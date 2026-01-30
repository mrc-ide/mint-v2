<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/assets/logo.png';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import ChartIcon from '@lucide/svelte/icons/chart-spline';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import BackIcon from '@lucide/svelte/icons/arrow-left';
	import { toggleMode } from 'mode-watcher';
	import HeaderRegionsDropdown from './HeaderRegionsDropdown.svelte';
	import type { UserState } from '$lib/types/userState';

	interface Props {
		userData: UserState;
	}
	let { userData }: Props = $props();
	let project = $derived(userData.projects.find((p) => p.name === page.params.project));
	let region = $derived(project?.regions.find((r) => r.name === page.params.region));
</script>

<header>
	<div
		class="fixed top-0 right-0 left-0 z-1 flex h-15 items-center border-b border-accent bg-background shadow-sm dark:shadow-gray-800"
	>
		<a
			href="/"
			class="ml-2 flex items-center justify-center px-2 text-xl font-extrabold text-primary hover:text-primary/80"
			><img src={logo} alt="MINT logo" class="h-12 w-12" />MINT</a
		>
		{#if project}
			<HeaderRegionsDropdown {project} {region} />
			<a
				class={buttonVariants({ variant: 'link', class: 'p-1', size: 'sm' })}
				href={`/projects/${project.name}/strategise`}
			>
				<ChartIcon class="size-3.5" />
				Strategise across regions
			</a>
			{#if region}
				{@const isComparePage = page.url.pathname.endsWith('/compare')}
				{#if isComparePage}
					<a
						class={buttonVariants({ variant: 'link', class: 'p-1', size: 'sm' })}
						href={`/projects/${project.name}/regions/${region.name}`}
					>
						<BackIcon class="size-3.5" />
						Back to region
					</a>
				{:else if region.hasRunBaseline}
					<a
						class={buttonVariants({ variant: 'link', class: 'p-1', size: 'sm' })}
						href={`/projects/${project.name}/regions/${region.name}/compare`}
					>
						<CalendarClockIcon class="size-3.5" />
						Long term comparison
					</a>
				{/if}
			{/if}
		{/if}
		<div class="ml-auto flex items-center gap-3 px-4">
			<a href="/privacy" class="text-muted-foreground hover:underline">Privacy</a>
			<a href="/accessibility" class="text-muted-foreground hover:underline">Accessibility</a>
			<a href="https://mrc-ide.github.io/mint-news/" target="_blank" class="text-muted-foreground hover:underline"
				>News</a
			>
			<Button onclick={toggleMode} variant="ghost" size="icon">
				<SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</div>
</header>
