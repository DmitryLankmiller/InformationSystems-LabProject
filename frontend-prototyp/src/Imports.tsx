import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError } from './api';
import type { AuthSession, ImportHistory } from './api';
import { Empty, ErrorNotice, Field, Icon, Modal } from './components';
import { date, number } from './format';
import { usePolling } from './usePolling';

interface AuthProps {
	session: AuthSession;
	onUnauthorized: () => void;
}

function ImportStatus({ status }: { status: ImportHistory['importStatus'] }) {
	const labels = {
		RUNNING: 'Выполняется',
		SUCCESS: 'Завершён',
		FAILED: 'Ошибка',
	};
	return (
		<span
			className={`badge ${status === 'SUCCESS' ? 'green' : status === 'FAILED' ? 'red' : 'blue'}`}>
			{labels[status]}
		</span>
	);
}

function ImportDetails({
	id,
	session,
	onUnauthorized,
}: AuthProps & { id: number }) {
	const load = useCallback(
		(signal: AbortSignal) => api.importHistory(id, session, signal),
		[id, session],
	);
	const { data, error, refresh } = usePolling(load, onUnauthorized);
	return (
		<>
			<a className="button secondary back-link" href="#imports">
				<Icon name="arrow" size={18} /> К истории импортов
			</a>
			<div className="page-heading">
				<div>
					<h1>Импорт #{id}</h1>
					<p>Подробности загрузки и результат обработки.</p>
				</div>
				<button className="button secondary" onClick={refresh}>
					<Icon name="refresh" /> Обновить
				</button>
			</div>
			<ErrorNotice error={error} retry={refresh} />
			{!data && !error && (
				<div className="loading">
					<span className="spinner" /> Загружаем импорт…
				</div>
			)}
			{data && (
				<article className="import-details">
					<div className="import-detail-heading">
						<h2>{data.fileName}</h2>
						<ImportStatus status={data.importStatus} />
					</div>
					<dl className="detail-grid">
						<div>
							<dt>ID операции</dt>
							<dd>{data.id}</dd>
						</div>
						<div>
							<dt>Файл</dt>
							<dd>{data.fileName}</dd>
						</div>
						<div>
							<dt>Пользователь</dt>
							<dd>{data.userLogin}</dd>
						</div>
						<div>
							<dt>Дата загрузки</dt>
							<dd>{date(data.importDate)}</dd>
						</div>
						{data.importStatus === 'SUCCESS' && (
							<div>
								<dt>Добавлено городов</dt>
								<dd>{number(data.importedRowsCount)}</dd>
							</div>
						)}
					</dl>
					{data.importStatus === 'RUNNING' && (
						<p className="import-progress" role="status">
							<span className="spinner" /> Файл обрабатывается. Можно вернуться
							к списку — импорт продолжится.
						</p>
					)}
					{data.importStatus === 'FAILED' && (
						<div className="import-failure" role="alert">
							<h3>Не удалось импортировать города</h3>
							<p>
								{data.errorMsg ||
									'Не удалось обработать файл. Проверьте данные и попробуйте ещё раз.'}
							</p>
							<p>Города из этого файла не добавлены.</p>
						</div>
					)}
				</article>
			)}
			<p className="footnote">
				<Icon name="refresh" size={17} /> Автоматическое обновление каждые 5
				секунд.
			</p>
		</>
	);
}

function ImportList({
	session,
	onUnauthorized,
	page,
	size,
	onPage,
	onSize,
}: AuthProps & {
	page: number;
	size: number;
	onPage: (page: number) => void;
	onSize: (size: number) => void;
}) {
	const load = useCallback(
		(signal: AbortSignal) => api.imports(page, size, session, signal),
		[page, size, session],
	);
	const { data, error, checked, refresh } = usePolling(load, onUnauthorized);
	useEffect(() => {
		if (data && page > Math.max(1, data.totalPages))
			onPage(Math.max(1, data.totalPages));
	}, [data, page, onPage]);

	return (
		<div className="collection">
			<div className="view-toolbar">
				<div className="view-label">
					<Icon name="imports" size={19} />
					<strong>
						{session.user.role === 'ADMIN' ? 'Все импорты' : 'Мои импорты'}
					</strong>
					<span className="record-count">{data?.totalElements ?? '…'}</span>
				</div>
				<div className="view-status">
					<span className="last-refresh">
						{checked
							? `Обновлено в ${checked.toLocaleTimeString('ru-RU')}`
							: 'Загружаем данные'}
					</span>
					<button
						className="icon-button"
						onClick={refresh}
						aria-label="Обновить историю">
						<Icon name="refresh" />
					</button>
				</div>
			</div>
			<ErrorNotice error={error} retry={refresh} />
			{!data && !error && (
				<div className="loading">
					<span className="spinner" /> Загружаем историю…
				</div>
			)}
			{data && (
				<>
					<div
						className="table-scroll import-table"
						tabIndex={0}
						role="region"
						aria-label="История импортов">
						<table>
							<thead>
								<tr>
									<th>Файл</th>
									<th>Дата загрузки</th>
									<th>Пользователь</th>
									<th>Статус</th>
									<th>Добавлено городов</th>
									<th>Действия</th>
								</tr>
							</thead>
							<tbody>
								{data.content.map((item) => (
									<tr key={item.id}>
										<td>
											<a
												className="import-file-link"
												href={`#imports/${item.id}`}>
												<Icon name="file" size={20} />
												{item.fileName}
											</a>
										</td>
										<td>{date(item.importDate)}</td>
										<td>{item.userLogin}</td>
										<td>
											<ImportStatus status={item.importStatus} />
										</td>
										<td className="numeric">
											{item.importStatus === 'SUCCESS'
												? number(item.importedRowsCount)
												: '—'}
										</td>
										<td>
											<a
												className="text-button"
												href={`#imports/${item.id}`}
												aria-label={`Подробнее об импорте ${item.fileName}`}>
												Подробнее
											</a>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{data.content.length === 0 && (
						<Empty title="Импортов пока нет">
							Загрузите CSV-файл с городами, чтобы начать.
						</Empty>
					)}
					<div className="pagination">
						<span className="subtle">
							{data.totalElements
								? `${(data.page - 1) * data.size + 1}–${Math.min(data.page * data.size, data.totalElements)} из ${number(data.totalElements)}`
								: '0 импортов'}
						</span>
						<div className="pagination-controls">
							<label>
								На странице{' '}
								<select
									aria-label="Импортов на странице"
									value={size}
									onChange={(event) => onSize(Number(event.target.value))}>
									{[10, 20, 50, 100].map((value) => (
										<option key={value}>{value}</option>
									))}
								</select>
							</label>
							<button
								className="icon-button previous"
								aria-label="Предыдущая страница"
								disabled={page <= 1}
								onClick={() => onPage(page - 1)}>
								<Icon name="chevron" size={17} />
							</button>
							<span className="page-index">{page}</span>
							<button
								className="icon-button"
								aria-label="Следующая страница"
								disabled={!data.hasNext}
								onClick={() => onPage(page + 1)}>
								<Icon name="chevron" size={17} />
							</button>
						</div>
					</div>
				</>
			)}
			<p className="footnote">
				<Icon name="refresh" size={17} /> Автоматическое обновление каждые 5
				секунд.
			</p>
		</div>
	);
}

function UploadDialog({
	session,
	onUnauthorized,
	onClose,
	onAccepted,
}: AuthProps & {
	onClose: () => void;
	onAccepted: (history: ImportHistory) => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<unknown>(null);

	function validate(file: File | null) {
		if (!file) return 'Выберите CSV-файл.';
		if (!/\.csv$/i.test(file.name)) return 'Выберите файл с расширением .csv.';
		if (file.size === 0)
			return 'Файл пуст. Добавьте заголовки и хотя бы один город.';
		return '';
	}
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (busy) return;
		const message = validate(file);
		setFileError(message);
		if (message || !file) return;
		setBusy(true);
		setError(null);
		try {
			onAccepted(await api.importCsv(file, session));
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) onUnauthorized();
			else setError(error);
		} finally {
			setBusy(false);
		}
	}
	return (
		<Modal
			title="Импорт городов"
			onClose={() => {
				if (!busy) onClose();
			}}>
			<form className="upload-form" onSubmit={submit} noValidate>
				<Field
					label="CSV-файл"
					required
					error={fileError}
					hint="UTF-8, разделитель — запятая. Первая строка содержит названия столбцов.">
					<input
						type="file"
						accept=".csv,text/csv"
						disabled={busy}
						aria-invalid={!!fileError}
						onBlur={() => setFileError(validate(file))}
						onChange={(event) => {
							const selected = event.target.files?.[0] ?? null;
							setFile(selected);
							setFileError(validate(selected));
							setError(null);
						}}
					/>
				</Field>
				<p className="upload-note">
					Если в файле есть ошибка, ни один город из него не будет добавлен.
					Результат появится в истории импорта.
				</p>
				<ErrorNotice error={error} />
				<div className="upload-actions">
					<button
						type="button"
						className="button secondary"
						disabled={busy}
						onClick={onClose}>
						Отмена
					</button>
					<button
						className="button primary"
						disabled={busy || !!fileError || !file}>
						{busy ? 'Загружаем…' : 'Начать импорт'}
					</button>
				</div>
			</form>
		</Modal>
	);
}

function importIdFromHash() {
	const match = location.hash.match(/^#imports\/([1-9]\d*)$/);
	const id = match ? Number(match[1]) : null;
	return id !== null && Number.isSafeInteger(id) ? id : null;
}

export function Imports({ session, onUnauthorized }: AuthProps) {
	const [id, setId] = useState(importIdFromHash);
	const [page, setPage] = useState(1);
	const [size, setSize] = useState(10);
	const [upload, setUpload] = useState(false);
	useEffect(() => {
		const change = () => setId(importIdFromHash());
		window.addEventListener('hashchange', change);
		return () => window.removeEventListener('hashchange', change);
	}, []);
	return (
		<>
			{id === null ? (
				<>
					<div className="page-heading">
						<div>
							<h1>Импорты</h1>
							<p>Загрузка городов из CSV и история обработки файлов.</p>
						</div>
						<button className="button primary" onClick={() => setUpload(true)}>
							<Icon name="imports" /> Импортировать CSV
						</button>
					</div>
					<ImportList
						session={session}
						onUnauthorized={onUnauthorized}
						page={page}
						size={size}
						onPage={setPage}
						onSize={(value) => {
							setSize(value);
							setPage(1);
						}}
					/>
				</>
			) : (
				<ImportDetails
					key={id}
					id={id}
					session={session}
					onUnauthorized={onUnauthorized}
				/>
			)}
			{upload && (
				<UploadDialog
					session={session}
					onUnauthorized={onUnauthorized}
					onClose={() => setUpload(false)}
					onAccepted={(history) => {
						setUpload(false);
						setPage(1);
						location.hash = `imports/${history.id}`;
					}}
				/>
			)}
		</>
	);
}
