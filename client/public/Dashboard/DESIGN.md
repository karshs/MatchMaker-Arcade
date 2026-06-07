---
name: Human-Centered Matchmaking CRM
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c19'
  on-tertiary-container: '#848480'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-label:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  sidebar_width: 260px
  max_content_width: 1200px
---

## Brand & Style
The design system is built on a foundation of **Modern Minimalism** infused with a **Warm Professionalism**. It targets high-end matchmaking consultants who require a tool that balances high information density with a calm, editorial aesthetic. 

The visual narrative avoids the coldness of traditional enterprise software by prioritizing a "Human-Centered" feel. This is achieved through a clean light palette, refined typography, and a "Quiet UI" approach where tonal shifts and subtle outlines do the heavy lifting rather than aggressive shadows. The goal is to evoke the feeling of a well-organized digital archive—trustworthy, premium, and sophisticated.

## Colors
This design system utilizes a "light" mode to provide a crisp, gallery-like digital environment that emphasizes clarity, portrait photography, and client data.

*   **Foundation:** The interface uses soft whites and subtle off-white surfaces (`#F9F7F2`) to create an open, airy, and inviting atmosphere.
*   **Typography:** Deep charcoal and black tones (`#1A1A1A`) provide high contrast and rigorous legibility against the light background.
*   **Highlights:** Warm Amber (`#D4AF37`) is used sparingly for primary actions, active states, and "VIP" status indicators, providing a sophisticated gold-toned accent that signals premium service.
*   **Semantic Accents:** Muted neutral tones are used for secondary information and status tracking, ensuring the UI feels organized and professional without being visually loud.

## Typography
The system utilizes **Geist** for its precision and neutral, sophisticated character. It provides the clarity of a technical sans-serif while maintaining the elegance required for a premium service.

*   **Scale:** Hierarchy is established through weight and subtle shifts in tracking rather than extreme size differences.
*   **Display:** Large headlines use tighter letter spacing and semi-bold weights to create a "locked-in," professional look.
*   **Labels:** Small UI labels (like metadata in the CRM) use an uppercase mono-variant for a precise, "dossier" feel.
*   **Line Height:** Generous leading is applied to body text to ensure long profiles and consultant notes remain legible and airy.

## Layout & Spacing
The layout philosophy is inspired by **Notion** and **Linear**, combining a fixed-width sidebar for navigation with a fluid but constrained content area.

*   **Grid:** A 12-column fluid grid is used for the main dashboard, but individual profile views adopt a single-column "document" style with a maximum content width of 1200px to prevent lines from becoming too long.
*   **Rhythm:** A 4px baseline grid ensures consistent vertical rhythm. Large margins (40px+) are used at the edges of the application to create "breathing room," emphasizing the premium nature of the tool.
*   **Density:** Information density is "Refined High." Elements are packed closely (small gutters), but significant padding within containers prevents a cluttered appearance.

## Elevation & Depth
This design system avoids heavy drop shadows in favor of **Tonal Layering** and **Low-Contrast Outlines**.

*   **Layering:** The base layer is the lightest surface. Main content areas and side panels are defined by subtle shifts in background warmth and hair-line borders rather than heavy shadows.
*   **Subtle Lift:** When a temporary surface (like a dropdown menu or modal) appears, a very soft, high-diffusion shadow is used to provide just enough depth to signify interaction.
*   **Interactive State:** Hover states are indicated by a subtle shift to a slightly cooler or darker neutral tint.

## Shapes
The shape language is **Precise and Professional**. 

*   **Corner Radii:** Using `roundedness: 1` (0.25rem / 4px) provides a sharper, more disciplined look that feels like high-end stationary or a boutique archival system.
*   **Buttons & Inputs:** These maintain the standard 4px radius for a crisp, organized appearance.
*   **Large Cards:** Profile containers and main dashboard widgets may scale up to an 8px (0.5rem) radius to feel distinct from smaller UI elements.
*   **Consistency:** All interactive elements utilize these sharp-to-soft transitions to maintain a sense of geometric rigor.

## Components
Consistent styling across the CRM components ensures a unified, high-end experience:

*   **Buttons:** Primary buttons use a high-contrast Black background with White text for maximum authority. Secondary buttons use a fine 1px border. The Amber accent is reserved for "Match" or "Success" actions.
*   **Input Fields:** Ghost-style inputs with a subtle bottom border or very faint 1px full border. Focus states use the Amber color for the border highlight.
*   **Cards:** "The Dossier Card" is the core unit. It features a thin border, tonal differentiation from the background, and internal padding of `16px` or `24px`.
*   **Status Chips:** Small, rectangular tags with soft background tints. They maintain a professional, slightly rounded aesthetic (4px radius).
*   **Lists:** Table rows and list items feature a subtle hover state shift. Use "Geist Mono" for ID numbers or date stamps to give a technical, precise feel to data entries.
*   **Profile Avatars:** Circular avatars with a 1px "gold" ring for premium/VIP clients, otherwise a standard borderless circle.