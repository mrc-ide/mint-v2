<script lang="ts">
	import { convertToLocaleString } from '$lib/number';
	import type { Snippet } from 'svelte';

	interface Props {
		value: number;
		baseline: number;
		children: Snippet;
		prefixUnit?: string;
		postfixUnit?: string;
		fractionalDigits?: number;
		displayChangeAsPercentage?: boolean;
	}
	let {
		children,
		value,
		baseline,
		prefixUnit,
		postfixUnit,
		fractionalDigits = 1,
		displayChangeAsPercentage = false
	}: Props = $props();
	const change = $derived(displayChangeAsPercentage ? ((value - baseline) / baseline) * 100 : value - baseline);
</script>

<div class="flex flex-row items-center gap-2">
	{@render children()}
	<span class="min-w-10 text-right text-sm font-medium tabular-nums">
		{#if change >= 0}+{:else}-{/if}
		{prefixUnit}{convertToLocaleString(Math.abs(change), fractionalDigits)}{postfixUnit}</span
	>
</div>
