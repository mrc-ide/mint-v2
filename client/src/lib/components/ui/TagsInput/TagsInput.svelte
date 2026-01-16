<!-- svelte-ignore state_referenced_locally -->
<!-- Copied over from https://github.com/agustinl/svelte-tags-input. used here with tailwind styles -->
<script lang="ts">
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-nocheck
	import { cn } from '$lib/utils';
	import { Button } from '../button';
	import Label from '../label/label.svelte';
	import X from '@lucide/svelte/icons/x';

	let tag = $state('');
	let arrelementsmatch: any[] = $state([]);

	let regExpEscape = (s) => {
		return s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
	};

	let {
		tags = $bindable([]),
		addKeys = [13],
		maxTags = false,
		onlyUnique = false,
		removeKeys = [8],
		placeholder = '',
		allowPaste = false,
		allowDrop = false,
		splitWith = ',',
		autoComplete = false,
		autoCompleteFilter = true,
		autoCompleteKey = false,
		autoCompleteMarkupKey = false,
		autoCompleteStartFocused = false,
		name = 'svelte-tags-input',
		id = uniqueID(),
		allowBlur = false,
		disable = false,
		minChars = 1,
		onlyAutocomplete = false,
		labelText = name,
		labelShow = false,
		readonly = false,
		onTagClick = () => {},
		autoCompleteShowKey = autoCompleteKey,
		onTagAdded = () => {},
		onTagRemoved = () => {},
		cleanOnBlur = false,
		customValidation = false,
		onDuplicate = (tag: string) => {}
	} = $props();

	let layoutElement = $state();

	let autoCompleteIndexStart = $derived(autoCompleteStartFocused ? 0 : -1);
	let autoCompleteIndex = $state();
	let matchsID = $derived(id + '_matchs');

	let storePlaceholder = $state(placeholder);

	// Update storePlaceholder when placeholder changes
	$effect(() => {
		storePlaceholder = placeholder;
	});

	// Initialize and update autoCompleteIndex when autoCompleteIndexStart changes
	$effect(() => {
		autoCompleteIndex = autoCompleteIndexStart;
	});

	function setTag(e) {
		const matches = document.getElementById(matchsID);
		// Get the focused tag from the autocomplete list, if there is one
		const focusedElement = matches?.querySelector('li.focus')?.textContent;

		// Set the current tag to the focused tag if there is one, otherwise use the input value
		const currentTag = focusedElement ?? e.target.value;

		if (addKeys) {
			addKeys.forEach(function (key) {
				if (key === e.keyCode) {
					if (currentTag) e.preventDefault();

					/* switch (input.keyCode) {
                case 9:
                    // TAB add first element on the autoComplete list
                    if (autoComplete && document.getElementById(matchsID)) {
                        addTag(document.getElementById(matchsID).querySelectorAll("li")[0].textContent);
                    } else {
                        addTag(currentTag);
                    }
                    break;
                default:
                    addTag(currentTag);
                    break;
                } */

					/*
					 * Fix https://github.com/agustinl/svelte-tags-input/issues/87
					 * If autocomplete = true
					 * If onlyAutocomplete = true: You cannot add random tags
					 * If input element with ID
					 */
					if (autoComplete && onlyAutocomplete && document.getElementById(matchsID)) {
						addTag(arrelementsmatch?.[autoCompleteIndex]?.label);
					} else {
						addTag(currentTag);
					}
				}
			});
		}

		if (removeKeys) {
			removeKeys.forEach(function (key) {
				if (key === e.keyCode && tag === '') {
					tags.pop();
					tags = tags;

					arrelementsmatch = [];
					document.getElementById(id).readOnly = false;
					placeholder = storePlaceholder;
					document.getElementById(id).focus();
				}
			});
		}

		// ArrowDown : focus on first element of the autocomplete
		if (e.keyCode === 40 && autoComplete && document.getElementById(matchsID)) {
			autoCompleteIndex++;
			// Went off the list ? Go to the first
			if (autoCompleteIndex >= arrelementsmatch.length || autoCompleteIndex < 0) {
				autoCompleteIndex = 0;
			}
		} else if (e.keyCode === 38) {
			// ArrowUp
			autoCompleteIndex--;
			// Went off the list ? Go to the last
			if (autoCompleteIndex < 0 || autoCompleteIndex >= arrelementsmatch.length) {
				autoCompleteIndex = arrelementsmatch.length - 1;
			}
		} else if (e.keyCode === 27) {
			// Escape
			arrelementsmatch = [];
			document.getElementById(id).focus();
		}
	}

	function addTag(currentTag) {
		if (typeof currentTag === 'object' && currentTag !== null) {
			if (!autoCompleteKey) {
				return console.error("'autoCompleteKey' is necessary if 'autoComplete' result is an array of objects");
			}

			if (onlyUnique) {
				let found = tags?.find((elem) => elem[autoCompleteKey] === currentTag[autoCompleteKey]);

				if (found) {
					onDuplicate(currentTag);
					return;
				}
			}

			var currentObjTags = currentTag;
			currentTag = currentTag[autoCompleteKey].trim();
		} else {
			currentTag = currentTag.trim();
		}

		if (currentTag == '') return;
		if (maxTags && tags.length == maxTags) return;
		if (onlyUnique && tags.includes(currentTag)) {
			onDuplicate(currentTag);
			return;
		}
		if (onlyAutocomplete && arrelementsmatch.length === 0) return;

		if (customValidation && !customValidation(currentTag)) return;

		tags.push(currentObjTags ? currentObjTags : currentTag);
		tags = tags;
		tag = '';

		onTagAdded(currentTag, tags);

		// Hide autocomplete list
		// Focus on svelte tags input
		arrelementsmatch = [];
		autoCompleteIndex = autoCompleteIndexStart;
		document.getElementById(id).focus();

		if (maxTags && tags.length == maxTags) {
			document.getElementById(id).readOnly = true;
			placeholder = '';
		}
	}

	function removeTag(i) {
		tags.splice(i, 1);
		onTagRemoved(tags[i], tags);
		tags = tags;

		// Hide autocomplete list
		// Focus on svelte tags input
		arrelementsmatch = [];
		document.getElementById(id).readOnly = false;
		placeholder = storePlaceholder;
		document.getElementById(id).focus();
	}

	function onPaste(e) {
		if (!allowPaste) return;
		e.preventDefault();

		const data = getClipboardData(e);
		splitTags(data).map((tag) => addTag(tag));
	}

	function onDrop(e) {
		if (!allowDrop) return;
		e.preventDefault();

		const data = e.dataTransfer.getData('Text');
		splitTags(data).map((tag) => addTag(tag));
	}

	function onFocus() {
		layoutElement.classList.add('focus');
	}

	function onBlur(e, currentTag) {
		layoutElement.classList.remove('focus');

		if (allowBlur) {
			// A match is highlighted
			if (arrelementsmatch.length && autoCompleteIndex > -1) {
				addTag(arrelementsmatch?.[autoCompleteIndex]?.label);
			}
			// There is no match, but we may add a new tag
			else if (!arrelementsmatch.length) {
				e.preventDefault();
				addTag(currentTag);
			}
		}

		// Clean input on
		if (cleanOnBlur) {
			tag = '';
		}

		arrelementsmatch = [];
		autoCompleteIndex = autoCompleteIndexStart;
	}

	function onClick() {
		minChars == 0 && getMatchElements();
	}

	function getClipboardData(e) {
		if (window.clipboardData) {
			return window.clipboardData.getData('Text');
		}

		if (e.clipboardData) {
			return e.clipboardData.getData('text/plain');
		}

		return '';
	}

	function splitTags(data) {
		return data.split(splitWith).map((tag) => tag.trim());
	}

	function escapeHTML(string) {
		const htmlEscapes = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;',
			'/': '&#x2F;'
		};
		return ('' + string).replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
	}

	function buildMatchMarkup(search, value) {
		return escapeHTML(value).replace(RegExp(regExpEscape(search.toLowerCase()), 'i'), '<strong>$&</strong>');
	}

	async function getMatchElements(input) {
		if (!autoComplete) return;
		if (maxTags && tags.length >= maxTags) return;

		let value = input ? input.target.value : '';
		let autoCompleteValues = [];

		if (Array.isArray(autoComplete)) {
			autoCompleteValues = autoComplete;
		}

		if (typeof autoComplete === 'function') {
			if (autoComplete.constructor.name === 'AsyncFunction') {
				autoCompleteValues = await autoComplete(value);
			} else {
				autoCompleteValues = autoComplete(value);
			}
		}

		if (autoCompleteValues.constructor.name === 'Promise') {
			autoCompleteValues = await autoCompleteValues;
		}
		// Escape
		if ((minChars > 0 && value == '') || (input && input.keyCode === 27) || value.length < minChars) {
			arrelementsmatch = [];
			return;
		}

		let matchs = autoCompleteValues;

		if (typeof autoCompleteValues[0] === 'object' && autoCompleteValues !== null) {
			if (!autoCompleteKey) {
				return console.error("'autoCompleteValue' is necessary if 'autoComplete' result is an array of objects");
			}

			if (autoCompleteFilter !== false) {
				matchs = autoCompleteValues.filter((e) => e[autoCompleteKey].toLowerCase().includes(value.toLowerCase()));
			}
			matchs = matchs.map((matchTag) => {
				return {
					label: matchTag,
					search: autoCompleteMarkupKey
						? matchTag[autoCompleteMarkupKey]
						: buildMatchMarkup(value, matchTag[autoCompleteKey])
				};
			});
		} else {
			if (autoCompleteFilter !== false) {
				matchs = autoCompleteValues.filter((e) => e.toLowerCase().includes(value.toLowerCase()));
			}
			matchs = matchs.map((matchTag) => {
				return {
					label: matchTag,
					search: buildMatchMarkup(value, matchTag)
				};
			});
		}

		if (onlyUnique === true && !autoCompleteKey) {
			matchs = matchs.filter((tag) => !tags.includes(tag.label));
		}

		arrelementsmatch = matchs;
	}

	function uniqueID() {
		return 'sti_' + Math.random().toString(36).substring(2, 11);
	}
</script>

<div class="relative">
	<div
		class={cn(
			'flex min-h-10.5 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm ring-offset-background transition-colors',
			'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
			'disabled:cursor-not-allowed disabled:opacity-50',
			disable && 'cursor-not-allowed opacity-50',
			readonly && 'cursor-default'
		)}
		bind:this={layoutElement}
	>
		<Label for={id} class={labelShow ? 'mb-1 text-sm font-medium' : 'sr-only'}>{labelText}</Label>

		{#if tags.length > 0}
			{#each tags as tag, i}
				<Button
					size="sm"
					variant="secondary"
					class={cn(
						'inline-flex h-7 items-center gap-1 px-2.5 text-xs',
						'transition-colors hover:bg-secondary/80',
						!disable && !readonly && 'cursor-pointer'
					)}
					onclick={() => onTagClick(tag)}
				>
					{#if typeof tag === 'string'}
						{tag}
					{:else}
						{tag[autoCompleteShowKey]}
					{/if}
					{#if !disable && !readonly}
						<button
							type="button"
							class="text-muted-foreground transition-colors hover:text-destructive"
							onpointerdown={(e) => {
								e.preventDefault();
								e.stopPropagation();
								removeTag(i);
							}}
							aria-label="Remove tag"
						>
							<X />
						</button>
					{/if}
				</Button>
			{/each}
		{/if}

		<input
			type="text"
			{id}
			name="{name}-input"
			bind:value={tag}
			onkeydown={setTag}
			onkeyup={getMatchElements}
			onpaste={onPaste}
			ondrop={onDrop}
			onfocus={onFocus}
			onblur={(e) => onBlur(e, tag)}
			onpointerdown={onClick}
			{placeholder}
			disabled={disable || readonly}
			autocomplete="off"
			class="min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
		/>

		<!-- Hidden inputs for form submission of tags -->
		{#each tags as tag}
			<input type="hidden" {name} value={typeof tag === 'string' ? tag : tag[autoCompleteKey]} />
		{/each}
	</div>

	{#if autoComplete && arrelementsmatch.length > 0}
		<div class="absolute top-full right-0 left-0 z-50 mt-1">
			<ul
				id="{id}_matchs"
				class={cn(
					'max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-md',
					'animate-in fade-in-0 zoom-in-95'
				)}
			>
				{#each arrelementsmatch as element, index}
					<li
						tabindex="-1"
						class={cn(
							'cursor-pointer px-3 py-2 text-sm transition-colors',
							'hover:bg-accent hover:text-accent-foreground',
							index === autoCompleteIndex && 'bg-accent text-accent-foreground'
						)}
						onpointerdown={(e) => {
							e.preventDefault();
							addTag(element.label);
						}}
					>
						{@html element.search}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
