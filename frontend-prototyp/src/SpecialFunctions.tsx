import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError } from './api';
import type { City } from './api';
import { Empty, ErrorNotice, Field, Icon } from './components';
import { number } from './format';
import { focusInvalid, numeric, parseNumber } from './validation';
import type { Rules } from './validation';
import { useFieldValidation } from './useFieldValidation';

const operations = [
	{
		id: 'minimum',
		icon: 'city',
		label: 'Минимальный телефонный код',
		description: 'Найти город с наименьшим телефонным кодом.',
		action: 'Найти город',
	},
	{
		id: 'count',
		icon: 'grid',
		label: 'Города на заданной высоте',
		description: 'Посчитать города с точным совпадением высоты.',
		action: 'Посчитать',
	},
	{
		id: 'higher',
		icon: 'globe',
		label: 'Выше уровня',
		description: 'Получить города выше указанной отметки.',
		action: 'Найти города',
	},
	{
		id: 'smallest',
		icon: 'pin',
		label: 'Маршрут к малому городу',
		description:
			'Расстояние от начала координат до города с наименьшей площадью.',
		action: 'Рассчитать расстояние',
	},
	{
		id: 'biggest',
		icon: 'pin',
		label: 'Маршрут к большому городу',
		description: 'Расстояние от вашей точки до города с наибольшей площадью.',
		action: 'Рассчитать расстояние',
	},
] as const;
type Operation = (typeof operations)[number];

function OperationCard({
	operation,
	onOpen,
}: {
	operation: Operation;
	onOpen: (city: City) => void;
}) {
	const [values, setValues] = useState({ height: '0', x: '0', y: '0', z: '0' });
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const [result, setResult] = useState<City | City[] | number | null>(null);
	const rules: Rules =
		operation.id === 'count' || operation.id === 'higher'
			? { height: numeric({ required: true }) }
			: operation.id === 'biggest'
				? {
						x: numeric({ required: true }),
						y: numeric({ required: true }),
						z: numeric({ required: true }),
					}
				: {};
	const validation = useFieldValidation(rules);
	async function run(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (busy) return;
		const form = event.currentTarget;
		if (!validation.validate(values)) {
			focusInvalid(form);
			return;
		}
		setBusy(true);
		setError(null);
		setResult(null);
		try {
			switch (operation.id) {
				case 'minimum':
					setResult(await api.minimumCode());
					break;
				case 'count':
					setResult(await api.count(parseNumber(values.height)));
					break;
				case 'higher':
					setResult(await api.higher(parseNumber(values.height)));
					break;
				case 'smallest':
					setResult(await api.smallestDistance());
					break;
				case 'biggest':
					setResult(
						await api.biggestDistance(
							parseNumber(values.x),
							parseNumber(values.y),
							parseNumber(values.z),
						),
					);
					break;
			}
		} catch (e) {
			setError(e);
			if (e instanceof ApiError)
				validation.server(
					Object.fromEntries(
						e.details.map((detail) => [
							detail.field === 'metersAboveSeaLevel'
								? 'height'
								: detail.field.replace(/0$/, ''),
							detail.message,
						]),
					),
				);
			requestAnimationFrame(() => {
				const article = form.closest('article');
				const target =
					form.querySelector<HTMLElement>('[aria-invalid="true"]') ??
					article?.querySelector<HTMLElement>('.error-notice');
				target?.focus();
				target?.scrollIntoView({ block: 'center' });
			});
		} finally {
			setBusy(false);
		}
	}
	function coordinate(key: keyof typeof values, label: string) {
		return (
			<Field label={label} error={validation.errors[key]} required>
				<input
					type="text"
					inputMode="decimal"
					name={key}
					value={values[key]}
					aria-invalid={!!validation.errors[key]}
					onBlur={(e) => validation.blur(key, e.target.value)}
					onChange={(e) => {
						setValues({ ...values, [key]: e.target.value });
						validation.change(key, e.target.value);
						setResult(null);
						setError(null);
					}}
				/>
			</Field>
		);
	}
	return (
		<article className="operation-card">
			<div className="operation-icon">
				<Icon name={operation.icon} size={24} />
			</div>
			<div className="operation-copy">
				<h2>{operation.label}</h2>
				<p>{operation.description}</p>
			</div>
			<form onSubmit={run} noValidate>
				<fieldset disabled={busy}>
					{(operation.id === 'count' || operation.id === 'higher') &&
						coordinate('height', 'Высота над уровнем моря, м')}
					{operation.id === 'biggest' && (
						<div className="form-grid three">
							{coordinate('x', 'X₀')}
							{coordinate('y', 'Y₀')}
							{coordinate('z', 'Z₀')}
						</div>
					)}
					<button className="button secondary" disabled={busy}>
						{busy ? 'Выполняем…' : operation.action}
						<Icon name="arrow" size={17} />
					</button>
				</fieldset>
			</form>
			<ErrorNotice error={error} />
			{result !== null && (
				<div className="operation-result" aria-live="polite">
					{typeof result === 'number' ? (
						<>
							<span className="eyebrow">
								{operation.id === 'count' ? 'НАЙДЕНО ГОРОДОВ' : 'РАССТОЯНИЕ'}
							</span>
							<strong className="result-number">{number(result)}</strong>
						</>
					) : Array.isArray(result) ? (
						<>
							<span className="eyebrow">НАЙДЕНО: {result.length}</span>
							{result.length ? (
								<div className="result-list">
									{result.map((city) => (
										<button key={city.id} onClick={() => onOpen(city)}>
											<span>
												<strong>{city.name}</strong>
												<small>
													Высота: {number(city.metersAboveSeaLevel)} м
												</small>
											</span>
											<Icon name="chevron" size={16} />
										</button>
									))}
								</div>
							) : (
								<Empty title="Подходящих городов нет" />
							)}
						</>
					) : (
						<button className="city-result" onClick={() => onOpen(result)}>
							<span>
								<strong>{result.name}</strong>
								<small>Телефонный код: {number(result.telephoneCode)}</small>
							</span>
							<Icon name="arrow" />
						</button>
					)}
				</div>
			)}
		</article>
	);
}

export function SpecialFunctions({ onOpen }: { onOpen: (city: City) => void }) {
	return (
		<>
			<div className="page-heading">
				<div>
					<h1>Специальные операции</h1>
					<p>Поиск по характеристикам и расчёт расстояний.</p>
				</div>
			</div>
			<div className="operations-grid">
				{operations.map((operation) => (
					<OperationCard
						key={operation.id}
						operation={operation}
						onOpen={onOpen}
					/>
				))}
			</div>
			<p className="footnote">
				<Icon name="info" size={15} /> Для расчётов используется высота города;
				если она не задана, принимается 0.
			</p>
		</>
	);
}
