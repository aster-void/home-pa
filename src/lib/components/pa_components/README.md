# Personal Assistant Components

This folder contains all the modular components for the Personal Assistant functionality. The architecture is designed to be easily extensible for future features.

## Structure

```
pa_components/
├── BaseCard.svelte           # Reusable base card component
├── FreeTimeGapsCard.svelte   # Free time gaps functionality
├── SmartSuggestionsCard.svelte # Smart suggestions functionality
├── index.ts                  # Clean exports for easy importing
└── README.md                 # This documentation
```

## Components

### BaseCard.svelte
A reusable base component that provides consistent styling and structure for all PA cards.

**Props:**
- `title: string` - The card title
- `status?: string` - Optional status text
- `statusType?: 'active' | 'inactive' | 'warning' | 'error'` - Status indicator type
- `class?: string` - Additional CSS classes

**Usage:**
```svelte
<BaseCard title="My Card" status="Active" statusType="active">
  <!-- Card content goes here -->
</BaseCard>
```

### FreeTimeGapsCard.svelte
Displays free time gaps with statistics, day boundary configuration, and gap list.

**Features:**
- Real-time gap calculation
- Day boundary editing
- Gap statistics (total time, count, largest gap)
- Visual status indicators (past/current/future)
- Responsive design

### SmartSuggestionsCard.svelte
Shows AI-powered suggestions based on available free time.

**Props:**
- `controller: AppController` - The app controller for suggestion management

**Features:**
- Real-time suggestion display
- Status indicators (active/inactive)
- Action buttons (Accept, Reject, Later, Dismiss)
- Responsive button layout

## Adding New Components

To add a new Personal Assistant feature:

1. **Create the component file:**
   ```bash
   touch src/lib/components/pa_components/NewFeatureCard.svelte
   ```

2. **Use BaseCard as the foundation:**
   ```svelte
   <script lang="ts">
     import BaseCard from './BaseCard.svelte';
     
     // Your component logic here
   </script>
   
   <BaseCard title="New Feature" status="Ready" statusType="active">
     <!-- Your feature content -->
   </BaseCard>
   ```

3. **Export from index.ts:**
   ```typescript
   export { default as NewFeatureCard } from './NewFeatureCard.svelte';
   ```

4. **Import in PersonalAssistantView.svelte:**
   ```svelte
   import { NewFeatureCard } from './pa_components/index.js';
   ```

5. **Add to the grid layout:**
   ```svelte
   <div class="overview-section">
     <FreeTimeGapsCard />
     <SmartSuggestionsCard {controller} />
     <NewFeatureCard />
   </div>
   ```

## Design Principles

- **Modularity**: Each feature is a self-contained component
- **Consistency**: All components use BaseCard for uniform styling
- **Futuristic Design**: Glass panels, neon glows, and sci-fi aesthetics
- **Responsiveness**: All components adapt to different screen sizes
- **Accessibility**: Proper contrast, touch targets, and semantic HTML
- **Performance**: Minimal re-renders with Svelte 5 runes

## Design System

The components use a futuristic design system with:

- **Color Palette**: Deep space background (`#07090e`) with electric cyan (`#00c8ff`) primary
- **Typography**: Display fonts (Orbitron, Rajdhani) for headings, Inter for body text
- **Glass Panels**: Semi-transparent backgrounds with backdrop blur effects
- **Neon Effects**: Subtle glows and shadows for interactive elements
- **High Contrast**: Excellent readability with proper color contrast ratios

## Future Components Ideas

- `TaskManagerCard.svelte` - Task and todo management
- `ProductivityAnalyticsCard.svelte` - Usage analytics and insights
- `HabitTrackerCard.svelte` - Habit tracking and streaks
- `GoalTrackerCard.svelte` - Goal setting and progress tracking
- `TimeBlockingCard.svelte` - Time blocking and focus sessions
- `WellnessReminderCard.svelte` - Break reminders and wellness tips
