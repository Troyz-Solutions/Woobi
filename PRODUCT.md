# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Global fashion shoppers and stylists building, organizing, and sharing digital wardrobes.

## Product Purpose

Woobi is a virtual fashion wardrobe and interactive 3D styling studio by Troyz Solutions. It enables users to organize the garments they already own, customize a digital avatar, explore outfit combinations inside a 3D dressing room (wardrobe, stage, mirror, and vanity), try on supported garment representations, and save looks for later.

Success means helping users discover wearable outfits from their existing wardrobe effortlessly and reliably.

## Positioning

"Good outfits. Already yours." Rather than driving users to buy more clothes, Woobi centers on styling and getting more value out of a user's existing wardrobe inside an interactive 3D dressing room.

## Operating Context

- **Current app delivery:** The repository delivers a five-domain modular web application (`modules/core`, `modules/3d-studio`, `modules/3d-studio-features`, `modules/settings`, `modules/backend`) powered by Three.js / WebGL and GLB assets, served by a Node.js HTTP server with local file-backed JSON persistence.
- **Android target (`android-app/`):** Currently wraps the synced web studio (`npm run sync:android`) inside a `WebView` (`MainActivity.kt` loading `https://appassets.androidplatform.net/assets/index.html`) while also containing an initial Jetpack Compose Material 3 scaffold (`com.example.aurawardrobe`). Impeccable's platform target is `android` for native Android UI design work going forward.
- **3D & studio workflows:** Wardrobe organization, avatar customization, virtual try-on, rule/preset-based outfit recommendations, saved looks, and personal settings (account, appearance, privacy, notifications, performance).

## Capabilities and Constraints

- **Factual capability boundaries (must not be overstated):**
  - Virtual try-on applies supported garment representations to the avatar; it is **not** photorealistic cloth simulation for arbitrary user uploads.
  - Outfit recommendations use rule/preset-based matching, color harmony, and occasion scoring; there is **no** independently verified production ML model.
  - The current file-backed JSON storage layer is designed for a single server process in development, not multi-writer production scale.
  - Existing tests and modules do not by themselves imply production launch or real-device sign-off.
- **Native Android expectations:** Future native Android UI must respect Material Design 3 navigation, predictive/system Back handling, edge-to-edge window insets, `sp` typography scaling, and `48×48 dp` minimum touch targets.

## Brand Commitments

- **Brand:** Woobi (by Troyz Solutions)
- **Tagline:** "Good outfits. Already yours."
- **Preserved wording & truthfulness:** Future UI copy and surfaces must stay faithful to Woobi's implemented capabilities without fabricating testimonials, press, benchmarks, or ML/photorealistic claims.

## Evidence on Hand

- Product documentation and architectural boundaries in `README.md`
- Active web UI and design tokens in `index.html`, `styles.css`, `modules/core/shared-ui/tokens.css`, and `modules/core/app/welcome/welcome.css`
- Interactive 3D studio modules and GLB assets (`modules/3d-studio/`, `wardrobe.glb`, `seren_stage.glb`, `seren_vanity.glb`, `seren_avatar.glb`, `woobi_female_mannequin.glb`, `woobi_male_mannequin.glb`)
- Android Gradle project in `android-app/` (`MainActivity.kt`, Jetpack Compose Material 3 theme/navigation scaffold, and synced web assets)
- **Absences:** No verified customer testimonials, third-party press quotes, or production ML accuracy benchmarks exist in the repository; do not invent them.

## Product Principles

1. **Wardrobe-First Utility:** Prioritize helping shoppers and stylists mix, match, and reuse garments already in their closet over shopping prompts.
2. **Spatial Clarity in 3D:** Keep the 3D dressing room, avatar, and styling controls intuitive and responsive on mobile viewports without cluttering the stage.
3. **Honest Capability Framing:** Represent virtual try-on and outfit scoring accurately as supported digital styling tools rather than claiming photorealistic physics or AI magic.
4. **Native Ergonomics on Android:** Respect Android system navigation, safe areas, touch-target sizing, and readability across devices and display scales.

## Accessibility & Inclusion

- Enforce `48×48 dp` minimum touch targets (and equivalent comfortable hit areas on web/WebView) with adequate spacing.
- Support system font scaling (`sp`), edge-to-edge safe-area insets, and WCAG AA text contrast across warm cream and surface layers.
- Ensure system Back navigation and keyboard/screen-reader semantics remain intact across studio views and settings.

