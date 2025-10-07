<script lang="ts">
  import "../app.css";
  import favicon from "@/assets/favicon.svg";
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
  import { AppController } from "$lib/controllers/app.controller.svelte.ts";
  import { setContext } from "svelte";

  let { children } = $props();

  // Create shared controller instance
  const controller = new AppController();

  // Set controller in context for child components
  setContext("controller", controller);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
  {@render children?.()}
  <BottomNavigation {controller} />
</div>

<style>
  .app-container {
    min-height: 100vh;
    background-color: #f8fafc;
    padding-bottom: 80px; /* Space for bottom navigation */
  }
</style>
