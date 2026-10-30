import { useState } from 'react';
import { validateFields } from './validation';
import type { FieldErrors, Rules } from './validation';

export function useFieldValidation(rules: Rules) {
	const [errors, setErrors] = useState<FieldErrors>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	function check(field: string, value: string) {
		const message = rules[field]?.(value);
		setErrors((previous) => {
			const next = { ...previous };
			if (message) next[field] = message;
			else delete next[field];
			return next;
		});
	}
	return {
		errors,
		change(field: string, value: string) {
			if (touched[field] || errors[field]) check(field, value);
		},
		blur(field: string, value: string) {
			setTouched((previous) => ({ ...previous, [field]: true }));
			check(field, value);
		},
		validate(values: Record<string, string>) {
			const next = validateFields(rules, values);
			setErrors(next);
			setTouched(
				Object.fromEntries(Object.keys(rules).map((field) => [field, true])),
			);
			return Object.keys(next).length === 0;
		},
		server(next: FieldErrors) {
			setErrors(next);
			setTouched((previous) => ({
				...previous,
				...Object.fromEntries(Object.keys(next).map((field) => [field, true])),
			}));
		},
		reset(fields: string[]) {
			setErrors((previous) =>
				Object.fromEntries(
					Object.entries(previous).filter(([field]) => !fields.includes(field)),
				),
			);
			setTouched((previous) =>
				Object.fromEntries(
					Object.entries(previous).filter(([field]) => !fields.includes(field)),
				),
			);
		},
	};
}
