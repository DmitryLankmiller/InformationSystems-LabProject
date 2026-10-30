import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError } from './api';
import type { City, CreateCity, Human, UpdateCity } from './api';
import { climates, living } from './format';
import { ErrorNotice, Field, Icon } from './components';
import {
	cityRules,
	focusInvalid,
	numeric,
	parseNumber,
	requiredText,
	zonedDate,
} from './validation';
import { useFieldValidation } from './useFieldValidation';

type Values = Record<string, string>;
const nullableFields = [
	'establishmentDate',
	'metersAboveSeaLevel',
	'telephoneCode',
	'climate',
	'standardOfLiving',
] as const;
const clearFlags = {
	establishmentDate: 'annulateEstablishmentDate',
	metersAboveSeaLevel: 'annulateMetersAboveSeaLevel',
	telephoneCode: 'annulateTelephoneCode',
	climate: 'annulateClimate',
	standardOfLiving: 'annulateStandardOfLiving',
} as const;

export function CityForm({
	city,
	onSaved,
	onCancel,
	onBusyChange,
}: {
	city?: City;
	onSaved: (city: City) => void;
	onCancel: () => void;
	onBusyChange: (busy: boolean) => void;
}) {
	const [values, setValues] = useState<Values>(() => ({
		name: city?.name ?? '',
		x: String(city?.coordinates.x ?? ''),
		y: String(city?.coordinates.y ?? ''),
		area: String(city?.area ?? ''),
		population: String(city?.population ?? ''),
		capital: String(city?.capital ?? false),
		establishmentDate: city?.establishmentDate ?? '',
		metersAboveSeaLevel: String(city?.metersAboveSeaLevel ?? ''),
		telephoneCode: String(city?.telephoneCode ?? ''),
		climate: city?.climate ?? '',
		standardOfLiving: city?.standardOfLiving ?? '',
		governorName: '',
		birthday: '',
		governorId: '',
	}));
	const [mode, setMode] = useState<'new' | 'existing'>('new');
	const [governors, setGovernors] = useState<Human[]>([]);
	const [governorError, setGovernorError] = useState<unknown>(null);
	const [loadingGovernors, setLoadingGovernors] = useState(!city);
	const validation = useFieldValidation({
		...cityRules,
		...(!city
			? mode === 'new'
				? { governorName: requiredText, birthday: zonedDate }
				: {
						governorId: numeric({
							required: true,
							integer: true,
							min: 1,
							max: 2147483647,
						}),
					}
			: {}),
	});
	const { errors } = validation;
	const [error, setError] = useState<unknown>(null);
	const [saving, setSaving] = useState(false);
	useEffect(() => {
		if (city) return;
		const controller = new AbortController();
		api
			.governors(controller.signal)
			.then(setGovernors)
			.catch((e) => {
				if (!controller.signal.aborted) setGovernorError(e);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoadingGovernors(false);
			});
		return () => controller.abort();
	}, [city]);

	function set(key: string, value: string) {
		setValues((previous) => ({ ...previous, [key]: value }));
		validation.change(key, value);
		setError(null);
	}
	function input(
		key: string,
		type = 'text',
		extra: Record<string, string | number> = {},
	) {
		return (
			<input
				name={key}
				type={type === 'number' ? 'text' : type}
				inputMode={
					type === 'number'
						? ['x', 'population', 'telephoneCode', 'governorId'].includes(key)
							? 'numeric'
							: 'decimal'
						: undefined
				}
				value={values[key]}
				onChange={(event) => set(key, event.target.value)}
				onBlur={(event) => validation.blur(key, event.target.value)}
				aria-invalid={!!errors[key]}
				{...extra}
			/>
		);
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (saving) return;
		const form = event.currentTarget as HTMLFormElement;
		if (!validation.validate(values)) {
			focusInvalid(form);
			return;
		}
		const body: CreateCity = {
			name: values.name.trim(),
			coordinates: { x: parseNumber(values.x), y: parseNumber(values.y) },
			area: parseNumber(values.area),
			population: parseNumber(values.population),
			capital: values.capital === 'true',
		};
		if (values.establishmentDate.trim())
			body.establishmentDate = values.establishmentDate.trim();
		if (values.metersAboveSeaLevel.trim())
			body.metersAboveSeaLevel = parseNumber(values.metersAboveSeaLevel);
		if (values.telephoneCode.trim())
			body.telephoneCode = parseNumber(values.telephoneCode);
		if (values.climate) body.climate = values.climate as CreateCity['climate'];
		if (values.standardOfLiving)
			body.standardOfLiving =
				values.standardOfLiving as CreateCity['standardOfLiving'];
		setSaving(true);
		onBusyChange(true);
		setError(null);
		try {
			let saved: City;
			if (city) {
				const patch: UpdateCity = { ...body };
				nullableFields.forEach((field) => {
					if (!values[field].trim() && city[field] != null)
						patch[clearFlags[field]] = true;
				});
				saved = await api.update(city.id, patch);
			} else {
				if (mode === 'new')
					body.governor = {
						name: values.governorName.trim(),
						...(values.birthday.trim()
							? { birthday: values.birthday.trim() }
							: {}),
					};
				else body.governorId = parseNumber(values.governorId);
				saved = await api.create(body);
			}
			onSaved(saved);
		} catch (e) {
			setError(e);
			if (e instanceof ApiError)
				validation.server(
					Object.fromEntries(
						e.details.map((detail) => [detail.field, detail.message]),
					),
				);
			focusInvalid(form);
		} finally {
			setSaving(false);
			onBusyChange(false);
		}
	}

	return (
		<form className="city-form" onSubmit={submit} noValidate>
			<fieldset disabled={saving}>
				<section className="form-section">
					<h3>Основная информация</h3>
					<div className="form-grid">
						<div className="full">
							<Field label="Название города" error={errors.name} required>
								{input('name', 'text', {
									placeholder: 'Например, Санкт-Петербург',
								})}
							</Field>
						</div>
						<Field label="Площадь, км²" error={errors.area} required>
							{input('area', 'number', { placeholder: '1439' })}
						</Field>
						<Field label="Население" error={errors.population} required>
							{input('population', 'number', { placeholder: '5600044' })}
						</Field>
						<Field label="Столица">
							{' '}
							<select
								name="capital"
								value={values.capital}
								onChange={(e) => set('capital', e.target.value)}>
								<option value="false">Нет</option>
								<option value="true">Да</option>
							</select>
						</Field>
						<Field label="Телефонный код" error={errors.telephoneCode}>
							{input('telephoneCode', 'number', { placeholder: 'Не указан' })}
						</Field>
					</div>
				</section>
				<section className="form-section">
					<h3>География и условия</h3>
					<div className="form-grid">
						<Field
							label="Координата X"
							required
							error={errors.x}
							hint="Целое число, не больше 434">
							{input('x', 'number')}
						</Field>
						<Field label="Координата Y" required error={errors.y}>
							{input('y', 'number')}
						</Field>
						<Field
							label="Высота над уровнем моря, м"
							error={errors.metersAboveSeaLevel}>
							{input('metersAboveSeaLevel', 'number', {
								placeholder: 'Не указана',
							})}
						</Field>
						<Field label="Климат" error={errors.climate}>
							<select
								name="climate"
								value={values.climate}
								aria-invalid={!!errors.climate}
								onChange={(e) => set('climate', e.target.value)}>
								<option value="">Не указан</option>
								{Object.entries(climates).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</Field>
						<Field label="Уровень жизни" error={errors.standardOfLiving}>
							<select
								name="standardOfLiving"
								value={values.standardOfLiving}
								aria-invalid={!!errors.standardOfLiving}
								onChange={(e) => set('standardOfLiving', e.target.value)}>
								<option value="">Не указан</option>
								{Object.entries(living).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</Field>
						<div className="full">
							<Field
								label="Дата основания"
								error={errors.establishmentDate}
								hint="Например: 1703-05-27T00:00:00+03:00[Europe/Moscow]">
								{input('establishmentDate', 'text', {
									placeholder: 'Дата и время с часовым поясом',
								})}
							</Field>
						</div>
					</div>
					{city && (
						<p className="subtle">
							Очистите необязательное поле, чтобы удалить его значение.
						</p>
					)}
				</section>
				<section className="form-section">
					<h3>Губернатор</h3>
					{city ? (
						<div className="info-strip">
							<Icon name="people" />
							<div>
								<strong>{city.governor.name}</strong>
								<p>
									ID {city.governor.id} · Губернатор сохраняется при изменении
									города.
								</p>
							</div>
						</div>
					) : (
						<>
							<div className="segmented">
								<button
									type="button"
									className={mode === 'new' ? 'active' : ''}
									onClick={() => {
										setMode('new');
										validation.reset([
											'governorName',
											'birthday',
											'governorId',
										]);
										setError(null);
									}}>
									Новый губернатор
								</button>
								<button
									type="button"
									className={mode === 'existing' ? 'active' : ''}
									onClick={() => {
										setMode('existing');
										validation.reset([
											'governorName',
											'birthday',
											'governorId',
										]);
										setError(null);
									}}>
									Выбрать существующего
								</button>
							</div>
							{mode === 'new' ? (
								<div className="form-grid">
									<Field
										label="Имя губернатора"
										error={errors.governorName}
										required>
										{input('governorName', 'text', {
											placeholder: 'Имя и фамилия',
										})}
									</Field>
									<Field
										label="Дата рождения"
										error={errors.birthday}
										hint="1990-01-01T00:00:00+03:00">
										{input('birthday', 'text', { placeholder: 'Не указана' })}
									</Field>
								</div>
							) : (
								<div className="form-grid">
									<Field
										label="Губернаторы городов"
										hint={
											loadingGovernors
												? 'Загружаем список…'
												: 'Или укажите ID вручную.'
										}>
										<select
											value={
												governors.some(
													(g) => String(g.id) === values.governorId,
												)
													? values.governorId
													: ''
											}
											onChange={(e) => set('governorId', e.target.value)}
											onBlur={() =>
												validation.blur('governorId', values.governorId)
											}>
											<option value="">Выберите из списка</option>
											{governors.map((g) => (
												<option value={g.id} key={g.id}>
													{g.name} · #{g.id}
												</option>
											))}
										</select>
									</Field>
									<Field
										label="ID губернатора"
										required
										error={errors.governorId}>
										{input('governorId', 'number')}
									</Field>
									{governorError != null && (
										<p className="subtle full">
											Список не загрузился. Можно указать ID вручную.
										</p>
									)}
								</div>
							)}
						</>
					)}
				</section>
			</fieldset>
			<ErrorNotice error={error} />
			<div className="modal-footer">
				<span className="subtle">* Обязательные поля</span>
				<button
					type="button"
					className="button secondary"
					disabled={saving}
					onClick={onCancel}>
					Отмена
				</button>
				<button className="button primary" disabled={saving} type="submit">
					{saving
						? 'Сохраняем…'
						: city
							? 'Сохранить изменения'
							: 'Создать город'}
					<Icon name="check" size={17} />
				</button>
			</div>
		</form>
	);
}
