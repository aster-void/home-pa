# 🎨 HomePA Design System

## Design Philosophy

**Clean, Intelligent, Minimalist**

- White background with black text for maximum readability
- Purposeful use of color for hierarchy and interaction
- Generous whitespace for visual breathing room
- Subtle, meaningful animations only

## How to Use This Guide

- **Tokens first:** Color, type, spacing, radius, shadows. Reuse these; do not invent new values.
- **Primitives second:** Buttons, tags, chips, badges, icons. Combine tokens into simple building blocks.
- **Layouts next:** Stacks, grids, cards, media + text, overlays. Choose a pattern before styling.
- **Components last:** Calendar/PA cards, utilities modals, local components. Extend, don’t fork.
- **Checks:** Contrast (AA), focus states, spacing scale (8/16/24 as defaults), consistent radii (6/8/12/24), no raw hex if a token exists.

## Quick Navigation

- Design Philosophy
- Color System
- Typography System
- Spacing & Scale
- Layout Patterns
- Component Patterns (Cards, Lists, Hero/Overlay, Progress, Tags/Badges)
- Local Components
- Accessibility & Contrast Checklist
- Responsive & Density Rules
- Measurements Appendix
- Pattern Card Template
- How to Add or Change Patterns

## System Layers at a Glance

- **Tokens (What):** Color, typography, spacing, radius, shadows. Never hard-code a new value when a token exists.
- **Primitives (How):** Buttons, tags, chips, badges, icons. Built only from tokens.
- **Layouts (Where):** Stacks, grids, cards, media + text, overlays. Pick a layout pattern before styling.
- **Components (Why):** Calendar/PA cards, utilities modals, local components. Extend patterns; do not fork styles.
- **Rules of Thumb:** Prefer 8/16/24 spacing, radius 6/8/12/24, text 14/16/18 for body/headlines, contrast AA or better, focus-visible everywhere.

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
| **--success**   | `#22C55E` | Success states               |

### Glass/Frosted Effects

| Variable           | Value                         | Usage                   |
| ------------------ | ----------------------------- | ----------------------- |
| **--glass-bg**     | `rgba(255, 255, 255, 0.8)`    | Glass panel backgrounds |
| **--glass-border** | `rgba(0, 0, 0, 0.06)`         | Glass panel borders     |
| **--glass-shadow** | `0 4px 16px rgba(0,0,0,0.06)` | Glass panel shadows     |

### Legacy Compatibility Colors

| Variable       | Value/Alias             | Usage                    |
| -------------- | ----------------------- | ------------------------ |
| **--white**    | `#FFFFFF`               | White color (legacy)     |
| **--navy-900** | `#1A1A1A`               | Dark text (legacy alias) |
| **--muted**    | `var(--text-secondary)` | Secondary text (alias)   |
| **--primary**  | `#0066CC`               | Primary accent (blue)    |
| **--text**     | `var(--text-primary)`   | Text color (alias)       |
| **--panel**    | `var(--bg-secondary)`   | Panel background (alias) |
| **--bg**       | `var(--bg-secondary)`   | Page background (alias)  |

**Note:** Prefer using the primary variable names (e.g., `--text-primary` over `--text`, `--bg-secondary` over `--panel`).

### Color Depth & Opacity

**Purpose:** Create visual hierarchy through opacity and color strength variations.

#### Text Color Depth Levels

| Level | Value | Usage | Opacity |
|-------|-------|-------|---------|
| **Primary** | `#000000` | Headlines, main content | 100% |
| **Primary Soft** | `#181818` | Subtitle titles, secondary headlines | 100% |
| **Secondary** | `#666666` | Body text, descriptions | 100% |
| **Tertiary** | `rgba(102, 102, 102, 0.8)` | Metadata, timestamps, due dates | 80% |
| **Quaternary** | `rgba(102, 102, 102, 0.6)` | Very subtle metadata, timestamps, less important info | 60% |

#### Background Color Depth

| Level | Value | Usage |
|-------|-------|-------|
| **Solid** | `#FFFFFF` | Card backgrounds, primary surfaces |
| **Subtle** | `#F8F9FA` | Secondary panels, sections |
| **Muted** | `#F1F3F5` | Tertiary backgrounds, empty states |
| **Dark** | `#3C3C43` | Tag backgrounds, dark UI elements |
| **Placeholder** | `#DEDEDE` | Icon placeholders, empty image areas |

#### Color Combination Patterns

**High Contrast (Primary Content):**
- Primary text (`#000000`) on white (`#FFFFFF`) - Maximum readability
- Use for: Headlines, important content, interactive elements

**Medium Contrast (Secondary Content):**
- Secondary text (`#666666`) on white (`#FFFFFF`) - Clear but less prominent
- Use for: Body text, descriptions, supporting information

**Low Contrast (Tertiary Content):**
- Tertiary text (`rgba(102, 102, 102, 0.8)`) on white (`#FFFFFF`) - Subtle hierarchy
- Use for: Metadata, timestamps, labels, due dates

**Inverse Contrast (Tags/Badges):**
- White text (`#FFFFFF`) on dark background (`#3C3C43`) - High emphasis
- Use for: Tags, badges, status indicators, filled buttons

**Neutral Borders:**
- Light gray (`#E6E6E6`) dividers on white - Subtle separation
- Use for: Section dividers, card separators, content boundaries

#### Rules for Color Depth

- **Text Hierarchy:** Use opacity to create visual hierarchy without changing color
- **Consistency:** Stick to defined opacity levels (80%, 60%, 40%) for predictable results
- **Accessibility:** Never go below 60% opacity for readable text
- **Backgrounds:** Use solid colors for primary surfaces, subtle tints for secondary
- **Tags/Badges:** Dark backgrounds (`#3C3C43`) with white text for emphasis

### Rules

- **Contrast:** Maintain ≥4.5:1 contrast ratio for text (WCAG AA)
- **Color Usage:** Use accent colors sparingly—only for actions and highlights
- **Background:** Never use pure white (#FFFFFF) for large surfaces—use #F8F9FA or #FEFEFE for subtle differentiation
- **Text:** Default to black (#000000 or #1A1A1A) for maximum readability
- **Opacity:** Use consistent opacity levels (80%, 60%) for tertiary text to maintain hierarchy

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
--font-mono:
  "Source Code Pro", "SF Mono", "Monaco", "Consolas", monospace;
```

- **Primary:** Helvetica Neue (UltraLight/Regular/Bold)
- **Monospace:** Source Code Pro (for UI components, labels, metadata)
- **Fallback:** System fonts (Inter, Poppins, system-ui)
- **Limit to 2-3 font families maximum**

### Font Weights

| Weight     | Value | Usage                                    |
| ---------- | ----- | ---------------------------------------- |
| **Light**  | `100` | Display text, large headings             |
| **Normal** | `400` | Body text, default, descriptions         |
| **Medium** | `500` | Headlines, emphasized content            |
| **Semibold**| `600` | Strong emphasis, time displays           |

### Font Sizes

| Variable     | Size   | Line Height | Usage                              |
| ------------ | ------ | ----------- | ---------------------------------- |
| **--fs-xxs** | `10px` | `13px`      | Logo labels, tiny text, icon labels|
| **--fs-xs**  | `9px`  | `12px`      | Day names, small labels            |
| **--fs-sm**  | `12px` | `15px`      | Captions, metadata, tags, timestamps, subheads|
| **--fs-base-sm**| `13px` | `16px`  | Small body text, compact descriptions |
| **--fs-md**  | `14px` | `18px`      | Body text, descriptions, subtitles |
| **--fs-base**| `16px` | `20px`      | Medium headlines, section titles    |
| **--fs-lg**  | `18px` | `23px`      | Headlines, subheadings, headers    |
| **--fs-xl**  | `20px` | `26px`      | Page titles                        |
| **--fs-xxl** | `22px` | `28px`     | Hero text (rare)                   |
| **--fs-display**| `24px` | `30px`  | Large numbers, display text, large headlines |
| **--fs-display-lg**| `24.5px` | `31px`  | Large numbers in progress circles   |
| **--fs-display-xl**| `32px` | `40px`  | Extra large numbers, prominent displays |

### Typography Patterns

#### Headline Pattern

```css
.headline {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 500; /* Medium */
  font-size: 18px;
  line-height: 23px; /* identical to box height */
  display: flex;
  align-items: center;
  color: #000000;
}
```

#### Body Text Pattern

```css
.body-text {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400; /* Normal */
  font-size: 14px;
  line-height: 18px;
  display: flex;
  align-items: center;
  color: #666666; /* Standard body text */
  /* OR */
  color: #3C3C43; /* Darker variant for emphasis */
}
```

**Color Variations:**
- **Standard:** `#666666` - Default body text, descriptions
- **Darker:** `#3C3C43` - Emphasized descriptions, important content

#### Metadata/Timestamp Pattern

```css
.metadata {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400; /* Normal */
  font-size: 12px;
  line-height: 15px; /* identical to box height */
  display: flex;
  align-items: center;
  letter-spacing: -0.04em;
  color: rgba(102, 102, 102, 0.8); /* 80% opacity */
}
```

#### Time Display Pattern

```css
.time-display {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 600; /* Semibold */
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  color: #000000;
}
```

#### Subtitle Title Pattern

```css
.subtitle-title {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 500; /* Medium */
  font-size: 14px;
  line-height: 18px;
  display: flex;
  align-items: center;
  color: #181818; /* Slightly softer than pure black */
}
```

#### Medium Headline Pattern (16px)

```css
.medium-headline {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 500; /* Medium */
  font-size: 16px;
  line-height: 20px;
  display: flex;
  align-items: center;
  color: #000000;
}
```

**Usage:** Section titles, medium-level headings, card subheadings

#### Semibold Title Pattern (14px)

```css
.semibold-title {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 600; /* Semibold */
  font-size: 14px;
  line-height: 18px;
  display: flex;
  align-items: center;
  color: #181818; /* Slightly softer than pure black */
}
```

**Usage:** List item titles, emphasized section titles, item labels

#### Small Text Pattern (Logo/Icon Labels)

```css
.small-text {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400; /* or 500 for emphasis */
  font-size: 10px;
  line-height: 13px;
  display: flex;
  align-items: center;
  color: #3C3C43; /* or #666666 for secondary */
}
```

#### Subhead Pattern

```css
.subhead {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  display: flex;
  align-items: center;
  color: rgba(102, 102, 102, 0.8); /* 80% opacity */
}
```

**Usage:** Subheadings below headlines, secondary information, metadata

#### Version Label Pattern

```css
.version-label {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #666666;
}
```

**Usage:** Version numbers, release labels, metadata labels above headlines

#### Subhead Pattern (16px)

```css
.subhead-16 {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  display: flex;
  align-items: center;
  color: #3C3C43; /* Darker than standard subhead */
}
```

**Usage:** Larger subheadings, prominent secondary text, emphasized subtitles

#### Compact Body Text Pattern (13px)

```css
.compact-body {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #666666;
}
```

**Usage:** Compact descriptions, tight layouts, space-constrained content

### Letter Spacing

| Usage | Value | Example |
|-------|-------|---------|
| **Default** | `normal` | Body text, headlines |
| **Tight** | `-0.04em` | Metadata, timestamps, due dates |
| **Medium** | `0.04em` | Headlines with spacing, emphasized text |
| **Loose** | `0.08em` | Uppercase labels, small text, name labels |

### Text Alignment Patterns

| Alignment | Value | Usage |
|-----------|-------|-------|
| **Left** | `text-align: left` or `align-items: flex-start` | Default for most content |
| **Center** | `text-align: center` or `align-items: center` | Centered text, date displays, numbers |
| **Right** | `text-align: right` or `align-items: flex-end` | Timestamps, due dates, right-aligned metadata |

**Usage Examples:**
- **Centered:** Date displays, month names, day numbers, icon labels
- **Right-Aligned:** Timestamps, due dates, metadata on right edge
- **Left-Aligned:** Headlines, body text, descriptions (default)

### Typography Rules

- **Line Height:** Match line-height to font size for tight layouts (e.g., 18px font = 23px line-height)
- **Letter Spacing:** Use `-0.04em` for metadata and timestamps, `0.04em` for emphasized text, `0.08em` for uppercase labels
- **Text Color:** Use `#000000` for headlines, `#666666` for body, `rgba(102, 102, 102, 0.8)` for metadata, `rgba(102, 102, 102, 0.6)` for subtle text
- **Font Family:** Use Source Code Pro for UI components, Helvetica Neue for body content
- **Font Weight:** Use 400 (normal) for body text, 500 (medium) for headlines, 600 (semibold) for emphasis
- **Minimum Size:** Never below 12px for readable text (accessibility)
- **Alignment:** Use `display: flex; align-items: center` for consistent vertical alignment
- **Text Transform:** Use `text-transform: uppercase` with `letter-spacing: 0.08em` for uppercase labels

---

## 3. Spacing & Scale

**Purpose:** Visual rhythm through consistent spacing units.

### Base Unit

- **Base:** `8px` (all spacing is a multiple of 8px)
- **Secondary Base:** `2px` for fine adjustments (dividers, borders)

### Spacing Scale

| Variable       | Value         | Usage                                    |
| -------------- | ------------- | ---------------------------------------- |
| **--space-xs** | `6px` (0.75×) | Tight spacing, icon padding, tag padding |
| **--space-sm** | `8px` (1×)    | Small gaps, tight component spacing      |
| **--space-md** | `10px` (1.25×)| Content gaps, form field spacing         |
| **--space-base**| `12px` (1.5×) | Standard component padding, gaps         |
| **--space-lg** | `16px` (2×)   | Section spacing, card content gaps       |
| **--space-xl** | `18px` (2.25×)| Large content gaps, stacked sections     |
| **--space-xxl**| `24px` (3×)   | Card padding, major section spacing      |
| **--space-xxxl**| `32px` (4×)  | Large margins, hero spacing              |
| **--space-huge**| `48px` (6×)  | Major layout gaps, wide component spacing|

### Gap Values (Flexbox/Grid)

Common gap values used in auto-layout patterns:

| Gap Value | Usage                                    |
|-----------|------------------------------------------|
| `2px`     | Very tight spacing, label-headline pairs |
| `4px`     | Tight spacing, subtitle sections        |
| `6px`     | Tight icon-text spacing, tag content     |
| `8px`     | Standard content gaps, form fields       |
| `9px`     | Custom spacing for header sections, tight gaps |
| `10px`    | Card content spacing, section gaps       |
| `12px`    | Component spacing, stacked elements      |
| `16px`    | Section spacing, card content sections   |
| `17px`    | Custom spacing for specific layouts      |
| `18px`    | Large content gaps, major sections        |
| `19px`    | Custom spacing for content sections       |
| `21px`    | Custom spacing for button groups, content sections |
| `24px`    | Card padding, wide spacing               |
| `25px`    | Medium-wide spacing for icon groups      |
| `28px`    | Custom spacing for card sections         |
| `32px`    | Large section spacing, major content gaps, layout gaps |
| `40px`    | Wide spacing for compact layouts, version-label pairs |
| `42px`    | Wide spacing for logo/name rows          |
| `48px`    | Major layout gaps, wide component spacing|
| `144px`   | Ultra wide spacing for icon-text groups in columns |
| `55px`    | Extra wide spacing for parts/segments   |
| `56px`    | Wide spacing for content separation     |
| `64px`    | Very wide spacing for icon-content pairs|
| `88px`    | Very wide spacing for content separation |
| `96px`    | Extra wide spacing for large layouts    |
| `122px`   | Ultra wide spacing for headline-image  |
| `128px`   | Maximum wide spacing for content blocks |
| `154px`   | Extreme wide spacing for intro sections |
| `185px`   | Ultra wide spacing for headline-progress pairs |
| `225px`   | Maximum spacing for logo rows           |
| `232px`   | Extreme spacing for name-timestamp pairs |
| `240px`   | Maximum spacing for tags rows           |
| `320px`   | Ultra wide spacing for content separation |
| `348px`   | Maximum spacing for segments/parts      |

### Padding Patterns

| Pattern | Value | Usage |
|---------|-------|-------|
| **Card Padding** | `16px 24px` | Standard card content padding |
| **Card Padding Large** | `18px 24px` | Larger cards, prominent content, custom padding |
| **Card Padding XL** | `24px` | Hero cards, featured content |
| **Card Padding Large Top** | `32px 24px` | Large top padding, prominent cards |
| **Card Padding Extra Large Top** | `48px 24px` | Extra large top padding, hero sections |
| **Card Padding Hero** | `96px 24px` | Hero top padding, side-by-side layouts |
| **Card Padding Asymmetric** | `48px 24px 24px` | Extra top padding with standard bottom |
| **Card Padding Wide** | `24px 32px` | Wide horizontal padding for sidebars |
| **Tag Padding** | `6px 8px` or `8px` | Tag/badge internal spacing |
| **Tag Padding Compact** | `6px 16px` | Compact tags (54px width, 27px height) |
| **Tag Padding Wide** | `8px 12px` or `8px 16px` | Wider tags with more horizontal padding |
| **Icon Padding** | `6px` | Icon-only buttons, small elements |

### Spacing Rules

- **Vertical Rhythm:** Headings have 2× base unit above, 1× below
- **Component Padding:** Use `16px 24px` for cards, `8px` for tags
- **Gap Consistency:** Use consistent gap values within components (8px, 10px, 12px, 16px)
- **Whitespace:** Err toward generous empty space—reduces cognitive load
- **Consistency:** Use variables, never magic numbers
- **Nested Spacing:** Reduce spacing in nested components (e.g., 16px → 8px → 6px)

---

## 4. Layout Patterns & Structures

**Purpose:** Consistent layout patterns for cards, content sections, and component organization.

### Auto-Layout (Flexbox) Patterns

#### Column Layout (Vertical Stack)

```css
.auto-layout-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* or center, flex-end */
  gap: 8px; /* or 10px, 12px, 16px */
  padding: 0px; /* or specific padding */
}
```

**Usage:** Card content, form sections, stacked information

#### Row Layout (Horizontal Stack)

```css
.auto-layout-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start; /* or center, flex-end */
  justify-content: center; /* or flex-start, space-between */
  gap: 32px; /* or 48px for wide spacing */
  padding: 0px;
}
```

**Usage:** Headers with actions, time/date displays, tag rows

#### Centered Content

```css
.auto-layout-centered {
  display: flex;
  flex-direction: row; /* or column */
  justify-content: center;
  align-items: center;
  gap: 32px; /* or 48px */
  padding: 0px;
}
```

**Usage:** Time/date displays, centered card content, icon-text combinations

#### Right-Aligned Content

```css
.right-aligned-content {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-end; /* or center, flex-start */
  padding: 0px;
  gap: 56px; /* or appropriate spacing */
}
```

**Usage:** Content aligned to right edge, timestamps, action buttons on right

#### Right-Aligned Column Content

```css
.right-aligned-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 24px;
  gap: 24px; /* or 32px */
  width: 456px; /* or appropriate width */
  height: 197px; /* or appropriate height */
}
```

**Usage:** Right-aligned card content, date displays, progress indicators

#### Content with Image and Tags

```css
.content-image-tags {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  padding: 0px;
  gap: 64px; /* spacing between content and image */
  width: 443px; /* or 100% */
  height: 63px;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  flex: 1;
}

.side-image {
  width: 50px; /* or 90px */
  height: 50px; /* or 90px */
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
}
```

**Usage:** Content with side image and tags, card layouts with multiple elements

#### Content with Image and Description

```css
.content-image-description {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px; /* or 36px, 56px */
  width: 100%;
}

.content-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px; /* or 18px */
  flex: 1;
}

.image-side {
  width: 90px; /* or 50px, 64px, 80px */
  height: 90px; /* match width for square */
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
}
```

#### Headline with Progress Bar and Description

```css
.headline-progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 18px; /* or 16px */
  width: 100%;
}

.headline-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 185px; /* wide spacing to push progress right */
  width: 408px; /* or 100% */
  height: 42px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  width: 97px; /* or appropriate width */
  height: 23px;
}
```

**Usage:** Task cards with progress, project cards, completion indicators

### Card Container Structure

#### Standard Card

```css
.card-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px;
  gap: 10px; /* or 12px, 16px */
  background: #FFFFFF;
  border-radius: 12px; /* or 24px for larger cards */
  width: 100%; /* or specific width */
}
```

**Variations:**
- **Large Card:** `padding: 18px 24px` or `padding: 24px`, `border-radius: 24px`
- **Compact Card:** `padding: 16px 24px`, `gap: 8px`
- **Color-Coded Left Border:** Add left border `width: 16px`, `background: #3C3C43`
- **Color-Coded Top Border:** Add top border bar `height: 16px`, `background: #3C3C43`, positioned at top
- **Centered Card:** `align-items: center` for centered content alignment

#### Color-Coded Top Border Card

```css
.color-top-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.color-bar-top {
  width: 100%;
  height: 16px;
  background: #3C3C43;
  flex-shrink: 0;
  order: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 8px;
  order: 1;
}
```

#### Color-Coded Side Bar Card (Wide)

```css
.color-side-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.color-bar-side {
  width: 124px; /* or 144px for wider */
  height: 100%; /* or specific height like 164px, 197px */
  background: #DEDEDE; /* or #3C3C43 */
  flex-shrink: 0;
  align-self: stretch;
  order: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* or flex-end for right alignment */
  padding: 16px 32px; /* or 24px */
  gap: 24px; /* or 32px */
  flex: 1;
  order: 1;
}
```

**Usage:** Cards with wide colored sidebars, date cards, calendar items

#### Centered Card Content

```css
.centered-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 12px;
}

.centered-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 24px; /* or 16px */
  width: 100%;
}
```

**Usage:** Cards with centered content, hero cards, feature highlights

#### Centered Headline + Subhead Pattern

```css
.centered-headline-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: 193px; /* or appropriate width */
  height: 45px;
}

.headline-centered {
  width: 193px; /* or 100% */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  text-align: center; /* Important for centered text */
  color: #000000;
}

.subhead-centered {
  width: 108px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center; /* Important for centered text */
  color: #181818; /* or #666666 */
}
```

**Usage:** Centered card headers, hero sections, feature titles

#### Card with Header Section

```css
.card-with-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px;
  gap: 6px; /* or 8px */
  width: 100%;
  height: 75px; /* or appropriate height */
}

.header-content {
  position: relative;
  width: 294px; /* or 100% */
  height: 43px; /* or appropriate height */
}

.header-group {
  position: absolute;
  width: 141px; /* or appropriate width */
  height: 43px;
  left: 24px; /* or 0px */
  top: 16px; /* or 0px */
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
}

.header-icon-right {
  position: absolute;
  width: 16px;
  height: 16px;
  right: 24px;
  top: 29.5px; /* or center vertically */
  background: #DEDEDE;
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 6px; /* or appropriate gap */
  width: 100%;
}
```

**Usage:** Cards with separate header sections, cards with action icons, profile cards

#### Card with Image Overlay Tag

```css
.image-card-with-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
  position: relative;
}

.card-image {
  width: 100%;
  height: 198px; /* or appropriate height */
  background: #DEDEDE;
  flex-shrink: 0;
  position: relative;
}

.overlay-tag {
  box-sizing: border-box;
  position: absolute;
  width: 52px;
  height: 31px;
  left: 234px; /* right edge positioning */
  top: 18px; /* or appropriate top */
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  padding: 8px;
  gap: 10px;
  background: #3C3C43;
  border: 1px solid #3C3C43;
  border-radius: 100px;
}

.card-content-below {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 6px; /* or appropriate gap */
  width: 100%;
}
```

**Usage:** Image cards with overlay badges, featured content cards, promotional cards

#### Card with Image on Top

```css
.image-top-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 12px;
}

.card-image-top {
  width: 256px; /* or 100% */
  height: 173px; /* or appropriate height */
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
  order: 0;
}

.content-below-image {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px; /* or appropriate gap */
  width: 100%;
  order: 1;
}
```

**Usage:** Image-first cards, article cards, product cards

#### Centered Icon Grid Pattern

```css
.centered-icon-grid {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 24px;
  width: 100%;
}

.icon-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 32px; /* spacing between icons */
  width: 184px; /* or appropriate width */
  height: 40px;
}

.icon-square {
  width: 40px;
  height: 40px;
  background: #DEDEDE;
  border-radius: 8px; /* square icons with rounded corners */
  flex-shrink: 0;
}

.content-below-icons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: 100%;
}
```

**Usage:** Feature grids, icon showcases, service cards

#### Card with Picture/Icon at Top (Centered)

```css
.icon-top-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;
}

.top-icon {
  width: 56px; /* or 32px, 40px */
  height: 56px; /* match width */
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.content-below-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 0px; /* or appropriate gap */
  width: 100%;
  order: 1;
}
```

**Usage:** Feature cards, service cards, icon-based navigation cards

#### Number Badge with Content Pattern

```css
.number-badge-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 12px; /* spacing between badge and content */
  width: 300px; /* or 100% */
  height: 54px; /* or appropriate height */
}

.number-badge {
  width: 32px;
  height: 32px;
  position: relative;
  flex-shrink: 0;
}

.badge-bg {
  position: absolute;
  left: 0%;
  right: 0%;
  top: 0%;
  bottom: 0%;
  background: #DEDEDE;
  border-radius: 50%; /* or 12px for rounded square */
}

.badge-number {
  position: absolute;
  left: 34.38%; /* centered horizontally */
  right: 31.25%;
  top: 15.62%; /* centered vertically */
  bottom: 12.5%;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  display: flex;
  align-items: center;
  color: #3C3C43;
}

.content-next-to-badge {
  width: 256px; /* or flex: 1 */
  height: 54px; /* or appropriate height */
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  display: flex;
  align-items: center;
  color: #666666;
}
```

**Usage:** Numbered lists, step-by-step content, ordered content cards

#### Right-Aligned Button Group

```css
.button-group-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start; /* or center, flex-end */
  padding: 0px;
  gap: 16px;
  width: 180px; /* or appropriate width */
  height: 31px;
}

.button-group-center {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;
  height: 31px;
}
```

**Usage:** Action buttons at card bottom, card footers, button groups

#### Card with Right-Aligned Content

```css
.card-right-aligned {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* right alignment */
  padding: 0px;
  gap: 24px; /* or 21px */
  width: 100%;
}

.content-section-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* content still left-aligned within section */
  padding: 0px;
  gap: 12px; /* or appropriate gap */
  width: 100%;
}
```

**Usage:** Cards with right-aligned structure, content with right-side actions

#### Card with Picture and Headline (Horizontal)

```css
.picture-headline-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 211px; /* or 100% */
  height: 56px;
}

.card-picture {
  width: 56px; /* or 32px */
  height: 56px; /* match width */
  background: #DEDEDE;
  flex-shrink: 0;
}

.headline-subtitle-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  flex: 1;
}
```

**Usage:** Profile cards, user cards, avatar with name cards

#### Card Content with Right-Aligned End Section

```css
.card-with-end-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0px;
  gap: 24px; /* or appropriate gap */
  width: 100%;
}

.content-primary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px; /* or appropriate gap */
  width: 100%;
}

.end-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 0px; /* or appropriate gap */
  width: 100%;
}
```

**Usage:** Cards with bottom actions, cards with footer sections

### Vertical Card Layout Patterns

#### Vertical Content Stack Pattern

```css
.vertical-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 18px; /* or 12px, 16px, 24px */
  width: 100%;
}

.vertical-stack-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 12px; /* spacing within item */
  width: 100%;
  height: 54px; /* or appropriate height */
}
```

**Usage:** List items, stacked content, vertical card layouts

#### Card with Centered Content and Numbered Items

```css
.centered-numbered-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 12px;
}

.centered-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 24px;
  width: 100%;
}

.numbered-items {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 18px; /* spacing between numbered items */
  width: 100%;
}
```

**Usage:** Step-by-step cards, instruction cards, numbered lists

#### Card with Image and Content Below

```css
.image-content-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.full-width-image {
  width: 100%;
  height: 198px; /* or 304px, 342px */
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 6px; /* or appropriate gap */
  width: 100%;
  order: 1;
}
```

**Usage:** Image-first cards, article previews, media cards

#### Card with Part/Label and Headline

```css
.part-headline-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px; /* or 12px */
  width: 100%;
}

.part-headline-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 139px; /* or appropriate width */
  height: 45px;
}

.part-label {
  width: 139px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}

.headline {
  width: 128px; /* or 100% */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}
```

**Usage:** Sectioned content, part-based cards, labeled sections

#### Card with Picture at Top-Right (Absolute)

```css
.card-with-top-picture {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0px;
  gap: 24px;
  width: 100%;
  position: relative;
}

.top-picture-absolute {
  position: absolute;
  width: 32px;
  height: 32px;
  /* Positioned at top-right or top-left */
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.content-below-picture {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 100%;
  order: 1;
}
```

**Usage:** Cards with corner icons, cards with absolute-positioned avatars

### Vertical Component Summary

**Key Patterns:**
- **Centered Content:** Use `justify-content: center` and `align-items: center` for centered card content
- **Centered Text:** Use `text-align: center` for centered headlines and subheads
- **Header Sections:** Separate header areas with `padding: 16px 24px` and `gap: 6px`
- **Image Overlays:** Use absolute positioning for tags/badges on images
- **Image-First Cards:** Place image as first child, content below
- **Icon Grids:** Use `gap: 32px` for icon rows, `border-radius: 8px` for square icons
- **Button Groups:** Right-align with `justify-content: flex-end`, `gap: 16px`
- **Number Badges:** 32px × 32px circles with centered numbers
- **Vertical Stacks:** Use `gap: 18px` or `24px` for vertical spacing between items
- **Part Labels:** 14px font, `#666666` color for section labels above headlines

#### Name + Value Pair Pattern

```css
.name-value-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 24px; /* wide spacing to push value right */
  width: 280px; /* or 100% */
  height: 23px;
}

.name-left {
  width: 128px; /* or flex: 1 */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.value-right {
  width: 128px; /* or appropriate width */
  height: 20px;
  font-size: 16px;
  font-weight: 600; /* Semibold for emphasis */
  line-height: 20px;
  text-align: right; /* Right-aligned value */
  color: #000000;
}
```

**Usage:** Name-price pairs, label-value displays, product cards

#### Large Circular Progress Visualization

```css
.progress-circle-large {
  width: 140px;
  height: 140px;
  position: relative;
}

.progress-ring-outer {
  box-sizing: border-box;
  position: absolute;
  width: 112px;
  height: 112px;
  left: 14px; /* centered: (140-112)/2 */
  top: 14px;
  border: 7px solid rgba(204, 204, 204, 0.35); /* Light gray background ring */
  border-radius: 50%;
}

.progress-ring-inner {
  box-sizing: border-box;
  position: absolute;
  width: 112px;
  height: 112px;
  left: 14px;
  top: 14px;
  border: 21px solid #DEDEDE; /* Progress color */
  border-radius: 50%;
  transform: rotate(180deg); /* Adjust rotation for progress */
}

.progress-percentage {
  position: absolute;
  width: 45px;
  height: 31px;
  left: 47.25px; /* centered horizontally */
  top: 54.25px; /* centered vertically */
  font-size: 24.5px;
  font-weight: 400;
  line-height: 31px;
  display: flex;
  align-items: center;
  color: #000000;
}
```

**Usage:** Progress indicators, completion circles, data visualizations

#### Multiple Sections Pattern with Titles

```css
.multiple-sections-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 32px; /* large spacing between sections */
  background: #FFFFFF;
  border-radius: 12px;
}

.sections-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px; /* spacing between individual sections */
  width: 100%;
}

.section-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 6px;
  width: 100%;
}

.section-title {
  width: 68px; /* or appropriate width */
  height: 20px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #3C3C43; /* Darker color for titles */
}

.section-description {
  width: 258px; /* or 100% */
  height: 54px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** Multi-section cards, feature lists, content with multiple titled sections

#### Card with Image and Header Below

```css
.image-header-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.full-width-image-top {
  width: 100%;
  height: 280px; /* or 222px, 381px */
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.header-section-below {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px;
  gap: 9px; /* custom gap for header */
  width: 100%;
  order: 1;
}

.header-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 64px; /* wide spacing */
  width: 100%;
}

.avatar-name-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
  width: 145px; /* or appropriate width */
  height: 32px;
}

.icon-text-group-right {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px; /* or 4px for tighter */
  width: 124px; /* or appropriate width */
  height: 18px;
}
```

**Usage:** Article cards, media cards, cards with author info

#### Picture Grid Pattern (Multiple Rows)

```css
.picture-grid-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.picture-grid-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 18px; /* spacing between pictures */
  width: 256px; /* or 100% */
  height: 113px;
}

.grid-picture {
  width: 119px;
  height: 113px;
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
}
```

**Usage:** Gallery cards, image grids, photo collections

#### Card with Divider Pattern

```css
.card-with-divider {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 16px;
  background: #FFFFFF;
  border-radius: 12px;
}

.content-above-divider {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 100%;
}

.divider-line {
  width: 291px; /* or 100% */
  height: 1px;
  background: #C4C4C4; /* Light gray divider */
  /* OR */
  background: #E6E6E6; /* Alternative light gray divider */
  flex-shrink: 0;
}

.content-below-divider {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 100%;
}
```

**Usage:** Cards with separated sections, content dividers, section breaks

#### Card with Title + Tags Section

```css
.title-tags-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 264px; /* or 100% */
  height: 57px;
}

.section-title {
  width: 108px; /* or appropriate width */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #181818; /* Slightly darker than body text */
}

.tags-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 8px; /* spacing between tags */
  width: 100%;
  height: 31px;
}
```

**Usage:** Tagged content sections, categorized tags, tag groups with titles

#### Card with Centered Footer

```css
.card-with-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.content-top {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  gap: 6px;
  width: 100%;
}

.image-middle {
  width: 100%;
  height: 198px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.footer-bottom {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 24px;
  gap: 18px;
  width: 100%;
}

.footer-icon-group {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 24px;
  width: 216px; /* or appropriate width */
  height: 18px;
}
```

**Usage:** Cards with centered footers, cards with bottom actions, footer sections

#### Icon-Text Group with Tighter Gap

```css
.icon-text-tight {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 4px; /* Tighter gap than standard 6px */
  width: 54px; /* or appropriate width */
  height: 18px;
}

.icon-small {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.text-small {
  width: 34px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** Compact icon-text pairs, tight header sections, compact metadata

#### Card with Headline Above Large Image

```css
.headline-image-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.headline-section {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 24px;
  gap: 10px;
  width: 100%;
}

.headline-text {
  width: 228px; /* or 100% */
  height: 46px; /* Multi-line headline */
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.large-image-below {
  width: 100%;
  height: 300px; /* or appropriate height */
  background: #DEDEDE;
  flex-shrink: 0;
}
```

**Usage:** Article cards, blog posts, content with headline above image

#### Card with Icon at Top and Tags

```css
.icon-top-tags-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.top-icon {
  width: 32px;
  height: 32px;
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 100%;
  order: 1;
}

.tags-section {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 172px; /* or appropriate width */
  height: 31px;
  order: 2;
}
```

**Usage:** Feature cards, service cards, cards with icon and tags

#### Card with Tags Above Headline

```css
.tags-headline-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.card-image-top {
  width: 100%;
  height: 198px;
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 8px;
  width: 100%;
  order: 1;
}

.tags-row-above {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 6px; /* tighter gap for tags */
  width: 110px; /* or appropriate width */
  height: 31px;
  order: 0;
}

.headline-below-tags {
  width: 256px; /* or 100% */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
  order: 1;
}
```

**Usage:** Image cards with tags above headline, featured content cards

#### Centered Card with Number Badge

```css
.centered-number-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.number-badge-top {
  width: 32px;
  height: 32px;
  position: relative;
  flex-shrink: 0;
  order: 0;
}

.content-centered {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 220px; /* or appropriate width */
  height: 85px;
  order: 1;
}

.headline-centered {
  width: 128px; /* or 100% */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  text-align: center;
  color: #000000;
}

.description-centered {
  width: 220px; /* or 100% */
  height: 54px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}
```

**Usage:** Numbered feature cards, step cards, centered content with badges

#### Card with Progress Bar and Section

```css
.progress-section-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  width: 250px; /* or 100% */
  height: 23px;
  order: 1;
}

.title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 258px; /* or 100% */
  height: 78px;
  order: 2;
}

.section-title {
  width: 48px; /* or appropriate width */
  height: 20px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #3C3C43;
}

.tag-bottom {
  width: 68px; /* or appropriate width */
  height: 31px;
  background: #3C3C43;
  border: 1px solid #3C3C43;
  border-radius: 100px;
  order: 3;
}
```

**Usage:** Progress cards, task cards with progress and sections

#### Card with Version Label and Logo

```css
.version-logo-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px 24px; /* custom padding */
  gap: 40px; /* wide spacing */
  background: #FFFFFF;
  border-radius: 12px;
}

.version-logo-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 40px; /* wide spacing between version and logo */
  width: 203px; /* or 100% */
  height: 24px;
}

.version-label {
  width: 139px; /* or appropriate width */
  height: 16px;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #666666;
}

.logo-right {
  width: 24px;
  height: 24px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 174px; /* or 100% */
  height: 62px;
}

.tag-headline-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 0px; /* or appropriate gap */
  width: 100%;
}
```

**Usage:** Version cards, release cards, cards with version info

#### Card with Version Label and Multiple Icon Groups

```css
.version-icon-groups-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.version-headline-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 186px; /* or 100% */
  height: 43px;
}

.version-label {
  width: 139px; /* or 100% */
  height: 16px;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #666666;
}

.subhead-medium {
  width: 156px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 500; /* Medium weight */
  line-height: 18px;
  color: #3C3C43;
}

.icon-groups-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px; /* spacing between icon group rows */
  width: 144px; /* or appropriate width */
  height: 86px;
}

.icon-group-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 32px; /* wide spacing between icon-text pairs */
  width: 144px; /* or 100% */
  height: 18px;
}
```

**Usage:** Cards with version info and multiple metadata rows, info cards

#### Centered Card with Picture and Title

```css
.centered-picture-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  gap: 16px;
  background: #FFFFFF;
  border-radius: 12px;
}

.centered-picture {
  width: 186px;
  height: 172px;
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
  order: 0;
}

.centered-title {
  width: 137px; /* or appropriate width */
  height: 46px; /* Multi-line title */
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  text-align: center;
  color: #000000;
  order: 1;
}
```

**Usage:** Feature cards, product cards, centered image cards

#### Card with Parts/Segments Row and Wide Tag

```css
.parts-wide-tag-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.parts-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 48px; /* wide spacing between parts */
  width: 249px; /* or 100% */
  height: 35px;
  order: 2;
}

.wide-tag-bottom {
  width: 249px; /* Full width tag */
  height: 31px;
  background: #3C3C43;
  border: 1px solid #3C3C43;
  border-radius: 12px; /* Rounded, not pill */
  order: 3;
}
```

**Usage:** Cards with parts/segments and full-width action tags

#### Multiple Rows with Dividers Pattern

```css
.rows-with-dividers {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px; /* spacing between rows */
  width: 246px; /* or 100% */
  height: 147px; /* or appropriate height */
}

.row-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 96px; /* wide spacing to push number right */
  width: 100%;
  height: 18px;
}

.row-title {
  width: 85px; /* or appropriate width */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}

.row-number {
  width: 65px; /* or appropriate width */
  height: 18px;
  font-size: 14px;
  font-weight: 500; /* Medium for emphasis */
  line-height: 18px;
  text-align: right;
  letter-spacing: 0.04em; /* Slight spacing for numbers */
  color: #181818;
}

.divider-between {
  width: 246px; /* or 100% */
  height: 1px;
  background: #E6E6E6; /* Light gray divider */
  flex-shrink: 0;
}
```

**Usage:** Data rows, list items with dividers, table-like content

#### Card with Subhead 16px and Buttons

```css
.subhead-16-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 12px;
}

.headline-subhead-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 128px; /* or 100% */
  height: 47px;
}

.subhead-16 {
  width: 128px; /* or 100% */
  height: 20px;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #3C3C43;
}

.button-group-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 180px; /* or appropriate width */
  height: 31px;
}
```

**Usage:** Cards with larger subheads and action buttons

#### Card with Picture and Large Tag

```css
.picture-large-tag-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 24px;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 12px;
}

.content-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px;
  width: 256px; /* or flex: 1 */
  height: 336px;
}

.picture-top {
  width: 256px; /* or 100% */
  height: 173px;
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
  order: 0;
}

.large-tag {
  width: 75px;
  height: 34px; /* Larger height */
  background: #3C3C43;
  border: 1px solid #3C3C43;
  border-radius: 100px;
  padding: 8px 12px;
  order: 2;
}

.large-tag-text {
  width: 51px;
  height: 18px;
  font-size: 14px; /* Larger font */
  font-weight: 400;
  line-height: 18px;
  color: #FFFFFF;
}
```

**Usage:** Cards with prominent tags, featured content cards

#### Content + Image Side-by-Side Card

```css
.content-image-side-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.content-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 96px 24px; /* Large top padding */
  gap: 16px;
  width: 219px; /* or flex: 1 */
  height: 350px;
  order: 0;
}

.image-column {
  width: 200px;
  height: 350px;
  background: #DEDEDE;
  flex-shrink: 0;
  order: 1;
}
```

**Usage:** Hero cards, feature cards with side image, content-image split layouts

#### List Card with Multiple Items

```css
.list-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 32px 24px;
  gap: 32px; /* Large spacing between items */
  background: #FFFFFF;
  border-radius: 12px;
}

.list-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px; /* Spacing between list items */
  width: 100%;
}

.list-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  width: 100%;
  height: 40px;
}

.item-picture {
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  background: #DEDEDE;
  border-radius: 6px; /* Rounded square */
  flex-shrink: 0;
}

.item-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  flex: 1;
}

.item-title {
  width: 108px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 600; /* Semibold */
  line-height: 18px;
  color: #181818;
}

.item-description {
  width: 247px; /* or 100% */
  height: 16px;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #666666;
}
```

**Usage:** List cards, item lists, directory cards, menu cards

#### Card with Background Image and Logo Overlay

```css
.background-image-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
  position: relative;
}

.image-background-section {
  width: 100%;
  height: 100px; /* or appropriate height */
  position: relative;
}

.image-bg {
  box-sizing: border-box;
  position: absolute;
  width: 100%;
  height: 72px;
  left: calc(50% - 100%/2);
  top: calc(50% - 14px);
  background: #EFEFEF; /* Light gray background */
}

.logo-overlay {
  position: absolute;
  width: 56px;
  height: 56px;
  left: calc(50% - 56px/2);
  top: calc(50% - 56px/2 + 22px);
  background: #DEDEDE;
  border-radius: 50%; /* or 12px */
}

.content-below-image {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  gap: 24px;
  width: 100%;
}
```

**Usage:** Brand cards, logo cards, hero cards with background

#### Icon-Text Groups with Vertical Dividers

```css
.icon-text-with-dividers {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  width: 229px; /* or appropriate width */
  height: 38px;
}

.icon-text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: 98px; /* or flex: 1 */
  height: 38px;
}

.icon-top {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.text-below {
  width: 98px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}

.vertical-divider {
  width: 1px;
  height: 36px;
  background: rgba(222, 222, 222, 0.8); /* Semi-transparent divider */
  flex-shrink: 0;
}
```

**Usage:** Icon groups with separators, feature lists, stat displays

#### Card with Large Number Display

```css
.large-number-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.part-label {
  width: 51px; /* or appropriate width */
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: rgba(102, 102, 102, 0.8);
}

.large-number {
  width: 39px; /* or appropriate width */
  height: 40px;
  font-size: 32px;
  font-weight: 500;
  line-height: 40px;
  display: flex;
  align-items: center;
  color: #000000;
}
```

**Usage:** Numbered sections, step indicators, large numeric displays

#### Headline with Underline Bar

```css
.headline-with-underline {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 87px; /* or appropriate width */
  height: 33px;
}

.headline {
  width: 87px; /* or 100% */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.underline-bar {
  width: 42px; /* or appropriate width */
  height: 2px;
  background: #3C3C43; /* Dark underline */
  flex-shrink: 0;
}
```

**Usage:** Section headers, emphasized headlines, titled sections

#### Card with Floating Image

```css
.card-with-floating-image {
  position: relative;
  width: 268px;
  height: 278px;
}

.floating-image {
  box-sizing: border-box;
  position: absolute;
  width: 56px;
  height: 56px;
  left: calc(50% - 56px/2);
  top: calc(50% - 56px/2 - 111px); /* Offset above card */
  background: #EFEFEF;
  border: 1px solid #FFFFFF; /* White border */
  border-radius: 12px;
}

.content-card {
  position: absolute;
  width: 268px;
  height: 249px;
  left: 0px;
  top: 29px; /* Offset to accommodate floating image */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px 24px 24px; /* Extra top padding */
  gap: 32px;
  background: #FFFFFF;
  border-radius: 12px;
}
```

**Usage:** Cards with floating logos, layered designs, offset image cards

#### Card with Image Overlay and Large Headline

```css
.image-overlay-card {
  position: absolute;
  width: 304px;
  height: 293px;
  background: #FFFFFF;
  border-radius: 12px;
}

.image-background-overlay {
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
  background: rgba(222, 222, 222, 0.25); /* Semi-transparent overlay */
}

.content-overlay {
  position: absolute;
  width: 159px;
  height: 77px;
  left: 32px;
  top: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
}

.large-headline-overlay {
  width: 159px; /* or 100% */
  height: 30px;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  color: #000000;
}

.tag-overlay {
  width: 148px;
  height: 31px;
  background: #3C3C43;
  border: 1px solid #3C3C43;
  border-radius: 8px; /* Square-ish */
  padding: 8px 18px;
}
```

**Usage:** Hero cards, overlay cards, image cards with text overlay

#### Card with Multiple Description Paragraphs

```css
.multiple-description-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.description-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px; /* Spacing between paragraphs */
  width: 227px; /* or 100% */
  height: 178px;
}

.description-paragraph {
  width: 227px; /* or 100% */
  height: 54px; /* Multi-line */
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** Content cards, article cards, multi-paragraph descriptions

#### Card with Icon-Text Columns

```css
.icon-text-columns-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 12px; /* or 16px */
  background: #FFFFFF;
  border-radius: 12px;
}

.icon-text-columns-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  width: 196px; /* or 100% */
  height: 35px;
}

.icon-text-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: 98px; /* or flex: 1 */
  height: 35px;
}

.icon-column {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.text-column {
  width: 98px; /* or 100% */
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  text-align: center;
  color: #666666;
}
```

**Usage:** Feature grids, icon columns, multi-column icon displays

#### Card with Image Overlay Headline

```css
.image-overlay-headline-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
  position: relative;
}

.full-image {
  width: 100%;
  height: 300px; /* or appropriate height */
  background: #DEDEDE;
  flex-shrink: 0;
  order: 0;
}

.overlay-headline {
  position: absolute;
  width: 128px;
  height: 92px;
  left: 24px;
  top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
}

.part-label-overlay {
  width: 97px; /* or appropriate width */
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: rgba(102, 102, 102, 0.8);
}

.headline-overlay-large {
  width: 128px; /* or 100% */
  height: 75px; /* Multi-line */
  font-size: 20px;
  font-weight: 500;
  line-height: 25px;
  color: #000000;
}

.content-below-image {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 4px;
  width: 100%;
  order: 1;
}
```

**Usage:** Hero cards, image cards with overlay text, featured content cards

#### Card with Divider and Icon-Text List

```css
.divider-icon-list-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 28px; /* Custom gap */
  background: #FFFFFF;
  border-radius: 12px;
}

.headline-description-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 6px;
  width: 200px; /* or 100% */
  height: 83px;
}

.divider-below {
  width: 200px; /* or 100% */
  height: 1px;
  background: rgba(222, 222, 222, 0.8); /* Semi-transparent */
  flex-shrink: 0;
}

.icon-text-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  width: 190px; /* or 100% */
  height: 86px;
}

.icon-text-item-full {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 190px; /* Full width */
  height: 18px;
}
```

**Usage:** Cards with dividers and metadata lists, info cards

#### Card with Title Section and Divider

```css
.title-section-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 12px;
  background: #FFFFFF;
  border-radius: 12px;
}

.title-section {
  width: 200px; /* or 100% */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #3C3C43; /* Darker color */
}

.divider-dark {
  width: 200px; /* or 100% */
  height: 1px;
  background: #3C3C43; /* Dark divider */
  flex-shrink: 0;
}

.description-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 200px; /* or 100% */
  height: 120px;
}
```

**Usage:** Sectioned content, titled sections with dividers

### Additional Vertical Component Patterns Summary

**New Patterns Added:**
- **Name + Value Pairs:** Headline on left, value (semibold, right-aligned) on right
- **Large Progress Circles:** 140px circles with percentage display (24.5px font)
- **Multiple Sections:** Cards with multiple titled sections (gap: 32px between sections)
- **Image + Header:** Full-width image with header section below (gap: 9px)
- **Picture Grids:** Multiple rows of 2 pictures (119px × 113px, gap: 18px)
- **Dividers:** 1px lines (#C4C4C4) for section separation
- **Title + Tags:** Section titles with tag rows below
- **Centered Footers:** Footer sections with centered icon groups
- **Tighter Icon-Text:** 4px gap for compact icon-text pairs
- **Headline Above Image:** Headline section above large image
- **Icon + Tags Cards:** Icon at top, content, tags below
- **Tags Above Headline:** Tags row above headline in image cards
- **Centered Number Badge:** Centered cards with number badge and centered content
- **Progress + Section:** Cards with progress bar and titled sections
- **Version Label + Logo:** Cards with version label and logo (gap: 40px)
- **Version + Icon Groups:** Cards with version and multiple icon-text group rows
- **Centered Picture Card:** Centered cards with picture and centered title
- **Parts + Wide Tag:** Cards with parts/segments row and full-width tag (249px)
- **Rows with Dividers:** Multiple data rows with dividers (#E6E6E6) between them
- **Subhead 16px:** Cards with larger subhead (16px, 20px line-height) and buttons
- **Large Tags:** Tags with 14px font, height 34px, width 75px
- **Small Progress Circles:** 100px circles with 17.7px percentage font
- **Tags with Square Radius:** Tags using `border-radius: 8px` (widths 80px, 110px, 148px)
- **Compact Header Icons:** Three 12px icons in header top-right (gap: 4px)
- **Three-Column Image Rows:** 3×2 grids of 120px × 120px images (alternate opacity)
- **Stacked Paragraph Cards:** Cards with multiple description rows (stacked paragraphs)
- **Title with Display Value:** Title + 24px display value + supporting copy
- **Content + Image Side-by-Side:** Content column (96px top padding) with image column (200px × 350px)
- **List Card with Items:** Multiple list items with picture (40px, border-radius: 6px), semibold title (14px), description (13px)
- **Card with Background Image:** Image background (#EFEFEF) with centered logo overlay, content below
- **Vertical Dividers:** 1px dividers (rgba(222, 222, 222, 0.8)) between icon-text groups
- **Icon-Text Columns:** Centered icon-text groups in columns (12px font, 15px line-height)
- **Large Number Display:** 32px font (40px line-height) for prominent numbers
- **Headline with Underline:** Headline with 2px underline bar (#3C3C43) below
- **Floating Image:** Absolutely positioned image with border (border-radius: 12px, border: 1px solid #FFFFFF)
- **Card with Offset Top:** Card positioned with top offset (29px) for layered effect

**Key Measurements:**
- **Image Sizes:** 40px, 48px, 56px (picture/avatar), 120px × 120px (3×2 grid), 119px × 113px (2-up grid), 186px × 172px (centered), 188px, 200px × 350px (side-by-side), 222px, 277px × 72px (background), 280px × 188px, 292px × 300px, 300px
- **Gap Values:** 4px (icons), 6px (tight tags), 8px (content stacks), 9px (headers), 12px (sections), 16px (content), 23px (card spacing), 24px (card padding), 28px (card sections), 32px (sections), 40px (version-label pairs), 48px (icon groups), 56px (card stack), 64px (logo/content), 96px (title-number pairs), 118px (headline-icon spacing), 144px (icon groups in columns)
- **Tag Width:** 54px (compact, padding 6px 16px), 60px, 74px, 75px (14px font, 34px height), 80px, 82px, 110px, 118px, 148px, 249px (ultra-wide)
- **Tag Height:** 27px (compact), 31px (standard), 34px (large with 14px font)
- **Tag Radius:** 6px (rounded square), 8px (square-ish), 12px (rounded), 100px (pill)
- **Tag Padding:** 6px 16px (compact), 8px (standard), 8px 12px (wide), 8px 18px (extra wide)
- **Tag Font:** 12px (standard), 14px (large tags)
- **Font Sizes:** 11px (small description), 12px (small subtitles), 13px (version labels, line-height 16px), 14px (body, numbers with 0.04em spacing), 16px (subheads, line-height 20px), 18px (headlines), 20px (large headline variant, line-height 25px), 24px (large headlines, line-height 30px), 32px (large numbers, line-height 40px), 24.5px/17.7px (display/progress percentages)
- **Divider:** 1px height, #C4C4C4, #E6E6E6, or rgba(222, 222, 222, 0.8) color; 2px height (#3C3C43) for underlines
- **Padding:** 18px 24px (custom card padding), 24px (standard), 32px 24px (large top padding), 48px 24px (extra large top padding), 96px 24px (hero top padding)
- **Letter Spacing:** 0.04em for numbers (right-aligned), 0.08em for uppercase labels
- **Background Colors:** #EFEFEF (light gray background), rgba(222, 222, 222, 0.25) (semi-transparent overlay)

#### Color-Coded Side Bar with Date Display

```css
.date-side-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.date-sidebar {
  width: 124px; /* or 144px */
  height: 164px; /* or 197px */
  background: #DEDEDE; /* or #3C3C43 */
  flex-shrink: 0;
  align-self: stretch;
  position: relative;
}

.date-content {
  position: absolute;
  width: 42px; /* or 46px */
  height: 48px; /* or 38px */
  left: 41px; /* centered horizontally */
  top: 20px; /* or 24px */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.month-label {
  width: 42px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}

.day-number-large {
  width: 15px; /* or 46px */
  height: 30px;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  display: flex;
  align-items: center;
  color: #181818;
}

.time-bottom {
  position: absolute;
  width: 58px;
  height: 15px;
  left: 33px;
  bottom: 16px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  text-align: center;
  color: #3C3C43;
}

.metadata-bottom {
  position: absolute;
  width: 101px;
  height: 15px;
  left: 22px;
  bottom: 20px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  display: flex;
  align-items: flex-end;
  color: #3C3C43;
}
```

**Usage:** Calendar date cards, event cards with date sidebar, date picker displays

### Content Section Patterns

#### Headline + Description

```css
.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px; /* between headline and description */
  width: 100%;
}

.headline {
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.description {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666; /* or #3C3C43 for darker variant */
}
```

#### Headline + Subhead (Tight Spacing)

```css
.headline-subhead-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px; /* Very tight spacing */
  width: 175px; /* or appropriate width */
  height: 40px;
}

.headline {
  width: 126px; /* or flex: 1 */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.subhead {
  width: 175px; /* or 100% */
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: rgba(102, 102, 102, 0.8); /* 80% opacity */
}
```

**Usage:** Headlines with secondary information directly below, compact card headers

#### Label + Headline Pattern (Tight Spacing)

```css
.label-headline-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px; /* Very tight spacing */
  width: 100%;
}

.label {
  width: 100%;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}

.headline {
  width: 100%;
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}
```

#### Intro Header with Label and Icon

```css
.intro-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 320px; /* or appropriate spacing to push icon right */
  width: 100%;
  height: 18px;
}

.intro-label {
  width: 190px; /* or flex: 1 */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}

.intro-icon-small {
  width: 18px;
  height: 18px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```

**Usage:** Section headers with labels and action icons

#### Headline with Icon

```css
.headline-with-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
}

.icon {
  width: 24px;
  height: 24px;
  background: #DEDEDE; /* placeholder */
  flex-shrink: 0;
}
```

#### Icon Size Variations

**Tiny Icons (12px):**
```css
.icon-tiny-12 {
  width: 12px;
  height: 12px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```
**Usage:** Compact header icons, tight icon groups, minimal UI elements

**Small Icons (16px):**
```css
.icon-small {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```
**Usage:** Logo/name combinations, inline metadata icons

**Medium Icons (36px):**
```css
.icon-medium {
  width: 36px;
  height: 36px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```
**Usage:** Profile pictures, medium avatars, card headers

**Standard Icons (24px):**
```css
.icon-standard {
  width: 24px;
  height: 24px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```
**Usage:** Headlines, standard UI elements

**Large Icons (40px):**
```css
.icon-large {
  width: 40px;
  height: 40px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```
**Usage:** Intro sections, prominent card headers

**Extra Large Icons (64px):**
```css
.icon-xl {
  width: 64px;
  height: 64px;
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
}
```
**Usage:** Feature cards, large visual elements

**Tiny Icons (18px):**
```css
.icon-tiny {
  width: 18px;
  height: 18px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```
**Usage:** Compact inline elements, intro headers

#### Headline with Tag

```css
.headline-with-tag {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 218px; /* or appropriate spacing to push tag to right */
  width: 100%;
  height: 27px; /* matches tag height */
}

.headline {
  width: 243px; /* or flex: 1 for flexible */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.tag {
  /* Tag styles as defined above */
  height: 27px;
}
```

#### Secondary Info Row

```css
.secondary-info {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between; /* or flex-start */
  padding: 0px;
  gap: 353px; /* or appropriate spacing */
  width: 100%;
}
```

**Usage:** Due dates, timestamps, metadata alongside content

#### Title + Due Date Row

```css
.title-due-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 264px; /* or appropriate spacing to push due date right */
  width: 100%;
  height: 18px;
}

.title {
  width: 134px; /* or flex: 1 */
  height: 18px;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  color: #181818;
}

.due-date {
  width: 82px;
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  text-align: right;
  letter-spacing: -0.04em;
  color: rgba(102, 102, 102, 0.8);
}
```

#### Headline with Timestamp (Wide Spacing)

```css
.headline-timestamp-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 122px; /* or 154px, 225px for wider spacing */
  width: 100%;
  height: 45px; /* or appropriate height */
}

.headline-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  flex: 1;
}

.timestamp {
  width: 75px;
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  text-align: right;
  letter-spacing: -0.04em;
  color: rgba(102, 102, 102, 0.8);
}
```

#### Content with Wide Gaps

```css
.content-wide-gap {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 96px; /* or 128px, 154px for very wide spacing */
  width: 100%;
}
```

**Usage:** Content sections that need maximum separation, headline-image pairs, intro sections

#### Content Sections with Specific Gaps

```css
.content-section-gap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 18px; /* or 19px, 24px, 32px */
  width: 100%;
}

.content-row-gap {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 36px; /* or 56px, 64px, 122px, 232px, 240px, 320px, 348px */
  width: 100%;
}
```

**Usage:** Specific spacing requirements for different content layouts

#### Headline + Description + Tags Row

```css
.headline-description-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px; /* between description and tags */
  width: 100%;
}

.headline-description-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 100%;
}

.tags-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 12px; /* spacing between tags */
  width: 308px; /* or appropriate width */
  height: 31px;
}
```

#### Tags Row with Wide Spacing

```css
.tags-row-wide {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 240px; /* maximum spacing to push content right */
  width: 488px; /* or 100% */
  height: 31px;
}

.tags-group {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 8px; /* spacing between tags */
  width: 172px; /* or appropriate width */
  height: 31px;
}
```

**Usage:** Tags with wide spacing to right edge, tags with action buttons

#### Headline with Name and Timestamp

```css
.name-timestamp-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 232px; /* wide spacing to push timestamp right */
  width: 443px; /* or 100% */
  height: 24px;
}

.name-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 109px; /* or flex: 1 */
  height: 24px;
}

.name-logo {
  width: 24px;
  height: 24px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.name-text-large {
  width: 126px; /* or flex: 1 */
  height: 23px;
  font-size: 18px;
  font-weight: 400; /* Normal weight */
  line-height: 23px;
  letter-spacing: 0.08em; /* Wide spacing for uppercase */
  color: #666666;
}

.timestamp-right {
  width: 102px;
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  text-align: right;
  color: rgba(102, 102, 102, 0.6); /* 60% opacity */
}
```

**Usage:** Headers with name/logo and timestamp, activity feeds, notifications

#### Version/Label with Headline (Absolute Positioning)

```css
.version-headline-group {
  position: absolute;
  width: 152px; /* or 126px */
  height: 40px;
  left: 0px;
  top: 0px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
}

.version-label {
  width: 152px; /* or 102px */
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: #666666;
}

.headline {
  width: 126px;
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}
```

**Usage:** Version labels, part labels, section headers with labels

#### Content with Image and Multiple Sections

```css
.content-multi-section {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 36px; /* spacing between sections */
  width: 472px; /* or 100% */
  height: 90px;
}

.content-primary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  flex: 1;
}

.image-secondary {
  width: 90px;
  height: 90px;
  background: #DEDEDE;
  border-radius: 12px;
  flex-shrink: 0;
}
```

**Usage:** Content cards with multiple sections and side images

#### Compact Description Pattern

```css
.compact-description {
  width: 341px; /* or 100% */
  height: 32px;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #666666;
}
```

**Usage:** Space-constrained descriptions, compact card content, multi-line text in tight layouts

#### Large Number Display Pattern (24px)

```css
.large-number {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 500; /* Medium */
  font-size: 24px;
  line-height: 30px;
  display: flex;
  align-items: center;
  color: #181818;
}
```

**Usage:** Large numbers, day numbers in date displays, prominent numeric values

#### Uppercase Name Pattern

```css
.uppercase-name {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400; /* Normal */
  font-size: 18px;
  line-height: 23px;
  display: flex;
  align-items: center;
  letter-spacing: 0.08em;
  color: #666666;
  text-transform: uppercase; /* if needed */
}
```

**Usage:** Uppercase labels, name tags, category headers

#### Normal Weight Large Text (18px)

```css
.large-normal-text {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400; /* Normal, not medium */
  font-size: 18px;
  line-height: 23px;
  display: flex;
  align-items: center;
  color: #666666; /* or appropriate color */
}
```

**Usage:** Large body text, prominent descriptions, name displays

#### Low Opacity Text (60%)

```css
.low-opacity-text {
  font-family: 'Source Code Pro', monospace;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  display: flex;
  align-items: center;
  color: rgba(102, 102, 102, 0.6); /* 60% opacity */
}
```

**Usage:** Very subtle metadata, timestamps, less important information

#### Headline with Value/Number (Right Side)

```css
.headline-value-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 40px; /* or 88px, 96px for wider spacing */
  width: 100%;
}

.headline-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
  flex: 1;
}

.value-text {
  width: 44px; /* or appropriate width */
  height: 23px;
  font-size: 18px;
  font-weight: 600;
  line-height: 23px;
  color: #000000;
}
```

**Usage:** Headlines with numeric values, statistics, counts on the right

### Tag/Badge Structure

```css
.tag {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end; /* or center */
  padding: 8px; /* or 6px, 8px 12px */
  gap: 10px;
  background: #3C3C43; /* filled */
  /* OR */
  border: 1px solid #3C3C43; /* outlined */
  border-radius: 12px; /* or 100px for pill shape */
  height: 31px; /* Standard */
  /* OR */
  height: 27px; /* Smaller/compact */
  /* OR */
  height: 34px; /* Larger tags with 14px font */
  width: auto; /* or specific width like 52px, 70px, 110px */
}

.tag-text {
  font-size: 12px; /* Standard */
  /* OR */
  font-size: 14px; /* Larger tags */
  font-weight: 400;
  line-height: 15px; /* for 12px font */
  /* OR */
  line-height: 18px; /* for 14px font */
  color: #FFFFFF; /* for filled */
  /* OR */
  color: #3C3C43; /* for outlined */
}
```

**Padding Variations:**
- **Standard:** `padding: 8px` - Default tag padding
- **Compact:** `padding: 6px` - Smaller tags, tighter spacing
- **Wide:** `padding: 8px 12px` - Horizontal padding for wider tags
- **Extra Wide:** `padding: 8px 16px` - Maximum horizontal padding for prominent tags
- **Extra Wide Alt:** `padding: 8px 18px` - Alternative wide padding for tags with more text

**Width Variations:**
- **Auto:** `width: auto` - Fits content
- **Fixed Small:** `width: 52px` - Compact tags
- **Fixed Medium:** `width: 60px` - Medium tags with padding 8px 12px
- **Fixed Medium Alt:** `width: 70px` - Standard tags
- **Fixed Large:** `width: 68px` - Wide tags with extra padding
- **Fixed Large Alt:** `width: 80px` - Alternative wide tags with padding 8px 18px
- **Fixed Large Alt 2:** `width: 82px` - Wide tags with padding 8px 12px
- **Fixed Large Alt 3:** `width: 74px` - Medium-wide tags with padding 8px
- **Fixed Large Alt 4:** `width: 75px` - Large tags with 14px font, padding 8px 12px, height 34px
- **Fixed Extra Large:** `width: 76px` - Maximum width tags
- **Fixed Maximum:** `width: 110px` - Very wide tags
- **Fixed Ultra Wide:** `width: 249px` - Full-width tags spanning card width

**Variations:**
- **Filled Tag:** `background: #3C3C43`, `color: #FFFFFF`
- **Outlined Tag:** `border: 1px solid #3C3C43`, `color: #3C3C43`, `background: transparent`
- **Pill Shape:** `border-radius: 100px` - Fully rounded
- **Rounded Tag:** `border-radius: 12px` - Standard rounded corners (not fully pill)
- **Compact:** `padding: 6px`, `height: 27px`
- **Wide Tag:** `padding: 8px 12px`, `width: 68px` - Wider horizontal padding
- **Hidden:** `display: none` - For conditional tags

### Number Badge Pattern

```css
.number-badge {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.badge-bg {
  position: absolute;
  left: 0%;
  right: 0%;
  top: 0%;
  bottom: 0%;
  background: #DEDEDE;
  border-radius: 50%; /* or 12px for rounded square */
}

.badge-number {
  position: absolute;
  left: 34.38%; /* or center with flex */
  right: 31.25%;
  top: 15.62%;
  bottom: 12.5%;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  display: flex;
  align-items: center;
  color: #3C3C43;
}
```

**Usage:** Numbered items, step indicators, list item numbers

### Time/Date Display Pattern

```css
.time-date-display {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 76px; /* or appropriate width */
}

.time {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  color: #000000;
}

.date {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}
```

#### Date Display Pattern (Month + Day Number)

```css
.date-display {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  position: absolute;
  width: 42px; /* or 46px */
  height: 48px; /* or 38px */
  left: 41px; /* or appropriate positioning */
  top: 20px; /* or appropriate positioning */
}

.month {
  width: 42px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}

.day-number {
  width: 15px; /* or 46px for wider */
  height: 30px;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  display: flex;
  align-items: center;
  color: #181818;
}

.time-below {
  position: absolute;
  width: 58px;
  height: 15px;
  left: 33px; /* or center */
  bottom: 16px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  text-align: center;
  color: #3C3C43;
}
```

**Usage:** Calendar date displays, month/day combinations, date pickers

### Image/Media Card Pattern

#### Image on Left/Right with Content

```css
.image-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start; /* or center, stretch */
  padding: 0px;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
}

.image {
  width: 100px; /* or 88px, 162px */
  height: 100px; /* or 88px, 168px */
  background: #DEDEDE; /* placeholder */
  border-radius: 12px;
  flex-shrink: 0;
  align-self: stretch; /* to fill card height */
}

.content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px;
  gap: 8px; /* or 18px */
  flex: 1;
}
```

**Image Size Variations:**
- **Tiny:** 32px × 32px - Small avatars, compact icons
- **Small:** 48px × 48px - Standard avatars, small images
- **Compact:** 50px × 50px - Compact thumbnails, small featured images
- **Medium:** 56px × 56px - Medium avatars, profile pictures
- **Standard:** 80px × 80px - Standard images, thumbnails
- **Large:** 90px × 90px - Large thumbnails, featured images
- **Extra Large:** 100px × 100px - Hero images, large features
- **Picture Grid:** 119px × 113px - Grid picture items, gallery thumbnails
- **Card Image Medium:** 188px × 188px - Medium card images
- **Card Image Large:** 222px × 222px - Large card images
- **Card Image XL:** 280px × 188px - Extra large card images (landscape)
- **Card Image Full:** 300px × 300px - Full card images
- **Centered Picture:** 186px × 172px - Centered picture cards
- **Full Width:** 162px × 168px - Full-width card images

**Image Border Radius:**
- **Square:** `border-radius: 0px` - No rounding
- **Rounded:** `border-radius: 12px` - Standard rounded corners
- **Circle:** `border-radius: 50%` - Perfect circles (for avatars)

**Layout Variations:**
- **Image Left:** Image first, content second
- **Image Right:** Content first, image second
- **Full Width Image:** Image spans full width, content below
- **Right-Aligned:** `justify-content: flex-end`, `align-items: flex-end` - Content aligned to right/bottom

#### Full-Width Image Card

```css
.full-image-card {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  background: #FFFFFF;
  border-radius: 12px;
}

.full-image {
  width: 162px; /* or appropriate width */
  height: 168px; /* matches card height */
  background: #DEDEDE;
  flex-shrink: 0;
  align-self: stretch; /* fills card height */
}

.content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px;
  gap: 18px; /* larger gap for full image cards */
  flex: 1;
}
```

#### Image with Headline (Various Sizes)

**Small Image (48px) with Content:**
```css
.image-headline-small {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 25px; /* or 64px for wider spacing */
  width: 100%;
}

.image-small {
  width: 48px;
  height: 48px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px; /* or 2px for tight spacing */
  flex: 1;
}
```

**Medium Image (56px) with Content:**
```css
.image-headline-medium {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;
}

.image-medium {
  width: 56px;
  height: 56px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```

**Large Image (90px) with Content:**
```css
.image-headline-large {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;
}

.image-large {
  width: 90px;
  height: 90px;
  background: #DEDEDE;
  border-radius: 12px; /* optional rounded corners */
  flex-shrink: 0;
}
```

**Square Image (80px) with Rounded Corners:**
```css
.image-rounded {
  width: 80px;
  height: 80px;
  background: #DEDEDE;
  border-radius: 12px; /* rounded corners */
  flex-shrink: 0;
}
```

### Logo/Icon with Two-Line Text Pattern

```css
.logo-with-text {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 68px; /* or appropriate width */
  height: 26px;
}

.logo-icon {
  width: 24px;
  height: 24px;
  background: #DEDEDE; /* placeholder */
  flex-shrink: 0;
}

.logo-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  width: 36px; /* or appropriate width */
  height: 26px;
}

.logo-line1 {
  width: 36px;
  height: 13px;
  font-size: 10px;
  font-weight: 500;
  line-height: 13px;
  color: #3C3C43;
}

.logo-line2 {
  width: 36px;
  height: 13px;
  font-size: 10px;
  font-weight: 400;
  line-height: 13px;
  color: #666666;
}
```

**Usage:** Multiple logos in a row with `gap: 24px`

#### Icon with Text Group (Horizontal Row)

```css
.icon-text-group {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 48px; /* spacing between icon-text pairs */
  width: 264px; /* or appropriate width */
  height: 18px;
}

.icon-text-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 56px;
  height: 18px;
}

.icon-centered {
  margin: 0 auto;
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.text-centered {
  margin: 0 auto;
  width: 34px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** Multiple icon-text pairs in a row, metadata displays, feature lists

#### Intro Section Pattern (Large Icon + Headline)

```css
.intro-section {
  display: flex;
  flex-direction: row;
  align-items: center; /* or flex-start */
  padding: 0px;
  gap: 12px; /* or 154px for wide spacing */
  width: 100%;
  height: 45px;
}

.intro-icon {
  width: 40px;
  height: 40px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.intro-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  flex: 1;
}

.intro-name {
  width: 128px; /* or flex: 1 */
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.intro-description {
  width: 100%;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666; /* or rgba(102, 102, 102, 0.8) for subhead */
}
```

#### Headline with Icon and Subhead

```css
.headline-icon-subhead {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 197px; /* or appropriate width */
  height: 45px;
}

.icon-small {
  width: 32px;
  height: 32px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.headline-subhead-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  flex: 1;
}

.headline {
  width: 126px;
  height: 23px;
  font-size: 18px;
  font-weight: 500;
  line-height: 23px;
  color: #000000;
}

.subhead {
  width: 157px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: rgba(102, 102, 102, 0.8);
}
```

#### Headline with Absolute Icon

```css
.headline-container {
  position: relative;
  width: 472px; /* or 100% */
  height: 40px;
}

.headline-group {
  position: absolute;
  width: 152px; /* or 126px */
  height: 40px;
  left: 0px;
  top: 0px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
}

.icon-absolute-right {
  position: absolute;
  width: 16px;
  height: 16px;
  left: 456px; /* right edge */
  top: 0px;
  background: #DEDEDE;
}
```

**Usage:** Headlines with action icons positioned at right edge, card headers with controls

#### Name with Intro Pattern

```css
.name-intro-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
  width: 346px; /* or appropriate width */
  height: 38px;
}

.profile-icon {
  width: 36px;
  height: 36px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.name-intro-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  flex: 1;
}

.name {
  width: 34px; /* or flex: 1 */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #181818;
}

.intro-text {
  width: 298px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** User profiles, name with intro text, author information

#### Icon Above Text (Vertical, Centered)

```css
.icon-above-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 4px; /* or 6px */
  width: 56px; /* or 98px for wider */
  height: 18px; /* or 38px for taller */
}

.icon-small {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.text-below-icon {
  width: 34px; /* or 98px */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}
```

#### Logo/Name with Small Icon (Horizontal)

```css
.logo-name-small {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px; /* tighter gap for small icons */
  width: 56px; /* or appropriate width */
  height: 18px;
}

.icon-small {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.name-text {
  width: 34px; /* or flex: 1 */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

#### Icon Group Pattern (Multiple Icons)

```css
.icon-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px; /* spacing between icons */
  width: 96px; /* or appropriate width */
  height: 24px;
  position: absolute;
  left: 380px; /* or appropriate positioning */
  top: 0px;
}

.icon-item {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.icon-large-item {
  width: 24px;
  height: 24px;
  background: #DEDEDE;
  flex-shrink: 0;
}
```

**Usage:** Action icon groups, toolbar icons, multiple controls in a row

#### Logo/Name with Space-Between Alignment

```css
.logo-name-spaced {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 56px;
  height: 18px;
}

.icon-centered {
  margin: 0 auto;
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.text-centered {
  margin: 0 auto;
  width: 34px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** Centered icon-text pairs, balanced logo displays

#### Logo Row with Wide Spacing

```css
.logo-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 18px; /* or 225px for maximum spacing */
  width: 204px; /* or appropriate width */
  height: 18px;
}

.logo-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 56px;
  height: 18px;
}
```

**Usage:** Multiple logos/names in a row with wide spacing between groups

#### Parts/Segments Pattern (Vertical Column)

```css
.parts-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 55px; /* wide spacing between parts */
  width: 100%;
}

.part-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px; /* tight spacing */
  width: 51px; /* or appropriate width */
  height: 35px;
}

.part-label {
  width: 44px;
  height: 15px;
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;
  color: #666666;
}

.part-value {
  width: 51px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #181818;
}
```

### Subtitle/Title Section Pattern

```css
.subtitle-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 6px;
  width: 100%;
}

.subtitle-title {
  width: 380px; /* or appropriate width */
  height: 18px;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  color: #181818; /* slightly lighter than pure black */
}

.subtitle-description {
  width: 100%;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

### Section Stacking Pattern

```css
.sections-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px; /* or 32px for larger spacing */
  width: 100%;
}

.section-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px; /* nested gap smaller than container */
  width: 100%;
}
```

**Gap Hierarchy:**
- **Container:** 24px or 32px between major sections
- **Section Item:** 12px for nested content
- **Content:** 6px or 8px for tight spacing within items

### Segments/Subtitle Rows Pattern

```css
.segments-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px; /* or 17px */
  width: 100%;
}

.segment-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  width: 100%;
  height: 40px;
}

.segment-subtitle {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 157px; /* or appropriate width */
  height: 40px;
}

.subtitle-title {
  width: 157px;
  height: 18px;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  color: #181818;
}

.subtitle-details {
  width: 150px;
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}

.segment-icons {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 0px; /* icons directly adjacent */
  flex: 1;
}

.segment-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: 98px; /* or appropriate width */
  height: 38px;
}
```

**Usage:** Multi-column layouts with subtitles and icon rows, segmented content displays

### Divider Pattern

```css
.divider {
  width: 100%; /* or specific width like 528px */
  height: 2px; /* or 4px for vertical dividers */
  background: #E6E6E6;
  flex-shrink: 0;
}

/* Vertical divider */
.divider-vertical {
  width: 4px;
  height: 64px; /* or appropriate height */
  background: #E6E6E6;
}
```

### Progress Bar Pattern

```css
.progress-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  width: 100%;
  height: 23px;
}

.progress-bar-wrapper {
  position: relative;
  width: 100%;
  height: 6px;
  align-self: stretch;
}

.progress-bg {
  position: absolute;
  height: 6px;
  left: 0px;
  right: 0px;
  top: 0px;
  background: rgba(222, 222, 222, 0.8); /* 80% opacity */
}

.progress-fill {
  position: absolute;
  height: 6px;
  left: 0px;
  right: 22px; /* or calculated based on percentage */
  top: 0px;
  background: #3C3C43;
  transform: matrix(-1, 0, 0, 1, 0, 0); /* Optional: reverse direction */
}

.progress-indicator {
  width: 44px; /* or auto */
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: rgba(102, 102, 102, 0.8);
}
```

**Usage:** Task progress, completion indicators, status bars

### Data Visualization Pattern (Circular Progress)

```css
.data-viz-container {
  width: 80px;
  height: 80px;
  position: relative;
  flex-shrink: 0;
}

.circle-outer {
  box-sizing: border-box;
  position: absolute;
  width: 64px;
  height: 64px;
  left: 8px;
  top: 8px;
  border: 4px solid rgba(204, 204, 204, 0.35);
  border-radius: 50%;
}

.circle-inner {
  box-sizing: border-box;
  position: absolute;
  width: 64px;
  height: 64px;
  left: 8px;
  top: 8px;
  border: 12px solid #DEDEDE;
  border-radius: 50%;
  transform: rotate(180deg); /* Adjust based on progress */
}

.percentage-text {
  position: absolute;
  width: 26px;
  height: 18px;
  left: 27px;
  top: 31px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  display: flex;
  align-items: center;
  color: #000000;
}
```

**Usage:** Progress indicators, completion percentages, data visualization

### Component Width Patterns

Common width values for cards and content sections:

| Width | Usage |
|-------|-------|
| `100%` | Flexible, responsive cards |
| `400px` - `422px` | Content sections within cards |
| `478px` - `536px` | Standard card content width |
| `530px` - `566px` | Wide card content |
| `576px` - `614px` | Large cards, hero cards |

**Rules:**
- Use `100%` for responsive layouts
- Use specific widths only when design requires fixed dimensions
- Content sections typically 400-500px wide within cards
- Cards typically 500-600px wide on desktop

### Positioning Patterns

#### Absolute Positioning (Stacked Items)

```css
.stacked-container {
  position: absolute;
  width: [parent width];
  height: [calculated height];
}

.stacked-item {
  position: absolute;
  width: [item width];
  height: [item height];
  /* Positioned relative to parent */
}
```

**Usage:** List items, stacked cards, overlapping elements

#### Absolute Positioning with Coordinates

```css
.absolute-positioned {
  position: absolute;
  width: 152px; /* or appropriate width */
  height: 40px; /* or appropriate height */
  left: 0px; /* or specific pixel value */
  top: 0px; /* or specific pixel value */
  /* OR */
  bottom: 20px; /* for bottom alignment */
}

.icon-absolute {
  position: absolute;
  width: 16px;
  height: 16px;
  left: 456px; /* right edge positioning */
  top: 0px;
  background: #DEDEDE;
}
```

**Usage:** Elements positioned at specific coordinates, icons at edges, overlays

#### Centered Absolute Positioning

```css
.centered-absolute {
  position: absolute;
  width: 42px;
  height: 48px;
  left: 22px; /* or calculated center */
  top: 24px; /* or calculated center */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```

**Usage:** Centered content within absolutely positioned containers

#### Fixed Positioning (Modals, Overlays)

```css
.fixed-overlay {
  position: fixed;
  inset: 0; /* or specific top/left/right/bottom */
  z-index: [appropriate level];
}
```

**Usage:** Modals, popups, overlays, backdrops

### Layout Rules

- **Flex Direction:** Use `column` for stacked content, `row` for horizontal layouts
- **Gap Consistency:** Use consistent gap values (8px, 10px, 12px, 16px) within components
- **Alignment:** Default to `flex-start` for column layouts, `center` for centered content
- **Padding:** Use `16px 24px` for card padding, `0px` for nested content sections
- **Width:** Use `100%` for flexible layouts, specific widths (400-600px) for card content
- **Nested Structures:** Reduce spacing in nested components (outer: 16px, inner: 8px)
- **Positioning:** Use `absolute` for stacked items, `fixed` for overlays/modals

---

## 5. Components

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

| Variable        | Value   | Usage                                    |
| --------------- | ------- | ---------------------------------------- |
| **--radius-sm** | `4px`   | Small elements, inputs                   |
| **--radius-xs** | `6px`   | Rounded squares, small images, list item pictures |
| **--radius-md** | `8px`   | Buttons, small cards                     |
| **--radius-lg** | `12px`  | Standard cards, containers (default)     |
| **--radius-xl** | `24px`  | Large cards, hero cards, prominent content|
| **--radius-full**| `100px` | Pill-shaped tags, fully rounded elements |

### Border Radius Patterns

```css
/* Standard card */
.card {
  border-radius: 12px;
}

/* Large/hero card */
.card-large {
  border-radius: 24px;
}

/* Pill-shaped tag */
.tag-pill {
  border-radius: 100px; /* or 999px for full pill */
}

/* Small elements */
.input, .button-small {
  border-radius: 8px;
}
```

### Borders

- **Thickness:** 1px for dividers and card borders, 2px for inputs on focus
- **Color:** `--ui-border` (#E5E7EB) for neutral borders, `#3C3C43` for dark borders
- **Style:** Solid, neutral gray, low opacity to blend naturally

### Border Patterns

```css
/* Standard border */
.border-standard {
  border: 1px solid #E6E6E6;
}

/* Dark border (for tags) */
.border-dark {
  border: 1px solid #3C3C43;
}

/* Color-coded left border */
.border-left-accent {
  border-left: 16px solid #3C3C43;
}
```

**Rules:**

- Use `12px` for standard cards, `24px` for large/hero cards
- Use `100px` (or `999px`) for fully rounded pill-shaped elements
- Consistent corner radius across similar components
- Use radius variables, never magic numbers
- Color-coded cards use left border (`16px` width) instead of full border

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

## 11. Popups & Modals

**Purpose:** Consistent overlay patterns for forms, dialogs, and information displays.

### Standard Popup Structure

All popups follow this pattern:

```css
/* Backdrop */
.popup-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: [appropriate level];
  animation: fadeIn 0.2s ease;
}

/* Content Container */
.popup-content {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--ui-border);
  border-radius: 16px 16px 0 0; /* Mobile: bottom sheet */
  padding: var(--space-lg);
  padding-bottom: calc(
    var(--space-lg) + var(--bottom-nav-height, 80px) +
      env(safe-area-inset-bottom)
  );
  margin-bottom: calc(
    var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom)
  );
  width: 100%;
  max-width: 500px;
  max-height: calc(90vh - var(--bottom-nav-height, 80px));
  overflow-y: auto;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.3s ease;
  z-index: [backdrop z-index + 1];
}

/* Desktop: Centered Modal */
@media (min-width: 768px) {
  .popup-content {
    border-radius: var(--radius-lg);
    max-height: 80vh;
    margin-bottom: 0;
    padding-bottom: var(--space-lg);
  }
}
```

### Header Pattern

```css
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--ui-border);
}

.popup-header h3 {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: var(--font-weight-normal);
  color: var(--text-primary);
}

.popup-header .close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-header .close-button:hover {
  background: var(--danger);
  color: white;
}
```

### Form Actions Pattern

```css
.form-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--ui-border);
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--fs-sm);
  font-weight: var(--font-weight-normal);
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-btn {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--ui-border);
}

.cancel-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-tertiary);
}

.submit-btn {
  background: var(--accent-primary);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Z-Index Hierarchy

| Level                 | Z-Index               | Usage                                 |
| --------------------- | --------------------- | ------------------------------------- |
| **Modals/Popups**     | `2100`                | Event form, task form, timeline popup |
| **Bottom Navigation** | `2000`                | Fixed bottom navigation bar           |
| **Settings Panel**    | `500`                 | Settings bottom sheet                 |
| **Suggestion Card**   | `1000`                | Suggestion popup cards                |
| **Backdrop**          | `[modal z-index - 1]` | Backdrop overlays                     |

### Popup Rules

- **Mobile:** Bottom sheet style (slides up from bottom)
- **Desktop:** Centered modal (slides up, then centers)
- **Backdrop:** Always clickable to close (unless explicitly disabled)
- **Escape Key:** Always closes popup (add `onkeydown` handler)
- **Navigation Clearance:** Always account for `--bottom-nav-height` on mobile
- **Safe Area:** Use `env(safe-area-inset-bottom)` for devices with notches
- **Scrollbar:** Custom styled scrollbars for popup content
- **Accessibility:** Always include `role="dialog"`, `aria-modal="true"`, and proper ARIA labels

### Examples

**Task Form, Event Form, Timeline Popup** all follow this pattern.

---

## 13. Implementation Checklist

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

## 14. Color Usage Examples

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

## 15. Layout & Responsive Design

### Breakpoints

| Breakpoint  | Value     | Usage                                 |
| ----------- | --------- | ------------------------------------- |
| **Mobile**  | `< 768px` | Bottom sheets, full-width layouts     |
| **Desktop** | `≥ 768px` | Centered modals, side-by-side layouts |

### Mobile-First Approach

- Default styles target mobile
- Use `@media (min-width: 768px)` for desktop enhancements
- Bottom navigation always visible (fixed position)
- Popups slide up from bottom on mobile, center on desktop

### Navigation Clearance

Always account for bottom navigation on mobile:

```css
padding-bottom: calc(
  var(--space-lg) + var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom)
);
margin-bottom: calc(
  var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom)
);
```

### Safe Area Insets

Use `env(safe-area-inset-bottom)` for devices with notches/home indicators to prevent content from being hidden.

---

## 15. Local Components

**Purpose:** Component-level patterns and reusable UI elements used throughout the application.

### Component Container with Dashed Border

```css
.component-container {
  box-sizing: border-box;
  position: relative;
  width: 580px; /* or appropriate width */
  height: 400px; /* or appropriate height */
  background: #FFFFFF;
  border: 2px dashed rgba(36, 36, 36, 0.81); /* Dashed border for component boundaries */
}
```

**Usage:** Component library references, design system documentation, component boundaries

### Progress Circle (80px)

```css
.progress-circle-container {
  position: absolute;
  width: 80px;
  height: 80px;
  /* Position as needed */
}

.progress-circle-outer {
  box-sizing: border-box;
  position: absolute;
  width: 64px;
  height: 64px;
  left: 8px; /* Centered in 80px container */
  top: 8px;
  border: 4px solid rgba(204, 204, 204, 0.35); /* Background circle */
  border-radius: 50%;
}

.progress-circle-inner {
  box-sizing: border-box;
  position: absolute;
  width: 64px;
  height: 64px;
  left: 8px;
  top: 8px;
  border: 12px solid #DEDEDE; /* Progress fill */
  border-radius: 50%;
  transform: rotate(180deg); /* Adjust for progress percentage */
}

.progress-percentage {
  position: absolute;
  width: 26px;
  height: 18px;
  left: 27px; /* Centered */
  top: 31px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  display: flex;
  align-items: center;
  color: #000000;
}
```

**Usage:** Progress indicators, completion status, circular progress displays

**Key Measurements:**
- **Container:** 80px × 80px
- **Circle:** 64px diameter
- **Border Width:** 4px (background), 12px (progress)
- **Font Size:** 14px for percentage

### Logo and Name (Vertical Layout)

```css
.logo-name-vertical {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: 98px; /* or appropriate width */
  height: 38px;
}

.logo-icon {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.logo-text {
  width: 98px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  color: #666666;
}
```

**Usage:** Brand displays, logo-text combinations, vertical icon-text pairs

### Logo and Name (Horizontal Layout)

```css
.logo-name-horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 56px; /* or appropriate width */
  height: 18px;
}

.logo-icon-horizontal {
  width: 16px;
  height: 16px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.logo-text-horizontal {
  width: 34px; /* or flex: 1 */
  height: 18px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #666666;
}
```

**Usage:** Inline brand displays, compact logo-text combinations, horizontal icon-text pairs

### Icon with Two-Line Text

```css
.icon-two-line-text {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 68px; /* or appropriate width */
  height: 26px;
}

.icon-large {
  width: 24px;
  height: 24px;
  background: #DEDEDE;
  flex-shrink: 0;
}

.two-line-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  width: 36px; /* or appropriate width */
  height: 26px;
}

.line-1 {
  width: 36px; /* or 100% */
  height: 13px;
  font-size: 10px;
  font-weight: 500; /* Medium */
  line-height: 13px;
  color: #3C3C43;
}

.line-2 {
  width: 36px; /* or 100% */
  height: 13px;
  font-size: 10px;
  font-weight: 400; /* Regular */
  line-height: 13px;
  color: #666666;
}
```

**Usage:** Icon with two-line labels, compact metadata displays, icon with subtitle

**Key Measurements:**
- **Icon:** 24px × 24px
- **Text Lines:** 10px font, 13px line-height
- **Gap:** 8px between icon and text

### Part + Value Text Pattern

```css
.part-value-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  width: 51px; /* or appropriate width */
  height: 35px;
}

.part-label {
  width: 44px; /* or 100% */
  height: 15px;
  font-size: 12px;
  font-weight: 500; /* Medium */
  line-height: 15px;
  color: #666666;
}

.value-text {
  width: 51px; /* or 100% */
  height: 18px;
  font-size: 14px;
  font-weight: 400; /* Regular */
  line-height: 18px;
  color: #181818;
}
```

**Usage:** Label-value pairs, metadata displays, part-number combinations

### Number Badge (Square)

```css
.number-badge-square {
  position: absolute;
  width: 32px;
  height: 32px;
  /* Position as needed */
}

.badge-background {
  position: absolute;
  left: 0%;
  right: 0%;
  top: 0%;
  bottom: 0%;
  background: #DEDEDE;
  border-radius: 0px; /* Square badge */
}

.badge-number {
  position: absolute;
  left: 34.38%; /* Centered */
  right: 31.25%;
  top: 15.62%;
  bottom: 12.5%;
  font-size: 18px;
  font-weight: 500; /* Medium */
  line-height: 23px;
  display: flex;
  align-items: center;
  color: #3C3C43;
}
```

**Usage:** Number indicators, step badges, square number badges

**Key Measurements:**
- **Size:** 32px × 32px (square)
- **Font:** 18px, medium weight
- **Color:** #3C3C43 (dark gray)

### Progress Bar (Compact)

```css
.progress-bar-compact {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  width: 97px; /* or appropriate width */
  height: 23px;
}

.progress-bar-track {
  width: 97px; /* or 100% */
  height: 6px;
  position: relative;
}

.progress-bar-bg {
  position: absolute;
  height: 6px;
  left: 0px;
  right: 0px;
  top: 0px;
  background: rgba(222, 222, 222, 0.8); /* Semi-transparent background */
}

.progress-bar-fill {
  position: absolute;
  height: 6px;
  left: 0px;
  right: 22px; /* Adjust for percentage */
  top: 0px;
  background: #3C3C43;
  transform: matrix(-1, 0, 0, 1, 0, 0); /* Right-to-left fill */
}

.progress-indicator {
  width: 44px;
  height: 15px;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: rgba(102, 102, 102, 0.8);
}
```

**Usage:** Compact progress indicators, inline progress bars, status displays

**Key Measurements:**
- **Width:** 97px (compact)
- **Height:** 6px
- **Font:** 12px for percentage indicator

### Component Library Summary

**Component Types:**
- **Containers:** Dashed border containers for component boundaries
- **Progress Indicators:** Circular (80px) and linear (97px) progress bars
- **Logo Patterns:** Vertical and horizontal logo-text combinations
- **Icon Patterns:** Icon with single text, icon with two-line text
- **Badges:** Square number badges (32px)
- **Text Patterns:** Part-value pairs, label-value combinations

**Key Measurements:**
- **Progress Circle:** 80px container, 64px circle, 14px percentage font
- **Number Badge:** 32px × 32px square
- **Icon Sizes:** 16px (small), 24px (standard)
- **Text Sizes:** 10px (two-line labels), 12px (labels), 14px (body), 18px (badge numbers)
- **Gaps:** 2px (tight), 4px (logo-text vertical), 6px (logo-text horizontal), 8px (icon-text)

**Border Patterns:**
- **Dashed Border:** 2px dashed rgba(36, 36, 36, 0.81) for component boundaries
- **Dashed Border (Purple):** 1px dashed #7B61FF for component library references

---

## Accessibility & Contrast Checklist

- **Contrast:** Body text ≥ 4.5:1; large text (≥24px or 18px semibold) ≥ 3:1. On dark tags (#3C3C43) use white (100% or 80%).
- **Focus:** Always show `:focus-visible` (1–2px outline or shadow) on interactive elements; avoid removing outlines.
- **Targets:** Min 44×44 for tap/click; space inline items to avoid overlap.
- **Keyboard:** Ensure tab order matches visual order; all controls reachable via keyboard.
- **Motion:** Prefer none; respect `prefers-reduced-motion`; keep subtle transitions only.
- **Overlays/Glass:** Maintain contrast; provide solid fallback if blur unsupported; avoid text on low-contrast imagery without a scrim.

## Responsive & Density Rules

- **Breakpoints (guideline):** <640px stack content; 640–1024px 1–2 columns; >1024px 2–3 columns as needed.
- **Card widths:** Aim 220–600px; avoid ultra-wide cards; wrap tags and icon rows on narrow viewports.
- **Spacing defaults:** Use 8/16/24 for most layouts. Compact mode: 4/12; Spacious mode: 32/40/48. Avoid inventing new gaps unless documented.
- **Radii defaults:** 6/8/12/24; keep consistent per surface. Do not mix new radii.
- **Headlines:** 18/20/24 only; 32 reserved for numbers/metrics; clamp text on narrow screens.
- **Images/Media:** Respect aspect; max-width: 100%; use placeholders (#DEDEDE) when loading.
- **Overflow:** Prefer wrapping over truncation for body text; if truncating, provide tooltip or full text access.

## Measurements Appendix (Canonical)

- **Spacing:** Core 8/16/24; Alternates 4/12/28/32/40/48/56/64/96; Rare: 118/144 for special icon rows.
- **Padding:** 16×24 (standard), 18×24 (large), 24 (xl), 24×32 (wide), 32×24 (large top), 48×24 (extra top), 96×24 (hero top), 48×24×24 (asymmetric).
- **Radii:** 6 (rounded square), 8 (small), 12 (default cards), 24 (hero), 100 (pill). Use existing tokens; do not add new.
- **Icons:** 12 (tiny header), 16 (small), 24 (standard), 36 (medium).
- **Tags:** Widths 54/60/74/75/80/82/110/118/148/249; Heights 27/31/34; Padding 6×16, 6×8, 8, 8×12, 8×16, 8×18; Radius 6/8/12/100.
- **Images:** 40/48/56 (avatars), 80 (logo), 100–120 (grid), 162–188–222–280×188–292×300–300, 200×350 (side image), 277×72 (bg strip).
- **Type:** Body 14/16; Subhead 16/18; Headline 18/20/24; Display numbers 24.5/32; Small copy 10/12/13.
- **Dividers:** 1px (#C4C4C4/#E6E6E6/rgba(222,222,222,0.8)); Underline 2px #3C3C43.

## Pattern Card Template

Use this template when adding a new pattern.

- **What:** Short name and purpose.
- **When to use:** Situations it solves; when *not* to use.
- **Specs:** Size, gaps, padding, radius, fonts, colors (tokens only), states.
- **Do / Don’t:** 2–3 bullets each.
- **Variants:** Dense/Spacious, With image/No image, Tag/No tag.
- **Accessibility:** Contrast note, focus behavior, target size, truncation policy.
- **Example:** Minimal code snippet with tokens.

## How to Add or Change Patterns

1) Reuse tokens: check color/type/spacing/radius lists; do not introduce new raw values.
2) Pick nearest layout pattern; avoid creating new layouts unless necessary.
3) Document with the Pattern Card Template: include when-to-use, specs, accessibility.
4) Link to Measurements Appendix instead of repeating numbers.
5) If changing a token or scale, update: token table, Measurements Appendix, and any referenced pattern notes.
6) Validate: contrast (AA), focus-visible, responsive wrap at <640px, tap targets 44×44.
7) Note variants (compact/spacious) and defaults (use 8/16/24 spacing, 6/8/12/24 radii).

---

_Last updated: December 2025_
