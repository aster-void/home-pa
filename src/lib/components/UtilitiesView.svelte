<script lang="ts">
  import { TransitCard } from "./util_components/index.js";
</script>

<div class="utilities-view">
  <div class="utilities-header">
    <h2>Utilities</h2>
    <p class="utilities-subtitle">
      Helpful tools and widgets for your daily tasks
    </p>
  </div>

  <div class="utilities-content">
    <!-- Transit Card -->
    <div class="utility-section">
      <TransitCard />
    </div>

    <!-- Future utility components will be added here -->
    <div class="coming-soon">
      <div class="coming-soon-icon">🔧</div>
      <h3>More Utilities Coming Soon</h3>
      <p>
        Weather, News, Calculator, and more utility widgets will be added here.
      </p>
    </div>
  </div>
</div>

<style>
  .utilities-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-lg);
    min-height: calc(100vh - 120px);
    overflow-y: auto;
    max-height: calc(100vh - 120px);
    scrollbar-width: thin;
    scrollbar-color: var(--coral) transparent;
  }

  .utilities-view::-webkit-scrollbar {
    width: 8px;
  }

  .utilities-view::-webkit-scrollbar-thumb {
    background: var(--coral);
    border-radius: 4px;
  }

  .utilities-view::-webkit-scrollbar-track {
    background: transparent;
  }

  .utilities-header {
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid rgba(15, 34, 48, 0.08);
  }

  .utilities-header h2 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-xl);
    font-weight: var(--font-weight-bold);
    color: var(--navy-900);
  }

  .utilities-subtitle {
    margin: 0;
    color: var(--muted);
    font-size: var(--fs-md);
  }

  .utilities-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .utility-section {
    flex-shrink: 0;
  }

  .coming-soon {
    text-align: center;
    padding: 3rem 2rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--muted);
  }

  .coming-soon-icon {
    font-size: 3rem;
    margin-bottom: var(--space-md);
  }

  .coming-soon h3 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text);
  }

  .coming-soon p {
    margin: 0;
    font-size: var(--fs-md);
    line-height: 1.5;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .utilities-view {
      padding: var(--space-md);
    }

    .utilities-header {
      margin-bottom: var(--space-md);
    }

    .utilities-content {
      gap: var(--space-md);
    }

    .coming-soon {
      padding: 2rem 1rem;
    }
  }
</style>
