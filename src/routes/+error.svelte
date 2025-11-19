<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';

	const errorDetails: Record<number, { title: string; description: string }> = {
		404: {
			title: 'Resource Not Found',
			description: "The page you're looking for doesn't exist or has been moved."
		},
		500: {
			title: 'Internal Server Error',
			description: "Something went wrong on our end. We're working to fix it."
		},
		403: {
			title: 'Forbidden',
			description: "You don't have permission to access this resource."
		},
		401: {
			title: 'Unauthorized',
			description: 'You need to be authenticated to access this page.'
		}
	};
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md text-center">
		<!-- Error Code -->
		<div class="mb-4">
			<h1 class="text-8xl font-bold text-destructive">
				{page.status}
			</h1>
		</div>

		<!-- Error Title -->
		<h2 class="mb-2 text-2xl font-semibold text-destructive">
			{errorDetails[page.status].title || 'An Error Occurred'}
		</h2>

		<!-- Error Message -->
		<p class="mb-6 text-destructive">
			{page.error?.message || errorDetails[page.status].description || 'An unexpected error occurred.'}
		</p>

		<!-- Actions -->
		<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			<Button href="/" class="w-full sm:w-auto">Go Home</Button>
			<Button variant="outline" onclick={() => window.history.back()} class="w-full sm:w-auto">Go Back</Button>
		</div>
	</div>
</div>
