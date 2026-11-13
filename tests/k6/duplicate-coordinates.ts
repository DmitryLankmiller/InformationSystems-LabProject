import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import type { Options } from 'k6/options';

const url = (__ENV.BASE_URL || 'https://se.ifmo.ru/~s373305/is/api').replace(
    /\/$/,
    '',
);
const vus = Number(__ENV.VUS || 5);
const created = new Counter('responses_201');
const conflicts = new Counter('responses_409');

export const options: Options = {
    scenarios: {
        duplicates: {
            executor: 'per-vu-iterations',
            vus,
            iterations: 1,
            maxDuration: '1m',
        },
    },
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0'],
        responses_201: ['count==1'],
        responses_409: [`count==${vus - 1}`],
    },
};

interface Data {
    prefix: string;
    x: number;
    startAt: number;
}
interface City {
    id: number;
    name: string;
    coordinates: { x: number; y: number };
}

export function setup(): Data {
    return {
        prefix: `k6-duplicates-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        x: -Math.floor(Math.random() * 1_000_000_000),
        startAt: Date.now() + 3000,
    };
}

export default function (data: Data) {
    const name = `${data.prefix}-${__VU}`;
    sleep(Math.max(0, (data.startAt - Date.now()) / 1000));
    const response = http.post(
        `${url}/cities`,
        JSON.stringify({
            name,
            coordinates: { x: data.x, y: 1 },
            area: 10,
            population: 1000,
            capital: false,
            governor: { name },
        }),
        {
            headers: { 'Content-Type': 'application/json' },
            responseCallback: http.expectedStatuses(201, 409),
            redirects: 0,
            timeout: '15s',
        },
    );
    created.add(Number(response.status === 201));
    conflicts.add(Number(response.status === 409));
    check(response, {
        'create: 201 or 409': (r) => r.status === 201 || r.status === 409,
    });
}

export function teardown(data: Data) {
    const response = http.get(
        `${url}/cities?name=${encodeURIComponent(data.prefix)}&size=1000`,
    );
    check(response, { 'list: 200': (r) => r.status === 200 });
    const page = response.json() as unknown as {
        totalElements: number;
        content: City[];
    };
    check(page, {
        'exactly one city saved': (p) =>
            p.totalElements === 1 && p.content.length === 1,
        'coordinates match': (p) =>
            p.content.length === 1 &&
            p.content[0].coordinates.x === data.x &&
            p.content[0].coordinates.y === 1,
    });
    for (const city of page.content.filter((item) =>
        item.name.startsWith(data.prefix),
    )) {
        check(http.del(`${url}/cities/${city.id}`), {
            'cleanup: 204': (r) => r.status === 204,
        });
    }
}
