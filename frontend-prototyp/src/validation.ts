export type Validator = (value: string) => string | undefined;
export type FieldErrors = Record<string, string>;
export type Rules = Record<string, Validator>;

export const parseNumber = (value: string) =>
	Number(value.trim().replace(',', '.'));
export const requiredText: Validator = (value) =>
	value.trim() ? undefined : 'Заполните это поле.';

interface NumberRules {
	required?: boolean;
	integer?: boolean;
	positive?: boolean;
	min?: number;
	max?: number;
	float32?: boolean;
}

export function numeric({
	required = false,
	integer = false,
	positive = false,
	min,
	max,
	float32 = false,
}: NumberRules = {}): Validator {
	return (raw) => {
		const value = raw.trim();
		if (!value) return required ? 'Введите число.' : undefined;
		if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(value))
			return 'Введите число полностью, например 12 или -3,5.';
		const number = parseNumber(value);
		if (!Number.isFinite(number))
			return 'Число слишком велико. Введите меньшее значение.';
		if (integer && !Number.isInteger(number)) return 'Введите целое число.';
		if (positive && number <= 0) return 'Значение должно быть больше 0.';
		if (min !== undefined && number < min)
			return `Значение должно быть не меньше ${min.toLocaleString('ru-RU')}.`;
		if (max !== undefined && number > max)
			return `Значение должно быть не больше ${max.toLocaleString('ru-RU')}.`;
		if (float32 && !Number.isFinite(Math.fround(number)))
			return 'Число слишком велико для этого поля.';
		if (float32 && positive && Math.fround(number) === 0)
			return 'Число слишком мало. Укажите большее положительное значение.';
		return undefined;
	};
}

export const positiveId = numeric({
	required: true,
	integer: true,
	min: 1,
	max: Number.MAX_SAFE_INTEGER,
});

function validOffset(value: string) {
	if (value === 'Z') return true;
	const match = value.match(/^[+-](\d{2}):(\d{2})(?::(\d{2}))?$/);
	if (!match) return false;
	const [, hours, minutes, seconds = '0'] = match;
	return (
		Number(minutes) <= 59 &&
		Number(seconds) <= 59 &&
		(Number(hours) < 18 ||
			(Number(hours) === 18 && Number(minutes) === 0 && Number(seconds) === 0))
	);
}

export const zonedDate: Validator = (raw) => {
	if (!raw.trim()) return undefined;
	const match = raw
		.trim()
		.match(
			/^(-\d{4,9}|\d{4}|\+\d{5,9})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2}(?::\d{2})?)(?:\[([^\]]+)\])?$/,
		);
	if (!match)
		return 'Укажите дату, время и часовой пояс, например 2026-01-31T12:30:00+03:00.';
	const [
		,
		yearText,
		monthText,
		dayText,
		hourText,
		minuteText,
		secondText = '0',
		,
		offset,
		zone,
	] = match;
	const year = Number(yearText),
		month = Number(monthText),
		day = Number(dayText);
	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (month < 1 || month > 12 || day < 1 || day > days[month - 1])
		return 'Такой даты не существует. Проверьте день и месяц.';
	if (
		Number(hourText) > 23 ||
		Number(minuteText) > 59 ||
		Number(secondText) > 59
	)
		return 'Укажите время от 00:00:00 до 23:59:59.';
	if (!validOffset(offset))
		return 'Укажите смещение часового пояса от −18:00 до +18:00.';
	if (zone) {
		const fixed = zone.match(/^(?:UTC|GMT|UT)?([+-]\d{2}:\d{2}(?::\d{2})?)$/);
		if (fixed) {
			if (!validOffset(fixed[1]))
				return 'Некорректное смещение часового пояса в скобках.';
		} else if (!['UT', 'UTC', 'GMT'].includes(zone)) {
			try {
				new Intl.DateTimeFormat('ru-RU', { timeZone: zone });
			} catch {
				return 'Неизвестный часовой пояс. Например: Europe/Moscow.';
			}
		}
	}
	return undefined;
};

export const cityRules: Rules = {
	name: requiredText,
	x: numeric({ required: true, integer: true, min: -2147483648, max: 434 }),
	y: numeric({ required: true, float32: true }),
	area: numeric({ required: true, positive: true, float32: true }),
	population: numeric({
		required: true,
		integer: true,
		min: 1,
		max: 2147483647,
	}),
	metersAboveSeaLevel: numeric(),
	telephoneCode: numeric({ integer: true, min: 1, max: 100000 }),
	establishmentDate: zonedDate,
};

export function validateFields(
	rules: Rules,
	values: Record<string, string>,
): FieldErrors {
	const errors: FieldErrors = {};
	Object.entries(rules).forEach(([field, validate]) => {
		const message = validate(values[field] ?? '');
		if (message) errors[field] = message;
	});
	return errors;
}

export function focusInvalid(form: HTMLFormElement) {
	requestAnimationFrame(() => {
		const element =
			form.querySelector<HTMLElement>('[aria-invalid="true"]') ??
			form.querySelector<HTMLElement>('.error-notice');
		element?.focus();
		element?.scrollIntoView({ block: 'center' });
	});
}
