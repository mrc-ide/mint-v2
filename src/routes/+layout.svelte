<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>MINT - Malaria Intervention Tool</title>
	<meta name="description" content="Malaria intervention tool for analyzing and planning malaria prevention strategies" />
</svelte:head>

<ModeWatcher />
{@render children?.()}
