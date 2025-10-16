# CSS Style Guide

## Design System Overview

This style guide defines the visual design system for the Personal Assistant calendar application, focusing on colors, typography, and consistent styling patterns.

## Color Palette

### Primary Colors
```css
/* Background Colors - Dark Theme */
--bg-primary: #3A3A3A;           /* Main background (darker) */
--bg-secondary: rgba(66, 66, 66, 1);  /* Header background */
--bg-tertiary: rgba(74, 74, 74, 1);   /* Details background (lighter dark) */
--bg-legend: rgba(60, 60, 60, 1);     /* Legend background */
--bg-card: rgba(82, 82, 82, 1);       /* Card backgrounds (slightly lighter) */

/* Text Colors */
--text-primary: rgba(255, 255, 255, 1);    /* Main text */
--text-secondary: rgba(255, 255, 255, .3); /* Muted text */
--text-tertiary: rgba(255, 255, 255, .5);  /* Day name text */
--text-today: rgba(156, 202, 235, 1);      /* Today highlight */

/* Event Category Colors */
--event-blue: rgba(156, 202, 235, 1);   /* Blue events */
--event-orange: rgba(247, 167, 0, 1);   /* Orange events */
--event-green: rgba(153, 198, 109, 1);  /* Green events */
--event-yellow: rgba(249, 233, 0, 1);   /* Yellow events */

/* UI Element Colors */
--ui-arrow: rgba(160, 159, 160, 1);     /* Navigation arrows */
--ui-empty: #eee;                       /* Empty state text */
```

### Legacy Colors (Keep for compatibility)
```css
--white: #ffffff;
--navy-700: #1e293b;
--coral: #f08a77;
--primary: #00c8ff;
--muted: #64748b;
--glass-border: rgba(255, 255, 255, 0.1);
```

## Typography

### Font Family
```css
--font-family: 'HelveticaNeue-UltraLight', 'Helvetica Neue UltraLight', 'Helvetica Neue', Arial, Helvetica, sans-serif;
```

### Font Weights
```css
--font-weight-light: 100;    /* UltraLight weight */
--font-weight-normal: 400;   /* Normal weight */
--font-weight-bold: 600;     /* Bold weight */
```

### Font Sizes
```css
--fs-xs: 9px;        /* Day names, small labels */
--fs-sm: 13px;       /* Legend entries */
--fs-md: 16px;       /* Event text */
--fs-lg: 18px;       /* Header titles (smaller) */
--fs-xl: 16px;       /* Day numbers (smaller) */
```

### Letter Spacing
```css
--letter-spacing-sm: 0.5px;   /* Event text */
--letter-spacing-md: 0.7px;   /* Day names */
--letter-spacing-lg: 1px;     /* Header titles */
--letter-spacing-xl: 1.5px;   /* Day numbers */
```

### Border Radius
```css
/* Less rounded corners */
--radius-lg: 12px;    /* Large radius */
--radius-md: 8px;     /* Medium radius */
--radius-sm: 4px;     /* Small radius */
```

## Layout & Spacing

### Box Model
```css
*, *:before, *:after {
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}
```

### Spacing Scale
```css
--space-xs: 3px;     /* Minimal spacing */
--space-sm: 5px;     /* Small spacing */
--space-md: 7px;     /* Medium spacing */
--space-lg: 10px;    /* Large spacing */
--space-xl: 16px;    /* Extra large spacing */
```

### Component Dimensions
```css
--calendar-width: 420px;
--calendar-height: 570px;
--header-height: 50px;
--day-width: 60px;
--legend-height: 30px;
--details-height: 75px;
```

## Form Elements

### Input Fields
```css
.form-group input {
  width: 100%;
  padding: var(--space-sm);
  border: 2px solid rgba(15, 34, 48, 0.1);
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 500;
  background: var(--white);
  color: var(--navy-700);
  font-family: var(--font-family);
  transition: all 0.18s ease;
}

.form-group input:focus {
  border-color: var(--coral);
  background: rgba(240, 138, 119, 0.05);
  outline: none;
}
```

### Buttons
```css
.time-switch {
  flex: 1;
  padding: var(--space-sm) var(--space-xs);
  border: 2px solid rgba(15, 34, 48, 0.1);
  border-radius: 999px;
  background: var(--white);
  color: var(--navy-700);
  font-family: var(--font-family);
  font-size: var(--fs-xs);
  font-weight: 500;
  transition: all 0.18s ease;
  cursor: pointer;
}

.time-switch.active {
  background: var(--coral);
  color: var(--white);
  border-color: var(--coral);
}
```

### Inline Form Fields
```css
.inline-field {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.inline-field label {
  font-size: var(--fs-xs);
  font-weight: 500;
  color: var(--navy-700);
  white-space: nowrap;
  min-width: fit-content;
}

.inline-field input {
  flex: 1;
  min-width: 0;
}
```

## Calendar Components

### Day Cells
```css
.day {
  display: inline-block;
  width: 60px;
  padding: 10px;
  text-align: center;
  vertical-align: top;
  cursor: pointer;
  background: var(--bg-primary);
  position: relative;
  z-index: 100;
}

.day-number {
  font-size: 24px;
  letter-spacing: 1.5px;
}

.day-name {
  font-size: 9px;
  text-transform: uppercase;
  margin-bottom: 5px;
  color: var(--text-tertiary);
  letter-spacing: .7px;
}
```

### Event Indicators
```css
.day .day-events span {
  vertical-align: top;
  display: inline-block;
  padding: 0;
  margin: 0;
  width: 5px;
  height: 5px;
  line-height: 5px;
  margin: 0 1px;
}

.blue { background: var(--event-blue); }
.orange { background: var(--event-orange); }
.green { background: var(--event-green); }
.yellow { background: var(--event-yellow); }
```

### Event Details
```css
.details {
  position: relative;
  width: 420px;
  height: 75px;
  background: var(--bg-tertiary);
  margin-top: 5px;
  border-radius: 4px;
}

.event {
  font-size: 16px;
  line-height: 22px;
  letter-spacing: .5px;
  padding: 2px 16px;
  vertical-align: top;
}
```

## Animations

### Keyframe Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
}

@keyframes moveFromTopFade {
  from { 
    opacity: .3; 
    height: 0px; 
    margin-top: 0px; 
    transform: translateY(-100%); 
  }
}

@keyframes moveToTopFade {
  to { 
    opacity: .3; 
    height: 0px; 
    margin-top: 0px; 
    transform: translateY(-100%); 
  }
}
```

### Animation Classes
```css
.month.new {
  animation: fadeIn 1s ease-out;
  opacity: 1;
}

.details.in {
  animation: moveFromTopFade .5s ease both;
}

.events.in {
  animation: fadeIn .3s ease both;
  animation-delay: .3s;
}
```

## Responsive Design

### Touch Interactions
```css
body {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

### Hardware Acceleration
```css
#calendar {
  -webkit-transform: translate3d(0, 0, 0);
  -moz-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}
```

## Naming Conventions

### CSS Classes
- Use kebab-case for class names: `.time-switch`, `.inline-field`
- Use descriptive names: `.event-details`, `.day-events`
- Prefix component-specific styles: `.calendar-*`, `.event-*`

### CSS Variables
- Use descriptive names with prefixes: `--bg-primary`, `--text-secondary`
- Group related variables: `--event-*`, `--space-*`, `--fs-*`

### Component Structure
```css
/* Component Container */
.component-name {
  /* Layout properties */
  /* Background and borders */
  /* Typography */
  /* Spacing */
}

/* Component States */
.component-name:hover { }
.component-name.active { }
.component-name.disabled { }

/* Component Children */
.component-name .child-element { }
.component-name .child-element:hover { }
```

## Best Practices

1. **Consistency**: Use the defined color palette and typography scale
2. **Performance**: Use hardware acceleration for animations
3. **Accessibility**: Ensure sufficient color contrast
4. **Maintainability**: Use CSS variables for reusable values
5. **Responsive**: Design for touch interactions and mobile-first
6. **Animations**: Keep animations smooth and purposeful