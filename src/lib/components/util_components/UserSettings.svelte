<script lang="ts">
  /**
   * UserSettings Component
   * 
   * Displays user authentication status and provides login/signup/logout functionality
   */
  
  import { authClient } from '$lib/auth-client.js';
  
  const session = authClient.useSession;
  
  let form = $state({ name: '', email: '', password: '' });
  let msg = $state('');
  let showSignUp = $state(false);
  let isLoading = $state(false);
  
  async function signUp() {
    msg = '';
    isLoading = true;
    try {
      const { error } = await authClient.signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (error) {
        msg = error.message || 'Sign up failed';
      } else {
        msg = 'Account created! You are now signed in.';
        form = { name: '', email: '', password: '' };
        showSignUp = false;
      }
    } finally {
      isLoading = false;
    }
  }
  
  async function signIn() {
    msg = '';
    isLoading = true;
    try {
      const { error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
      });
      if (error) {
        msg = error.message || 'Sign in failed';
      } else {
        msg = '';
        form = { name: '', email: '', password: '' };
      }
    } finally {
      isLoading = false;
    }
  }
  
  async function signOut() {
    msg = '';
    isLoading = true;
    try {
      const { error } = await authClient.signOut();
      if (error) {
        msg = error.message || 'Sign out failed';
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="user-settings">
  {#if $session.data?.user}
    <!-- Logged In State -->
    <div class="user-info">
      <div class="user-avatar">
        {#if $session.data.user.image}
          <img src={$session.data.user.image} alt="Profile" />
        {:else}
          <span class="avatar-placeholder">
            {$session.data.user.name?.charAt(0).toUpperCase() || $session.data.user.email?.charAt(0).toUpperCase() || '?'}
          </span>
        {/if}
      </div>
      <div class="user-details">
        <span class="user-name">{$session.data.user.name || 'User'}</span>
        <span class="user-email">{$session.data.user.email}</span>
      </div>
    </div>
    
    <div class="user-status">
      <span class="status-badge online">● Connected</span>
      <span class="status-text">Your calendar syncs to the cloud</span>
    </div>
    
    <button 
      class="btn-signout" 
      onclick={signOut}
      disabled={isLoading}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  {:else}
    <!-- Logged Out State -->
    <div class="auth-notice">
      <p>Sign in to sync your calendar across devices and enable import/export features.</p>
    </div>
    
    {#if showSignUp}
      <!-- Sign Up Form -->
      <form class="auth-form" onsubmit={(e) => { e.preventDefault(); signUp(); }}>
        <input 
          type="text"
          placeholder="Name" 
          bind:value={form.name}
          disabled={isLoading}
          required
        />
        <input 
          type="email"
          placeholder="Email" 
          bind:value={form.email}
          disabled={isLoading}
          required
        />
        <input 
          type="password"
          placeholder="Password" 
          bind:value={form.password}
          disabled={isLoading}
          required
          minlength="6"
        />
        <button type="submit" class="btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
        <button 
          type="button" 
          class="btn-link"
          onclick={() => { showSignUp = false; msg = ''; }}
        >
          Already have an account? Sign In
        </button>
      </form>
    {:else}
      <!-- Sign In Form -->
      <form class="auth-form" onsubmit={(e) => { e.preventDefault(); signIn(); }}>
        <input 
          type="email"
          placeholder="Email" 
          bind:value={form.email}
          disabled={isLoading}
          required
        />
        <input 
          type="password"
          placeholder="Password" 
          bind:value={form.password}
          disabled={isLoading}
          required
        />
        <button type="submit" class="btn-primary" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        <button 
          type="button" 
          class="btn-link"
          onclick={() => { showSignUp = true; msg = ''; }}
        >
          Don't have an account? Sign Up
        </button>
      </form>
    {/if}
  {/if}
  
  {#if msg}
    <div class="message" class:error={msg.includes('failed') || msg.includes('error')}>
      {msg}
    </div>
  {/if}
</div>

<style>
  .user-settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-surface-alt, #f8fafc);
    border-radius: 12px;
  }
  
  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--coral, #f08a77);
    color: white;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }
  
  .user-name {
    font-weight: 600;
    color: var(--color-text-primary, #1a1a2e);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .user-email {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #64748b);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .user-status {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 8px;
  }
  
  .status-badge {
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .status-badge.online {
    color: var(--color-success, #10b981);
  }
  
  .status-text {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #64748b);
  }
  
  .btn-signout {
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid var(--color-error, #ef4444);
    color: var(--color-error, #ef4444);
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-signout:hover:not(:disabled) {
    background: var(--color-error, #ef4444);
    color: white;
  }
  
  .btn-signout:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .auth-notice {
    padding: 1rem;
    background: var(--color-info-bg, #e0f2fe);
    border-radius: 8px;
    color: var(--color-info-text, #0369a1);
    font-size: 0.9rem;
  }
  
  .auth-notice p {
    margin: 0;
  }
  
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .auth-form input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .auth-form input:focus {
    outline: none;
    border-color: var(--coral, #f08a77);
  }
  
  .auth-form input:disabled {
    background: var(--color-surface-alt, #f8fafc);
    cursor: not-allowed;
  }
  
  .btn-primary {
    padding: 0.875rem;
    background: var(--coral, #f08a77);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-link {
    background: none;
    border: none;
    color: var(--color-primary, #6366f1);
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: underline;
  }
  
  .btn-link:hover {
    color: var(--color-primary-dark, #4f46e5);
  }
  
  .message {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    background: var(--color-success-bg, #ecfdf5);
    color: var(--color-success-text, #065f46);
  }
  
  .message.error {
    background: var(--color-error-bg, #fef2f2);
    color: var(--color-error-text, #991b1b);
  }
</style>

