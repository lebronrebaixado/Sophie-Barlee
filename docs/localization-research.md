# Shopify locale implementation notes

Research checked against official Shopify developer documentation on 29 October 2026.

- Shopify storefront locale files use JSON under `theme/locales/`; filenames follow IETF language tags with lowercase language and uppercase region, such as `en-GB.json`, `fr-BE.json` and `nl-BE.json`. A theme has exactly one default locale file named `*.default.json`; this project keeps `en.default.json` as its British-English default. Shopify permits at most 3,400 translations per locale file and 1,000 characters per value. [Locale-file documentation](https://shopify.dev/docs/storefronts/themes/architecture/locales) [Storefront locale-file documentation](https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files)
- Storefront translations are rendered with Liquid's `t` filter against the active Shopify language. Locale files do not translate merchant content such as product descriptions or collection names by themselves; those content records need Shopify's translation tooling. [Storefront locale-file documentation](https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files)
- Shopify exposes enabled languages through `localization.available_languages` and the current language through `localization.language`. A customer language selector belongs inside `{% form 'localization' %}` and submits `language_code`; it should only appear when more than one language is enabled on the store. [Liquid localization object](https://shopify.dev/docs/api/liquid/objects/localization) [Multiple currencies and languages](https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages)
- Theme locale files prepare the theme but do not by themselves publish or activate a language on a store. The store owner must add/publish each language and assign it to the relevant Markets before Shopify exposes it in `available_languages`. No language or storefront publication will be changed as part of this code-only update.

Implementation choice: British English is the default theme copy (`en.default.json`); Belgian French and Belgian Dutch use `fr-BE.json` and `nl-BE.json`. The former Portuguese locale is removed from the theme package.

For the selector, Shopify's localization form submits `language_code`; the language object's `iso_code`, `endonym_name`, `name` and `root_url` are documented Liquid properties. The implementation uses `iso_code` for option values and `endonym_name` for native-language labels, with an accessible translated label. [Localization form tag](https://shopify.dev/docs/api/liquid/tags/form) [Shop locale object](https://shopify.dev/docs/api/liquid/objects/shop_locale)

## Store-language activation and merchant content (29 October 2026)

Shopify's current admin path is **Settings → Languages**. There, the merchant adds and publishes languages, changes the store's default language, and assigns languages to domains/markets. Published languages receive language-specific URLs and automatic `hreflang` tags. The theme selector therefore lists only `localization.available_languages`, not every locale bundled with the theme. [1] [2]

Shopify Translate & Adapt supports translating products, collections, blog posts, policies and pages, manually or with its AI translation feature. Checkout and email-notification language behavior is managed separately after languages are published. [1] [3]

Changing the default language can remove translations for the language promoted to default; Shopify advises exporting translations before that change. The theme update itself does not modify store language, Markets settings or published status. [2]

### References

[1]: https://help.shopify.com/en/manual/international/languages "Shopify localization and translation"
[2]: https://help.shopify.com/en/manual/international/languages/manage-languages "Shopify manage store languages"
[3]: https://help.shopify.com/en/manual/international/languages/translate-adapt-app "Shopify Translate and Adapt"

## Read-only catalogue audit (29 October 2026)

A Storefront API request returned 20 active product records on the first page, with more products available on subsequent pages. A text scan found clear Portuguese in 10 of those first 20 records' titles, product types or descriptions. The API also returned the real collections `ESSENTIALS`, `NEW IN` and `ACCESSORIES`. The Preview homepage currently renders real catalogue data, but the first-page audit means the complete product catalogue cannot yet be described as Portuguese-free. The current Shopify connector supports product-field updates but no dedicated translation-registration workflow was confirmed, so no product fields were overwritten. Shopify Translate & Adapt is the documented path to preserve source content while publishing English, Belgian French and Belgian Dutch merchant-content translations.
