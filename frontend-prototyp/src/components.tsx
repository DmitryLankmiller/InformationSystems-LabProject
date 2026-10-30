import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ApiError } from './api';
import { errorMessage } from './format';
import { fieldLabel } from './errors';

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
	const paths: Record<string, ReactNode> = {
		city: (
			<>
				<path d="M3 21V9h6v12M9 21V3h7v18M16 21v-9h5v9M1 21h22" />
				<path d="M12 7h1m-1 4h1m-1 4h1M5 13h1m-1 4h1m12-1h1" />
			</>
		),
		grid: (
			<>
				<rect x="3" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="3" width="7" height="7" rx="1" />
				<rect x="3" y="14" width="7" height="7" rx="1" />
				<rect x="14" y="14" width="7" height="7" rx="1" />
			</>
		),
		spark: (
			<>
				<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z" />
			</>
		),
		pulse: (
			<>
				<path d="M2 12h5l3-8 4 16 3-8h5" />
			</>
		),
		plus: <path d="M12 5v14M5 12h14" />,
		search: (
			<>
				<circle cx="10.5" cy="10.5" r="6.5" />
				<path d="m16 16 4.5 4.5" />
			</>
		),
		refresh: (
			<>
				<path d="M20 7v5h-5M4 17v-5h5" />
				<path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" />
			</>
		),
		close: <path d="m6 6 12 12M6 18 18 6" />,
		arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
		chevron: <path d="m9 5 7 7-7 7" />,
		edit: (
			<>
				<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15Z" />
			</>
		),
		trash: (
			<>
				<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
			</>
		),
		pin: (
			<>
				<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
				<circle cx="12" cy="10" r="2" />
			</>
		),
		check: <path d="m5 12 4 4L19 6" />,
		info: (
			<>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 11v6m0-10v1" />
			</>
		),
		sort: (
			<>
				<path d="M8 4v16m-4-4 4 4 4-4M16 20V4m-4 4 4-4 4 4" />
			</>
		),
		globe: (
			<>
				<circle cx="12" cy="12" r="9" />
				<ellipse cx="12" cy="12" rx="4" ry="9" />
				<path d="M3 12h18" />
			</>
		),
		people: (
			<>
				<circle cx="9" cy="8" r="3" />
				<path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3" />
			</>
		),
	};
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			{paths[name] || paths.info}
		</svg>
	);
}

export function Modal({
	title,
	subtitle,
	onClose,
	children,
	wide = false,
}: {
	title: string;
	subtitle?: string;
	onClose: () => void;
	children: ReactNode;
	wide?: boolean;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = ref.current!;
		const previous = document.activeElement as HTMLElement | null;
		dialog.showModal();
		return () => {
			dialog.close();
			previous?.focus();
		};
	}, []);
	return (
		<dialog
			ref={ref}
			className={`modal ${wide ? 'modal-drawer' : ''}`}
			aria-label={title}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}>
			<div className="modal-heading">
				<div>
					<h2>{title}</h2>
					{subtitle && <p>{subtitle}</p>}
				</div>
				<button className="icon-button" onClick={onClose} aria-label="Закрыть">
					<Icon name="close" />
				</button>
			</div>
			<div className="modal-body">{children}</div>
		</dialog>
	);
}

export function ErrorNotice({
	error,
	retry,
}: {
	error: unknown;
	retry?: () => void;
}) {
	if (!error) return null;
	return (
		<div className="error-notice" role="alert" tabIndex={-1}>
			<Icon name="info" />
			<div>
				<strong>{errorMessage(error)}</strong>
				{error instanceof ApiError && error.details.length > 0 && (
					<ul>
						{error.details.map((detail, index) => (
							<li key={index}>
								{fieldLabel(detail.field)}: {detail.message}
							</li>
						))}
					</ul>
				)}
				{retry && (
					<button className="text-button" onClick={retry}>
						Попробовать снова
					</button>
				)}
			</div>
		</div>
	);
}

export function Field({
	label,
	error,
	children,
	hint,
	required,
}: {
	label: string;
	error?: string;
	children: ReactNode;
	hint?: string;
	required?: boolean;
}) {
	return (
		<label className={`field ${error ? 'field-error' : ''}`}>
			<span>
				{label}
				{required && <b className="required"> *</b>}
			</span>
			{children}
			{error ? (
				<small role="alert">{error}</small>
			) : (
				hint && <small>{hint}</small>
			)}
		</label>
	);
}

export function Empty({
	title,
	children,
}: {
	title: string;
	children?: ReactNode;
}) {
	return (
		<div className="empty">
			<span className="empty-icon">
				<Icon name="city" size={30} />
			</span>
			<h3>{title}</h3>
			{children && <p>{children}</p>}
		</div>
	);
}
