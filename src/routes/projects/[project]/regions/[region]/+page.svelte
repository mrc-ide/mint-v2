<script lang="ts">
	import { DynamicForm } from '$lib/components/dynamic-form';
	import { formSchema } from '$lib/schemas/testForm';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	$effect(() => {
		const d2 = data;
		toast('re run');
	});
</script>

<!-- will need to pass in initial values + hasRun -->
<DynamicForm schema={formSchema as any} initialValues={{}} hasRun={false} />
