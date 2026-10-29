---
name: Midnight Dispatch
colors:
  surface: '#09122a'
  surface-dim: '#09122a'
  surface-bright: '#303852'
  surface-container-lowest: '#040d25'
  surface-container-low: '#121b33'
  surface-container: '#161f37'
  surface-container-high: '#202942'
  surface-container-highest: '#2b344d'
  on-surface: '#dae1ff'
  on-surface-variant: '#d7c3b3'
  inverse-surface: '#dae1ff'
  inverse-on-surface: '#273049'
  outline: '#9f8d7f'
  outline-variant: '#524438'
  surface-tint: '#ffb873'
  primary: '#ffc794'
  on-primary: '#4b2800'
  primary-container: '#f2a65a'
  on-primary-container: '#6b3c00'
  inverse-primary: '#8b5006'
  secondary: '#adc6ff'
  on-secondary: '#002e68'
  secondary-container: '#036be0'
  on-secondary-container: '#f2f4ff'
  tertiary: '#f8cb7f'
  on-tertiary: '#422c00'
  tertiary-container: '#dab067'
  on-tertiary-container: '#5f4200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcbf'
  primary-fixed-dim: '#ffb873'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6a3b00'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffdea9'
  tertiary-fixed-dim: '#ebc075'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4100'
  background: '#09122a'
  on-background: '#dae1ff'
  surface-variant: '#2b344d'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Merriweather
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.875rem
    letterSpacing: 0.01em
  body-md:
    fontFamily: Merriweather
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.65rem
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Merriweather
    fontSize: 0.875rem
    fontWeight: '300'
    lineHeight: 1.5rem
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.06em
  incident-mono:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '700'
    lineHeight: 1.25rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system evokes the solitary, hyper-focused atmosphere of a 03:00 incident response rotation merged with the immersive literary depth of an interactive engineering manual. Designed for engineers navigating high-stakes technical scenarios, it balances the focus of a midnight console with the warmth and introspection of classic long-form fiction.

The visual style blends **Tactile Noir** with **Functional Literary Minimalism**. It relies on deep, atmospheric dark surfaces illuminated by warm amber luminescence—mimicking desk lamplight across an engineer's terminal—punctuated by deliberate, stark systemic crisis interventions. Tactile low-profile borders, precise optical alignment, and focused editorial typesetting create an ergonomic, narrative-first interface optimized for extended nocturnal reading and critical decision branches.

## Colors

The palette is tuned specifically for deep night sessions, reducing ocular fatigue while maintaining high semantic differentiation.

- **Canvas & Background Surfaces**: Anchored by `#0f1830` (Base Void), with elevation layers stepping through `#162244` (Surface Layer 1) and `#1e2c56` (Surface Layer 2 / Overlays). Neutral borders and dividers sit at `#2c3d70`. Body text reads in a warm-shifted off-white (`#e4e8f2`) to prevent high-frequency glare against dark midnight backgrounds.
- **Lantern Light (Primary & Interactive)**: `#f2a65a` provides warm, human illumination across primary interactions, active choice paths, reader progress indicators, and interactive key elements. Its highlight companion `#ffd285` drives warm glow effects, focused states, and accent highlights.
- **System Crisis & Anomaly (Secondary / Intervention)**: `#1b73e8` (accent) and `#0a62c9` (surface/fill) are derived from system recovery environments and BSOD telemetry. This blue is strictly quarantined for high-severity incident callouts, production outage branches, real-time alerts, and diagnostic command lines. It must never be used for casual actions or aesthetic decoration.

## Typography

The type ecosystem unifies three distinct disciplines:

1. **System Headings (Space Grotesk)**: Structural, tightly tracked, and muscular. Communicates architecture and chapter progression with mechanical authority.
2. **Narrative Text (Merriweather)**: Provides high legibility and relaxed rhythm for long-form narrative choices and incident walkthroughs. Set with generous line height and warm letterform spacing to reduce visual strain in low-light environments.
3. **Telemetry & Logs (JetBrains Mono)**: Drives timestamps, server telemetry, decision nodes, and system diagnostic overlays with technical precision.

## Layout & Spacing

The layout is built mobile-first, prioritizing one-handed thumb ergonomics and unbroken reading concentration.

- **Column Mechanics**: Single-column reading container capped at a maximum width of `680px` for optimal narrative line length (60–75 characters per line). On desktop breakpoints (`1024px+`), supplementary telemetry, logs, and state indicators unlock into a fixed sidebar column (`320px`), anchoring the reading vessel centrally.
- **Rhythm**: Spacing follows a vertical 4px base rhythm. Large vertical drops (`space-xl`) separate distinct narrative scenes and choice intersections, whereas tight clusters (`space-xs`, `space-sm`) group technical telemetry metadata with their respective outputs.

## Elevation & Depth

Depth is defined through layered surface luminosity and amber radiance rather than high-contrast drop shadows.

- **Atmospheric Layering**: The primary foundation rests on `#0f1830`. Containers and reading cards lift into `#162244`, with elevated floating sheets and choice docks rising to `#1e2c56`. Each tier is delineated by a 1px structural hairline border (`#2c3d70`).
- **Lantern Bloom**: Interactive components that offer tactical decisions cast an amber radial wash: `0 0 20px -4px rgba(242, 166, 90, 0.18)`. Active states pulse gently up to `rgba(242, 166, 90, 0.35)`.
- **Crisis Severity**: Crisis elements completely override amber bloom with hard-edged, zero-blur blue radiance: `0 0 0 1px #1b73e8, 0 8px 24px -4px rgba(10, 98, 201, 0.35)`, asserting systemic emergency.

## Shapes

The interface embraces a low-radius, tactile architectural curvature (`0.25rem` / 4px base). Narrative panels, decision cards, and incident dialogs feature disciplined corners that reflect industrial terminals and tactile hardware manuals rather than rounded consumer apps. Discrete pill shapes are strictly forbidden, preserving an intentional, technical posture.

## Components

### Narrative Choice Buttons
Interactive branching options are rendered as tactile full-width cards with a left-accent indicator. The resting state uses surface `#162244` bordered with `#2c3d70`. On hover or touch target engagement, the left border shifts to `#f2a65a` with an ambient amber internal glow and warm text fill. The branch index key (`[Option A]`) is rendered in `label-mono`.

### Crisis Callouts & Outage Banners
Reserved exclusively for severe infrastructure disruptions and architectural dead-ends. Built with a solid `#0a62c9` left stroke (4px), a dark navy-blue background tint (`#0e1f3d`), and high-contrast system blue typography (`#1b73e8`) for error codes and stack traces. Narrative text inside remains readable off-white.

### Telemetry Status Chips
Compact, monospaced metadata badges indicating server health, current system time (`03:42 UTC`), or operational state. Contained within `#1e2c56` with a 1px border. Status indicator dots use `#f2a65a` for nominal/reading state and flash `#1b73e8` during active system crises.

### Terminal & Code Blocks
Framed with an upper status header displaying simulated environment path and file metadata. Surfaces use deep void `#0b1224` with code syntax highlighting tilted towards lantern ambers, soft teals, and muted indigos.

### Inputs & Toggles
Engineered with zero-fuss 1px borders. Focus states drop default browser outlines in favor of a crisp lantern border `#f2a65a` alongside an inner shadow glow (`0 0 8px rgba(242, 166, 90, 0.2)`). Checkboxes and radios feature square-cut geometry with crisp amber check fills.