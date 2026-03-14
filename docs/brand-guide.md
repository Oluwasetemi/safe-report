# SafeReport — Brand Guide
**Version:** 1.0.0
**Status:** Approved
**Date:** March 2026

---

## Aesthetic Direction: "Hi-Vis Signal"

SafeReport borrows its visual language from emergency infrastructure — the chartreuse of a safety vest, the condensed boldness of a road works sign, the high-contrast urgency of caution tape. Most civic tech looks like a government form. SafeReport looks like it belongs at the scene.

**One sentence:** *Electric urgency on midnight black.*

**The feeling:** You open the app and immediately feel that something real is happening. Not alarming — but awake. Alive. The kind of interface that makes people trust it works.

---

## Color System

### Brand Colors

| Token | Name | Hex | RGB | Usage |
|---|---|---|---|---|
| `--brand-primary` | Signal Chartreuse | `#C8FF00` | 200, 255, 0 | Logo, primary CTAs, SafeGuide accent, active states |
| `--brand-primary-dim` | Dim Chartreuse | `#9ECC00` | 158, 204, 0 | Hover state for primary elements |
| `--brand-on-primary` | Night | `#070D1A` | 7, 13, 26 | Text sitting ON chartreuse backgrounds |
| `--brand-secondary` | Emergency Ember | `#FF5722` | 255, 87, 34 | Secondary accents, urgency indicators |

### Surface Colors (Dark — Authority Dashboard)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--surface-base` | Midnight | `#070D1A` | App background, dashboard base |
| `--surface-raised` | Deep Navy | `#0D1829` | Cards, panels, sidebars |
| `--surface-overlay` | Navy | `#142035` | Modals, dropdowns, hover overlays |
| `--surface-border` | Steel | `#1E2D47` | Dividers, card borders |
| `--surface-muted` | Slate | `#2A3F5F` | Disabled elements, subtle borders |

### Surface Colors (Light — Public Map & Citizen UI)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--surface-light-base` | Cloud | `#F4F6F9` | Page background |
| `--surface-light-raised` | White | `#FFFFFF` | Cards, report form, panels |
| `--surface-light-border` | Mist | `#E2E8F0` | Dividers, input borders |
| `--surface-light-muted` | Fog | `#94A3B8` | Placeholder text, secondary labels |

### Text Colors

| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| `--text-primary` | `#F1F5F9` | `#070D1A` | Headlines, body copy |
| `--text-secondary` | `#7B9CC4` | `#475569` | Labels, metadata, timestamps |
| `--text-muted` | `#4A6080` | `#94A3B8` | Placeholder text, captions |
| `--text-inverse` | `#070D1A` | `#FFFFFF` | Text on brand-primary bg |

---

## Functional / Severity Colors

These colors carry semantic meaning on the map and in alert states. They are **not** for decoration — use them only in their defined contexts. They must never be reassigned.

| Token | Name | Hex | Context |
|---|---|---|---|
| `--severity-critical` | Alarm Red | `#FF2323` | CRITICAL pins, active emergency alerts, pulsing map pins |
| `--severity-high` | Hazard Orange | `#FF6B00` | HIGH severity, official evacuation zones (orange pins) |
| `--severity-medium` | Caution Amber | `#FFB800` | MEDIUM severity reports |
| `--severity-low` | Signal Blue | `#00AAFF` | LOW severity, civic complaints (blue pins) |
| `--severity-resolved` | Clear Green | `#00D26A` | Resolved incidents, resolved pins |
| `--crime-zone` | Crime Purple | `#9F5CF5` | Crime 300m vague zone on public map |
| `--severity-critical-bg` | Red Wash | `#FF232318` | Background tint behind critical alerts |
| `--severity-resolved-bg` | Green Wash | `#00D26A18` | Background tint behind resolved status |

---

## Typography

### Font Stack

| Role | Family | Weights | Source |
|---|---|---|---|
| **Display / Headlines** | Barlow Condensed | 600, 700, 800 | Google Fonts |
| **Body / UI** | Barlow | 400, 500, 600 | Google Fonts |
| **Monospace / IDs** | Space Mono | 400, 700 | Google Fonts |

**Why Barlow?** Barlow Condensed is the font of emergency signage, road infrastructure, and civic systems. It packs high information density into small spaces — essential for a mobile reporting app — while carrying authority and urgency. The condensed variant gives headlines impact; the regular variant stays highly readable at small sizes.

**Why Space Mono?** Ticket numbers (`POT-482910-07`), report IDs, timestamps, and coordinates demand a mono face. Space Mono adds a slight retro-terminal character that distinguishes data from prose.

### Type Scale

| Name | Font | Weight | Size (rem) | Line Height | Usage |
|---|---|---|---|---|---|
| `display-xl` | Barlow Condensed | 800 | 3.5rem | 1.0 | Hero / landing |
| `display-lg` | Barlow Condensed | 700 | 2.5rem | 1.05 | Page titles |
| `display-md` | Barlow Condensed | 700 | 2rem | 1.1 | Section headers |
| `heading-lg` | Barlow Condensed | 600 | 1.5rem | 1.2 | Card headers, dashboard panels |
| `heading-md` | Barlow | 600 | 1.125rem | 1.3 | Sub-section labels |
| `body-lg` | Barlow | 400 | 1rem | 1.6 | Primary body copy |
| `body-md` | Barlow | 400 | 0.875rem | 1.6 | Secondary copy, descriptions |
| `label-lg` | Barlow | 600 | 0.875rem | 1.4 | Button text, form labels |
| `label-sm` | Barlow | 500 | 0.75rem | 1.4 | Tags, badges, metadata |
| `mono-md` | Space Mono | 400 | 0.875rem | 1.5 | Ticket numbers, IDs |
| `mono-sm` | Space Mono | 400 | 0.75rem | 1.5 | Coordinates, timestamps |

---

## Shape & Spacing

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Badges, tags, small chips |
| `--radius-md` | 8px | Buttons, inputs, small cards |
| `--radius-lg` | 12px | Cards, panels, modals |
| `--radius-xl` | 16px | Bottom sheets, large modals |
| `--radius-full` | 9999px | Map pins, avatar circles, pill badges |

### Spacing Scale
Follows a base-4 scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px.

### Touch Targets
**Minimum 48×48px** for all interactive elements. No exceptions — this app must work for users with large fingers, gloves, or impaired dexterity.

---

## Iconography

**Library:** [Lucide React](https://lucide.dev)

- Stroke width: `1.5` (default) — do not mix stroke widths
- Size standard: `16px` (inline), `20px` (button icon), `24px` (standalone / nav)
- Never fill icons — stroke-only maintains consistency

**Category icons used on map pins:**

| Category | Lucide Icon |
|---|---|
| Fire / Explosion | `Flame` |
| Flooding | `Waves` |
| Medical | `HeartPulse` |
| Building Collapse | `Building2` |
| Power Line | `Zap` |
| Road / Pothole | `Construction` |
| Crime | `ShieldAlert` |
| Garbage / Utility | `Trash2` |
| Landslide | `MountainSnow` |
| Environmental | `Leaf` |
| SafeGuide | `Bot` |

---

## Component Signatures

### Map Pins

Pins are filled circles with a white category icon centered inside. Size scales from 28px (low confidence) to 44px (high confidence + critical). Critical pins have a pulsing red ring animation.

```
Size:       28px → 36px → 44px  (confidence: low → medium → high)
Shape:      circle, rounded-full
Icon:       white Lucide icon, centered, 50% of pin diameter
Border:     2px white ring
Animation:  critical pins → pulsing ring using severity-critical color
```

### Severity Badges

```
CRITICAL  →  bg: severity-critical-bg,  text: severity-critical,  border: severity-critical
HIGH      →  bg: hazard orange wash,    text: severity-high
MEDIUM    →  bg: amber wash,            text: severity-medium
LOW       →  bg: blue wash,             text: severity-low
RESOLVED  →  bg: severity-resolved-bg,  text: severity-resolved
```
Font: `label-sm`, Barlow 600. Padding: 2px 8px. Radius: `radius-sm`. UPPERCASE.

### Primary Button

```
Background:   brand-primary (#C8FF00)
Text:         brand-on-primary (#070D1A), label-lg, Barlow 600
Padding:      12px 24px
Radius:       radius-md (8px)
Hover:        brand-primary-dim (#9ECC00), slight scale(1.02)
Active:       scale(0.98)
Min height:   48px
```

### Report Form Bottom Sheet

```
Background:   surface-light-raised (light) / surface-raised (dark)
Border top:   2px brand-primary
Radius:       radius-xl radius-xl 0 0 (top corners only)
Handle:       4×40px pill, surface-muted color, centered top
Animation:    slides up from bottom, 300ms ease-out
```

### Emergency Card (post-submission)

```
Background:   surface-raised with severity-critical-bg tint (if critical)
Left border:  4px solid severity-critical
Content:      department name, number, one-tap call button
Call button:  severity-resolved green, Lucide Phone icon, full-width
```

### Authority Triage Card

```
Background:   surface-raised (#0D1829)
Border:       1px surface-border
Left accent:  4px solid (severity color of incident)
New alert:    brand-primary left accent + subtle glow
Font:         heading-md for incident title, body-md for details
Timestamp:    mono-sm, text-muted
```

---

## SafeGuide Identity

SafeGuide has a sub-brand identity within SafeReport.

| Element | Value |
|---|---|
| Accent color | Signal Chartreuse `#C8FF00` |
| Icon | Lucide `Bot` (20px, chartreuse) |
| FAB button | 56px circle, surface-raised bg, chartreuse icon + border |
| Active state | Pulsing chartreuse ring (2px, 50% opacity, 1.5s loop) |
| Chat bubble (AI) | surface-overlay bg, chartreuse left border (2px) |
| Chat bubble (user) | brand-primary bg, text brand-on-primary |
| Font | Barlow 400 for responses, Barlow 600 for prompts |

The SafeGuide pulse animation uses chartreuse, not red — it must never be confused with the critical emergency pin pulse.

---

## Motion & Animation

### Principles
- **Purposeful:** Every animation communicates state, not decoration
- **Fast:** UI transitions max 300ms. Map pins max 400ms.
- **Accessible:** Respect `prefers-reduced-motion` — disable non-critical animations

### Key Animations

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `pin-appear` | 400ms | spring (ease-out-back) | New pin drops onto map |
| `pin-pulse` | 1.5s infinite | ease-in-out | Critical emergency pins |
| `sheet-up` | 300ms | ease-out | Bottom sheet report form |
| `card-in` | 200ms | ease-out | Authority triage new alert |
| `badge-pop` | 250ms | spring | Status badge changes |
| `safeguide-pulse` | 1.5s infinite | ease-in-out | SafeGuide FAB when active |
| `alert-flash` | 600ms 3× | ease-in-out | Authority dashboard new critical report |

### Pin Pulse (CSS reference)
```css
@keyframes pin-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--severity-critical) 60%, transparent); }
  50%       { box-shadow: 0 0 0 12px transparent; }
}
```

---

## Accessibility

| Rule | Requirement |
|---|---|
| Contrast ratio | WCAG AA minimum (4.5:1 for normal text, 3:1 for large) |
| Touch targets | 48×48px minimum, 8px gap between targets |
| Focus ring | 2px brand-primary outline, 2px offset — never remove focus styles |
| Font size | 16px body minimum on mobile — never below 14px for any visible text |
| Motion | All non-critical animations disabled under `prefers-reduced-motion` |
| Color alone | Never use color as the only differentiator — always pair with icon or label |
| High contrast mode | `bg-base → #000000`, `text-primary → #FFFFFF`, brand-primary unchanged |

---

## Discreet Mode

When a user activates **Discreet Mode** (crime reporting privacy feature), the entire UI transforms:

- Background: `#F5F5F5` plain white
- All colored elements removed
- Displays as a plain note-taking app
- SafeGuide FAB hidden
- Only a subtle monochrome lock icon indicates the mode is active
- Activated by triple-tap on the SafeGuide button or a preset code

---

## Logo & Wordmark

**Wordmark:** `SAFEREPORT` — Barlow Condensed 800, uppercase, tracked at +0.05em
**Color:** Signal Chartreuse `#C8FF00` on dark backgrounds, Midnight `#070D1A` on light backgrounds
**Icon mark:** A map pin shape with a Wi-Fi/signal arc inside — representing live reporting
**Clearspace:** Minimum 16px around the wordmark on all sides
**Minimum size:** 80px wide (wordmark), 24px (icon mark only)

---

## Dos and Don'ts

### Do
- Use Barlow Condensed for all headlines — it creates the "SafeReport look"
- Let Signal Chartreuse appear sparingly — it should feel electric when it appears
- Use Space Mono for all data values, IDs, coordinates, and ticket numbers
- Give pins room to breathe — generous map padding makes the map readable
- Use uppercase for severity badges and status labels — it reads faster at a glance

### Don't
- Don't use brand-primary (chartreuse) for severity indicators — severity has its own colors
- Don't mix icon stroke widths — always 1.5px
- Don't reduce touch targets below 48px — this app must work for everyone
- Don't animate the SafeGuide pulse and a critical pin pulse at the same time on screen without distinction — they use different colors for a reason
- Don't use Geist, Inter, Roboto, or Arial — they make SafeReport look like every other app

---

*SafeReport Brand Guide v1.0.0 — March 2026*
*Every pixel should feel like it belongs at the scene.*
