# M1 Core - Usage Guide

## Overview

This is the M1 (MVP Core) implementation of home-pa, featuring the minimal "input → suggestion → reaction → log" loop with native Svelte stores for optimal performance and reactivity.

## Features

### 📅 Calendar Management

- **Create Events**: Add new calendar events with flexible timing options
  - **All-day events**: Can span multiple days, stored as date-only
  - **Some-timing events**: Single day events without specific times
  - **Timed events**: Events with specific start/end times
  - **🆕 Recurring Events**: Create events that repeat with RRULE support
- **Edit Events**: Modify existing events with form pre-population
- **Delete Events**: Remove events with confirmation dialog
- **View Modes**: Switch between day view (selected date) and list view (all events)
- **Timeline View**: Visual timeline showing timed events and all-day events
- **Date Navigation**: Navigate between different days with keyboard shortcuts
- **Smart Validation**: Prevents creating events in the past or with invalid times
- **🆕 Sliding Window**: Efficient 7-month window for recurring events
- **🆕 Forever Events**: Special handling for events with no end date (∞ indicator)

### 📝 Memo Management

- **Simple Memos**: Create and manage text-based memos
- **Edit/Delete**: Full CRUD operations for memos
- **Clean Interface**: Single input field for easy note-taking
- **Instant Updates**: Real-time UI updates when memos are modified

### 💡 Smart Suggestions

- **Gap Detection**: Automatically detects free time between events (30+ minutes)
- **Smart Proposals**: Suggests productive activities for available time
- **Reaction Tracking**: Accept, reject, or mark suggestions for later
- **Auto-trigger**: New suggestions appear when returning to calendar view
- **Positioned UI**: Suggestion panel positioned at bottom-right corner

### 📊 Activity Logs

- **Track Reactions**: View history of all suggestion interactions
- **Time Analysis**: See how much free time you had and how you used it
- **Simple Format**: Clean, easy-to-read log entries with timestamps
- **Real-time Updates**: Logs update immediately when reactions are recorded

## Getting Started

### Development Setup

```bash
# Start the database (optional - app works without it)
./scripts/up.sh

# Install dependencies
bun install

# Start development server
bun dev
```

The app will be available at `http://localhost:3000`

### Quick Start

1. **Create Events**: Fill out the event form and click "作成" (Create)
2. **View Events**: Switch between "日表示" (Day View) and "リスト表示" (List View)
3. **Get Suggestions**: Return to calendar view to trigger suggestions for free time
4. **React to Suggestions**: Use the suggestion panel buttons to accept/reject/later
5. **View Logs**: Check the "ログ" (Logs) tab to see your suggestion history

## Architecture

### Svelte 5 Runes

- Uses modern Svelte 5 syntax with `$state`, `$derived`, and `$props`
- Controller pattern for clean separation of concerns
- Reactive state management without legacy patterns
- Function-based derived states for proper reactivity

### Native Svelte Stores

- **Reactive by Default**: Svelte stores provide automatic reactivity
- **Optimal Performance**: Only affected components re-render
- **Clean Architecture**: Standard Svelte patterns for data management
- **In-Memory Storage**: All data stored in memory (no database required)
- **Perfect for MVP**: Easy to extend to persistent storage later
- **Type Safe**: Full TypeScript support with proper inference

### Component Structure

```
src/lib/
├── types.ts                    # TypeScript interfaces
├── stores/
│   └── data.ts                # Svelte stores for reactive data
├── services/
│   └── suggestion.ts          # Suggestion logic & gap detection
├── controllers/
│   └── app.controller.svelte.ts  # Main app controller with runes
└── components/
    ├── Navigation.svelte      # Top navigation
    ├── CalendarView.svelte    # Calendar management with form
    ├── MemoView.svelte        # Memo management
    ├── LogsView.svelte        # Activity logs display
    └── SuggestionPanel.svelte # Smart suggestions (bottom-right)
```

## Key Specifications Met

✅ **Minimal CRUD**: Events and memos with full CRUD operations  
✅ **Gap Time Detection**: 30+ minute threshold for suggestions  
✅ **Fixed Templates**: Simple, predefined suggestion messages  
✅ **Reaction Tracking**: Accept/reject/later responses with logging  
✅ **Memory Storage**: No database required - perfect for MVP  
✅ **Clean UI**: Three main views with simple navigation  
✅ **End-to-End Flow**: Input → Suggestion → Reaction → Log  
✅ **Reactive Updates**: Instant UI updates when data changes  
✅ **Form Validation**: Smart validation prevents invalid data  
✅ **Suggestion Triggers**: Auto-suggestions when returning to calendar  
✅ **Native Stores**: Uses Svelte stores for optimal performance  
✅ **Type Safety**: Full TypeScript support throughout  
✅ **🆕 Recurring Events**: RRULE support with sliding window system  
✅ **🆕 Forever Events**: Special handling for events with no end date  
✅ **🆕 Memory Efficiency**: 7-month sliding window prevents memory bloat  
✅ **🆕 Visual Indicators**: ∞ symbol for forever events, debug panel

## Data Flow

1. **User Input**: Creates events/memos through forms
2. **Svelte Stores**: Data stored in reactive writable/derived stores
3. **Operations**: Store operations handle CRUD with automatic reactivity
4. **UI Components**: Subscribe to stores and auto-update when data changes
5. **Suggestions**: Triggered by gap detection or calendar navigation
6. **Logging**: All suggestion reactions are recorded with timestamps

## Store Architecture

### Base Stores

```typescript
// Writable stores for raw data
export const events = writable<Event[]>([]);
export const memos = writable<Memo[]>([]);
export const suggestionLogs = writable<SuggestionLog[]>([]);
export const selectedDate = writable<Date>(new Date());
```

### Store Operations

```typescript
// Clean CRUD operations with automatic reactivity
export const eventOperations = {
  create(event) {
    /* Updates store automatically */
  },
  update(id, updates) {
    /* Updates store automatically */
  },
  delete(id) {
    /* Updates store automatically */
  },
};
```

### Derived Stores

```typescript
// Computed values that update automatically
export const todaysEvents = derived(
  [events, selectedDate],
  ([$events, $selectedDate]) => {
    return $events.filter(event => /* filter logic */);
  }
);
```

### Component Usage

```svelte
<script>
  import { events, todaysEvents } from "../stores/data.js";
</script>

<!-- Automatic reactivity - no manual triggers needed -->
{#each $events as event}
  <div>{event.title}</div>
{/each}
```

## Usage Patterns

### Creating Events

1. Navigate to Calendar view
2. Fill in event title
3. Choose event type:
   - **終日 (All-day)**: Shows 00:00-23:59, can span multiple days
   - **どこかのタイミングで (Some-timing)**: Single day, no specific time
   - **Time fields**: Manually edit times to create timed events
4. Set start/end dates as needed
5. Click "作成" (Create) button
6. Event appears immediately in the list and timeline

### Getting Suggestions

- **Automatic**: Suggestions appear when returning to calendar view
- **Gap-based**: Only shows for 30+ minutes of free time
- **Always Available**: Shows default suggestion if no events exist

### Managing Memos

1. Navigate to Memo view
2. Type memo text and click "追加" (Add)
3. Edit existing memos by clicking "編集" (Edit)
4. Delete memos with "削除" (Delete) button

### Viewing Logs

- Navigate to Logs view to see all suggestion interactions
- Each log entry shows: timestamp, gap time, reaction type
- Logs update in real-time as you react to suggestions

## Current Implementation Status

### ✅ Fully Implemented

- Event CRUD with form validation
- Memo CRUD operations
- Suggestion system with gap detection
- Reaction logging and display
- Native Svelte stores with automatic reactivity
- Day/List view modes for calendar
- Form reset with proper default times
- Japanese UI with proper error messages

### 🔧 Technical Features

- **Svelte 5 Runes**: Modern reactive patterns with `$state`, `$derived`
- **Native Svelte Stores**: `writable`, `derived` for optimal performance
- **Store Operations**: Clean CRUD operations with automatic reactivity
- **TypeScript**: Full type safety with proper inference
- **Component Architecture**: Direct store subscriptions for instant updates
- **No External Dependencies**: Pure Svelte implementation

## Future Enhancements (Out of Scope for M1)

- LLM integration for dynamic suggestions
- External API integrations (weather, transit)
- Push notifications
- Data persistence (database integration)
- ~~Advanced calendar features (recurring events, reminders)~~ ✅ **COMPLETED**
- User authentication and multi-user support
- Mobile app version
- Offline support

## Technical Notes

- **Built with**: SvelteKit + TypeScript + Svelte 5 runes
- **Package Manager**: Bun for fast development
- **Styling**: Tailwind CSS with custom components
- **Architecture**: Controller pattern with native Svelte stores
- **State Management**: Svelte stores (`writable`, `derived`) for optimal reactivity
- **Data Operations**: Store-based CRUD operations with automatic UI updates
- **Validation**: Client-side validation with user-friendly error messages
- **Performance**: Only affected components re-render when data changes
- **Development**: Hot module reloading with Vite
