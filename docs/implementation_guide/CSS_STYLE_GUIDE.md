# 🎨 HomePA Design System

## Design Philosophy

**Clean, Intelligent, Minimalist**

- White background with black text for maximum readability
- Purposeful use of color for hierarchy and interaction
- Generous whitespace for visual breathing room
- Subtle, meaningful animations only

---

## 1. Color System

**Purpose:** Maintain clarity, hierarchy, and calm neutrality with a white-on-black foundation.

### Core Colors

| Variable           | Value     | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| **--bg-primary**   | `#FFFFFF` | Main background                    |
| **--bg-secondary** | `#F8F9FA` | Secondary surfaces (cards, panels) |
| **--bg-tertiary**  | `#F1F3F5` | Elevated surfaces, sections        |
| **--bg-card**      | `#FFFFFF` | Card backgrounds                   |

### Text Colors

| Variable             | Value                  | Usage                            |
| -------------------- | ---------------------- | -------------------------------- |
| **--text-primary**   | `#000000` or `#1A1A1A` | Main readable text               |
| **--text-secondary** | `#6C757D`              | Supporting text, muted content   |
| **--text-tertiary**  | `#ADB5BD`              | Placeholder text, less important |
| **--text-today**     | `#0066CC`              | Today/current date highlight     |

### Accent Colors

| Variable               | Value             | Usage                       |
| ---------------------- | ----------------- | --------------------------- |
| **--accent-primary**   | `#F08A77` (Coral) | Primary actions, highlights |
| **--accent-secondary** | `#9CA3AF`         | Secondary actions           |
| **--accent-hover**     | `#E87862`         | Hover state for accent      |

### Event Category Colors

| Variable           | Value     | Usage                  |
| ------------------ | --------- | ---------------------- |
| **--event-blue**   | `#4A9EFF` | Blue category events   |
| **--event-orange** | `#F7A700` | Orange category events |
| **--event-green**  | `#99C66D` | Green category events  |
| **--event-yellow** | `#F9E900` | Yellow category events |

### UI Element Colors

| Variable        | Value     | Usage                        |
| --------------- | --------- | ---------------------------- |
| **--ui-arrow**  | `#9CA3AF` | Navigation arrows            |
| **--ui-border** | `#E5E7EB` | Borders, dividers            |
| **--ui-empty**  | `#F1F3F5` | Empty states                 |
| **--danger**    | `#EF4444` | Error states, delete actions |

### Rules

- **Contrast:** Maintain ≥4.5:1 contrast ratio for text (WCAG AA)
- **Color Usage:** Use accent colors sparingly—only for actions and highlights
- **Background:** Never use pure white (#FFFFFF) for large surfaces—use #F8F9FA or #FEFEFE for subtle differentiation
- **Text:** Default to black (#000000 or #1A1A1A) for maximum readability

---

## 2. Typography System

**Goal:** Refined hierarchy, spacious rhythm, clear communication.

### Font Family

```css
--font-family:
  "HelveticaNeue-UltraLight", "Helvetica Neue UltraLight", "Helvetica Neue",
  Arial, Helvetica, sans-serif;
--font-sans:
  "Inter", "Poppins", system-ui, -apple-system, "Segoe UI", Roboto,
  "Helvetica Neue", Arial;
```

- **Primary:** Helvetica Neue (UltraLight/Regular/Bold)
- **Fallback:** System fonts (Inter, Poppins, system-ui)
- **Limit to 2 font families maximum**

### Font Weights

| Weight     | Value | Usage                        |
| ---------- | ----- | ---------------------------- |
| **Light**  | `100` | Display text, large headings |
| **Normal** | `400` | Body text, default           |
| **Bold**   | `600` | Headings, emphasis           |

### Font Sizes

| Variable     | Size   | Usage                   |
| ------------ | ------ | ----------------------- |
| **--fs-xs**  | `9px`  | Day names, small labels |
| **--fs-sm**  | `13px` | Captions, metadata      |
| **--fs-md**  | `16px` | Body text, events       |
| **--fs-lg**  | `18px` | Subheadings, headers    |
| **--fs-xl**  | `20px` | Page titles             |
| **--fs-xxl** | `22px` | Hero text (rare)        |

### Typography Rules

- **Line Height:** 1.5 for body text, 1.3 for headings
- **Letter Spacing:** Normal for body, -0.02em for headings
- **Text Color:** Always use `--text-primary` for headings, `--text-secondary` for supporting text
- **Minimum Size:** Never below 14px for body text (accessibility)

---

## 3. Spacing & Scale

**Purpose:** Visual rhythm through consistent spacing units.

### Base Unit

- **Base:** `8px` (all spacing is a multiple of 8px)

### Spacing Scale

| Variable       | Value         | Usage                |
| -------------- | ------------- | -------------------- |
| **--space-xs** | `6px` (0.75×) | Tight spacing, icons |
| **--space-sm** | `12px` (1.5×) | Component padding    |
| **--space-md** | `20px` (2.5×) | Section spacing      |
| **--space-lg** | `32px` (4×)   | Large gaps, margins  |

### Spacing Rules

- **Vertical Rhythm:** Headings have 2× base unit above, 1× below
- **Component Padding:** Use `--space-sm` to `--space-md` consistently
- **Whitespace:** Err toward generous empty space—reduces cognitive load
- **Consistency:** Use variables, never magic numbers

---

## 4. Components

### Buttons

**Primary Button**

```css
background: var(--accent-primary);
color: var(--white);
padding: 10px 18px;
border-radius: var(--radius-md);
font-weight: 600;
```

**Secondary/Ghost Button**

```css
background: transparent;
border: 1px solid var(--ui-border);
color: var(--text-primary);
```

**Hover State**

- Subtle brightness shift or slight lift (`translateY(-2px)`)
- Smooth transition (≤300ms, `ease-in-out`)

**Rules:**

- Horizontal padding > vertical (visual balance)
- Minimum touch target: 44px height
- Rounded corners: `--radius-md` (8px)

### Links

- Default: `--text-primary` color
- Hover: Underline animation or color shift to accent
- No decorative icons unless functionally necessary
- Focus state: Clear outline (accessibility)

### Cards / Surfaces

```css
background: var(--bg-card);
border: 1px solid var(--ui-border);
border-radius: var(--radius-md);
box-shadow: var(--shadow-subtle);
padding: var(--space-md);
```

**Rules:**

- Border: 1px solid light gray OR soft shadow (`rgba(0,0,0,0.05)`)
- Radius: `--radius-md` (8px) for consistency
- Clear margin around content

### Navigation Elements

- Consistent height across pages (`--bottom-nav-height: 80px`)
- Text alignment balanced with icons
- Clear contrast with background
- Interaction feedback on hover/active (underline or highlight)

---

## 5. Motion & Interaction

**Principles:** Minimal, purposeful, smooth.

| Type                  | Description                                          |
| --------------------- | ---------------------------------------------------- |
| **Hover animations**  | Opacity (0.7 → 1), color shift, or scale (max 1.02×) |
| **State transitions** | `ease-in-out`, duration ≤300ms                       |
| **Feedback**          | Subtle highlight on button/toggle activation         |

**Rules:**

- Motion serves clarity, not decoration
- Avoid multiple competing animations
- Respect `prefers-reduced-motion` (disable animations)
- Default easing: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## 6. Iconography

- Simple, geometric line icons (1.5–2px stroke)
- Color matches text color (`--text-primary` or `--text-secondary`)
- Consistent corner radius and line weight
- Optically align with nearby text
- Adequate padding around icons (minimum `--space-sm`)

---

## 7. Shadows & Depth

**Purpose:** Subtle elevation hierarchy without heavy shadows.

| Level        | Shadow                        | Usage             |
| ------------ | ----------------------------- | ----------------- |
| **Base**     | `none`                        | Default elements  |
| **Elevated** | `0 2px 4px rgba(0,0,0,0.05)`  | Cards on hover    |
| **Floating** | `0 4px 12px rgba(0,0,0,0.08)` | Modals, dropdowns |
| **High**     | `0 8px 24px rgba(0,0,0,0.12)` | Overlays, modals  |

**Rules:**

- Prioritize flat design with mild elevation
- Blur radius > offset for softness
- Shadows never compete with color contrast

---

## 8. Borders & Corners

### Border Radius

| Variable        | Value  | Usage                    |
| --------------- | ------ | ------------------------ |
| **--radius-sm** | `4px`  | Small elements, inputs   |
| **--radius-md** | `8px`  | Cards, buttons (default) |
| **--radius-lg** | `12px` | Large cards, modals      |

### Borders

- **Thickness:** 1px for dividers, 2px for inputs on focus
- **Color:** `--ui-border` (#E5E7EB) for neutral borders
- **Style:** Solid, neutral gray, low opacity to blend naturally

**Rules:**

- Consistent corner radius across components
- Use radius variables, never magic numbers

---

## 9. Accessibility & Readability

### Contrast Requirements

- **Text contrast:** ≥4.5:1 (WCAG AA)
- **Large text:** ≥3:1 (WCAG AA)
- **Interactive elements:** Clear focus states

### Touch Targets

- **Minimum height:** 44px for interactive elements
- **Adequate spacing:** At least 8px between touch targets

### Focus States

```css
:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

**Rules:**

- Never convey meaning by color alone (use icons/text)
- Focus state always visible
- Font size never below 14px
- Provide text alternatives for icons

---

## 10. Transitions & States

### Default Timing

- **Duration:** 200–300ms
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` or `ease-in-out`

### State Hierarchy

| State        | Description                           |
| ------------ | ------------------------------------- |
| **Default**  | Base appearance                       |
| **Hover**    | Subtle brightness/color shift         |
| **Active**   | Pressed state (darker/lighter)        |
| **Focus**    | Keyboard navigation highlight         |
| **Disabled** | Reduced opacity (0.5), no interaction |

**Rules:**

- States clearly distinct by tone and opacity
- Never rely solely on hover for essential information (support touch)
- Disabled elements: `opacity: 0.5`, `cursor: not-allowed`

---

## 11. Implementation Checklist

When creating new components:

- [ ] Use CSS variables from design system
- [ ] Follow spacing scale (multiples of 8px)
- [ ] Ensure ≥4.5:1 text contrast
- [ ] Minimum 44px touch targets
- [ ] Include focus states
- [ ] Add hover transitions (≤300ms)
- [ ] Use consistent border radius
- [ ] Test with `prefers-reduced-motion`
- [ ] Validate with accessibility tools

---

## 12. Color Usage Examples

### Text Hierarchy

```css
.heading {
  color: var(--text-primary);
} /* #000000 */
.body {
  color: var(--text-primary);
} /* #000000 */
.caption {
  color: var(--text-secondary);
} /* #6C757D */
.meta {
  color: var(--text-tertiary);
} /* #ADB5BD */
```

### Backgrounds

```css
.page {
  background: var(--bg-primary);
} /* #FFFFFF */
.card {
  background: var(--bg-card);
} /* #FFFFFF */
.section {
  background: var(--bg-secondary);
} /* #F8F9FA */
```

### Interactive Elements

```css
.button-primary {
  background: var(--accent-primary);
  color: var(--white);
}
.link {
  color: var(--accent-primary);
}
.focus-ring {
  outline-color: var(--accent-primary);
}
```

---

_Last updated: [Current Date]_
