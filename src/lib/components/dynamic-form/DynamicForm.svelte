<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type {
		CustomDisabled,
		CustomValidationRule,
		CustomValue,
		Schema,
		SchemaField,
		SchemaGroup,
		SchemaSubGroup
	} from './types';

	type Props = {
		schema: Schema;
		initialValues: Record<string, unknown>;
		hasRun: boolean;
	};
	let { schema, initialValues, hasRun = false }: Props = $props();

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

<form class="space-y-6">
	{#each schema.groups as group}
		<section class="rounded-md border p-4">
			{#if group.collapsible}
				<div class="mb-1 flex items-center justify-between">
					<button
						type="button"
						class="inline-flex items-center gap-2 text-left text-lg font-semibold"
						aria-expanded={!isGroupCollapsed(group)}
						aria-controls={`group-${group.id}`}
						onclick={() => (collapsedGroups[group.id] = !isGroupCollapsed(group))}
					>
						<span class="inline-block w-4 text-center">{isGroupCollapsed(group) ? '▸' : '▾'}</span>
						{group.title}
					</button>
					{#if group.triggersRerun}
						<span class="text-[10px] tracking-wide text-amber-600 uppercase">Triggers re-run</span>
					{/if}
				</div>
			{:else if group.title}<h2 class="mb-1 text-lg font-semibold">{group.title}</h2>{/if}
			{#if group.description}<p class="mb-2 text-sm text-slate-600">{group.description}</p>{/if}
			{#if group.helpText}<p class="mb-4 text-xs text-slate-500">{group.helpText}</p>{/if}

			{#if !isGroupCollapsed(group)}
				<div id={`group-${group.id}`}>
					{#each group.subGroups as subGroup}
						<div class="mb-4 rounded-md bg-slate-50 p-3">
							{#if subGroup.title}
								<div class="mb-2 flex items-center justify-between">
									{#if subGroup.collapsible}
										<button
											type="button"
											class="inline-flex items-center gap-2 font-medium"
											aria-expanded={!isSubGroupCollapsed(group.id, subGroup.id)}
											aria-controls={`subgroup-${group.id}-${subGroup.id}`}
											onclick={() =>
												(collapsedSubGroups[`${group.id}:${subGroup.id}`] = !isSubGroupCollapsed(
													group.id,
													subGroup.id
												))}
										>
											<span class="inline-block w-4 text-center"
												>{isSubGroupCollapsed(group.id, subGroup.id) ? '▸' : '▾'}</span
											>
											{subGroup.title}
										</button>
									{:else}
										<h3 class="font-medium">{subGroup.title}</h3>
									{/if}
									{#if group.triggersRerun}
										<span class="text-[10px] tracking-wide text-amber-600 uppercase">Triggers re-run</span>
									{/if}
								</div>
							{/if}
							{#if subGroup.description}<p class="mb-2 text-xs text-slate-600">{subGroup.description}</p>{/if}
							{#if subGroup.helpText}<p class="mb-3 text-[11px] text-slate-500">{subGroup.helpText}</p>{/if}

							{#if !isSubGroupCollapsed(group.id, subGroup.id)}
								<div id={`subgroup-${group.id}-${subGroup.id}`} class="grid grid-cols-1 gap-4 md:grid-cols-2">
									{#each subGroup.fields as field}
										<div class="flex flex-col gap-1">
											{#if field.label}<label class="text-sm font-medium" for={field.id}>{field.label}</label>{/if}
											{#if field.helpText}<p class="text-xs text-slate-500">{field.helpText}</p>{/if}

											{#if field.type === 'number'}
												<input
													id={field.id}
													type="number"
													class="h-9 rounded border px-2"
													min={field.min}
													max={field.max}
													step={field.step ?? 'any'}
													disabled={isDisabled(field)}
													value={String(form[field.id] ?? '')}
													oninput={(e) =>
														onChange(field, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
												/>
											{:else if field.type === 'checkbox'}
												<input
													id={field.id}
													type="checkbox"
													class="h-4 w-4"
													disabled={isDisabled(field)}
													checked={Boolean(form[field.id])}
													onchange={(e) => onChange(field, e.currentTarget.checked)}
												/>
											{:else if field.type === 'slider'}
												<div class="flex items-center gap-3">
													<input
														id={field.id}
														type="range"
														class="flex-1"
														min={field.min}
														max={field.max}
														step={field.step ?? 1}
														disabled={isDisabled(field)}
														value={Number(form[field.id] ?? 0)}
														oninput={(e) => onChange(field, Number(e.currentTarget.value))}
													/>
													<span class="w-14 text-right text-sm tabular-nums"
														>{form[field.id] as number}{field.unit ?? ''}</span
													>
												</div>
											{:else if field.type === 'multiselect'}
												<div class="flex flex-wrap gap-3">
													{#each field.options ?? [] as opt}
														<label class="inline-flex items-center gap-2 text-sm">
															<input
																type="checkbox"
																class="h-4 w-4"
																disabled={isDisabled(field)}
																checked={(form[field.id] as string[] | undefined)?.includes(opt.value)}
																onchange={(e) => {
																	const current = new Set<string>((form[field.id] as string[] | undefined) ?? []);
																	if (e.currentTarget.checked) current.add(opt.value);
																	else current.delete(opt.value);
																	onChange(field, Array.from(current));
																}}
															/>
															{opt.label}
														</label>
													{/each}
												</div>
											{:else if field.type === 'display'}
												<div class="rounded bg-white px-2 py-1 text-sm tabular-nums">
													{evaluateValueExpression(field) as number}{field.unit ?? ''}
												</div>
											{/if}

											{#if errors[field.id]}
												<p class="text-xs text-red-600">{errors[field.id]}</p>
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
	{/each}

	<div class="flex items-center justify-end gap-2">
		<button type="button" class="rounded border px-3 py-1 text-sm" onclick={() => invalidateAll()}>
			Force re-run
		</button>
		<button type="submit" class="rounded bg-slate-900 px-3 py-1 text-sm text-white">Submit</button>
	</div>
</form>
