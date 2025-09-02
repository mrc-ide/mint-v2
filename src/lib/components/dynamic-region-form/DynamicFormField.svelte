<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import InfoTooltip from '../InfoTooltip.svelte';
	import Switch from '../ui/switch/switch.svelte';
	import type { FormValue, SchemaField } from './types';
	import { evaluateValueExpression, isDisabled } from './utils';

	interface Props {
		field: SchemaField;
		form: Record<string, FormValue>;
		errors: Record<string, string | null>;
		onFieldChange: (field: SchemaField, value: FormValue) => void;
		isInputsDisabled: boolean;
	}
	let { field, form, errors, onFieldChange, isInputsDisabled }: Props = $props();

	let isFieldDisabled = $derived(isInputsDisabled || isDisabled(form, field));
</script>

<div class="flex flex-col gap-2">
	<div class="flex gap-2">
		<Label for={field.id} class={errors[field.id] ? 'text-destructive' : ''}>{field.label}</Label>
		{#if field.helpText}
			<InfoTooltip text={field.helpText} />
		{/if}
	</div>

	{#if field.type === 'number'}
		<Input
			id={field.id}
			type="number"
			min={field.min}
			max={field.max}
			step={field.step ?? 'any'}
			disabled={isFieldDisabled}
			value={String(form[field.id] ?? '')}
			aria-invalid={Boolean(errors[field.id])}
			oninput={(e) => onFieldChange(field, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
		/>
	{:else if field.type === 'toggle'}
		<Switch
			id={field.id}
			disabled={isFieldDisabled}
			aria-invalid={Boolean(errors[field.id])}
			checked={Boolean(form[field.id])}
			onCheckedChange={(checked) => onFieldChange(field, checked)}
		/>
	{:else if field.type === 'slider'}
		<div class="flex items-center gap-3">
			<Slider
				id={field.id}
				type="single"
				min={field.min}
				max={field.max}
				step={field.step ?? 1}
				disabled={isInputsDisabled}
				value={Number(form[field.id] ?? 0)}
				aria-invalid={Boolean(errors[field.id])}
				onValueChange={(value) => onFieldChange(field, value)}
				thumbClass={Boolean(errors[field.id]) ? 'border-destructive' : ''}
			/>
			<span class="w-10 text-right text-sm tabular-nums">{form[field.id] as number}{field.unit ?? ''}</span>
		</div>
	{:else if field.type === 'multiselect'}
		<div class="flex flex-wrap gap-2">
			{#each field.options ?? [] as opt (opt.value)}
				{@const selectedValues = (form[field.id] as string[]) ?? []}
				<Label class="inline-flex items-center gap-2 text-sm font-normal">
					<Checkbox
						disabled={isInputsDisabled}
						checked={selectedValues.includes(opt.value)}
						onCheckedChange={(checked) => {
							const current = new Set<string>(selectedValues);
							if (checked) current.add(opt.value);
							else current.delete(opt.value);
							onFieldChange(field, Array.from(current));
						}}
					/>
					{opt.label}
				</Label>
			{/each}
		</div>
	{:else if field.type === 'display'}
		<div class="rounded-md bg-slate-50 px-2 py-1 text-sm tabular-nums dark:bg-slate-950">
			{evaluateValueExpression(form, field) as number}{field.unit ?? ''}
		</div>
	{/if}

	{#if errors[field.id]}
		<p class="text-xs text-destructive">{errors[field.id]}</p>
	{/if}
</div>
