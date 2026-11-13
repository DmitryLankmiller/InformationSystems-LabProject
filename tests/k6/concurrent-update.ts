import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import type { Options } from 'k6/options';

const url = (__ENV.BASE_URL || 'https://se.ifmo.ru/~s373305/is/api').replace(
    /\/$/,
    '',
);
const vus = Number(__ENV.VUS || 5);
const updated = new Counter('responses_200');
const params = {
    headers: { 'Content-Type': 'application/json' },
    redirects: 0,
    timeout: '15s',
};

export const options: Options = {
    scenarios: {
        update: {
            executor: 'per-vu-iterations',
            vus,
            iterations: 1,
            maxDuration: '1m',
        },
    },
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0'],
        responses_200: [`count==${vus}`],
    },
};

interface Data {
    id: number;
    startAt: number;
}

export function setup(): Data {
    const name = `k6-update-${Date.now()}`;
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
        params,
    );
    if (!check(response, { 'setup: 201': (r) => r.status === 201 }))
        fail('City was not created');
    return { id: response.json('id') as number, startAt: Date.now() + 3000 };
}

export default function (data: Data) {
    sleep(Math.max(0, (data.startAt - Date.now()) / 1000));
    const response = http.patch(
        `${url}/cities/${data.id}`,
        JSON.stringify({
            area: 100 + __VU,
            population: 10000 + __VU,
        }),
        params,
    );
    updated.add(Number(response.status === 200));
    check(response, { 'update: 200': (r) => r.status === 200 });
}

export function teardown(data: Data) {
    try {
        const response = http.get(`${url}/cities/${data.id}`);
        check(response, { 'final read: 200': (r) => r.status === 200 });
        const city = response.json() as { area: number; population: number };
        const winner = city.area - 100;
        check(city, {
            'final fields belong to one complete PATCH': (c) =>
                Number.isInteger(winner) &&
                winner >= 1 &&
                winner <= vus &&
                c.population === 10000 + winner,
        });
    } finally {
        check(http.del(`${url}/cities/${data.id}`), {
            'cleanup: 204': (r) => r.status === 204,
        });
    }
}
