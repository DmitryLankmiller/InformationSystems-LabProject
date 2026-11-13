import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import type { Options } from 'k6/options';

const url = (__ENV.BASE_URL || 'https://se.ifmo.ru/~s373305/is/api').replace(
    /\/$/,
    '',
);
const vus = Number(__ENV.VUS || 5);
const deleted = new Counter('responses_204');
const conflicts = new Counter('responses_409');

export const options: Options = {
    scenarios: {
        delete: {
            executor: 'per-vu-iterations',
            vus,
            iterations: 1,
            maxDuration: '1m',
        },
    },
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0'],
        responses_204: ['count==1'],
        responses_409: [`count==${vus - 1}`],
    },
};

interface Data {
    id: number;
    startAt: number;
}

export function setup(): Data {
    const name = `k6-delete-${Date.now()}`;
    const response = http.post(
        `${url}/cities`,
        JSON.stringify({
            name,
            coordinates: {
                x: -Math.floor(Math.random() * 1_000_000_000),
                y: 1,
            },
            area: 10,
            population: 1000,
            capital: false,
            governor: { name },
        }),
        { headers: { 'Content-Type': 'application/json' } },
    );
    if (!check(response, { 'setup: 201': (r) => r.status === 201 }))
        fail('City was not created');
    return { id: response.json('id') as number, startAt: Date.now() + 3000 };
}

export default function (data: Data) {
    sleep(Math.max(0, (data.startAt - Date.now()) / 1000));
    const response = http.del(`${url}/cities/${data.id}`, null, {
        responseCallback: http.expectedStatuses(204, 409),
        redirects: 0,
        timeout: '15s',
    });
    deleted.add(Number(response.status === 204));
    conflicts.add(Number(response.status === 409));
    check(response, {
        'delete: 204 or 409': (r) => r.status === 204 || r.status === 409,
    });
}

export function teardown(data: Data) {
    const response = http.get(`${url}/cities/${data.id}`, {
        responseCallback: http.expectedStatuses(404),
    });
    check(response, { 'city is absent: 404': (r) => r.status === 404 });
    if (response.status === 200) http.del(`${url}/cities/${data.id}`);
}
