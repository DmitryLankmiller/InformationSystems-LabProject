import { parseErrorDetails } from './errors';
import type { ErrorDetail } from './errors';

export type Climate = 'RAIN_FOREST' | 'HUMIDSUBTROPICAL' | 'SUBARCTIC';
export type StandardOfLiving = 'HIGH' | 'MEDIUM' | 'VERY_LOW' | 'NIGHTMARE';
export interface Human {
	id: number;
	name: string;
	birthday?: string | null;
}
export interface City {
	id: number;
	name: string;
	coordinates: { id: number; x: number; y: number };
	creationDate: string;
	area: number;
	population: number;
	establishmentDate?: string | null;
	capital: boolean;
	metersAboveSeaLevel?: number | null;
	telephoneCode?: number | null;
	climate?: Climate | null;
	standardOfLiving?: StandardOfLiving | null;
	governor: Human;
}
export interface CityPage {
	content: City[];
	page: number;
	size: number;
	hasNext: boolean;
	totalPages: number;
	totalElements: number;
}
export interface CreateCity {
	name: string;
	coordinates: { x: number; y: number };
	area: number;
	population: number;
	capital: boolean;
	establishmentDate?: string;
	metersAboveSeaLevel?: number;
	telephoneCode?: number;
	climate?: Climate;
	standardOfLiving?: StandardOfLiving;
	governor?: { name: string; birthday?: string };
	governorId?: number;
}
export type UpdateCity = Partial<
	Omit<CreateCity, 'governor' | 'governorId'>
> & {
	annulateEstablishmentDate?: boolean;
	annulateMetersAboveSeaLevel?: boolean;
	annulateTelephoneCode?: boolean;
	annulateClimate?: boolean;
	annulateStandardOfLiving?: boolean;
};
export interface Health {
	status: 'ok' | 'not ok';
	message?: string | null;
}
export class ApiError extends Error {
	readonly status: number;
	readonly details: ErrorDetail[];
	constructor(status: number, message: string, details: ErrorDetail[] = []) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.details = details;
	}
}

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const messages: Record<number, string> = {
	400: 'Не удалось прочитать данные. Проверьте формат полей, в том числе дат.',
	401: 'Нужно войти в систему, чтобы выполнить действие.',
	403: 'Недостаточно прав для этого действия.',
	404: 'Объект не найден. Возможно, его уже удалили.',
	408: 'Сервер не ответил вовремя. Повторите запрос.',
	409: 'Город уже удалён или операция конфликтует с текущими данными.',
	413: 'Слишком много данных в запросе. Сократите введённый текст.',
	415: 'Сервер не поддерживает формат отправленных данных.',
	422: 'Проверьте значения полей.',
	429: 'Слишком много запросов. Немного подождите и повторите действие.',
	500: 'Сервер не смог выполнить запрос. Попробуйте позже.',
	502: 'Сервер недоступен. Проверьте подключение.',
	503: 'Сервер временно недоступен. Попробуйте позже.',
	504: 'Сервер не ответил вовремя. Повторите запрос.',
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const timeout = AbortSignal.timeout(15000);
	const signal = AbortSignal.any([
		timeout,
		...(options.signal ? [options.signal] : []),
	]);
	try {
		const response = await fetch(`${base}${path}`, {
			...options,
			headers: {
				Accept: 'application/json',
				...(options.body ? { 'Content-Type': 'application/json' } : {}),
			},
			signal,
		});
		if (!response.ok) {
			const payload: unknown = response.headers
				.get('content-type')
				?.includes('application/json')
				? await response.json().catch(() => null)
				: null;
			if (signal.aborted) signal.throwIfAborted();
			throw new ApiError(
				response.status,
				messages[response.status] ||
					'Не удалось выполнить действие. Попробуйте ещё раз.',
				response.status < 500 ? parseErrorDetails(payload) : [],
			);
		}
		if (response.status === 204) return undefined as T;
		try {
			return (await response.json()) as T;
		} catch {
			if (signal.aborted) signal.throwIfAborted();
			throw new ApiError(
				response.status,
				'Сервер вернул некорректный ответ. Обновите страницу или попробуйте позже.',
			);
		}
	} catch (error) {
		if (error instanceof ApiError) throw error;
		if (options.signal?.aborted)
			throw new DOMException('Request cancelled', 'AbortError');
		if (timeout.aborted) throw new ApiError(408, messages[408]);
		throw new ApiError(
			0,
			'Нет связи с сервером. Проверьте подключение и повторите запрос.',
		);
	}
}

export interface ListQuery {
	page: number;
	size: number;
	name?: string;
	governorName?: string;
	sort?: string;
}
export const api = {
	cities: (query: ListQuery, signal?: AbortSignal) => {
		const params = new URLSearchParams();
		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== '') params.set(key, String(value));
		});
		return request<CityPage>(`/cities?${params}`, { signal });
	},
	city: (id: number, signal?: AbortSignal) =>
		request<City>(`/cities/${id}`, { signal }),
	create: async (body: CreateCity) => {
		try {
			return await request<City>('/cities', {
				method: 'POST',
				body: JSON.stringify(body),
			});
		} catch (error) {
			if (
				error instanceof ApiError &&
				error.status === 404 &&
				body.governorId !== undefined
			) {
				throw new ApiError(404, 'Не удалось найти выбранного губернатора.', [
					{
						field: 'governorId',
						message:
							'Губернатор с таким ID не найден. Выберите другого или создайте нового.',
					},
				]);
			}
			throw error;
		}
	},
	update: (id: number, body: UpdateCity) =>
		request<City>(`/cities/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		}),
	delete: (id: number) => request<void>(`/cities/${id}`, { method: 'DELETE' }),
	minimumCode: () => request<City>('/cities/manage/min-telephone-code'),
	count: (height: number) =>
		request<number>(
			`/cities/manage/count-by-sea-level?${new URLSearchParams({ metersAboveSeaLevel: String(height) })}`,
		),
	higher: (height: number) =>
		request<City[]>(
			`/cities/manage/cities-higher?${new URLSearchParams({ metersAboveSeaLevel: String(height) })}`,
		),
	smallestDistance: () =>
		request<number>('/cities/manage/calculate-dist-to-smallest'),
	biggestDistance: (x: number, y: number, z: number) =>
		request<number>(
			`/cities/manage/calculate-dist-to-biggest?${new URLSearchParams({ x0: String(x), y0: String(y), z0: String(z) })}`,
		),
	health: (signal?: AbortSignal) =>
		request<Health>('/health/check', { signal }),
	dbHealth: (signal?: AbortSignal) =>
		request<Health>('/health/db/check', { signal }),
	governors: async (signal?: AbortSignal) => {
		const found = new Map<number, Human>();
		let page = 1;
		let more = true;
		while (more) {
			const result = await api.cities(
				{ page, size: 1000, sort: 'name:asc' },
				signal,
			);
			result.content.forEach((city) =>
				found.set(city.governor.id, city.governor),
			);
			more = result.hasNext;
			page += 1;
		}
		return [...found.values()].sort((a, b) =>
			a.name.localeCompare(b.name, 'ru'),
		);
	},
};
