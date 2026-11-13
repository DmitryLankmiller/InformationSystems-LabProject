import http from 'k6/http';
import { check, fail } from 'k6';
import type { Options } from 'k6/options';

const url = (__ENV.BASE_URL || 'https://se.ifmo.ru/~s373305/is/api').replace(
    /\/$/,
    '',
);
const vus = Number(__ENV.VUS || 5);
const iterations = Number(__ENV.ITERATIONS || 3);
const params = {
    headers: { 'Content-Type': 'application/json' },
    redirects: 0,
    timeout: '15s',
};

export const options: Options = {
    scenarios: {
        crud: {
            executor: 'per-vu-iterations',
            vus,
            iterations,
            maxDuration: '3m',
        },
    },
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0'],
        iterations: [`count==${vus * iterations}`],
    },
};

interface City {
    id: number;
    name: string;
    area: number;
    population: number;
    coordinates: { x: number; y: number };
    governor: { id: number; name: string };
}

export default function () {
    const name = `k6-${Date.now()}-${__VU}-${__ITER}`;
    const body = {
        name,
        coordinates: {
            x: -Math.floor(Math.random() * 1_000_000_000),
            y: __VU * 1000 + __ITER,
        },
        area: 100,
        population: 1000,
        capital: false,
        governor: { name: `${name}-governor` },
    };
    const created = http.post(`${url}/cities`, JSON.stringify(body), params);
    if (!check(created, { 'create: 201': (r) => r.status === 201 }))
        fail(
            `POST /cities: HTTP ${created.status}; ${String(created.body).slice(0, 500)}`,
        );
    const saved = created.json() as unknown as City;
    let id = saved.id;

    try {
        const read = http.get(`${url}/cities/${id}`);
        if (!check(read, { 'read: 200': (r) => r.status === 200 }))
            fail(
                `GET /cities/${id}: HTTP ${read.status}; ${String(read.body).slice(0, 500)}`,
            );
        const city = read.json() as unknown as City;
        check(city, {
            'fields and relations saved': (c) =>
                c.name === name &&
                c.area === 100 &&
                c.population === 1000 &&
                c.coordinates.x === body.coordinates.x &&
                c.coordinates.y === body.coordinates.y &&
                c.governor.name === body.governor.name,
        });

        const updated = http.patch(
            `${url}/cities/${id}`,
            JSON.stringify({ area: 200, population: 2000 }),
            params,
        );
        if (!check(updated, { 'update: 200': (r) => r.status === 200 }))
            fail(
                `PATCH /cities/${id}: HTTP ${updated.status}; ${String(updated.body).slice(0, 500)}`,
            );
        const reread = http.get(`${url}/cities/${id}`);
        if (
            !check(reread, {
                'read after update: 200': (r) => r.status === 200,
            })
        )
            fail(
                `GET /cities/${id}: HTTP ${reread.status}; ${String(reread.body).slice(0, 500)}`,
            );
        const changed = reread.json() as unknown as City;
        check(changed, {
            'changes persisted, other fields preserved': (c) =>
                c.area === 200 &&
                c.population === 2000 &&
                c.name === name &&
                c.governor.id === saved.governor.id,
        });

        const deleted = http.del(`${url}/cities/${id}`);
        if (!check(deleted, { 'delete: 204': (r) => r.status === 204 }))
            fail(
                `DELETE /cities/${id}: HTTP ${deleted.status}; ${String(deleted.body).slice(0, 500)}`,
            );
        const absent = http.get(`${url}/cities/${id}`, {
            responseCallback: http.expectedStatuses(404),
        });
        check(absent, { 'deleted city: 404': (r) => r.status === 404 });

        // Reusing the pair checks that the coordinates were deleted as well.
        const replacement = http.post(
            `${url}/cities`,
            JSON.stringify(body),
            params,
        );
        if (
            !check(replacement, {
                'coordinates can be reused: 201': (r) => r.status === 201,
            })
        )
            fail(
                `Repeated POST /cities: HTTP ${replacement.status}; ${String(replacement.body).slice(0, 500)}`,
            );
        id = replacement.json('id') as number;
    } finally {
        const removed = http.del(`${url}/cities/${id}`, null, {
            responseCallback: http.expectedStatuses(204, 409),
        });
        check(removed, {
            [`cleanup: 204 or 409 (HTTP ${removed.status})`]: (r) =>
                r.status === 204 || r.status === 409,
        });
    }
}
