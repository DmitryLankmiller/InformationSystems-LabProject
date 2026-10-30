export interface ErrorDetail {
	field: string;
	message: string;
}

const labels: Record<string, string> = {
	name: 'Название города',
	x: 'Координата X',
	y: 'Координата Y',
	area: 'Площадь',
	population: 'Население',
	capital: 'Столица',
	metersAboveSeaLevel: 'Высота над уровнем моря',
	telephoneCode: 'Телефонный код',
	climate: 'Климат',
	standardOfLiving: 'Уровень жизни',
	page: 'Страница',
	size: 'Размер страницы',
	birthday: 'Дата рождения губернатора',
	establishmentDate: 'Дата основания',
	governorName: 'Имя губернатора',
	governorId: 'ID губернатора',
	governorProvided: 'Губернатор',
	notBlankFieldsValid: 'Название города',
	height: 'Высота над уровнем моря',
	x0: 'Координата X₀',
	y0: 'Координата Y₀',
	z0: 'Координата Z₀',
	form: 'Данные формы',
};

export function fieldKey(path: string) {
	if (/(?:^|\.)governor\.name$/.test(path)) return 'governorName';
	const key = path.split('.').at(-1) ?? '';
	return Object.hasOwn(labels, key) ? key : 'form';
}
export const fieldLabel = (path: string) => labels[fieldKey(path)];

export function validationMessage(message: string) {
	const exact: Record<string, string> = {
		'must not be null': 'Заполните это поле.',
		'must not be blank': 'Поле не должно быть пустым.',
		'must not be empty': 'Поле не должно быть пустым.',
		'must be greater than 0': 'Значение должно быть больше 0.',
		'must be greater than or equal to 0': 'Значение должно быть не меньше 0.',
		'must be less than 0': 'Значение должно быть меньше 0.',
		'must be less than or equal to 0': 'Значение должно быть не больше 0.',
		'must be true': 'Проверьте заполнение связанных полей.',
	};
	if (Object.hasOwn(exact, message)) return exact[message];
	for (const [pattern, text] of [
		[
			/^must be less than or equal to (-?\d+(?:\.\d+)?)$/,
			'Значение должно быть не больше',
		],
		[
			/^must be greater than or equal to (-?\d+(?:\.\d+)?)$/,
			'Значение должно быть не меньше',
		],
		[/^must be less than (-?\d+(?:\.\d+)?)$/, 'Значение должно быть меньше'],
		[/^must be greater than (-?\d+(?:\.\d+)?)$/, 'Значение должно быть больше'],
	] as const) {
		const match = message.match(pattern);
		if (match) return `${text} ${match[1]}.`;
	}
	if (/^must be a (?:date in the )?past/.test(message))
		return 'Дата должна быть в прошлом.';
	if (/^must be a (?:date in the )?future/.test(message))
		return 'Дата должна быть в будущем.';
	return 'Проверьте значение поля.';
}

export function parseErrorDetails(payload: unknown): ErrorDetail[] {
	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('details' in payload) ||
		!Array.isArray(payload.details)
	)
		return [];
	return payload.details.flatMap((detail: unknown) => {
		if (
			typeof detail !== 'object' ||
			detail === null ||
			!('field' in detail) ||
			typeof detail.field !== 'string' ||
			!('message' in detail) ||
			typeof detail.message !== 'string'
		)
			return [];
		const field = fieldKey(detail.field);
		return [
			{
				field,
				message:
					field === 'governorProvided'
						? 'Создайте нового губернатора или выберите существующего.'
						: validationMessage(detail.message),
			},
		];
	});
}
