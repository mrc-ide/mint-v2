<script lang="ts">
	import { DynamicForm } from '$lib/components/dynamic-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let hasRun = $state(false);
	$effect(() => {
		const d2 = data;
		toast('re run');
	});
</script>

<!-- will need to pass in initial values + hasRun -->
<DynamicForm schema={data.formSchema} initialValues={{}} bind:hasRun />
