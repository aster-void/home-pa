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
  class="fixed right-0 bottom-0 left-0 z-[2000] flex h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] items-stretch gap-1 border-t border-[#1a202c]/[0.06] bg-white/90 px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-[180%] sm:px-2"
  aria-label="Main navigation"
>
  {#each navItems as { href, label }}
    <a
      {href}
      class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-none bg-transparent p-2.5 text-[#718096] no-underline transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#ed8936]/10 hover:text-[#ed8936] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed8936]/30 {isActive(
        href,
      )
        ? 'bg-[#ed8936]/15 text-[#ed8936]'
        : ''}"
      aria-current={isActive(href) ? "page" : undefined}
    >
      <span
        class="text-center text-sm leading-[1.2] tracking-wide {isActive(href)
          ? 'font-semibold'
          : 'font-medium'}"
      >
        {label}
      </span>
    </a>
  {/each}
</nav>
