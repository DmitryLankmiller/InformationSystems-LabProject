import { useEffect, useState } from 'react';
import { ApiError } from './api';

export function usePolling<T>(
	load: (signal: AbortSignal) => Promise<T>,
	onUnauthorized: () => void,
) {
	const [revision, setRevision] = useState(0);
	const [state, setState] = useState<{
		source: typeof load;
		data: T | null;
		error: unknown;
		checked: Date | null;
	} | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		let pending = false;
		let stopped = false;
		async function update() {
			if (pending || stopped) return;
			pending = true;
			try {
				const data = await load(controller.signal);
				if (!controller.signal.aborted)
					setState({ source: load, data, error: null, checked: new Date() });
			} catch (error) {
				if (controller.signal.aborted) return;
				if (error instanceof ApiError) {
					if (error.status === 401) onUnauthorized();
					stopped = [401, 403, 404].includes(error.status);
				}
				setState((previous) => ({
					source: load,
					data: previous?.source === load ? previous.data : null,
					checked: previous?.source === load ? previous.checked : null,
					error,
				}));
			} finally {
				pending = false;
			}
		}
		void update();
		const timer = setInterval(() => {
			if (!document.hidden) void update();
		}, 5000);
		return () => {
			controller.abort();
			clearInterval(timer);
		};
	}, [load, onUnauthorized, revision]);

	return {
		data: state?.source === load ? state.data : null,
		error: state?.source === load ? state.error : null,
		checked: state?.source === load ? state.checked : null,
		refresh: () => setRevision((value) => value + 1),
	};
}
