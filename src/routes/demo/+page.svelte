<script lang="ts">
	import type { PageProps } from './$types';
	import { DynamicForm } from '$lib/components/dynamic-form';
	import { formSchema } from '$lib/schemas/testForm';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	$effect(() => {
		const d2 = data;
		toast('re run');
	});
</script>

<div class="mx-auto max-w-5xl space-y-6 p-6">
	<h1 class="text-2xl font-semibold">Dynamic Form Demo</h1>
	<p class="text-sm text-slate-600">Server timestamp (updates on re-run): {data.ts}</p>

	<DynamicForm schema={formSchema as any} initialValues={{}} />
</div>
