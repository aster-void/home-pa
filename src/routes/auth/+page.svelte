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
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- Dynamic redirect URL from query params, cannot be statically resolved
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

<div class="auth-container">
  <div class="auth-sidebar">
    <div class="sidebar-content">
      <div class="logo-section" in:fade={{ duration: 600, delay: 200 }}>
        <div class="logo-circle"></div>
        <h1 class="app-title">Home-PA</h1>
        <p class="app-subtitle">Your Personal Assistant</p>
      </div>

      <div
        class="feature-list"
        in:fly={{ y: 20, duration: 600, delay: 400, easing: cubicOut }}
      >
        <div class="feature-item">
          <div class="feature-icon">📅</div>
          <div class="feature-text">
            <h3>Smart Calendar</h3>
            <p>Organize your schedule effortlessly</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">✓</div>
          <div class="feature-text">
            <h3>Task Management</h3>
            <p>Stay on top of your todos</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💬</div>
          <div class="feature-text">
            <h3>AI Assistant</h3>
            <p>Get intelligent help anytime</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="auth-main">
    {#if $session.data?.user}
      <div class="auth-card" in:fade={{ duration: 400 }}>
        <h2 class="card-title">Welcome back!</h2>
        <p class="user-info">
          Signed in as <strong>{$session.data.user.email}</strong>
        </p>
        <button class="btn btn-primary" onclick={signOut} disabled={isLoading}>
          {isLoading ? "Signing out..." : "Sign out"}
        </button>
      </div>
    {:else}
      <div
        class="auth-card"
        in:fly={{ y: 30, duration: 600, delay: 300, easing: cubicOut }}
      >
        <div class="card-header">
          <h2 class="card-title">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p class="card-subtitle">
            {mode === "signin"
              ? "Sign in to continue to your personal assistant"
              : "Join to start organizing your life"}
          </p>
        </div>

        <form
          class="auth-form"
          onsubmit={(e) => {
            e.preventDefault();
            mode === "signin" ? signIn() : signUp();
          }}
        >
          {#if mode === "signup"}
            <div class="form-group" in:fly={{ x: -20, duration: 300 }}>
              <label for="name" class="form-label">Name</label>
              <input
                id="name"
                type="text"
                class="form-input"
                placeholder="Your name"
                bind:value={form.name}
                required
              />
            </div>
          {/if}

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
              bind:value={form.email}
              required
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              bind:value={form.password}
              required
            />
          </div>

          {#if msg}
            <div class="error-message" in:fly={{ y: -10, duration: 300 }}>
              {msg}
            </div>
          {/if}

          <button
            type="submit"
            class="btn btn-primary btn-large"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading-spinner"></span>
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

        <div class="card-footer">
          <p class="toggle-text">
            {mode === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button class="link-button" onclick={toggleMode}>
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      "Manrope",
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
  }

  .auth-container {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(135deg, #faf8f6 0%, #f0ebe6 100%);
  }

  .auth-sidebar {
    flex: 0 0 45%;
    background: linear-gradient(165deg, #2d3748 0%, #1a202c 100%);
    color: white;
    padding: 4rem 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .auth-sidebar::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 80%,
        rgba(237, 137, 54, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(66, 153, 225, 0.1) 0%,
        transparent 50%
      );
    pointer-events: none;
  }

  .sidebar-content {
    position: relative;
    z-index: 1;
    max-width: 480px;
    margin: 0 auto;
  }

  .logo-section {
    margin-bottom: 4rem;
  }

  .logo-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 40px rgba(237, 137, 54, 0.3);
  }

  .app-title {
    font-family: "Instrument Serif", Georgia, serif;
    font-size: 3.5rem;
    font-weight: 400;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .app-subtitle {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 400;
    margin: 0;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .feature-item {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
  }

  .feature-icon {
    font-size: 2rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .feature-text h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.375rem 0;
    color: white;
  }

  .feature-text p {
    font-size: 0.9375rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.5;
  }

  .auth-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .auth-card {
    background: white;
    border-radius: 24px;
    padding: 3rem;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    margin-bottom: 2.5rem;
  }

  .card-title {
    font-family: "Instrument Serif", Georgia, serif;
    font-size: 2.25rem;
    font-weight: 400;
    margin: 0 0 0.75rem 0;
    color: #1a202c;
    letter-spacing: -0.02em;
  }

  .card-subtitle {
    font-size: 1rem;
    color: #718096;
    margin: 0;
    line-height: 1.6;
  }

  .user-info {
    font-size: 1rem;
    color: #4a5568;
    margin: 0 0 1.5rem 0;
  }

  .user-info strong {
    color: #1a202c;
    font-weight: 600;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
    letter-spacing: 0.01em;
  }

  .form-input {
    padding: 0.875rem 1rem;
    font-size: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    font-family: "Manrope", sans-serif;
    transition: all 0.2s ease;
    color: #1a202c;
  }

  .form-input:focus {
    outline: none;
    border-color: #ed8936;
    box-shadow: 0 0 0 4px rgba(237, 137, 54, 0.1);
  }

  .form-input::placeholder {
    color: #a0aec0;
  }

  .error-message {
    padding: 0.875rem 1rem;
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 12px;
    color: #c53030;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  .btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: "Manrope", sans-serif;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(237, 137, 54, 0.4);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-large {
    padding: 1rem 1.5rem;
    font-size: 1.0625rem;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .card-footer {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .toggle-text {
    font-size: 0.9375rem;
    color: #718096;
    margin: 0;
  }

  .link-button {
    background: none;
    border: none;
    color: #ed8936;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-left: 0.375rem;
    font-family: "Manrope", sans-serif;
    font-size: inherit;
    transition: color 0.2s ease;
  }

  .link-button:hover {
    color: #dd6b20;
    text-decoration: underline;
  }

  @media (max-width: 1024px) {
    .auth-sidebar {
      display: none;
    }

    .auth-main {
      flex: 1;
    }
  }

  @media (max-width: 640px) {
    .auth-main {
      padding: 1.5rem;
    }

    .auth-card {
      padding: 2rem 1.5rem;
    }

    .card-title {
      font-size: 1.875rem;
    }

    .app-title {
      font-size: 2.5rem;
    }
  }
</style>
