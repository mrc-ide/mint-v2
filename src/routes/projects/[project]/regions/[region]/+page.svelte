<script lang="ts">
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();
</script>

TODO
<p>Project: {params.project}, {JSON.stringify(data.project)}</p>
<p>Region: {params.region}, {JSON.stringify(data.region)}</p>
