import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import type { Options } from 'k6/options';

const url = (__ENV.BASE_URL || 'https://se.ifmo.ru/~s373305/is/api').replace(
    /\/$/,
    '',
);
const vus = Number(__ENV.VUS || 5);
const accepted = new Counter('responses_202');
const completed = new Counter('imports_success');

export const options: Options = {
    scenarios: {
        imports: {
            executor: 'per-vu-iterations',
            vus,
            iterations: 1,
            maxDuration: '3m',
        },
    },
    setupTimeout: '2m',
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0'],
        responses_202: [`count==${vus}`],
        imports_success: [`count==${vus}`],
    },
};

interface Data {
    prefix: string;
    x: number;
    startAt: number;
    users: { login: string; authorization: string }[];
}
interface History {
    importStatus: string;
    userLogin: string;
    importedRowsCount: number | null;
}
interface City {
    id: number;
    name: string;
    area: number;
    population: number;
    coordinates: { x: number; y: number };
    governor: { name: string };
}

export function setup(): Data {
    const prefix = `k6-import-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const users = Array.from({ length: vus }, (_, index) => {
        const login = `${prefix}-${index}`;
        const password = `Password-${prefix}`;
        const response = http.post(
            `${url}/auth/register`,
            JSON.stringify({ login, password }),
            {
                headers: { 'Content-Type': 'application/json' },
            },
        );
        if (!check(response, { 'register: 201': (r) => r.status === 201 }))
            fail('Registration failed');
        return {
            login,
            authorization: `Basic ${encoding.b64encode(`${login}:${password}`)}`,
        };
    });
    return {
        prefix,
        users,
        x: -Math.floor(Math.random() * 1_000_000_000),
        startAt: Date.now() + 3000,
    };
}

export default function (data: Data) {
    const user = data.users[__VU - 1];
    const prefix = `${data.prefix}-${__VU}-`;
    const rows = [0, 1, 2].map(
        (index) =>
            `${prefix}${index},${data.x},${__VU * 10 + index},${10 + index},${1000 + index},false,${prefix}governor-${index}`,
    );
    const csv = [
        'name,coordinates_x,coordinates_y,area,population,capital,governor_name',
        ...rows,
        '',
    ].join('\r\n');
    const params = {
        headers: { Authorization: user.authorization },
        redirects: 0,
        timeout: '15s',
    };

    sleep(Math.max(0, (data.startAt - Date.now()) / 1000));
    const response = http.post(
        `${url}/import/accept`,
        {
            import_csv: http.file(csv, 'cities.csv', 'text/csv'),
        },
        params,
    );
    accepted.add(Number(response.status === 202));
    if (!check(response, { 'upload: 202': (r) => r.status === 202 }))
        fail('Upload failed');
    const id = response.json('id') as number;

    let history: History | null = null;
    for (let attempt = 0; attempt < 120; attempt++) {
        const polled = http.get(`${url}/import/history/${id}`, params);
        if (!check(polled, { 'history: 200': (r) => r.status === 200 }))
            fail('History unavailable');
        history = polled.json() as unknown as History;
        if (history.importStatus !== 'RUNNING') break;
        sleep(0.5);
    }
    completed.add(Number(history?.importStatus === 'SUCCESS'));
    check(history, {
        'import succeeded': (h) => h?.importStatus === 'SUCCESS',
        'owner and imported count match': (h) =>
            h?.userLogin === user.login && h.importedRowsCount === 3,
    });

    const listed = http.get(
        `${url}/cities?name=${encodeURIComponent(prefix)}&size=1000`,
    );
    check(listed, { 'cities: 200': (r) => r.status === 200 });
    const page = listed.json() as unknown as {
        totalElements: number;
        content: City[];
    };
    check(page, {
        'whole batch saved': (p) =>
            p.totalElements === 3 && p.content.length === 3,
        'fields and relations match CSV': (p) =>
            [0, 1, 2].every((index) =>
                p.content.some(
                    (city) =>
                        city.name === `${prefix}${index}` &&
                        city.area === 10 + index &&
                        city.population === 1000 + index &&
                        city.coordinates.x === data.x &&
                        city.coordinates.y === __VU * 10 + index &&
                        city.governor.name === `${prefix}governor-${index}`,
                ),
            ),
    });
}

export function teardown(data: Data) {
    const cities: City[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext) {
        const response = http.get(
            `${url}/cities?name=${encodeURIComponent(data.prefix)}&size=1000&page=${page++}`,
        );
        if (!check(response, { 'cleanup list: 200': (r) => r.status === 200 }))
            fail('Cleanup unavailable');
        const result = response.json() as unknown as {
            content: City[];
            hasNext: boolean;
        };
        cities.push(
            ...result.content.filter((city) =>
                city.name.startsWith(data.prefix),
            ),
        );
        hasNext = result.hasNext;
    }
    for (const city of cities) {
        check(http.del(`${url}/cities/${city.id}`), {
            'cleanup: 204': (r) => r.status === 204,
        });
    }
}
