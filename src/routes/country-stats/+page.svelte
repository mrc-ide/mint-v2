<script lang="ts">
	let { data } = $props();
</script>

<div class="mx-auto max-w-xl p-6">
	<h1 class="mb-4 text-2xl font-bold">Country Visit Statistics</h1>

	<div class="flex flex-col gap-2">
		{#each Object.entries(data.visits) as [country, count]}
			<div class="flex justify-between rounded border p-3">
				<span class="font-medium">{country}</span>
				<span class="text-muted-foreground">{count} visits</span>
			</div>
		{/each}
	</div>
</div>
