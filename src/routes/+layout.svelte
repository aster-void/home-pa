<script lang="ts">
  import "../app.css";
  import favicon from "@/assets/favicon.svg";
  import {
    BottomNavigation,
    Toast,
  } from "$lib/features/shared/components/index.ts";
  import { initializeStores } from "$lib/bootstrap/bootstrap.ts";
  import { loadTasks } from "$lib/features/tasks/state/taskActions.ts";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { children } = $props();

  // Initialize global stores on layout load
  initializeStores();

  const session = authClient.useSession;

  // Public routes that don't require authentication
  const PUBLIC_ROUTES = ["/auth"];

  function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );
  }

  // Load tasks once when authenticated
  let tasksLoaded = false;
  $effect(() => {
    const isLoading = $session.isPending;
    const isAuthenticated = !!$session.data?.user;

    if (!isLoading && isAuthenticated && !tasksLoaded) {
      tasksLoaded = true;
      loadTasks();
    }
  });

  // Client-side auth guard (backup for server-side redirect)
  $effect(() => {
    const isLoading = $session.isPending;
    const isAuthenticated = !!$session.data?.user;
    const pathname = $page.url.pathname;

    if (!isLoading && !isAuthenticated && !isPublicRoute(pathname)) {
      const redirectTo = encodeURIComponent(pathname + $page.url.search);
      goto(`/auth?redirectTo=${redirectTo}`, { replaceState: true });
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if isPublicRoute($page.url.pathname)}
  <div class="flex h-screen min-h-screen flex-col overflow-hidden">
    {@render children?.()}
  </div>
{:else}
  <div class="flex h-screen min-h-screen flex-col bg-[var(--color-bg-app)]">
    <main
      class="box-border flex h-[calc(100vh-var(--bottom-nav-height,80px)-env(safe-area-inset-bottom))] max-h-[calc(100vh-var(--bottom-nav-height,80px)-env(safe-area-inset-bottom))] min-h-[calc(100vh-var(--bottom-nav-height,80px)-env(safe-area-inset-bottom))] w-full flex-col overflow-auto bg-transparent"
    >
      {@render children?.()}
    </main>
    <BottomNavigation />
    <Toast />
  </div>
{/if}
