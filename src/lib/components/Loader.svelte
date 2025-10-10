<script lang="ts">
	interface Props {
		text?: string;
	}
	let { text = 'Loading...' }: Props = $props();
</script>

<div class="flex items-center justify-center p-8">
	<div class="flex flex-col items-center gap-3">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
		<div class="text-sm text-muted-foreground">{text}</div>
	</div>
</div>
