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
const rolledBack = new Counter('imports_failed');

export const options: Options = {
	scenarios: {
		rollback: {
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
		imports_failed: [`count==${vus}`],
	},
};

interface Data {
	prefix: string;
	x: number;
	startAt: number;
	users: { authorization: string }[];
}
interface History {
	importStatus: string;
	importedRowsCount: number | null;
	errorMsg: string | null;
}
interface City {
	id: number;
	name: string;
}

export function setup(): Data {
	const prefix = `k6-rollback-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
	const prefix = `${data.prefix}-${__VU}-`;
	const y = __VU * 10;
	// Two individually valid rows share one pair: the DB must reject the transaction.
	const csv = [
		'name,coordinates_x,coordinates_y,area,population,capital,governor_name',
		`${prefix}0,${data.x},${y},10,1000,false,${prefix}governor-0`,
		`${prefix}1,${data.x},${y},20,2000,false,${prefix}governor-1`,
		'',
	].join('\r\n');
	const params = {
		headers: { Authorization: data.users[__VU - 1].authorization },
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
	rolledBack.add(Number(history?.importStatus === 'FAILED'));
	check(history, {
		'import failed': (h) => h?.importStatus === 'FAILED',
		'no imported count': (h) => h?.importedRowsCount === null,
		'error explained': (h) =>
			typeof h?.errorMsg === 'string' && h.errorMsg.length > 0,
	});
	const listed = http.get(`${url}/cities?name=${encodeURIComponent(prefix)}`);
	check(listed, {
		'cities: 200': (r) => r.status === 200,
		'no city from this file saved': (r) => r.json('totalElements') === 0,
	});

	// Reusing the first pair checks rollback of the nested coordinates too.
	const probe = http.post(
		`${url}/cities`,
		JSON.stringify({
			name: `${prefix}probe`,
			coordinates: { x: data.x, y },
			area: 10,
			population: 1000,
			capital: false,
			governor: { name: `${prefix}governor` },
		}),
		{ headers: { 'Content-Type': 'application/json' } },
	);
	check(probe, {
		'coordinates rolled back, create: 201': (r) => r.status === 201,
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
			...result.content.filter((city) => city.name.startsWith(data.prefix)),
		);
		hasNext = result.hasNext;
	}
	for (const city of cities) {
		check(http.del(`${url}/cities/${city.id}`), {
			'cleanup: 204': (r) => r.status === 204,
		});
	}
}
