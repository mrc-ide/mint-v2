<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = { label: string } & ComponentProps<typeof Button>;
	let { label, variant = 'ghost', ...restProps }: Props = $props();
</script>

<Button {variant} {...restProps} size="sm" class="h-full py-1 whitespace-normal has-[>svg]:px-1">
	{label}
	<ArrowUpDownIcon class="flex-shrink-0" />
</Button>
