<script lang="ts">
	import type { WithoutChildrenOrChild } from '$lib/utils';
	import { cn } from '$lib/utils';
	import { Slider } from './ui/slider';
	import { Slider as SliderPrimitive } from 'bits-ui';
	let {
		class: className,
		value = $bindable(),
		containerClass,
		markerValue,
		min,
		max,
		unit,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
		containerClass?: string;
		markerValue: number;
		min: number;
		max: number;
		unit?: string;
	} = $props();

	let markerPos = $derived(((markerValue - min) / (max - min)) * 100);
</script>

<div class={cn('relative h-7 w-64', containerClass)}>
	<Slider bind:value={value as never} class={className} {min} {max} {...restProps} />
	<div class="pointer-events-none absolute top-0 h-full" style="left: {markerPos}%;">
		<div class="z-1.5 h-full w-0.5 bg-foreground/80"></div>
		<div class="-translate-x-1/4 text-xs text-muted-foreground">
			{markerValue}{unit}
		</div>
	</div>
</div>
