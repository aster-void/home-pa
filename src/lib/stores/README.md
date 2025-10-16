# Store Architecture

This directory contains the centralized state management for the Personal Assistant application using Svelte stores as the single source of truth.

## 🏗️ Architecture Overview

The store architecture is organized into three main categories:

```
src/lib/stores/
├── README.md                 # This file - architecture documentation
├── ui.ts                     # UI state (views, modes, panels)
├── forms/                    # Form state management
│   ├── eventForm.ts         # Event creation/editing form
│   └── memoForm.ts          # Memo creation/editing form
├── actions/                  # Business logic and operations
│   ├── eventActions.ts      # Event CRUD operations
│   ├── memoActions.ts       # Memo CRUD operations
│   ├── uiActions.ts         # UI navigation and state changes
│   └── suggestionActions.ts # Suggestion system operations
├── data.ts                   # Core data stores (events, memos, etc.)
├── gaps.ts                   # Gap-finding store
├── recurrence.store.ts       # Recurring events store
└── toast.ts                  # Toast notifications store
```

## 📁 File Responsibilities

### **UI State (`ui.ts`)**
- **Purpose**: Manages UI state that affects the overall application layout
- **Contains**: Current view, view mode, panel states, navigation state
- **Usage**: Components subscribe to these stores to react to UI changes
- **Example**: `currentView`, `viewMode`, `isMemoOpen`

### **Form State (`forms/`)**
- **Purpose**: Manages form data and validation state
- **Contains**: Form fields, validation errors, editing states
- **Usage**: Form components bind directly to these stores
- **Example**: `eventForm`, `memoForm`

### **Business Logic (`actions/`)**
- **Purpose**: Contains all business logic and operations
- **Contains**: CRUD operations, validation, data transformations
- **Usage**: Components call these functions to perform actions
- **Example**: `createEvent()`, `updateMemo()`, `navigateDate()`

### **Core Data (`data.ts`)**
- **Purpose**: Core application data stores
- **Contains**: Events, memos, suggestion logs, selected date
- **Usage**: All components access these for data display
- **Example**: `events`, `memos`, `selectedDate`

## 🔄 Data Flow

```
User Interaction → Action Function → Store Update → Component Reactivity
```

1. **User interacts** with UI (clicks button, types in form)
2. **Component calls** action function (e.g., `eventActions.create()`)
3. **Action function** validates data and updates stores
4. **Stores update** automatically trigger component re-renders
5. **UI reflects** the new state

## 🎯 Key Principles

### **1. Single Source of Truth**
- All data lives in stores
- No duplicate state between components
- Stores are the authoritative data source

### **2. Separation of Concerns**
- **UI State**: What the user sees (views, panels, modes)
- **Form State**: What the user is editing (form fields, validation)
- **Business Logic**: What the app does (CRUD, validation, transformations)
- **Core Data**: What the app stores (events, memos, etc.)

### **3. Reactive Updates**
- Components automatically update when stores change
- No manual syncing or state management
- Changes propagate automatically through the app

### **4. Action-Based Operations**
- All operations go through action functions
- Actions handle validation, business logic, and store updates
- Components just call actions - they don't manage state directly

## 📖 Usage Examples

### **Accessing UI State**
```typescript
import { currentView, viewMode } from '$lib/stores/ui.js';

// In component
$currentView // reactive value
viewActions.setView('personal-assistant') // action call
```

### **Form Management**
```typescript
import { eventForm } from '$lib/stores/forms/eventForm.js';
import { eventActions } from '$lib/stores/actions/eventActions.js';

// In component
$eventForm.title // reactive form field
eventActions.create() // submit form
```

### **Data Operations**
```typescript
import { events } from '$lib/stores/data.js';
import { eventActions } from '$lib/stores/actions/eventActions.js';

// In component
$events // reactive events array
eventActions.delete(eventId) // delete event
```

## 🚀 Benefits

- **Simpler Components**: Components just subscribe to stores and call actions
- **Automatic Updates**: UI updates automatically when data changes
- **Better Testing**: Actions are pure functions, easy to test
- **Clear Separation**: UI, forms, and business logic are separate
- **No Sync Issues**: Single source of truth eliminates sync problems
- **Better Performance**: Direct store subscriptions are efficient

## 🔧 Development Guidelines

### **Adding New State**
1. Determine the category (UI, form, or core data)
2. Add to appropriate store file
3. Create action functions if needed
4. Update components to use new state

### **Adding New Actions**
1. Add to appropriate actions file
2. Handle validation and business logic
3. Update stores with results
4. Components call the action function

### **Component Integration**
1. Import needed stores and actions
2. Subscribe to stores with `$storeName`
3. Call actions in event handlers
4. No manual state management needed

## 🐛 Debugging

### **Store DevTools**
Enable store debugging in development:
```typescript
// In component
import { events } from '$lib/stores/data.js';
console.log('Events:', $events); // Log current state
```

### **Action Debugging**
Add logging to action functions:
```typescript
export function createEvent(data) {
  console.log('Creating event:', data);
  // ... validation and store updates
}
```

## 📚 Related Documentation

- [DATA_FLOW.md](../../docs/implementation_guide/DATA_FLOW.md) - Detailed data flow documentation
- [check_calendar.md](../../docs/implementation_guide/check_calendar.md) - Calendar system documentation
- [recurrence/README.md](../services/recurrence/README.md) - Recurrence system documentation
