<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  const session = authClient.useSession;

  let form = $state({ name: "", email: "", password: "" });
  let msg = $state("");
  let mode = $state<"signin" | "signup">("signin");
  let isLoading = $state(false);

  // Get redirect target from URL params
  function getRedirectTo(): string {
    const redirectTo = $page.url.searchParams.get("redirectTo");
    return redirectTo ? decodeURIComponent(redirectTo) : "/";
  }

  // Redirect authenticated users away from auth page
  $effect(() => {
    if ($session.data?.user) {
      goto(getRedirectTo(), { replaceState: true });
    }
  });

  async function signUp() {
    msg = "";
    isLoading = true;
    const { error } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    isLoading = false;
    if (error) {
      msg = error.message || "Sign up failed";
    }
    // Redirect handled by $effect when session updates
  }

  async function signIn() {
    msg = "";
    isLoading = true;
    const { error } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });
    isLoading = false;
    if (error) {
      msg = error.message || "Sign in failed";
    }
    // Redirect handled by $effect when session updates
  }

  async function signOut() {
    msg = "";
    isLoading = true;
    const { error } = await authClient.signOut();
    isLoading = false;
    if (error) msg = error.message || "Sign out failed";
  }

  function toggleMode() {
    mode = mode === "signin" ? "signup" : "signin";
    msg = "";
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="flex min-h-screen bg-gradient-to-br from-[#faf8f6] to-[#f0ebe6]">
  <div
    class="relative flex flex-[0_0_45%] flex-col justify-center overflow-hidden bg-gradient-to-br from-[#2d3748] to-[#1a202c] p-16 text-white before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_80%,rgba(237,137,54,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(66,153,225,0.1)_0%,transparent_50%)] before:content-[''] max-lg:hidden"
  >
    <div class="relative z-10 mx-auto max-w-[480px]">
      <div class="mb-16" in:fade={{ duration: 600, delay: 200 }}>
        <div
          class="mb-6 h-16 w-16 rounded-full bg-gradient-to-br from-[#ed8936] to-[#dd6b20] shadow-[0_10px_40px_rgba(237,137,54,0.3)]"
        ></div>
        <h1
          class="m-0 mb-2 font-serif text-[3.5rem] leading-tight font-normal tracking-tight"
        >
          Home-PA
        </h1>
        <p class="m-0 text-lg font-normal text-white/70">
          Your Personal Assistant
        </p>
      </div>

      <div
        class="flex flex-col gap-8"
        in:fly={{ y: 20, duration: 600, delay: 400, easing: cubicOut }}
      >
        <div class="flex items-start gap-5">
          <div class="flex-shrink-0 text-4xl leading-none">📅</div>
          <div>
            <h3 class="m-0 mb-1.5 text-lg font-semibold text-white">
              Smart Calendar
            </h3>
            <p class="m-0 text-[0.9375rem] leading-relaxed text-white/65">
              Organize your schedule effortlessly
            </p>
          </div>
        </div>
        <div class="flex items-start gap-5">
          <div class="flex-shrink-0 text-4xl leading-none">✓</div>
          <div>
            <h3 class="m-0 mb-1.5 text-lg font-semibold text-white">
              Task Management
            </h3>
            <p class="m-0 text-[0.9375rem] leading-relaxed text-white/65">
              Stay on top of your todos
            </p>
          </div>
        </div>
        <div class="flex items-start gap-5">
          <div class="flex-shrink-0 text-4xl leading-none">💬</div>
          <div>
            <h3 class="m-0 mb-1.5 text-lg font-semibold text-white">
              AI Assistant
            </h3>
            <p class="m-0 text-[0.9375rem] leading-relaxed text-white/65">
              Get intelligent help anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="flex flex-1 items-center justify-center p-8 max-sm:p-6">
    {#if $session.data?.user}
      <div
        class="w-full max-w-[480px] rounded-3xl bg-white p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
        in:fade={{ duration: 400 }}
      >
        <h2
          class="m-0 mb-3 font-serif text-4xl font-normal tracking-tight text-[#1a202c]"
        >
          Welcome back!
        </h2>
        <p class="m-0 mb-6 text-base text-[#4a5568]">
          Signed in as <strong class="font-semibold text-[#1a202c]"
            >{$session.data.user.email}</strong
          >
        </p>
        <button
          class="btn border-none bg-gradient-to-br from-[#ed8936] to-[#dd6b20] text-white shadow-[0_4px_12px_rgba(237,137,54,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(237,137,54,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          onclick={signOut}
          disabled={isLoading}
        >
          {isLoading ? "Signing out..." : "Sign out"}
        </button>
      </div>
    {:else}
      <div
        class="w-full max-w-[480px] rounded-3xl bg-white p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-sm:p-8"
        in:fly={{ y: 30, duration: 600, delay: 300, easing: cubicOut }}
      >
        <div class="mb-10">
          <h2
            class="m-0 mb-3 font-serif text-4xl font-normal tracking-tight text-[#1a202c] max-sm:text-3xl"
          >
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p class="m-0 text-base leading-relaxed text-[#718096]">
            {mode === "signin"
              ? "Sign in to continue to your personal assistant"
              : "Join to start organizing your life"}
          </p>
        </div>

        <form
          class="flex flex-col gap-6"
          onsubmit={(e) => {
            e.preventDefault();
            if (mode === "signin") {
              signIn();
            } else {
              signUp();
            }
          }}
        >
          {#if mode === "signup"}
            <div class="flex flex-col gap-2" in:fly={{ x: -20, duration: 300 }}>
              <label
                for="name"
                class="text-sm font-semibold tracking-wide text-[#2d3748]"
                >Name</label
              >
              <input
                id="name"
                type="text"
                class="input-bordered input rounded-xl border-2 border-base-300 bg-white px-4 py-3.5 text-base text-[#1a202c] transition-all duration-200 placeholder:text-[#a0aec0] focus:border-[#ed8936] focus:shadow-[0_0_0_4px_rgba(237,137,54,0.1)] focus:outline-none"
                placeholder="Your name"
                bind:value={form.name}
                required
              />
            </div>
          {/if}

          <div class="flex flex-col gap-2">
            <label
              for="email"
              class="text-sm font-semibold tracking-wide text-[#2d3748]"
              >Email</label
            >
            <input
              id="email"
              type="email"
              class="input-bordered input rounded-xl border-2 border-base-300 bg-white px-4 py-3.5 text-base text-[#1a202c] transition-all duration-200 placeholder:text-[#a0aec0] focus:border-[#ed8936] focus:shadow-[0_0_0_4px_rgba(237,137,54,0.1)] focus:outline-none"
              placeholder="you@example.com"
              bind:value={form.email}
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="text-sm font-semibold tracking-wide text-[#2d3748]"
              >Password</label
            >
            <input
              id="password"
              type="password"
              class="input-bordered input rounded-xl border-2 border-base-300 bg-white px-4 py-3.5 text-base text-[#1a202c] transition-all duration-200 placeholder:text-[#a0aec0] focus:border-[#ed8936] focus:shadow-[0_0_0_4px_rgba(237,137,54,0.1)] focus:outline-none"
              placeholder="••••••••"
              bind:value={form.password}
              required
            />
          </div>

          {#if msg}
            <div
              class="rounded-xl border border-[#feb2b2] bg-[#fff5f5] px-4 py-3.5 text-[0.9375rem] leading-relaxed text-[#c53030]"
              in:fly={{ y: -10, duration: 300 }}
            >
              {msg}
            </div>
          {/if}

          <button
            type="submit"
            class="btn inline-flex items-center justify-center gap-2 border-none bg-gradient-to-br from-[#ed8936] to-[#dd6b20] px-6 py-4 text-[1.0625rem] font-semibold text-white shadow-[0_4px_12px_rgba(237,137,54,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(237,137,54,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {#if isLoading}
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              ></span>
              <span
                >{mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."}</span
              >
            {:else}
              {mode === "signin" ? "Sign in" : "Create account"}
            {/if}
          </button>
        </form>

        <div class="mt-8 border-t border-base-300 pt-8 text-center">
          <p class="m-0 text-[0.9375rem] text-[#718096]">
            {mode === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              class="ml-1.5 cursor-pointer border-none bg-transparent p-0 font-semibold text-[#ed8936] transition-colors duration-200 hover:text-[#dd6b20] hover:underline"
              onclick={toggleMode}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>
