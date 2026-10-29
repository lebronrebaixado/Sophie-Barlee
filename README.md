# Sophie-Barlee

An editable Shopify Online Store 2.0 theme and server-rendered visual Preview. The Shopify theme is the commerce implementation; the Preview is for layout review only and does not accept orders.

## Public visual Preview

[Open the GitHub Pages Preview](https://lebronrebaixado.github.io/Sophie-Barlee/). This static, `noindex` page does not support purchases, product search, newsletter sign-ups or personal-data collection.

## Shopify theme

Build the installable archive with `python3 scripts/package-theme.py`; output: `dist/sophie-barlee-shopify-theme.zip`. In Shopify Admin, go to **Online Store → Themes → Add theme → Upload zip file** and add it as an unpublished theme. Choose real navigation menus and collections in the theme editor, review the campaign images and legal pages, and test the draft theme before any publication.

The default theme copy is British English (`en.default.json`). The fixed theme UI is also translated into Belgian French (`fr-BE.json`) and Belgian Dutch (`nl-BE.json`). No Portuguese locale or fixed Portuguese theme copy is shipped. The native language selector displays only languages Shopify has enabled and published. To activate French and Dutch, add and publish each under **Settings → Languages**, assign them to the intended Markets and translate product/collection data, menus, pages, policies and blog content with Shopify Translate & Adapt. Blank optional theme-editor copy fields use locale-aware defaults; manually entered overrides need their own translations. Checkout and email notification settings are managed separately.

Five generated editorial campaign images are included as fallback assets (desktop/mobile hero, two editorial panels and a panoramic banner). They are campaign imagery, not product photography or availability claims.

## Preview and data status

The server reads public product and collection data through the configured Storefront API and does not write store data or expose its token to the browser. Run with Node 22+ using `pnpm start` (port 3000); `pnpm check` checks JavaScript and Python syntax. The homepage, collection, product, search and empty-bag routes are server-rendered. The Preview is not the live Shopify theme and should remain `noindex`.

The Shopify Storefront API was checked read-only on 29 October 2026 and returned active products plus the `ESSENTIALS`, `NEW IN` and `ACCESSORIES` collections; more products remain paginated. Some of the first 20 active product records contain Portuguese titles, types or descriptions. Theme locale files do not translate that merchant-authored content; use Shopify Translate & Adapt to translate product, collection, menu, page and policy content before claiming the entire storefront is Portuguese-free. No catalogue records were modified.

This session has no authorised Shopify theme upload or activation operation. The theme ZIP is prepared, but no theme was uploaded, activated or published; the active theme and commercial settings were not changed.

## Typography

Cormorant Garamond and Montserrat are bundled locally under SIL Open Font License 1.1. Font assets and their notices are included in the theme and the public Preview.
