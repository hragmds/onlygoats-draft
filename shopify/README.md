# OnlyGoatz Parallax Hero — Shopify install

A self-contained Three.js hero that replaces the homepage video slideshow with
real graded-card slabs that drift with subtle depth-parallax as you scroll.

## What's in this folder

- `assets/og-hero.min.js` — the whole effect (Three.js bundled in), one file.
- `og-hero.liquid` — the theme section (markup + editor settings + init).
- `test-harness.html` — a local preview page; not uploaded to Shopify.

## Card images

Shopify asset filenames can't contain spaces, so the six card scans ship under
these exact names. Rename the repo's `public/assets/` files accordingly before
upload:

| Upload as              | From (`public/assets/`)         |
| ---------------------- | ------------------------------- |
| `jordan-fleer.jpg`     | `Jordan Fleer front.jpg`        |
| `gretzky-opc.jpg`      | `Gretzky OPC front.jpg`         |
| `trout-bowman.jpg`     | `Trout Bowman Auto front.jpg`   |
| `tiger-woods.jpg`      | `Tiger Woods Front.jpg`         |
| `henderson-topps.jpg`  | `Henderson Topps front.jpg`     |
| `jordan-star.jpg`      | `Jordan Star front.jpg`         |
| `og-card-back.png`     | `back.png`                      |

## Install (Shopify admin)

1. **Online Store → Themes → ⋯ → Edit code.**
2. **Assets → Add a new asset**, upload `og-hero.min.js` and the seven images
   named exactly as in the table above.
3. **Sections → Add a new section**, name it `og-hero`, delete the starter
   content, paste all of `og-hero.liquid`, and save.
4. **Online Store → Themes → Customize** (theme editor):
   - On the homepage, **Add section → OG Parallax Hero**.
   - Drag it to the very top of the page.
   - Set **Button link** to `/collections/all` (headline/button text default to
     "Unbox the Legends." / "Discover Your GOAT." / "Shop Now").
   - **Hide or remove** the existing video slideshow section.
5. **Save.**

## Notes

- **Reduced motion:** visitors with "reduce motion" enabled see a single static
  composed frame — no animation, no mouse tracking. This is automatic.
- **Performance:** the render loop pauses whenever the hero scrolls off-screen,
  and pixel ratio is capped at 2.
- **Re-styling / re-bundling:** the layout lives in `src/hero/hero-config.js`
  (dev repo). After any engine or config change, run `node build/build-shopify.mjs`
  to regenerate `assets/og-hero.min.js`, then re-upload it. Card coordinates in
  `og-hero.liquid` are passed in per-card, so if you move cards, update both the
  config (for the Astro demo) and the `cards` array in `og-hero.liquid`.
