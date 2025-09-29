<script lang="ts">
	import type { StrategiseResults } from '$lib/types/userState';

	interface Props {
		strategiseResults: StrategiseResults[];
	}
	let { strategiseResults }: Props = $props();
</script>

<!-- TODO: add table + graphs -->
<pre>
    {JSON.stringify(strategiseResults, null, 1)}
</pre>
