<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';

	type SchemaField = {
		id: string;
		label?: string;
		helpText?: string;
		type: 'number' | 'checkbox' | 'slider' | 'multiselect' | 'display';
		required?: boolean;
		default?: unknown;
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		options?: { label: string; value: string }[];
		validation?: {
			rules?: string[]; // e.g. ['integer']
			message?: string;
			custom?: string[]; // references to top-level customValidationRules
		};
		disabled?:
			| boolean
			| {
					type: 'cross_field';
					fields: string[];
					operator: 'falsy' | 'sum_lte' | 'sum_gte' | 'all' | 'any';
					threshold?: number;
			  };
		value?:
			| unknown
			| {
					type: 'cross_field';
					fields: string[];
					operator: 'sum' | 'avg' | 'min' | 'max';
			  };
	};

	type SchemaSubGroup = {
		id: string;
		title?: string;
		description?: string;
		helpText?: string;
		collapsible?: boolean;
		fields: SchemaField[];
	};

	type SchemaGroup = {
		id: string;
		title?: string;
		description?: string;
		helpText?: string;
		collapsible?: boolean;
		triggersRerun?: boolean;
		subGroups: SchemaSubGroup[];
	};

	type CustomRule = {
		type: 'cross_field';
		fields: string[];
		operator: 'sum_lte' | 'sum_lt' | 'sum_gte' | 'sum_gt' | 'sum_eq';
		threshold: number;
		message: string;
	};

	type Schema = {
		groups: SchemaGroup[];
		customValidationRules?: Record<string, CustomRule>;
	};

	let {
		schema,
		initialValues = {},
		class: className = ''
	} = $props<{
		schema: Schema;
		initialValues?: Record<string, unknown>;
		class?: string;
	}>();

	// Helpers to iterate fields and to map field->group
	function forEachField(cb: (f: SchemaField, g: SchemaGroup, sg: SchemaSubGroup) => void) {
		for (const g of schema.groups) {
			for (const sg of g.subGroups) {
				for (const f of sg.fields) cb(f, g, sg);
			}
		}
	}
	const fieldToGroup: Record<string, SchemaGroup> = {};
	forEachField((f, g) => {
		fieldToGroup[f.id] = g;
	});

	// Initialize state from defaults + initialValues override
	const form = $state<Record<string, unknown>>({});
	const errors = $state<Record<string, string | null>>({});
	const collapsedGroups = $state<Record<string, boolean>>({});
	const collapsedSubGroups = $state<Record<string, boolean>>({});

	function coerceDefault(f: SchemaField): unknown {
		// For display fields, we won't assign default here (computed later)
		if (f.type === 'checkbox') return typeof f.default === 'boolean' ? f.default : false;
		if (f.type === 'multiselect') return Array.isArray(f.default) ? f.default : [];
		if (f.type === 'number' || f.type === 'slider') return typeof f.default === 'number' ? f.default : 0;
		return f.default ?? null;
	}

	// init
	forEachField((f, g, sg) => {
		form[f.id] = initialValues[f.id] ?? coerceDefault(f);
		errors[f.id] = null;
		// initialize collapse states (default expanded)
		if (g.collapsible && collapsedGroups[g.id] === undefined) collapsedGroups[g.id] = false;
		const key = `${g.id}:${sg.id}`;
		if (sg.collapsible && collapsedSubGroups[key] === undefined) collapsedSubGroups[key] = false;
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

	function evalValueExpr(f: SchemaField): unknown {
		if (f.type !== 'display' || !f.value || typeof f.value !== 'object') return form[f.id];
		const expr = f.value as { type: 'cross_field'; fields: string[]; operator: string };
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

	function isDisabled(f: SchemaField): boolean {
		if (typeof f.disabled === 'boolean') return f.disabled;
		if (!f.disabled || typeof f.disabled !== 'object') return false;
		const d = f.disabled as Required<SchemaField>['disabled'] & object;
		const vals = (d as any).fields?.map((id: string) => form[id]);
		switch ((d as any).operator) {
			case 'falsy':
				return vals?.every((v: unknown) => !v) ?? false;
			case 'all':
				return vals?.every(Boolean) ?? false;
			case 'any':
				return vals?.some(Boolean) ?? false;
			case 'sum_lte':
				return (vals?.reduce((a: number, v: unknown) => a + getNumber(v), 0) ?? 0) <= Number((d as any).threshold ?? 0);
			case 'sum_gte':
				return (vals?.reduce((a: number, v: unknown) => a + getNumber(v), 0) ?? 0) >= Number((d as any).threshold ?? 0);
			default:
				return false;
		}
	}

	// Validation
	function validateField(f: SchemaField) {
		let message: string | null = null;
		const val = form[f.id];

		if (f.required && (val === null || val === undefined || val === '' || Number.isNaN(val))) {
			message = `${f.label ?? f.id} is required`;
		}

		if (!message && (f.type === 'number' || f.type === 'slider' || f.type === 'display')) {
			const n = getNumber(evalValueExpr(f));
			if (typeof f.min === 'number' && n < f.min) message = `${f.label ?? f.id} must be ≥ ${f.min}`;
			if (!message && typeof f.max === 'number' && n > f.max) message = `${f.label ?? f.id} must be ≤ ${f.max}`;
		}

		if (!message && f.validation?.rules?.includes('integer')) {
			const n = getNumber(val);
			if (!Number.isInteger(n)) message = f.validation?.message ?? `${f.label ?? f.id} must be an integer`;
		}

		errors[f.id] = message;
	}

	function validateCustomRules() {
		const rules = schema.customValidationRules ?? {};
		for (const key of Object.keys(rules)) {
			const r = rules[key];
			if (r.type === 'cross_field') {
				const sum = r.fields.reduce((a: number, id: string) => a + getNumber(form[id]), 0);
				let violated = false;
				switch (r.operator) {
					case 'sum_lte':
						violated = !(sum <= r.threshold);
						break;
					case 'sum_lt':
						violated = !(sum < r.threshold);
						break;
					case 'sum_gte':
						violated = !(sum >= r.threshold);
						break;
					case 'sum_gt':
						violated = !(sum > r.threshold);
						break;
					case 'sum_eq':
						violated = !(sum === r.threshold);
						break;
				}
				for (const fid of r.fields) {
					// attach or clear the custom error per involved field
					if (violated) errors[fid] = r.message;
					else if (errors[fid] === r.message) errors[fid] = null;
				}
			}
		}
	}

	// Debounced rerun on changes within triggersRerun groups
	let rerunTimer: ReturnType<typeof setTimeout> | null = null;
	function scheduleRerun() {
		if (rerunTimer) clearTimeout(rerunTimer);
		rerunTimer = setTimeout(() => {
			// Re-run page data loading (e.g. refetch timeseries)
			invalidateAll();
		}, 300);
	}

	function onChange(f: SchemaField, value: unknown) {
		form[f.id] = value;
		validateField(f);
		validateCustomRules();

		// If this field's top-level group has triggersRerun, schedule invalidate
		const g = fieldToGroup[f.id];
		if (g?.triggersRerun) scheduleRerun();
	}

	// Keep display fields in sync
	$effect(() => {
		forEachField((f) => {
			if (f.type === 'display') {
				form[f.id] = evalValueExpr(f);
			}
		});
	});

	$inspect(form);
</script>

<form class={cn('space-y-6', className)}>
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
					{#each group.subGroups as sg}
						<div class="mb-4 rounded-md bg-slate-50 p-3">
							{#if sg.title}
								<div class="mb-2 flex items-center justify-between">
									{#if sg.collapsible}
										<button
											type="button"
											class="inline-flex items-center gap-2 font-medium"
											aria-expanded={!isSubGroupCollapsed(group.id, sg.id)}
											aria-controls={`subgroup-${group.id}-${sg.id}`}
											onclick={() =>
												(collapsedSubGroups[`${group.id}:${sg.id}`] = !isSubGroupCollapsed(group.id, sg.id))}
										>
											<span class="inline-block w-4 text-center"
												>{isSubGroupCollapsed(group.id, sg.id) ? '▸' : '▾'}</span
											>
											{sg.title}
										</button>
									{:else}
										<h3 class="font-medium">{sg.title}</h3>
									{/if}
									{#if group.triggersRerun}
										<span class="text-[10px] tracking-wide text-amber-600 uppercase">Triggers re-run</span>
									{/if}
								</div>
							{/if}
							{#if sg.description}<p class="mb-2 text-xs text-slate-600">{sg.description}</p>{/if}
							{#if sg.helpText}<p class="mb-3 text-[11px] text-slate-500">{sg.helpText}</p>{/if}

							{#if !isSubGroupCollapsed(group.id, sg.id)}
								<div id={`subgroup-${group.id}-${sg.id}`} class="grid grid-cols-1 gap-4 md:grid-cols-2">
									{#each sg.fields as f}
										<div class="flex flex-col gap-1">
											{#if f.label}<label class="text-sm font-medium" for={f.id}>{f.label}</label>{/if}
											{#if f.helpText}<p class="text-xs text-slate-500">{f.helpText}</p>{/if}

											{#if f.type === 'number'}
												<input
													id={f.id}
													type="number"
													class="h-9 rounded border px-2"
													min={f.min}
													max={f.max}
													step={f.step ?? 'any'}
													disabled={isDisabled(f)}
													value={String(form[f.id] ?? '')}
													oninput={(e) =>
														onChange(f, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
												/>
											{:else if f.type === 'checkbox'}
												<input
													id={f.id}
													type="checkbox"
													class="h-4 w-4"
													disabled={isDisabled(f)}
													checked={Boolean(form[f.id])}
													onchange={(e) => onChange(f, e.currentTarget.checked)}
												/>
											{:else if f.type === 'slider'}
												<div class="flex items-center gap-3">
													<input
														id={f.id}
														type="range"
														class="flex-1"
														min={f.min}
														max={f.max}
														step={f.step ?? 1}
														disabled={isDisabled(f)}
														value={Number(form[f.id] ?? 0)}
														oninput={(e) => onChange(f, Number(e.currentTarget.value))}
													/>
													<span class="w-14 text-right text-sm tabular-nums">{form[f.id] as number}{f.unit ?? ''}</span>
												</div>
											{:else if f.type === 'multiselect'}
												<div class="flex flex-wrap gap-3">
													{#each f.options ?? [] as opt}
														<label class="inline-flex items-center gap-2 text-sm">
															<input
																type="checkbox"
																class="h-4 w-4"
																disabled={isDisabled(f)}
																checked={(form[f.id] as string[] | undefined)?.includes(opt.value)}
																onchange={(e) => {
																	const current = new Set<string>((form[f.id] as string[] | undefined) ?? []);
																	if (e.currentTarget.checked) current.add(opt.value);
																	else current.delete(opt.value);
																	onChange(f, Array.from(current));
																}}
															/>
															{opt.label}
														</label>
													{/each}
												</div>
											{:else if f.type === 'display'}
												<div class="rounded bg-white px-2 py-1 text-sm tabular-nums">
													{evalValueExpr(f) as number}{f.unit ?? ''}
												</div>
											{/if}

											{#if errors[f.id]}
												<p class="text-xs text-red-600">{errors[f.id]}</p>
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
