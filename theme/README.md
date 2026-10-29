# Sophie Barlee Shopify theme

An Online Store 2.0 Liquid theme. Sections are editable in the Shopify theme editor; navigation and merchandising use real Shopify objects, without demo products.

The package contains three complete theme locales: `en.default.json` (British English default), `fr-BE.json` (Belgian French), and `nl-BE.json` (Belgian Dutch). It contains no Portuguese locale. The language selector uses Shopify's native localization form and displays only languages currently enabled and published by the merchant. The Liquid document `lang` attribute follows the active language. Shopify's `stylesheet_tag` filter loads the theme CSS.

Locale files translate fixed theme copy only. Leave optional theme-editor copy overrides blank to retain the active locale's default wording, or supply a translation for each active language. Merchant-authored content—product titles/descriptions/options, collection titles/descriptions, navigation menus, pages, policies, blog content and email notifications—must be translated and published in Shopify. Add and publish French and Dutch under **Settings → Languages**, assign each to the intended Markets, then translate catalogue and page content with Shopify Translate & Adapt. Theme locale files do not activate languages or change Markets.

Five generated editorial campaign images are included as fallbacks: a desktop hero, a mobile hero, two editorial panels and a panoramic campaign banner. These are not product photos or product availability claims; each image can be replaced in the theme editor.

Before publishing: install the ZIP as an unpublished theme, check that CSS, fonts, images and all three locales render correctly, configure the real menu and collections, review size-guide/policy/contact pages, test product variants and the native bag/checkout, and validate all product/commercial/legal facts. No store language setting, active theme, catalogue item or publication state has been changed by building this theme.
