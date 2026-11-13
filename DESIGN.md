---
name: Woobi
description: Interactive 3D wardrobe and tactile dressing room studio — Good outfits. Already yours.
colors:
  botanical-olive: "#52634B"
  deep-moss: "#3F4C39"
  sage-leaf: "#64775B"
  warm-linen: "#FAF9F6"
  studio-canvas: "#F8F7F4"
  pure-atelier: "#FFFFFF"
  sandstone-tint: "#F3EFE8"
  stone-hairline: "#E8E3D8"
  chalk-divider: "#EFECE6"
  charcoal-ink: "#1D201C"
  slate-moss: "#4A5147"
  muted-sage: "#7A8174"
  ash-pebble: "#9FA499"
  crimson-alert: "#D94F4F"
  amber-ochre: "#E09F3E"
  meadow-success: "#4E8752"
typography:
  display:
    fontFamily: "'DM Serif Display', 'Playfair Display', Georgia, serif"
    fontSize: "2.45rem"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.6px"
  headline:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "1.45rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0em"
  title:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0em"
  body:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "3.5px"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "30px"
  phone: "48px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.botanical-olive}"
    textColor: "{colors.pure-atelier}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "13px 20px"
  button-primary-hover:
    backgroundColor: "{colors.deep-moss}"
  button-secondary:
    backgroundColor: "{colors.pure-atelier}"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.sandstone-tint}"
  chip-default:
    backgroundColor: "{colors.pure-atelier}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  chip-active:
    backgroundColor: "{colors.botanical-olive}"
    textColor: "{colors.pure-atelier}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  card-surface:
    backgroundColor: "{colors.pure-atelier}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.md}"
    padding: "10px"
  input-select:
    backgroundColor: "{colors.pure-atelier}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  nav-bar:
    backgroundColor: "{colors.warm-linen}"
    textColor: "{colors.muted-sage}"
    height: "64px"
    padding: "6px 14px"
---

# Design System: Woobi

## Overview

**Creative North Star: "The Tactile Dressing Room"**

Woobi pairs the calm warmth of a daylight dressing room with the spatial clarity of an interactive 3D wardrobe studio. Surfaces stay intentionally quiet—warm alabaster linen, raw stone hairlines, and crisp cotton cards—so garments, fabric swatches, and the 3D mannequin always command visual focus without competing chrome.

On the web studio (and its synced WebView surface), depth is expressed through tonal layering and whispered ambient lift rather than heavy drop shadows. For native Android surfaces, Material Design 3 governs structural navigation and ergonomics, adopting Android Dynamic Color (Material You) as the primary scheme on Android 12+ while anchoring the static fallback and brand identity in Woobi's Botanical Olive and Warm Linen palette.

**Key Characteristics:**
- Warm organic light-canvas surfaces (`#FAF9F6`, `#F8F7F4`, `#F3EFE8`) that let garment photography and 3D materials read accurately.
- Botanical Olive (`#52634B`) reserved for primary actions, active navigation states, and selected filter pills.
- High-contrast editorial serif headlines paired with crisp, legible sans-serif UI controls and metadata.
- Android-ready ergonomics: Material You primary theming with Woobi Olive fallback, `48×48 dp` minimum native touch targets, and edge-to-edge safe-area awareness.

## Colors

A sunlit, neutral-warm wardrobe palette built around alabaster linen surfaces and a single restrained botanical olive accent.

### Primary
- **Botanical Olive** (`#52634B`): Primary CTAs, active filter chips, selected bottom-navigation tabs, and focused interactive borders.
- **Deep Moss** (`#3F4C39`): Hover and pressed state for primary olive buttons and high-emphasis interactive anchors.
- **Sage Leaf** (`#64775B`): Secondary olive accent for subtle highlights and soft tint derivations.

### Neutral
- **Warm Linen** (`#FAF9F6`): Primary viewport and phone-frame canvas background.
- **Studio Canvas** (`#F8F7F4`): Outer studio backdrop framing the mobile viewport and editorial panels.
- **Pure Atelier** (`#FFFFFF`): Elevated garment cards, secondary outlined buttons, select inputs, and modal surfaces.
- **Sandstone Tint** (`#F3EFE8`): Subtle garment image wells, hover fills for secondary surfaces, and soft section grouping.
- **Stone Hairline** (`#E8E3D8`): Primary `1px` structural borders on cards, inputs, chips, and progress tracks.
- **Chalk Divider** (`#EFECE6`): Light internal separators between list rows and secondary containers.
- **Charcoal Ink** (`#1D201C`): Primary headings, body copy, and active icon strokes.
- **Slate Moss** (`#4A5147`): Secondary subheadings, form labels, and supporting descriptions.
- **Muted Sage** (`#7A8174`): Inactive navigation tabs and helper hints (audit against WCAG AA `4.5:1` on light linen surfaces).
- **Ash Pebble** (`#9FA499`): Disabled indicators and subtle overflow action icons.

### Tertiary
- **Crimson Alert** (`#D94F4F`): Destructive actions and validation errors.
- **Amber Ochre** (`#E09F3E`): Caution states and non-blocking advisories.
- **Meadow Success** (`#4E8752`): Confirmation badges and completed wardrobe progress states.

### Named Rules
**The Quiet Backdrop Rule.** Saturated color belongs on garments and the primary olive CTA—never on whole-screen backgrounds. Keep `≥85%` of every screen in warm linen, sandstone, and pure white surfaces.
**The Android Dynamic Fallback Rule.** Native Android screens adopt Material You dynamic color schemes on Android 12+ while mapping Woobi's Botanical Olive (`#52634B`) and Warm Linen (`#FAF9F6`) directly into the static Material 3 color scheme fallback.

## Typography

**Display Font:** `'DM Serif Display', 'Playfair Display', Georgia, serif`
**Body Font:** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (native Android falls back to Roboto mapped through the Material 3 type scale)
**Label/Mono Font:** `'Plus Jakarta Sans'` uppercase tracked labels (`3.5px` tracking) for editorial kickers and studio section tags.

**Character:** Editorial serif titles bring wardrobe-lookbook poise to greetings and hero screens, while a neutral geometric sans handles dense garment metadata, sizing, and studio controls cleanly.

### Hierarchy
- **Display** (700 bold, `2.45rem`, line-height `1.14`, tracking `-0.6px`): Editorial welcome and feature hero headlines.
- **Headline** (500 medium, `1.45rem`, line-height `1.25`): Screen titles and editorial pitch headings.
- **Title** (600 semibold, `0.92rem`, line-height `1.35`): Primary button labels, card footers, and section headers.
- **Body** (400 regular, `14px`, line-height `1.45`): Supporting copy, garment descriptions, and form values (`65–75ch` max measure on desktop).
- **Label** (700 bold, `0.72rem`, line-height `1.2`, tracking `3.5px`, uppercase): Studio taglines and compact metadata tags (keep interactive web/Android UI labels at legible `≥12px` / `12sp` minimum).

### Named Rules
**The Serif-Anchor Rule.** Reserve serif faces for display titles and editorial brand marks; never set dense form fields, garment tags, or bottom-bar tabs in serif.

## Layout

On desktop viewports (`≥768px`), Woobi frames an editorial brand left-rail alongside a centered `420px` mobile studio viewport (`max-height: 890px`). On mobile viewports and Android WebView/native screens, content fills `100vw × 100dvh` edge-to-edge with `16px 22px` body padding (`22px` horizontal rhythm) and a fixed `64px` bottom navigation bar respecting `env(safe-area-inset-bottom)` and Android window insets. Two-column garment grids use `12px` gaps (`grid-template-columns: 1fr 1fr`), while form rows pair a `90px` label column with a flexible control column (`12px` gap).

## Elevation & Depth

Woobi follows a **tonal & whispered lift** depth model. At rest, cards, chips, and inputs sit flat against Warm Linen (`#FAF9F6`) and are separated by tonal shifts (`#FFFFFF` on `#FAF9F6`, `#F3EFE8` inside image wells) and `1px` Stone Hairline borders (`#E8E3D8`). Ambient shadows appear sparingly—only for floating navigation glass, circular overlay tools, hover lift, and the desktop phone bezel.

### Shadow Vocabulary
- **Card Whisper** (`box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04)`): Subtle resting separation for elevated summary cards.
- **Hover Lift** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08)`): Gentle interactive elevation on pointer hover.
- **Navigation Veil** (`box-shadow: 0 -4px 20px rgba(26, 31, 25, 0.04)`): Soft upward boundary under the frosted bottom navigation bar.
- **Desktop Studio Frame** (`box-shadow: 0 30px 80px -15px rgba(26, 31, 25, 0.22), 0 0 0 1px #D6D0C5`): Grounding shadow for the `420px` mobile preview bezel on desktop.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat and border-defined at rest; reserve lift (`translateY(-1px)` and hover shadows) for active pointer feedback or top-level floating chrome.

## Shapes

Corners follow a continuous soft-organic scale from small controls (`6px` xs, `10px` sm for buttons and inputs) to garment cards (`14px` md), featured review frames (`20px` lg), modal sheets (`30px` xl), and full pills (`9999px`) for filter chips and circular icon actions. Borders stay uniformly crisp at `1px solid #E8E3D8` (shifting to Botanical Olive `#52634B` on hover or active focus).

## Components

Tactile, border-defined controls with calm resting states and crisp olive activation.

### Buttons
- **Shape:** Softly rounded rectangle (`10px` radius; `12px` on hero welcome CTAs).
- **Primary:** Botanical Olive fill (`#52634B`), Pure Atelier text (`#FFFFFF`), `13px 20px` padding, `600` weight.
- **Hover / Focus:** Shifts to Deep Moss (`#3F4C39`) with a subtle `1px` upward lift (`transform: translateY(-1px)`).
- **Secondary / Ghost:** Pure Atelier fill (`#FFFFFF`), `1px solid #E8E3D8` border, Charcoal Ink text (`#1D201C`), `12px 20px` padding; hovers to Sandstone Tint (`#F3EFE8`) with an olive border. Text links use transparent background and underline on hover.

### Chips
- **Style:** Full pill (`9999px` radius), Pure Atelier fill (`#FFFFFF`), `1px solid #E8E3D8` border, `8px 16px` padding, `0.82rem` semibold text.
- **State:** Active/selected chips switch to Botanical Olive fill (`#52634B`) and border with Pure Atelier text (`#FFFFFF`).

### Cards / Containers
- **Corner Style:** Softly rounded (`14px` radius; `20px` on full-bleed review frames).
- **Background:** Pure Atelier (`#FFFFFF`) cards with Sandstone Tint (`#F3EFE8`) inner `1:1` garment wells (`10px` radius).
- **Shadow Strategy:** Flat at rest with a `1px solid #E8E3D8` hairline; shifts border to Botanical Olive on hover.
- **Internal Padding:** `10px` on compact garment grid cards.

### Inputs / Fields
- **Style:** Pure Atelier (`#FFFFFF`) fill, `1px solid #E8E3D8` stroke, `10px` radius, `10px 14px` padding.
- **Focus:** Highlight border with Botanical Olive (`#52634B`) and clear `focus-visible` indicator.

### Navigation
- **Style:** Fixed `64px` bottom bar with frosted Warm Linen glass (`rgba(250, 249, 246, 0.96)` + `backdrop-filter: blur(20px)`), `1px` top stone divider, and safe-area bottom inset padding. Active tabs adopt Botanical Olive (`#52634B`) icon stroke and `700` weight label; native Android maps this structure to a Material 3 Navigation Bar (compact) or Navigation Rail (expanded).

## Do's and Don'ts

### Do:
- **Do** keep `≥85%` of screen area in warm linen, sandstone, and white surfaces so garment colors and 3D renders stay color-accurate.
- **Do** enforce `≥48×48 dp` native Android touch targets and `≥4.5:1` WCAG AA text contrast (darkening `#7A8174` / `#8C7B68` muted text on cream backgrounds where needed).
- **Do** use exponential deceleration easing (`cubic-bezier(0.16, 1, 0.3, 1)`) for panels and tab transitions.

### Don't:
- **Don't** use elastic/bounce `cubic-bezier` curves (`>1.0` overshoot) on drawers, cards, or modals.
- **Don't** render tiny micro-text (`<12px`) for interactive labels, taglines, or metadata on mobile/Android screens.
- **Don't** ship default Material template purple (`#6650A4` / `#D0BCFF`) as Woobi's fallback theme in `android-app`—use Material You dynamic color with Botanical Olive + Warm Linen static fallback.

