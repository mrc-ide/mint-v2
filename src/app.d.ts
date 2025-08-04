// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			userState: {
				userId: string;
				createdAt: string;
			}; // TODO: update as we iron out the types
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
