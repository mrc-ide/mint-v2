<script lang="ts">
	import { Button } from "$lib/components/ui/button";
    import type { PageProps } from "./$types";
    
    let { data }: PageProps = $props();

    $inspect(data);
</script>

<h1>Welcome to {data.name}</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<Button>Click me daddy</Button>