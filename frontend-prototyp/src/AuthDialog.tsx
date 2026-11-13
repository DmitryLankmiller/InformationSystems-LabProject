import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from './api';
import type { AuthSession } from './api';
import { ErrorNotice, Field, Modal } from './components';
import { useFieldValidation } from './useFieldValidation';
import { focusInvalid } from './validation';

export function AuthDialog({ onClose, onAuthenticated }: {
	onClose: () => void;
	onAuthenticated: (session: AuthSession) => void;
}) {
	const [register, setRegister] = useState(false);
	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const validation = useFieldValidation({
		login: (value) => {
			if (!value.trim()) return 'Укажите логин.';
			if (value.length > 64) return 'Не больше 64 символов.';
			if (/[\s:\p{Cc}]/u.test(value)) return 'Без пробелов, двоеточий и управляющих символов.';
		},
		password: (value) => {
			if (!value.trim()) return 'Укажите пароль.';
			if (register && (value.length < 8 || value.length > 128))
				return 'Пароль должен содержать от 8 до 128 символов.';
			if (/\p{Cc}/u.test(value)) return 'Пароль не должен содержать управляющие символы.';
		},
	});

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (busy) return;
		if (!validation.validate({ login, password })) {
			focusInvalid(event.currentTarget);
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const session = await (register ? api.register : api.login)({ login, password });
			onAuthenticated(session);
		} catch (error) {
			setError(error);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Modal title={register ? 'Регистрация' : 'Вход в Cityspace'} onClose={() => { if (!busy) onClose(); }}>
			<form className="auth-form" onSubmit={submit} noValidate>
				<fieldset disabled={busy}>
					<div className="segmented" aria-label="Вход или регистрация">
						{[false, true].map((mode) => (
							<button key={String(mode)} type="button" className={register === mode ? 'active' : ''}
								aria-pressed={register === mode} onClick={() => {
									setRegister(mode);
									setError(null);
									setPassword('');
									validation.reset(['login', 'password']);
								}}>
								{mode ? 'Регистрация' : 'Вход'}
							</button>
						))}
					</div>
					<div className="auth-fields">
						<Field label="Логин" required error={validation.errors.login}>
							<input name="login" autoComplete="username" value={login}
								aria-invalid={!!validation.errors.login} autoCapitalize="none" spellCheck={false}
								onBlur={() => validation.blur('login', login)} onChange={(event) => {
									setLogin(event.target.value);
									validation.change('login', event.target.value);
									setError(null);
								}} />
						</Field>
						<Field label="Пароль" required error={validation.errors.password}
							hint={register ? 'От 8 до 128 символов.' : undefined}>
							<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'}
								value={password} aria-invalid={!!validation.errors.password}
								onBlur={() => validation.blur('password', password)} onChange={(event) => {
									setPassword(event.target.value);
									validation.change('password', event.target.value);
									setError(null);
								}} />
						</Field>
					</div>
				</fieldset>
				<ErrorNotice error={error} />
				<button className="button primary" disabled={busy}>
					{busy ? 'Подождите…' : register ? 'Зарегистрироваться' : 'Войти'}
				</button>
			</form>
		</Modal>
	);
}
