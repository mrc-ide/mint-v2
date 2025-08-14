<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Info from '@lucide/svelte/icons/info';
	import debounce from 'debounce';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import { Label } from '../ui/label';
	import type { CustomValidationRule, Schema, SchemaField, SchemaGroup } from './types';
	import {
		coerceDefaults,
		evaluateValueExpression,
		forEachField,
		getNumber,
		isDisabled,
		isGroupCollapsed,
		isSubGroupCollapsed
	} from './utils';

	type Props = {
		schema: Schema;
		initialValues: Record<string, unknown>;
		hasRun: boolean;
		children: Snippet;
		submit: (formValues: Record<string, unknown>, rerun?: boolean) => Promise<void>;
	};

	let { schema, initialValues, hasRun, children, submit }: Props = $props();
	const debouncedSubmit = debounce(submit, 500);
	// Initialize state from defaults + initialValues override
	let form = $state<Record<string, unknown>>({});
	let errors = $state<Record<string, string | null>>({});
	let collapsedGroups = $state<Record<string, boolean>>({});
	let collapsedSubGroups = $state<Record<string, boolean>>({});
	let hasFormErrors = $derived(Object.values(errors).some((error) => error !== null));
	// Helpers to iterate fields and to map field->group
	const fieldToGroup: Record<string, SchemaGroup> = {};
	forEachField(schema.groups, (field, group) => {
		fieldToGroup[field.id] = group;
	});
	// initialize form values and errors
	forEachField(schema.groups, (field, group, subGroup) => {
		form[field.id] = initialValues[field.id] ?? coerceDefaults(field);
		errors[field.id] = null;
		// initialize collapse states (default expanded)
		if (group.collapsible) {
			collapsedGroups[group.id] = Boolean(group.preRun) && hasRun;
		}
		const key = `${group.id}:${subGroup.id}`;
		if (subGroup.collapsible && collapsedSubGroups[key] === undefined) {
			collapsedSubGroups[key] = false;
		}
	});

	// Validation
	const validateField = (field: SchemaField) => {
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
	};

	const validateCustomRules = () => {
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
	};

	const onFieldChange = (field: SchemaField, value: unknown) => {
		form[field.id] = value;
		validateField(field);
		validateCustomRules();

		if (!hasRun || hasFormErrors) return;

		const group = fieldToGroup[field.id];
		debouncedSubmit(form, group.triggersRerun);
	};
</script>

<form class="grid grid-cols-4 gap-4">
	{#each schema.groups as group}
		{#if group.preRun || hasRun}
			<section class={['rounded-md border p-8', group.preRun ? 'col-span-4' : 'col-span-1 col-start-1']}>
				<div class="flex gap-2">
					{#if group.collapsible}
						<button
							type="button"
							class="inline-flex items-center gap-1 text-left text-lg font-semibold hover:text-muted-foreground"
							aria-expanded={!isGroupCollapsed(collapsedGroups, group)}
							aria-controls={`group-${group.id}`}
							onclick={() => (collapsedGroups[group.id] = !isGroupCollapsed(collapsedGroups, group))}
						>
							<ChevronsUpDownIcon
								class={[
									'inline-block w-5 text-center transition-transform duration-200',
									{ 'rotate-180': isGroupCollapsed(collapsedGroups, group) }
								]}
							/>
							{group.title}
						</button>
					{:else if group.title}<h2 class="mb-1 text-lg font-semibold">{group.title}</h2>{/if}
					{#if group.helpText}
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger><Info class="h-4 w-4 text-muted-foreground" /></Tooltip.Trigger>
								<Tooltip.Content>
									<p>{group.helpText}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					{/if}
				</div>
				{#if group.description}<p class="mb-1 text-sm text-muted-foreground">{group.description}</p>{/if}

				{#if !isGroupCollapsed(collapsedGroups, group)}
					<div
						id={`group-${group.id}`}
						transition:slide
						class={['mx-2 flex justify-between gap-5', group.preRun ? 'flex-row' : 'flex-col']}
					>
						{#each group.subGroups as subGroup}
							<div>
								<div class="mb-0.5 flex gap-2">
									{#if subGroup.collapsible}
										<button
											type="button"
											class="inline-flex items-center gap-2 font-medium hover:text-muted-foreground"
											aria-expanded={!isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id)}
											aria-controls={`subgroup-${group.id}-${subGroup.id}`}
											onclick={() =>
												(collapsedSubGroups[`${group.id}:${subGroup.id}`] = !isSubGroupCollapsed(
													collapsedSubGroups,
													group.id,
													subGroup.id
												))}
										>
											<ChevronsUpDownIcon
												class={[
													'inline-block w-5 text-center transition-transform duration-200',
													{ 'rotate-180': isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id) }
												]}
											/>
											{subGroup.title}
										</button>
									{:else}
										<h3 class="font-medium">{subGroup.title}</h3>
									{/if}
									{#if subGroup.helpText}
										<Tooltip.Provider>
											<Tooltip.Root>
												<Tooltip.Trigger><Info class="h-4 w-4 text-muted-foreground" /></Tooltip.Trigger>
												<Tooltip.Content>
													<p>{subGroup.helpText}</p>
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{/if}
								</div>

								{#if subGroup.description}<p class="mb-1 text-xs text-muted-foreground">{subGroup.description}</p>{/if}

								{#if !isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id)}
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
														disabled={isDisabled(form, field)}
														value={String(form[field.id] ?? '')}
														aria-invalid={Boolean(errors[field.id])}
														oninput={(e) =>
															onFieldChange(field, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
													/>
												{:else if field.type === 'checkbox'}
													<Checkbox
														id={field.id}
														disabled={isDisabled(form, field)}
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
															disabled={isDisabled(form, field)}
															value={Number(form[field.id] ?? 0)}
															aria-invalid={Boolean(errors[field.id])}
															onValueChange={(value) => onFieldChange(field, value)}
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
																	disabled={isDisabled(form, field)}
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
													<div
														class={cn(
															'rounded-md bg-slate-50 px-2 py-1 text-sm tabular-nums dark:bg-slate-950',
															errors[field.id] && 'border border-destructive'
														)}
													>
														{evaluateValueExpression(form, field) as number}{field.unit ?? ''}
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

	{#if hasRun}
		<div class="col-span-3 col-start-2 row-span-2 row-start-2">
			{@render children()}
		</div>
	{/if}
	<div class="col-span-4 flex justify-center">
		{#if !hasRun}
			<Button
				onclick={() => {
					if (hasFormErrors) return;
					submit(form, true);
					const preRunGroup = schema.groups.find((g) => g.preRun);
					if (preRunGroup) {
						collapsedGroups[preRunGroup.id] = true; // Collapse pre-run group after running
					}
				}}
				size="lg"
				disabled={hasFormErrors}
			>
				Run baseline
			</Button>
		{/if}
	</div>
</form>

<style></style>
