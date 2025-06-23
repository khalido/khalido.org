<script lang="ts">
  import * as Command from "@lib/components/ui/command/index.ts";

  let open = $state(false);
  let searchValue = $state("");

  const staticItems = {
    Pages: [
      { title: "Home", href: "/" },
      { title: "About", href: "/about" },
      { title: "Blog", href: "/blog" },
    ],
    Actions: [
      { title: "Toggle Theme", action: "toggleTheme" },
      { title: "Copy URL", action: "copyUrl" },
    ],
    Socials: [
      { title: "GitHub", href: "https://github.com/your-username" },
      { title: "Twitter", href: "https://twitter.com/your-username" },
    ],
  };

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open = !open;
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open>
  <Command.Input
    bind:value={searchValue}
    placeholder="Type a command or search..."
  />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>

    <Command.Group heading="Pages">
      {#each staticItems.Pages as item}
        <Command.Item
          value={item.title}
          onSelect={() => {
            window.location.href = item.href;
            open = false;
          }}
        >
          {item.title}
        </Command.Item>
      {/each}
    </Command.Group>

    <Command.Group heading="Actions">
      {#each staticItems.Actions as item}
        <Command.Item
          value={item.title}
          onSelect={() => {
            console.log("Action:", item.action);
            open = false;
          }}
        >
          {item.title}
        </Command.Item>
      {/each}
    </Command.Group>

    <Command.Group heading="Socials">
      {#each staticItems.Socials as item}
        <Command.Item
          value={item.title}
          onSelect={() => {
            window.open(item.href, "_blank");
            open = false;
          }}
        >
          {item.title}
        </Command.Item>
      {/each}
    </Command.Group>
  </Command.List>
</Command.Dialog>
