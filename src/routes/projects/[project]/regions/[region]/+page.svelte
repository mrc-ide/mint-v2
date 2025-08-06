<script lang="ts">
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();
</script>

TODO
<p>Project: {params.project}</p>
<p>Region: {params.region}</p>
