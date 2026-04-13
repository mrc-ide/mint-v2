<script lang="ts">
	interface Props {
		label: string;
		value: string;
	}
	let { label, value }: Props = $props();
</script>

<div class="flex justify-between text-xs">
	<span class="text-muted-foreground">{label}:</span>
	<span class="font-medium">{value}</span>
</div>
