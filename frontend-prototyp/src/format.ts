import type { Climate, StandardOfLiving } from './api';

export const climates: Record<Climate, string> = {
	RAIN_FOREST: 'Тропический',
	HUMIDSUBTROPICAL: 'Влажный субтропический',
	SUBARCTIC: 'Субарктический',
};
export const living: Record<StandardOfLiving, string> = {
	HIGH: 'Высокий',
	MEDIUM: 'Средний',
	VERY_LOW: 'Очень низкий',
	NIGHTMARE: 'Кошмарный',
};
export const number = (value: number | null | undefined) =>
	value == null
		? '—'
		: value.toLocaleString('ru-RU', { maximumFractionDigits: 6 });
export function date(value?: string | null): string {
	if (!value) return '—';
	const match = value.match(/^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
	if (!match) return value;
	const [, year, month, day, hour, minute] = match;
	return `${day}.${month}.${year}, ${hour}:${minute}`;
}
export const errorMessage = (error: unknown) =>
	error instanceof Error ? error.message : 'Не удалось выполнить запрос.';
