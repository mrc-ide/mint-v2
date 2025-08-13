<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '../ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '../ui/input';
	import { Label } from '../ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Info from '@lucide/svelte/icons/info';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type {
		CustomDisabled,
		CustomValidationRule,
		CustomValue,
		Schema,
		SchemaField,
		SchemaGroup,
		SchemaSubGroup
	} from './types';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';

	type Props = {
		schema: Schema;
		initialValues: Record<string, unknown>;
		hasRun: boolean;
	};
	let { schema, initialValues, hasRun = $bindable(false) }: Props = $props();

	// Helpers to iterate fields and to map field->group
	function forEachField(callback: (f: SchemaField, g: SchemaGroup, sg: SchemaSubGroup) => void) {
		for (const g of schema.groups) {
			for (const sg of g.subGroups) {
				for (const f of sg.fields) callback(f, g, sg);
			}
		}
	}
	const fieldToGroup: Record<string, SchemaGroup> = {};
	forEachField((field, group) => {
		fieldToGroup[field.id] = group;
	});

	// Initialize state from defaults + initialValues override
	const form = $state<Record<string, unknown>>({});
	const errors = $state<Record<string, string | null>>({});
	const collapsedGroups = $state<Record<string, boolean>>({});
	const collapsedSubGroups = $state<Record<string, boolean>>({});

	const coerceDefaults = (field: SchemaField): unknown => {
		// For display fields, we won't assign default here (computed later)
		switch (field.type) {
			case 'checkbox':
				return field.default ?? false;
			case 'number':
			case 'slider':
				return field.default ?? 0;
			case 'multiselect':
				return field.default ?? [];
			default:
				return field.default ?? null; // For 'display' or any other type, return default or null
		}
	};

	// init
	forEachField((field, group, subGroup) => {
		form[field.id] = initialValues[field.id] ?? coerceDefaults(field);
		errors[field.id] = null;
		// initialize collapse states (default expanded)
		if (group.collapsible && collapsedGroups[group.id] === undefined) collapsedGroups[group.id] = false;
		const key = `${group.id}:${subGroup.id}`;
		if (subGroup.collapsible && collapsedSubGroups[key] === undefined) collapsedSubGroups[key] = false;
	});

	function isGroupCollapsed(group: SchemaGroup) {
		return collapsedGroups[group.id] === true;
	}

	function isSubGroupCollapsed(groupId: string, subGroupId: string) {
		return collapsedSubGroups[`${groupId}:${subGroupId}`] === true;
	}

	// Util: evaluate display and disabled expressions
	function getNumber(val: unknown): number {
		const n = typeof val === 'number' ? val : Number(val);
		return Number.isFinite(n) ? n : 0;
	}

	function evaluateValueExpression(field: SchemaField): unknown {
		if (field.type !== 'display' || !field.value || typeof field.value !== 'object') return form[field.id];
		const expr = field.value as CustomValue;
		const vals = expr.fields.map((id) => getNumber(form[id]));
		switch (expr.operator) {
			case 'sum':
				return vals.reduce((a, b) => a + b, 0);
			case 'avg':
				return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
			case 'min':
				return vals.length ? Math.min(...vals) : 0;
			case 'max':
				return vals.length ? Math.max(...vals) : 0;
			default:
				return null;
		}
	}

	const isDisabled = (field: SchemaField): boolean => {
		if (typeof field.disabled === 'boolean') return field.disabled;
		if (!field.disabled || typeof field.disabled !== 'object') return false;
		const expr: CustomDisabled = field.disabled;
		const vals = expr.fields.map((id) => form[id]);
		switch (expr.operator) {
			case 'falsy':
				return vals.every((val) => !val) ?? false;
			case 'all':
				return vals.every((val) => Boolean(val)) ?? false;
			case 'any':
				return vals.some((val) => Boolean(val)) ?? false;
			default:
				return false;
		}
	};

	// Validation
	function validateField(field: SchemaField) {
		const val = form[field.id];
		let message: string | null = null;

		// Required field validation
		if (field.required && (val === null || val === undefined || val === '' || Number.isNaN(val))) {
			message = `${field.label} is required`;
		}

		// Numeric field validation
		if (!message && (field.type === 'number' || field.type === 'slider')) {
			const numValue = getNumber(val);

			// Min value check
			if (typeof field.min === 'number' && numValue < field.min) {
				message = `${field.label} must be ≥ ${field.min}`;
			}

			// Max value check
			if (!message && typeof field.max === 'number' && numValue > field.max) {
				message = `${field.label} must be ≤ ${field.max}`;
			}

			// Integer check
			if (!message && field.integer && !Number.isInteger(numValue)) {
				message = `${field.label} must be an integer`;
			}
		}

		errors[field.id] = message;
	}

	function validateCustomRules() {
		const rules: Record<string, CustomValidationRule> = schema.customValidationRules ?? {};
		for (const key of Object.keys(rules)) {
			const rule = rules[key];
			if (rule.type !== 'cross_field') continue;
			if (rule.type === 'cross_field') {
				const sum = rule.fields.reduce((a: number, id: string) => a + getNumber(form[id]), 0);
				let violated = false;
				switch (rule.operator) {
					case 'sum_lte':
						violated = !(sum <= rule.threshold);
						break;
					case 'sum_lt':
						violated = !(sum < rule.threshold);
						break;
					case 'sum_gte':
						violated = !(sum >= rule.threshold);
						break;
					case 'sum_gt':
						violated = !(sum > rule.threshold);
						break;
					case 'sum_eq':
						violated = !(sum === rule.threshold);
						break;
				}
				for (const fid of rule.errorFields) {
					// attach or clear the custom error per involved field
					if (violated) errors[fid] = rule.message;
					else if (errors[fid] === rule.message) errors[fid] = null;
				}
			}
		}
	}

	// Debounced rerun on changes within triggersRerun groups
	let rerunTimer: ReturnType<typeof setTimeout> | null = null;
	const rerunModel = (waitMs: number = 500) => {
		if (rerunTimer) clearTimeout(rerunTimer);
		rerunTimer = setTimeout(() => {
			// Re-run page data loading (e.g. refetch timeseries)
			invalidateAll();
		}, waitMs);
	};

	const onChange = (field: SchemaField, value: unknown) => {
		form[field.id] = value;
		validateField(field);
		validateCustomRules();

		// rerun if this group triggers reruns and there are no validation errors
		const group = fieldToGroup[field.id];
		const isFormInvalid = Object.values(errors).some((error) => error !== null);
		if (group.triggersRerun && !isFormInvalid) {
			rerunModel();
		}
	};

	$inspect(form);
</script>

<form class="grid grid-cols-4 gap-4">
	{#each schema.groups as group}
		{#if group.preRun || hasRun}
			<section class={['rounded-md border p-8', group.preRun ? 'col-span-4' : 'col-span-1 col-start-1']}>
				{#if group.collapsible}
					<button
						type="button"
						class="inline-flex items-center gap-1 text-left text-lg font-semibold hover:text-muted-foreground"
						aria-expanded={!isGroupCollapsed(group)}
						aria-controls={`group-${group.id}`}
						onclick={() => (collapsedGroups[group.id] = !isGroupCollapsed(group))}
					>
						<ChevronsUpDownIcon
							class={[
								'inline-block w-5 text-center transition-transform duration-200',
								{ 'rotate-180': isGroupCollapsed(group) }
							]}
						/>
						{group.title}
					</button>
				{:else if group.title}<h2 class="mb-1 text-lg font-semibold">{group.title}</h2>{/if}
				{#if group.description}<p class="mb-1 text-sm text-muted-foreground">{group.description}</p>{/if}
				{#if group.helpText}<p class="mb-2 text-xs text-muted-foreground">{group.helpText}</p>{/if}

				{#if !isGroupCollapsed(group)}
					<div
						id={`group-${group.id}`}
						transition:slide
						class={['mx-2 flex justify-between gap-5', group.preRun ? 'flex-row' : 'flex-col']}
					>
						{#each group.subGroups as subGroup}
							<div>
								{#if subGroup.title}
									<div class="mb-0.5">
										{#if subGroup.collapsible}
											<button
												type="button"
												class="inline-flex items-center gap-2 font-medium hover:text-muted-foreground"
												aria-expanded={!isSubGroupCollapsed(group.id, subGroup.id)}
												aria-controls={`subgroup-${group.id}-${subGroup.id}`}
												onclick={() =>
													(collapsedSubGroups[`${group.id}:${subGroup.id}`] = !isSubGroupCollapsed(
														group.id,
														subGroup.id
													))}
											>
												<ChevronsUpDownIcon
													class={[
														'inline-block w-5 text-center transition-transform duration-200',
														{ 'rotate-180': isSubGroupCollapsed(group.id, subGroup.id) }
													]}
												/>
												{subGroup.title}
											</button>
										{:else}
											<h3 class="font-medium">{subGroup.title}</h3>
										{/if}
									</div>
								{/if}
								{#if subGroup.description}<p class="mb-1 text-xs text-muted-foreground">{subGroup.description}</p>{/if}
								{#if subGroup.helpText}<p class="mb-1 text-[11px] text-muted-foreground">{subGroup.helpText}</p>{/if}

								{#if !isSubGroupCollapsed(group.id, subGroup.id)}
									<div id={`subgroup-${group.id}-${subGroup.id}`} class="flex flex-col gap-3" transition:slide>
										{#each subGroup.fields as field}
											<div class="flex flex-col gap-2">
												<div class="flex gap-2">
													<Label for={field.id} class={errors[field.id] ? 'text-destructive' : ''}>{field.label}</Label>
													{#if field.helpText}
														<Tooltip.Provider>
															<Tooltip.Root>
																<Tooltip.Trigger><Info class="h-4 w-4 text-muted-foreground" /></Tooltip.Trigger>
																<Tooltip.Content>
																	<p>{field.helpText}</p>
																</Tooltip.Content>
															</Tooltip.Root>
														</Tooltip.Provider>
													{/if}
												</div>

												{#if field.type === 'number'}
													<Input
														id={field.id}
														type="number"
														min={field.min}
														max={field.max}
														step={field.step ?? 'any'}
														disabled={isDisabled(field)}
														value={String(form[field.id] ?? '')}
														aria-invalid={Boolean(errors[field.id])}
														oninput={(e) =>
															onChange(field, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
													/>
												{:else if field.type === 'checkbox'}
													<Checkbox
														id={field.id}
														disabled={isDisabled(field)}
														aria-invalid={Boolean(errors[field.id])}
														checked={Boolean(form[field.id])}
														onCheckedChange={(checked) => onChange(field, checked)}
													/>
												{:else if field.type === 'slider'}
													<div class="flex items-center gap-3">
														<Slider
															id={field.id}
															type="single"
															min={field.min}
															max={field.max}
															step={field.step ?? 1}
															disabled={isDisabled(field)}
															value={Number(form[field.id] ?? 0)}
															aria-invalid={Boolean(errors[field.id])}
															onValueChange={(value) => onChange(field, value)}
														/>
														<span class="w-10 text-right text-sm tabular-nums"
															>{form[field.id] as number}{field.unit ?? ''}</span
														>
													</div>
												{:else if field.type === 'multiselect'}
													<div class="flex flex-wrap gap-2">
														{#each field.options ?? [] as opt}
															{@const selectedValues = (form[field.id] as string[]) ?? []}
															<Label class="inline-flex items-center gap-2 text-sm font-normal">
																<Checkbox
																	disabled={isDisabled(field)}
																	checked={selectedValues.includes(opt.value)}
																	onCheckedChange={(checked) => {
																		const current = new Set<string>(selectedValues);
																		if (checked) current.add(opt.value);
																		else current.delete(opt.value);
																		onChange(field, Array.from(current));
																	}}
																/>
																{opt.label}
															</Label>
														{/each}
													</div>
												{:else if field.type === 'display'}
													<div
														class={cn(
															'rounded-md bg-slate-50 px-2 py-1 text-sm tabular-nums dark:bg-slate-950',
															errors[field.id] && 'border border-destructive'
														)}
													>
														{evaluateValueExpression(field) as number}{field.unit ?? ''}
													</div>
												{/if}

												{#if errors[field.id]}
													<p class="text-xs text-destructive">{errors[field.id]}</p>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/each}

	<div class="col-span-4 flex justify-center">
		{#if !hasRun}
			<Button
				onclick={() => {
					hasRun = true;
					invalidateAll();
					const preRunGroup = schema.groups.find((g) => g.preRun);
					if (preRunGroup) {
						collapsedGroups[preRunGroup.id] = true; // Collapse pre-run group after running
					}
				}}
				size="lg"
			>
				Run baseline
			</Button>
		{/if}
	</div>
</form>

<style></style>
