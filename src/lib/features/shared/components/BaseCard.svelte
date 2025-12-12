<script lang="ts">
  let p: {
    title: string;
    status?: string;
    statusType?: "active" | "inactive" | "warning" | "error";
    class?: string;
    children?: import("svelte").Snippet;
  } = $props();
</script>

<div class="card {p.class ?? ''}">
  <div class="card-header">
    <h3>{p.title}</h3>
    {#if p.status}
      <div class="status-section">
        <span class="status-indicator {p.statusType ?? 'inactive'}"
          >{p.status}</span
        >
      </div>
    {/if}
  </div>

  <div class="card-content">
    {@render p.children?.()}
  </div>
</div>

<style>
  .card {
    background: var(--bg-card);
    border: 1px solid rgba(15, 34, 48, 0.05);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    box-shadow: var(--shadow-subtle);
    transition:
      transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1),
      box-shadow 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .card:focus-within,
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-soft);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid rgba(15, 34, 48, 0.08);
  }

  .card-header h3 {
    margin: 0;
    font-family: var(--font-family);
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    letter-spacing: 1px;
  }

  .status-section {
    display: flex;
    align-items: center;
  }

  .status-indicator {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-family: var(--font-family);
    font-weight: var(--font-weight-bold);
    border: 1px solid transparent;
  }

  .status-indicator.active {
    background: rgba(240, 138, 119, 0.1);
    color: var(--coral);
    border-color: var(--coral);
  }

  .status-indicator.inactive {
    background: rgba(154, 166, 178, 0.05);
    color: var(--muted);
    border-color: rgba(154, 166, 178, 0.2);
  }

  .status-indicator.warning {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
    border-color: #ffc107;
  }

  .status-indicator.error {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border-color: #dc3545;
  }

  .card-content {
    min-height: 200px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .card {
      padding: var(--space-sm);
    }
  }

  @media (max-width: 480px) {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
    }
  }
</style>
