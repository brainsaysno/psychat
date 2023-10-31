import { writable, get } from 'svelte/store';

// Custom store synced with localStorage by design.
// Modified typed example from https://svelte.dev/repl/e6c0e3db7d064d43a7e4559b2862e1f7?version=3.48.0
export default function localStorageSyncStore<T>(key: string, fallbackData: T) {
	const store = writable<T>(fallbackData);
	const { subscribe, set } = store;
	const isBrowser = typeof window !== 'undefined';

	if (isBrowser && localStorage[key])
		set(JSON.parse(localStorage[key] as string) as T);

	return {
		subscribe,
		set(n) {
			if (isBrowser) localStorage[key] = JSON.stringify(n);
			set(n);
		},
		update(this, updater) {
			const updatedStore = updater(get(store));

			if (isBrowser) localStorage[key] = JSON.stringify(updatedStore);
			set(updatedStore);
		},
	} satisfies typeof store;
}
