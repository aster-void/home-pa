<script lang="ts">
  import "../app.css";
  import favicon from "@/assets/favicon.svg";
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { initializeStores } from "$lib/stores/bootstrap.js";

  let { children } = $props();

  // Initialize global stores on layout load
  initializeStores();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
  {@render children?.()}
  <BottomNavigation />
  <Toast />
</div>

<style>
  .app-container {
    min-height: 100vh;
    background-color: #f8fafc;
    /* Reserve space for bottom navigation including safe area */
    padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  }
</style>
