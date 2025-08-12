// See https://svelte.dev/docs/kit/types#app.d.ts

import type { UserState } from '$lib/types';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// TODO: update as we iron out the types
			userState: UserState;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
