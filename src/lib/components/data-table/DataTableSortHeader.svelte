<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = { label: string } & ComponentProps<typeof Button>;
	let { label, variant = 'ghost', ...restProps }: Props = $props();
</script>

<Button {variant} {...restProps} class="flex h-full  whitespace-normal">
	{label}
	<ArrowUpDownIcon class="flex-shrink-0" />
</Button>
