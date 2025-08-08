<script lang="ts">
	import favicon from '$lib/assets/favicon.ico';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import Header from './_components/Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>MINT - Malaria Intervention Tool</title>
	<meta
		name="description"
		content="Malaria intervention tool for analyzing and planning malaria prevention strategies"
	/>
</svelte:head>

<ModeWatcher />
<Toaster richColors />
<Header />
<main class="flex min-h-svh px-5 pt-18 pb-5">
	<div class="flex-1">{@render children?.()}</div>
</main>
