// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			userData: Record<string, any>; // TODO: update to a more specific type later
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
