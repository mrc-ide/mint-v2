<script lang="ts">
	let { data } = $props();
</script>

<div class="text-center text-sm text-muted-foreground">
	Powered by <a
		target="_blank"
		href="https://github.com/mrc-ide/MINTe-python"
		class="hover:underline"
		rel="noopener noreferrer"
	>
		MINTe v{data.versionInfo.minte}
	</a>
	<a
		target="_blank"
		href="https://github.com/mrc-ide/estiMINT-python"
		class="hover:underline"
		rel="noopener noreferrer"
	>
		| EstiMint v{data.versionInfo.estimint}
	</a>
	| API v{data.versionInfo.server}
</div>
