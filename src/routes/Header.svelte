<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';
</script>

<header>
	<div
		class="dark:shadow-gray-green-900 fixed top-0 right-0 left-0 flex h-16 items-center border-b border-accent bg-background shadow-sm dark:shadow-gray-800"
	>
		<a href="/" class="px-2 text-2xl font-extrabold text-primary hover:text-primary/80">MINT</a>
		<div class="ml-auto flex items-center gap-3 px-4">
			<a href="/privacy" class="text-muted-foreground hover:underline">Privacy</a>
			<a href="/accessibility" class="text-muted-foreground hover:underline">Accessibility</a>
			<a
				href="https://mrc-ide.github.io/mint-news/"
				target="_blank"
				class="font-light text-muted-foreground hover:underline">News</a
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
