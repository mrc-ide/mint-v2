<script lang="ts">
	interface Props {
		title: string;
		value: string;
	}
	let { title, value }: Props = $props();
</script>

<div
	class="rounded-lg border border-border/50 bg-card p-2 text-center shadow-sm transition-all hover:border-border hover:shadow-md"
>
	<h3 class="text-sm font-medium text-muted-foreground">{title}</h3>
	<p class="text-lg font-bold">{value}</p>
</div>
