<script lang="ts">
	import favicon from '$lib/assets/favicon.ico';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import Header from './_components/Header.svelte';
	import { configureHighcharts } from '$lib/charts/baseChart';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	// Add 'started' class to body when app is mounted to indicate hydration is complete
	onMount(() => {
		document.body.classList.add('started');
	});

	configureHighcharts();
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
<Header userData={data.userData} />
<main class="flex min-h-svh px-5 pt-18 pb-5">
	<div class="flex-1">{@render children?.()}</div>
</main>
<footer class="py-3">
	<div class="text-center text-sm text-muted-foreground">
		Powered by <a
			target="_blank"
			href="https://github.com/mrc-ide/MINTe-python"
			class="hover:underline"
			rel="noopener noreferrer"
		>
			MINTe v{data.versionInfo.minte}
		</a>
	</div>
</footer>
