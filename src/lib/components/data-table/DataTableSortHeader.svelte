<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import type { ComponentProps } from 'svelte';
	import InfoTooltip from '../InfoTooltip.svelte';

	type Props = { label: string; helpText?: string } & ComponentProps<typeof Button>;
	let { label, helpText, variant = 'ghost', ...restProps }: Props = $props();
</script>

<Button {variant} {...restProps} size="sm" class="h-full py-1 whitespace-normal has-[>svg]:px-1">
	{label}
	{#if helpText}
		<InfoTooltip text={helpText} />
	{/if}
	<ArrowUpDownIcon class="flex-shrink-0" />
</Button>
