<script lang="ts">
  import { page } from "$app/stores";

  const navItems = [
    { href: "/calendar", label: "Calendar" },
    { href: "/assistant", label: "Assistant" },
    { href: "/tasks", label: "Tasks" },
    { href: "/utilities", label: "Utilities" },
  ] as const;

  function isActive(href: string): boolean {
    return (
      $page.url.pathname === href || $page.url.pathname.startsWith(href + "/")
    );
  }
</script>

<nav
  class="fixed right-0 bottom-0 left-0 z-[var(--z-nav)] flex h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] items-stretch gap-2 border-t border-[var(--color-border-default)] bg-[var(--color-bg-app)]/90 px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-2"
  aria-label="Main navigation"
>
  {#each navItems as { href, label } (href)}
    <a
      {href}
      class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-none bg-transparent p-2.5 text-[var(--color-text-secondary)] no-underline transition-all duration-200 ease-out hover:bg-[var(--color-surface-100)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] {isActive(
        href,
      )
        ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-800)]'
        : ''}"
      aria-current={isActive(href) ? "page" : undefined}
    >
      <span
        class="text-center text-sm leading-[1.2] font-medium tracking-normal {isActive(
          href,
        )
          ? 'font-medium'
          : 'font-normal'}"
      >
        {label}
      </span>
    </a>
  {/each}
</nav>
