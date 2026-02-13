<script lang="ts">
	import { convertToLocaleString } from '$lib/number';
	import type { Snippet } from 'svelte';

	interface Props {
		value: number;
		baseline: number;
		children: Snippet;
		prefixUnit?: string;
		postFixUnit?: string;
	}
	let { children, value, baseline, prefixUnit, postFixUnit }: Props = $props();
</script>

<div class="flex flex-row items-center gap-2">
	{@render children()}
	<span class="text-right text-sm font-medium tabular-nums">
		{#if value - baseline >= 0}+{:else}-{/if}
		{prefixUnit}{convertToLocaleString(Math.abs(value - baseline), 1)}{postFixUnit}</span
	>
</div>
