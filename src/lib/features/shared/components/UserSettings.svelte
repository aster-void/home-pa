<script lang="ts">
  /**
   * UserSettings Component
   *
   * Displays user authentication status and provides login/signup/logout functionality
   */

  import { authClient } from "$lib/auth-client.ts";

  const session = authClient.useSession;

  let form = $state({ name: "", email: "", password: "" });
  let msg = $state("");
  let showSignUp = $state(false);
  let isLoading = $state(false);

  async function signUp() {
    msg = "";
    isLoading = true;
    try {
      const { error } = await authClient.signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (error) {
        msg = error.message || "Sign up failed";
      } else {
        msg = "Account created! You are now signed in.";
        form = { name: "", email: "", password: "" };
        showSignUp = false;
      }
    } finally {
      isLoading = false;
    }
  }

  async function signIn() {
    msg = "";
    isLoading = true;
    try {
      const { error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
      });
      if (error) {
        msg = error.message || "Sign in failed";
      } else {
        msg = "";
        form = { name: "", email: "", password: "" };
      }
    } finally {
      isLoading = false;
    }
  }

  async function signOut() {
    msg = "";
    isLoading = true;
    try {
      const { error } = await authClient.signOut();
      if (error) {
        msg = error.message || "Sign out failed";
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex flex-col gap-4">
  {#if $session.data?.user}
    <!-- Logged In State -->
    <div
      class="flex items-center gap-4 rounded-xl bg-[color:var(--color-surface-alt,#f8fafc)] p-4"
    >
      <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
        {#if $session.data.user.image}
          <img
            src={$session.data.user.image}
            alt="Profile"
            class="h-full w-full object-cover"
          />
        {:else}
          <span
            class="flex h-full w-full items-center justify-center bg-[#F08A77] text-xl font-semibold text-white"
          >
            {$session.data.user.name?.charAt(0).toUpperCase() ||
              $session.data.user.email?.charAt(0).toUpperCase() ||
              "?"}
          </span>
        {/if}
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <span
          class="overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-[color:var(--color-text-primary,#1a1a2e)]"
        >
          {$session.data.user.name || "User"}
        </span>
        <span
          class="overflow-hidden text-[0.85rem] text-ellipsis whitespace-nowrap text-[color:var(--color-text-secondary,#64748b)]"
        >
          {$session.data.user.email}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-1 rounded-lg bg-success/10 p-3">
      <span class="text-[0.85rem] font-medium text-success">● Connected</span>
      <span class="text-[0.8rem] text-base-content/60"
        >Your calendar syncs to the cloud</span
      >
    </div>

    <button
      class="min-h-[44px] w-full cursor-pointer rounded-lg border border-error bg-transparent px-3 py-3 font-medium text-error transition-all duration-200 hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      onclick={signOut}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Sign Out"}
    </button>
  {:else}
    <!-- Logged Out State -->
    <div class="rounded-lg bg-info/10 p-4 text-sm text-info">
      <p class="m-0">
        Sign in to sync your calendar across devices and enable import/export
        features.
      </p>
    </div>

    {#if showSignUp}
      <!-- Sign Up Form -->
      <form
        class="flex flex-col gap-3"
        onsubmit={(e) => {
          e.preventDefault();
          signUp();
        }}
      >
        <input
          type="text"
          placeholder="Name"
          bind:value={form.name}
          disabled={isLoading}
          required
          class="input-bordered input min-h-[44px] w-full transition-colors duration-200 focus:border-[#F08A77] focus:outline-none disabled:cursor-not-allowed disabled:bg-base-200"
        />
        <input
          type="email"
          placeholder="Email"
          bind:value={form.email}
          disabled={isLoading}
          required
          class="input-bordered input min-h-[44px] w-full transition-colors duration-200 focus:border-[#F08A77] focus:outline-none disabled:cursor-not-allowed disabled:bg-base-200"
        />
        <input
          type="password"
          placeholder="Password"
          bind:value={form.password}
          disabled={isLoading}
          required
          minlength="6"
          class="input-bordered input min-h-[44px] w-full transition-colors duration-200 focus:border-[#F08A77] focus:outline-none disabled:cursor-not-allowed disabled:bg-base-200"
        />
        <button
          type="submit"
          class="btn min-h-[44px] border-none bg-[#F08A77] font-medium text-white transition-all duration-200 hover:bg-[#E87862] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
        <button
          type="button"
          class="hover:text-primary-focus min-h-[44px] cursor-pointer border-none bg-transparent text-sm text-primary underline transition-colors duration-200"
          onclick={() => {
            showSignUp = false;
            msg = "";
          }}
        >
          Already have an account? Sign In
        </button>
      </form>
    {:else}
      <!-- Sign In Form -->
      <form
        class="flex flex-col gap-3"
        onsubmit={(e) => {
          e.preventDefault();
          signIn();
        }}
      >
        <input
          type="email"
          placeholder="Email"
          bind:value={form.email}
          disabled={isLoading}
          required
          class="input-bordered input min-h-[44px] w-full transition-colors duration-200 focus:border-[#F08A77] focus:outline-none disabled:cursor-not-allowed disabled:bg-base-200"
        />
        <input
          type="password"
          placeholder="Password"
          bind:value={form.password}
          disabled={isLoading}
          required
          class="input-bordered input min-h-[44px] w-full transition-colors duration-200 focus:border-[#F08A77] focus:outline-none disabled:cursor-not-allowed disabled:bg-base-200"
        />
        <button
          type="submit"
          class="btn min-h-[44px] border-none bg-[#F08A77] font-medium text-white transition-all duration-200 hover:bg-[#E87862] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
        <button
          type="button"
          class="hover:text-primary-focus min-h-[44px] cursor-pointer border-none bg-transparent text-sm text-primary underline transition-colors duration-200"
          onclick={() => {
            showSignUp = true;
            msg = "";
          }}
        >
          Don't have an account? Sign Up
        </button>
      </form>
    {/if}
  {/if}

  {#if msg}
    <div
      class="rounded-lg px-4 py-3 text-sm {msg.includes('failed') ||
      msg.includes('error')
        ? 'bg-error/10 text-error'
        : 'bg-success/10 text-success'}"
    >
      {msg}
    </div>
  {/if}
</div>
