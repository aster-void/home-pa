<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  const session = authClient.useSession;

  let form = $state({ name: "", email: "", password: "" });
  let msg = $state("");

  // Get redirect target from URL params
  function getRedirectTo(): string {
    const redirectTo = $page.url.searchParams.get("redirectTo");
    return redirectTo ? decodeURIComponent(redirectTo) : "/";
  }

  // Redirect authenticated users away from auth page
  $effect(() => {
    if ($session.data?.user) {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- Dynamic redirect URL from query params, cannot be statically resolved
      goto(getRedirectTo(), { replaceState: true });
    }
  });

  async function signUp() {
    msg = "";
    const { error } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    if (error) {
      msg = error.message || "Sign up failed";
    }
    // Redirect handled by $effect when session updates
  }

  async function signIn() {
    msg = "";
    const { error } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });
    if (error) {
      msg = error.message || "Sign in failed";
    }
    // Redirect handled by $effect when session updates
  }

  async function signOut() {
    msg = "";
    const { error } = await authClient.signOut();
    if (error) msg = error.message || "Sign out failed";
  }
</script>

<h2>Auth</h2>

{#if $session.data?.user}
  <p>Signed in as {$session.data.user.email}</p>
  <button onclick={signOut}>Sign out</button>
{:else}
  <form
    onsubmit={(e) => {
      e.preventDefault();
      signIn();
    }}
  >
    <input placeholder="email" bind:value={form.email} />
    <input placeholder="password" type="password" bind:value={form.password} />
    <button type="submit">Sign in</button>
  </form>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      signUp();
    }}
  >
    <input placeholder="name" bind:value={form.name} />
    <input placeholder="email" bind:value={form.email} />
    <input placeholder="password" type="password" bind:value={form.password} />
    <button type="submit">Sign up</button>
  </form>
{/if}

{#if msg}
  <p>{msg}</p>
{/if}
