<script lang="ts">
    import type { PageProps } from "./$types";
    let { data }: PageProps = $props();

    $inspect(data, "data");
</script>

<h1>Welcome to {data.name}</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
