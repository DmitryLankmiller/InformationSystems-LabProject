import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from './api';
import type { City, CityPage, Health } from './api';
import { CityForm } from './CityForm';
import { Empty, ErrorNotice, Icon, Modal } from './components';
import { climates, date, living, number } from './format';
import { SpecialFunctions } from './SpecialFunctions';
import { focusInvalid, parseNumber, positiveId } from './validation';
import { useFieldValidation } from './useFieldValidation';
import './App.css';

type Section = 'cities' | 'operations' | 'health';
type ModalState =
	| { type: 'create' }
	| { type: 'detail' | 'edit' | 'delete'; city: City }
	| null;
interface SortRule {
	field: 'name' | 'governorName';
	direction: 'asc' | 'desc';
}
const sections: { id: Section; label: string; icon: string }[] = [
	{ id: 'cities', label: 'Города', icon: 'grid' },
	{ id: 'operations', label: 'Специальные операции', icon: 'spark' },
	{ id: 'health', label: 'Состояние системы', icon: 'pulse' },
];

function CityDetails({
	city,
	onEdit,
	onDelete,
}: {
	city: City;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const attributes = [
		['Площадь', `${number(city.area)} км²`],
		['Население', `${number(city.population)} чел.`],
		['Столица', city.capital ? 'Да' : 'Нет'],
		[
			'Высота над уровнем моря',
			city.metersAboveSeaLevel == null
				? '—'
				: `${number(city.metersAboveSeaLevel)} м`,
		],
		['Телефонный код', number(city.telephoneCode)],
		['Климат', city.climate ? climates[city.climate] : '—'],
		[
			'Уровень жизни',
			city.standardOfLiving ? living[city.standardOfLiving] : '—',
		],
		['Дата основания', date(city.establishmentDate)],
		['Дата создания', date(city.creationDate)],
	];
	return (
		<>
			<div className="detail-hero">
				<span className="detail-city-icon">
					{city.name.slice(0, 1).toLocaleUpperCase('ru')}
				</span>
				<div>
					<span className="subtle">Город · #{city.id}</span>
					<h3>{city.name}</h3>
				</div>
			</div>
			<h3 className="section-heading">Свойства</h3>
			<dl className="detail-grid">
				{attributes.map(([label, value]) => (
					<div key={label}>
						<dt>{label}</dt>
						<dd>{value}</dd>
					</div>
				))}
			</dl>
			<div className="related-grid">
				<section>
					<h3>
						<Icon name="pin" size={17} /> Координаты{' '}
						<span>#{city.coordinates.id}</span>
					</h3>
					<p>
						X <strong>{number(city.coordinates.x)}</strong>
						<span className="dot-separator">·</span>Y{' '}
						<strong>{number(city.coordinates.y)}</strong>
					</p>
				</section>
				<section>
					<h3>
						<Icon name="people" size={17} /> Губернатор{' '}
						<span>#{city.governor.id}</span>
					</h3>
					<strong>{city.governor.name}</strong>
					<p>Дата рождения: {date(city.governor.birthday)}</p>
				</section>
			</div>
			<div className="modal-footer">
				<button className="button danger-quiet" onClick={onDelete}>
					<Icon name="trash" size={17} />
					Удалить
				</button>
				<span className="spacer" />
				<button className="button primary" onClick={onEdit}>
					<Icon name="edit" size={17} />
					Редактировать
				</button>
			</div>
		</>
	);
}

function App() {
	const [section, setSection] = useState<Section>(() =>
		sections.some((s) => s.id === location.hash.slice(1))
			? (location.hash.slice(1) as Section)
			: 'cities',
	);
	const [page, setPage] = useState(1);
	const [size, setSize] = useState(10);
	const [search, setSearch] = useState({ name: '', governorName: '' });
	const [filters, setFilters] = useState(search);
	const [sorts, setSorts] = useState<SortRule[]>([]);
	const [showSorts, setShowSorts] = useState(false);
	const [data, setData] = useState<CityPage | null>(null);
	const [listError, setListError] = useState<unknown>(null);
	const [refreshed, setRefreshed] = useState<Date | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [modal, setModal] = useState<ModalState>(null);
	const [detailError, setDetailError] = useState<unknown>(null);
	const [toast, setToast] = useState('');
	const [lookup, setLookup] = useState('');
	const [lookupError, setLookupError] = useState<unknown>(null);
	const [lookupBusy, setLookupBusy] = useState(false);
	const lookupValidation = useFieldValidation({ id: positiveId });
	const [deleting, setDeleting] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleteError, setDeleteError] = useState<unknown>(null);
	const [health, setHealth] = useState<{
		app?: Health;
		db?: Health;
		error?: string;
		checked?: Date;
	}>({});
	const sort = sorts.map((rule) => `${rule.field}:${rule.direction}`).join(',');
	const query = useMemo(
		() => ({ page, size, ...filters, sort }),
		[page, size, filters, sort],
	);
	const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
	const open = useCallback((city: City) => {
		setDetailError(null);
		setModal({ type: 'detail', city });
	}, []);

	useEffect(() => {
		const change = () =>
			setSection(
				sections.some((s) => s.id === location.hash.slice(1))
					? (location.hash.slice(1) as Section)
					: 'cities',
			);
		window.addEventListener('hashchange', change);
		return () => window.removeEventListener('hashchange', change);
	}, []);
	useEffect(() => {
		if (
			search.name === filters.name &&
			search.governorName === filters.governorName
		)
			return;
		const timer = setTimeout(() => {
			setFilters(search);
			setPage(1);
		}, 350);
		return () => clearTimeout(timer);
	}, [search, filters]);
	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(''), 4500);
		return () => clearTimeout(timer);
	}, [toast]);
	useEffect(() => {
		const controller = new AbortController();
		let pending = false;
		async function load() {
			if (pending) return;
			pending = true;
			try {
				const result = await api.cities(query, controller.signal);
				if (!controller.signal.aborted) {
					setData(result);
					setListError(null);
					setRefreshed(new Date());
					if (result.totalPages > 0 && query.page > result.totalPages)
						setPage(result.totalPages);
					else if (result.totalPages === 0 && query.page > 1) setPage(1);
				}
			} catch (e) {
				if (!controller.signal.aborted) setListError(e);
			} finally {
				pending = false;
			}
		}
		void load();
		const timer = setInterval(() => {
			if (!document.hidden) void load();
		}, 5000);
		return () => {
			controller.abort();
			clearInterval(timer);
		};
	}, [query, refreshKey]);
	useEffect(() => {
		const controller = new AbortController();
		let pending = false;
		async function check() {
			if (pending) return;
			pending = true;
			try {
				const results = await Promise.allSettled([
					api.health(controller.signal),
					api.dbHealth(controller.signal),
				]);
				if (!controller.signal.aborted)
					setHealth({
						app:
							results[0].status === 'fulfilled' ? results[0].value : undefined,
						db:
							results[1].status === 'fulfilled' ? results[1].value : undefined,
						error: results.some((r) => r.status === 'rejected')
							? 'Один из сервисов недоступен.'
							: undefined,
						checked: new Date(),
					});
			} finally {
				pending = false;
			}
		}
		void check();
		const timer = setInterval(() => {
			if (!document.hidden) void check();
		}, 10000);
		return () => {
			controller.abort();
			clearInterval(timer);
		};
	}, [refreshKey]);
	const detailId = modal?.type === 'detail' ? modal.city.id : null;
	useEffect(() => {
		if (detailId === null) return;
		const controller = new AbortController();
		let pending = false;
		async function load() {
			if (pending) return;
			pending = true;
			try {
				const city = await api.city(detailId!, controller.signal);
				if (!controller.signal.aborted) {
					setDetailError(null);
					setModal((previous) =>
						previous?.type === 'detail' && previous.city.id === city.id
							? { type: 'detail', city }
							: previous,
					);
				}
			} catch (e) {
				if (!controller.signal.aborted) setDetailError(e);
			} finally {
				pending = false;
			}
		}
		void load();
		const timer = setInterval(() => {
			if (!document.hidden) void load();
		}, 5000);
		return () => {
			controller.abort();
			clearInterval(timer);
		};
	}, [detailId]);

	async function findCity(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (lookupBusy) return;
		if (!lookupValidation.validate({ id: lookup })) {
			focusInvalid(event.currentTarget);
			return;
		}
		setLookupBusy(true);
		setLookupError(null);
		try {
			open(await api.city(parseNumber(lookup)));
		} catch (e) {
			setLookupError(e);
		} finally {
			setLookupBusy(false);
		}
	}
	async function deleteCity(city: City) {
		setDeleting(true);
		setDeleteError(null);
		try {
			await api.delete(city.id);
			setModal(null);
			setToast(`Город «${city.name}» удалён`);
			refresh();
		} catch (e) {
			setDeleteError(e);
		} finally {
			setDeleting(false);
		}
	}
	function navigate(next: Section) {
		setSection(next);
	}
	function edit(city: City) {
		setModal({ type: 'edit', city });
	}
	function confirmDelete(city: City) {
		setDeleteError(null);
		setModal({ type: 'delete', city });
	}
	function cycleSort(field: SortRule['field']) {
		const existing = sorts.find((rule) => rule.field === field);
		setSorts(
			existing?.direction === 'desc'
				? sorts.filter((rule) => rule.field !== field)
				: existing
					? sorts.map((rule) =>
							rule.field === field ? { ...rule, direction: 'desc' } : rule,
						)
					: [...sorts, { field, direction: 'asc' }],
		);
		setPage(1);
	}
	function sortLabel(field: SortRule['field']) {
		const index = sorts.findIndex((rule) => rule.field === field);
		return index < 0
			? '↕'
			: `${sorts[index].direction === 'asc' ? '↑' : '↓'}${sorts.length > 1 ? index + 1 : ''}`;
	}
	const activeFilters = Number(!!filters.name) + Number(!!filters.governorName);

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<a className="brand" href="#cities" aria-label="Cityspace — города">
					<span className="brand-icon">
						<Icon name="city" size={23} />
					</span>
					<span>Cityspace</span>
				</a>
				<div className="workspace">
					<strong>Информационные системы</strong>
					<span>Лабораторная работа №1</span>
				</div>
				<span className="nav-caption">Приложение</span>
				<nav>
					{sections.map((item) => (
						<a
							key={item.id}
							href={`#${item.id}`}
							aria-label={item.label}
							title={item.label}
							aria-current={section === item.id ? 'page' : undefined}
							onClick={() => navigate(item.id)}
							className={section === item.id ? 'active' : ''}>
							<Icon name={item.icon} />
							<span>{item.id === 'operations' ? 'Операции' : item.label}</span>
							{item.id === 'cities' && data && <b>{data.totalElements}</b>}
						</a>
					))}
				</nav>
				<div className="sidebar-bottom"></div>
			</aside>
			<div className="main-shell">
				<main>
					{section === 'cities' && (
						<>
							<div className="page-heading">
								<div>
									<h1>Города</h1>
									<p>Справочник городов и связанных с ними данных.</p>
								</div>
								<button
									className="button primary"
									onClick={() => setModal({ type: 'create' })}>
									<Icon name="plus" size={20} />
									Добавить город
								</button>
							</div>
							<div className="collection">
								<div className="view-toolbar">
									<div className="view-label">
										<Icon name="grid" size={19} />
										<strong>
											{activeFilters ? 'Результаты поиска' : 'Все города'}
										</strong>
										<span className="record-count">
											{data?.totalElements ?? '…'}
										</span>
									</div>
									<div className="view-status">
										<span className="last-refresh">
											{refreshed
												? `Обновлено в ${refreshed.toLocaleTimeString('ru-RU')}`
												: 'Загружаем данные'}
										</span>
										<button
											className="icon-button"
											onClick={refresh}
											title="Обновить данные"
											aria-label="Обновить данные">
											<Icon name="refresh" />
										</button>
									</div>
								</div>
								<div className="filters">
									<label className="search-input">
										<Icon name="search" size={18} />
										<input
											aria-label="Поиск по названию города"
											placeholder="Название города…"
											value={search.name}
											onChange={(e) =>
												setSearch({ ...search, name: e.target.value })
											}
										/>
									</label>
									<label className="search-input">
										<Icon name="people" size={18} />
										<input
											aria-label="Поиск по имени губернатора"
											placeholder="Имя губернатора…"
											value={search.governorName}
											onChange={(e) =>
												setSearch({ ...search, governorName: e.target.value })
											}
										/>
									</label>
									<button
										className={`button secondary ${sorts.length ? 'selected' : ''}`}
										onClick={() => setShowSorts(!showSorts)}
										aria-expanded={showSorts}>
										<Icon name="sort" size={17} />
										Сортировка
										{sorts.length > 0 && (
											<span className="count-badge">{sorts.length}</span>
										)}
									</button>
									{(activeFilters > 0 || sorts.length > 0) && (
										<button
											className="text-button"
											onClick={() => {
												setSearch({ name: '', governorName: '' });
												setSorts([]);
												setPage(1);
											}}>
											Сбросить
										</button>
									)}
								</div>
								{showSorts && (
									<div className="sort-panel">
										<span className="subtle">По порядку приоритета:</span>
										{sorts.map((rule, index) => (
											<div className="sort-rule" key={rule.field}>
												<span>{index + 1}</span>
												<strong>
													{rule.field === 'name' ? 'Название' : 'Губернатор'}
												</strong>
												<button
													className="text-button"
													onClick={() => {
														setSorts(
															sorts.map((s) =>
																s.field === rule.field
																	? {
																			...s,
																			direction:
																				s.direction === 'asc' ? 'desc' : 'asc',
																		}
																	: s,
															),
														);
														setPage(1);
													}}>
													{rule.direction === 'asc' ? 'А → Я' : 'Я → А'}
												</button>
												{index > 0 && (
													<button
														className="icon-button small"
														aria-label="Повысить приоритет"
														onClick={() => {
															const next = [...sorts];
															[next[index - 1], next[index]] = [
																next[index],
																next[index - 1],
															];
															setSorts(next);
															setPage(1);
														}}>
														↑
													</button>
												)}
												<button
													className="icon-button small"
													aria-label="Убрать сортировку"
													onClick={() => {
														setSorts(
															sorts.filter((s) => s.field !== rule.field),
														);
														setPage(1);
													}}>
													<Icon name="close" size={14} />
												</button>
											</div>
										))}
										{(['name', 'governorName'] as const)
											.filter((field) => !sorts.some((s) => s.field === field))
											.map((field) => (
												<button
													className="button secondary compact"
													key={field}
													onClick={() => {
														setSorts([...sorts, { field, direction: 'asc' }]);
														setPage(1);
													}}>
													<Icon name="plus" size={15} />
													{field === 'name' ? 'Название' : 'Губернатор'}
												</button>
											))}
									</div>
								)}
								<ErrorNotice error={listError} retry={refresh} />
								{!data && !listError ? (
									<div className="loading">
										<span className="spinner" />
										Загружаем города…
									</div>
								) : (
									data && (
										<>
											<div
												className="table-scroll"
												tabIndex={0}
												role="region"
												aria-label="Таблица городов с горизонтальной прокруткой">
												<table>
													<thead>
														<tr>
															<th>ID</th>
															<th>
																<button onClick={() => cycleSort('name')}>
																	Город <span>{sortLabel('name')}</span>
																</button>
															</th>
															<th>Координаты</th>
															<th>Площадь, км²</th>
															<th>Население</th>
															<th>Столица</th>
															<th>Высота, м</th>
															<th>Тел. код</th>
															<th>Климат</th>
															<th>Уровень жизни</th>
															<th>
																<button
																	onClick={() => cycleSort('governorName')}>
																	Губернатор{' '}
																	<span>{sortLabel('governorName')}</span>
																</button>
															</th>
															<th>Основан</th>
															<th>Создан</th>
															<th className="actions-cell">Действия</th>
														</tr>
													</thead>
													<tbody>
														{data.content.map((city) => (
															<tr key={city.id}>
																<td className="id-cell">#{city.id}</td>
																<td className="city-cell">
																	<button
																		className="city-link"
																		onClick={() => open(city)}>
																		<span
																			className="table-city-icon"
																			aria-hidden="true">
																			{city.name
																				.slice(0, 1)
																				.toLocaleUpperCase('ru')}
																		</span>
																		<span>{city.name}</span>
																	</button>
																</td>
																<td>
																	<span className="mono">
																		{number(city.coordinates.x)};{' '}
																		{number(city.coordinates.y)}
																	</span>
																</td>
																<td className="numeric">{number(city.area)}</td>
																<td className="numeric">
																	{number(city.population)}
																</td>
																<td>
																	{city.capital ? (
																		<span className="badge green">Столица</span>
																	) : (
																		<span className="subtle">Нет</span>
																	)}
																</td>
																<td className="numeric">
																	{number(city.metersAboveSeaLevel)}
																</td>
																<td>{number(city.telephoneCode)}</td>
																<td>
																	{city.climate ? climates[city.climate] : '—'}
																</td>
																<td>
																	{city.standardOfLiving ? (
																		<span
																			className={`badge ${city.standardOfLiving === 'HIGH' ? 'green' : 'neutral'}`}>
																			{living[city.standardOfLiving]}
																		</span>
																	) : (
																		'—'
																	)}
																</td>
																<td>
																	<span className="governor-name">
																		{city.governor.name}
																	</span>
																	<small className="cell-note">
																		#{city.governor.id} ·{' '}
																		{date(city.governor.birthday)}
																	</small>
																</td>
																<td title={city.establishmentDate ?? ''}>
																	{date(city.establishmentDate)}
																</td>
																<td title={city.creationDate}>
																	{date(city.creationDate)}
																</td>
																<td className="actions-cell">
																	<div>
																		<button
																			className="icon-button small"
																			aria-label={`Изменить ${city.name}`}
																			onClick={() => edit(city)}>
																			<Icon name="edit" size={19} />
																		</button>
																		<button
																			className="icon-button small danger-quiet"
																			aria-label={`Удалить ${city.name}`}
																			onClick={() => confirmDelete(city)}>
																			<Icon name="trash" size={19} />
																		</button>
																	</div>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
											{data.content.length === 0 && (
												<Empty
													title={
														activeFilters
															? 'Ничего не нашлось'
															: 'Городов пока нет'
													}>
													{activeFilters
														? 'Попробуйте изменить или сбросить фильтры.'
														: 'Добавьте первый город в коллекцию.'}
												</Empty>
											)}
											<div className="pagination">
												<span className="subtle">
													{data.totalElements
														? `${(data.page - 1) * data.size + 1}–${Math.min(data.page * data.size, data.totalElements)} из ${number(data.totalElements)}`
														: '0 городов'}
												</span>
												<div className="pagination-controls">
													<label>
														На странице{' '}
														<select
															aria-label="Городов на странице"
															value={size}
															onChange={(e) => {
																setSize(Number(e.target.value));
																setPage(1);
															}}>
															{[10, 20, 50, 100].map((value) => (
																<option key={value}>{value}</option>
															))}
														</select>
													</label>
													<button
														className="icon-button previous"
														aria-label="Предыдущая страница"
														disabled={page <= 1}
														onClick={() => setPage(page - 1)}>
														<Icon name="chevron" size={17} />
													</button>
													<span className="page-index">{page}</span>
													<button
														className="icon-button"
														aria-label="Следующая страница"
														disabled={!data.hasNext}
														onClick={() => setPage(page + 1)}>
														<Icon name="chevron" size={17} />
													</button>
												</div>
											</div>
										</>
									)
								)}
							</div>
							<div className="below-table">
								<Icon name="info" size={17} />
								<span>
									Нажмите на название, чтобы открыть карточку. Остальные столбцы
									доступны при прокрутке вправо.
								</span>
							</div>
							<div className="lookup-panel">
								<div>
									<Icon name="search" />
									<h3>Открыть по ID</h3>
								</div>
								<form onSubmit={findCity} noValidate>
									<label
										className={`field ${lookupValidation.errors.id ? 'field-error' : ''}`}>
										<input
											aria-label="ID города"
											type="text"
											inputMode="numeric"
											placeholder="ID города"
											value={lookup}
											aria-invalid={!!lookupValidation.errors.id}
											onBlur={(e) =>
												lookupValidation.blur('id', e.target.value)
											}
											onChange={(e) => {
												setLookup(e.target.value);
												lookupValidation.change('id', e.target.value);
												setLookupError(null);
											}}
										/>
										{lookupValidation.errors.id && (
											<small role="alert">{lookupValidation.errors.id}</small>
										)}
									</label>
									<button className="button secondary" disabled={lookupBusy}>
										{lookupBusy ? 'Ищем…' : 'Открыть'}
										<Icon name="arrow" size={19} />
									</button>
								</form>
							</div>
							<ErrorNotice error={lookupError} />
						</>
					)}
					{section === 'operations' && <SpecialFunctions onOpen={open} />}
					{section === 'health' && (
						<>
							<div className="page-heading">
								<div>
									<h1>Состояние системы</h1>
									<p>Приложение и база данных.</p>
								</div>
								<button className="button secondary" onClick={refresh}>
									<Icon name="refresh" size={20} />
									Проверить сейчас
								</button>
							</div>
							<div className="health-grid">
								{(
									[
										{ key: 'app', label: 'Приложение', icon: 'pulse' },
										{ key: 'db', label: 'База данных', icon: 'grid' },
									] as const
								).map((item) => (
									<article className="health-card" key={item.key}>
										<span className="operation-icon">
											<Icon name={item.icon} size={25} />
										</span>
										<div>
											<h2>{item.label}</h2>
											<p>
												{item.key === 'app'
													? 'Сервер отвечает на запросы приложения.'
													: 'Соединение с базой данных городов.'}
											</p>
											{health[item.key]?.status !== 'ok' && health.checked && (
												<p className="health-error">
													{item.key === 'db'
														? 'Не удалось подтвердить соединение с БД.'
														: 'Не удалось связаться с приложением.'}
												</p>
											)}
										</div>
										<span
											className={`badge ${health[item.key]?.status === 'ok' ? 'green' : 'neutral'}`}>
											{health[item.key]?.status === 'ok'
												? 'Работает'
												: health.checked
													? 'Недоступно'
													: 'Проверяем…'}
										</span>
									</article>
								))}
							</div>
							<p className="footnote">
								<Icon name="refresh" size={17} />
								Автоматическая проверка каждые 10 секунд
								{health.checked &&
									` · ${health.checked.toLocaleTimeString('ru-RU')}`}
							</p>
						</>
					)}
				</main>
				<footer className="app-footer"></footer>
			</div>
			{modal && (
				<Modal
					key={
						modal.type === 'create'
							? 'create'
							: `${modal.type}-${modal.city.id}`
					}
					title={
						modal.type === 'create'
							? 'Новый город'
							: modal.type === 'edit'
								? 'Редактировать город'
								: modal.type === 'delete'
									? 'Удалить город?'
									: 'Карточка города'
					}
					subtitle={
						modal.type === 'create'
							? 'Добавьте город и свяжите его с губернатором.'
							: modal.type === 'edit'
								? `Изменение данных города #${modal.city.id}`
								: undefined
					}
					wide={modal.type !== 'delete'}
					onClose={() => {
						if (!deleting && !saving) setModal(null);
					}}>
					{(modal.type === 'create' || modal.type === 'edit') && (
						<CityForm
							city={modal.type === 'edit' ? modal.city : undefined}
							onBusyChange={setSaving}
							onCancel={() => setModal(null)}
							onSaved={(city) => {
								setToast(
									modal.type === 'create'
										? `Город «${city.name}» создан`
										: 'Изменения сохранены',
								);
								open(city);
								refresh();
							}}
						/>
					)}
					{modal.type === 'detail' && (
						<>
							<ErrorNotice error={detailError} />
							<CityDetails
								city={modal.city}
								onEdit={() => edit(modal.city)}
								onDelete={() => confirmDelete(modal.city)}
							/>
						</>
					)}
					{modal.type === 'delete' && (
						<div className="delete-confirm">
							<span className="delete-icon">
								<Icon name="trash" size={28} />
							</span>
							<p>
								Город <strong>«{modal.city.name}»</strong> и его координаты
								будут удалены. Губернатор останется в системе.
							</p>
							<p className="subtle">Это действие нельзя отменить.</p>
							<ErrorNotice error={deleteError} />
							<div className="modal-footer">
								<button
									className="button secondary"
									disabled={deleting}
									onClick={() => setModal(null)}>
									Отмена
								</button>
								<button
									className="button danger"
									disabled={deleting}
									onClick={() => deleteCity(modal.city)}>
									{deleting ? 'Удаляем…' : 'Удалить город'}
								</button>
							</div>
						</div>
					)}
				</Modal>
			)}
			{toast && (
				<div className="toast" role="status">
					<span>
						<Icon name="check" size={18} />
					</span>
					{toast}
					<button
						className="icon-button small"
						aria-label="Закрыть уведомление"
						onClick={() => setToast('')}>
						<Icon name="close" size={16} />
					</button>
				</div>
			)}
		</div>
	);
}

export default App;
