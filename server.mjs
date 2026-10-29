import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();
const STORAGE_IMAGES = {
  hero: '/manus-storage/async-images/juFru1RO3bRAqqDvzphegV/image-1.webp',
  heroMobile: '/manus-storage/async-images/juFru1RO3bRAqqDvzphegV/image-2.webp',
  everyday: '/manus-storage/async-images/juFru1RO3bRAqqDvzphegV/image-3.webp',
  accessories: '/manus-storage/async-images/juFru1RO3bRAqqDvzphegV/image-4.webp',
  campaign: '/manus-storage/async-images/juFru1RO3bRAqqDvzphegV/image-5.webp',
};
const PRODUCT_FIELDS = `id title handle description availableForSale featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } }`;
const CATALOG_QUERY = `query SophieBarleePreview {
  products(first: 8, sortKey: CREATED_AT, reverse: true) { nodes { ${PRODUCT_FIELDS} } }
  collections(first: 24) {
    nodes { id title handle description image { url altText } products(first: 8) { nodes { ${PRODUCT_FIELDS} } } }
  }
  shop { name privacyPolicy { url title } termsOfService { url title } shippingPolicy { url title } refundPolicy { url title } }
}`;
const PRODUCT_QUERY = `query SophieBarleeProduct($handle: String!) {
  product(handle: $handle) {
    id title handle description availableForSale featuredImage { url altText }
    images(first: 12) { nodes { url altText } }
    options { name values }
    variants(first: 100) { nodes { id title availableForSale price { amount currencyCode } selectedOptions { name value } } }
    priceRange { minVariantPrice { amount currencyCode } }
  }
}`;

let cachedCatalog = null;
let cacheExpires = 0;
const productCache = new Map();

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function safeUrl(value = '') {
  return /^https:\/\//i.test(String(value)) ? escapeHtml(value) : '';
}
function formatPrice(amount, currencyCode) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '';
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currencyCode || 'EUR' }).format(value); }
  catch { return `${value.toFixed(2)} ${escapeHtml(currencyCode || '')}`; }
}
async function storefrontRequest(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) throw new Error('Storefront API credentials are not configured in the project runtime.');
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2026-10';
  const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`Storefront API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join('; '));
  return payload.data || {};
}
async function getCatalog() {
  if (cachedCatalog && Date.now() < cacheExpires) return cachedCatalog;
  try {
    const data = await storefrontRequest(CATALOG_QUERY);
    const catalog = {
      connected: true,
      products: data.products?.nodes || [],
      collections: (data.collections?.nodes || []).filter((item) => item.products?.nodes?.length),
      shop: data.shop || null,
    };
    cachedCatalog = catalog;
    cacheExpires = Date.now() + 30_000;
    return catalog;
  } catch (error) {
    console.error('Storefront catalog lookup failed:', error.message);
    return { connected: false, products: [], collections: [], shop: null };
  }
}
async function getProduct(handle) {
  const cached = productCache.get(handle);
  if (cached && Date.now() < cached.expires) return cached.product;
  try {
    const data = await storefrontRequest(PRODUCT_QUERY, { handle });
    const product = data.product || null;
    productCache.set(handle, { product, expires: Date.now() + 30_000 });
    return product;
  } catch (error) {
    console.error('Storefront product lookup failed:', error.message);
    return null;
  }
}
function productCard(product) {
  const image = product.featuredImage;
  const price = product.priceRange?.minVariantPrice;
  return `<article class="product-card"><a class="product-photo" href="/products/${encodeURIComponent(product.handle)}" aria-label="${escapeHtml(product.title)}">${image?.url ? `<img src="${safeUrl(image.url)}" alt="${escapeHtml(image.altText || product.title)}" loading="lazy">` : '<span class="image-placeholder" aria-hidden="true"></span>'}${product.availableForSale ? '' : '<span class="product-status">Out of stock</span>'}</a><div class="product-card-copy"><a href="/products/${encodeURIComponent(product.handle)}">${escapeHtml(product.title)}</a><span class="product-price">${formatPrice(price?.amount, price?.currencyCode)}</span></div></article>`;
}
function nav(catalog) {
  if (!catalog.collections.length) return '<a href="/collections/all">Collections</a>';
  return catalog.collections.slice(0, 6).map((collection) => `<a href="/collections/${encodeURIComponent(collection.handle)}">${escapeHtml(collection.title)}</a>`).join('');
}
function header(catalog) {
  return `<div class="announcement">Discover the new Sophie Barlee collection.</div><header class="site-header"><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle><span class="sr-only">Open menu</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span></button><a class="wordmark" href="/" aria-label="Sophie Barlee home page"><span class="wordmark-mark" aria-hidden="true">S</span><span>SOPHIE BARLEE</span></a><nav id="primary-navigation" class="primary-navigation" aria-label="Main navigation" data-primary-navigation>${nav(catalog)}</nav><div class="header-actions"><a class="header-link" href="/search">Search</a><a class="header-link" href="/cart" aria-label="Shopping bag">Bag <span class="cart-count">0</span></a></div></header>`;
}
function productGrid(products, query = '') {
  if (!products.length) {
    const title = query ? 'We could not find any results for this search.' : 'No products are available yet.';
    const copy = query ? 'Try another search or explore the available collections.' : 'New arrivals will appear here when products are available in the shop.';
    return `<div class="catalog-empty"><p class="eyebrow">The Sophie Barlee selection</p><h3>${title}</h3><p>${copy}</p></div>`;
  }
  return `<div class="product-grid">${products.map(productCard).join('')}</div>`;
}
function collectionCards(collections) {
  if (!collections.length) return '';
  return `<section class="section collection-section" aria-labelledby="collections-title"><div class="section-heading"><div><p class="eyebrow">Choose your next chapter</p><h2 id="collections-title">Discover the collections</h2></div></div><div class="collection-grid">${collections.slice(0, 5).map((collection, index) => {
    const image = collection.image?.url || collection.products?.nodes?.[0]?.featuredImage?.url;
    return `<a class="collection-card" href="/collections/${encodeURIComponent(collection.handle)}"><div class="collection-image">${image ? `<img src="${safeUrl(image)}" alt="${escapeHtml(collection.image?.altText || collection.title)}" loading="lazy">` : '<span class="image-placeholder" aria-hidden="true"></span>'}<span class="collection-index">0${index + 1}</span></div><h3>${escapeHtml(collection.title)}</h3><span class="text-link">Discover <span aria-hidden="true">↗</span></span></a>`;
  }).join('')}</div></section>`;
}
function categoryRail(collections) {
  if (!collections.length) return '';
  return `<section class="category-rail section" aria-label="Explore collections"><div class="rail-heading"><div><p class="eyebrow">Find your rhythm</p><h2>Explore by collection</h2></div></div><div class="rail-scroll">${collections.slice(0, 7).map((collection) => `<a class="category-tile" href="/collections/${encodeURIComponent(collection.handle)}">${collection.image?.url ? `<img src="${safeUrl(collection.image.url)}" alt="${escapeHtml(collection.image.altText || collection.title)}" loading="lazy">` : ''}<span class="category-label">${escapeHtml(collection.title)}</span><span class="category-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>`;
}
function policyLinks(shop) {
  if (!shop) return '';
  return [shop.shippingPolicy, shop.refundPolicy, shop.privacyPolicy, shop.termsOfService].filter((policy) => policy?.url).map((policy) => `<a href="${safeUrl(policy.url)}">${escapeHtml(policy.title)}</a>`).join('');
}
function shell(catalog, content, { title = 'Sophie Barlee — Define your style', description = 'Styles to take you from everyday moments to special occasions.', image = '', status = 200 } = {}) {
  const policies = policyLinks(catalog.shop);
  const imageTag = safeUrl(image);
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f7f4ee"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Sophie Barlee"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">${imageTag ? `<meta property="og:image" content="${imageTag}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageTag}">` : ''}<link rel="stylesheet" href="/theme-assets/sophie.css"><script src="/theme-assets/sophie.js" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a>${header(catalog)}<main id="main">${content}</main><footer class="site-footer"><div class="footer-main"><div class="footer-brand"><a class="footer-wordmark" href="/">SOPHIE BARLEE</a><p>Define your style. Write your own rules.</p></div><nav class="footer-policies" aria-label="Shop policies">${policies || '<span>Shop policies will appear here when configured in Shopify.</span>'}</nav></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Sophie Barlee</span><span>Your style. Your signature.</span></div></footer>${catalog.connected ? '' : '<p class="connection-note">The Shopify catalogue is unavailable right now. This preview does not change or store any shop data.</p>'}</body></html>`;
  return { status, html };
}
function renderHome(catalog) {
  const products = catalog.products.filter((product) => product.availableForSale);
  const categories = categoryRail(catalog.collections);
  const editorial = `<section class="editorial section" aria-label="Editorial collections"><a class="editorial-panel" href="/collections/all"><img src="${STORAGE_IMAGES.everyday}" alt="Editorial womenswear portrait in ivory and sand tones" loading="lazy"><span class="editorial-overlay"><span class="eyebrow">For every day</span><strong>Everyday Elegance</strong><span>Versatile pieces to elevate your everyday looks.</span><span class="text-link">Explore the collection <span aria-hidden="true">↗</span></span></span></a><a class="editorial-panel" href="/collections/all"><img src="${STORAGE_IMAGES.accessories}" alt="Editorial portrait with understated accessories" loading="lazy"><span class="editorial-overlay"><span class="eyebrow">The finishing touch</span><strong>The Accessories Edit</strong><span>The details that bring personality to every outfit.</span><span class="text-link">Explore accessories <span aria-hidden="true">↗</span></span></span></a></section>`;
  const content = `<section class="hero"><picture><source media="(max-width: 700px)" srcset="${STORAGE_IMAGES.heroMobile}"><img class="hero-image" src="${STORAGE_IMAGES.hero}" alt="Sophie Barlee editorial campaign in a warm-toned urban interior"></picture><div class="hero-shade"></div><div class="hero-copy"><p class="eyebrow">SOPHIE BARLEE · THE NEW SEASON</p><h1>Discover your<br>next look.</h1><p>Styles to take you from everyday moments to special occasions.</p><a class="button button-light" href="/collections/all">Explore the collection <span aria-hidden="true">↗</span></a></div><span class="hero-caption">Your style. Your signature.</span></section>${categories}${collectionCards(catalog.collections)}${editorial}<section class="campaign"><img class="campaign-image" src="${STORAGE_IMAGES.campaign}" alt="Sophie Barlee editorial campaign featuring three women in contemporary looks" loading="lazy"><div class="campaign-shade"></div><div class="campaign-copy"><p class="eyebrow">A PERSONAL EXPRESSION</p><h2>THE SOPHIE EDIT</h2><p>A curated selection to express your style.</p><a class="button button-light" href="/collections/all">Explore the edit <span aria-hidden="true">↗</span></a></div></section><section class="section arrivals" aria-labelledby="arrivals-title"><div class="section-heading"><div><p class="eyebrow">Just in</p><h2 id="arrivals-title">New arrivals</h2></div></div>${productGrid(products)}</section><section class="newsletter"><div class="newsletter-copy"><p class="eyebrow">Get the latest</p><h2>Step into the<br>Sophie Barlee world.</h2><p>Receive new arrivals, style inspiration and updates on upcoming collections.</p></div><form class="newsletter-form" data-preview-newsletter><label for="newsletter-email">Your email address</label><div class="newsletter-field"><input id="newsletter-email" name="email" type="email" autocomplete="email" required placeholder="you@example.co.uk"><button type="submit">Subscribe <span aria-hidden="true">↗</span></button></div><label class="consent"><input type="checkbox" name="consent" required><span>I agree to receive updates by email. I can unsubscribe at any time.</span></label><p class="form-feedback" aria-live="polite"></p></form></section>`;
  return shell(catalog, content, { image: '' });
}
function renderCollection(catalog, handle) {
  const isAll = handle === 'all';
  const collection = isAll ? null : catalog.collections.find((item) => item.handle === handle);
  const products = isAll ? catalog.products.filter((product) => product.availableForSale) : (collection?.products?.nodes || []).filter((product) => product.availableForSale);
  if (!isAll && !collection) return shell(catalog, '<section class="section not-found-page"><p class="eyebrow">404 · Sophie Barlee</p><h1>This collection is unavailable.</h1><a class="button button-dark" href="/">Back to the home page</a></section>', { title: 'Collection not found — Sophie Barlee', status: 404 });
  const title = isAll ? 'All products' : collection.title;
  const description = collection?.description || 'Explore the Sophie Barlee styles in this collection.';
  const image = collection?.image?.url || '';
  const content = `<section class="section collection-page"><header class="collection-heading">${image ? `<img class="collection-hero-image" src="${safeUrl(image)}" alt="${escapeHtml(collection.image?.altText || title)}">` : ''}<p class="eyebrow">Sophie Barlee · Collections</p><h1>${escapeHtml(title)}</h1>${!isAll && collection.description ? `<p class="collection-description">${escapeHtml(collection.description)}</p>` : ''}<p class="collection-count">${products.length} ${products.length === 1 ? 'product' : 'products'} in this preview</p></header>${productGrid(products)}</section>`;
  return shell(catalog, content, { title: `${title} — Sophie Barlee`, description, image });
}
async function renderProduct(catalog, handle) {
  const product = await getProduct(handle);
  if (!product) return shell(catalog, '<section class="section not-found-page"><p class="eyebrow">404 · Sophie Barlee</p><h1>This product is unavailable.</h1><a class="button button-dark" href="/collections/all">Explore the collection</a></section>', { title: 'Product not found — Sophie Barlee', status: 404 });
  const imageNodes = product.images?.nodes || [];
  const variant = product.variants?.nodes?.find((item) => item.availableForSale) || product.variants?.nodes?.[0];
  const price = variant?.price || product.priceRange?.minVariantPrice;
  const gallery = imageNodes.map((image) => `<figure class="product-gallery-item"><img src="${safeUrl(image.url)}" alt="${escapeHtml(image.altText || product.title)}" loading="lazy"></figure>`).join('');
  const options = product.options?.filter((option) => option.name !== 'Title' && option.values?.length > 1).map((option) => `<div class="variant-option"><label for="preview-option-${escapeHtml(option.name)}">${escapeHtml(option.name)}</label><select id="preview-option-${escapeHtml(option.name)}" disabled>${option.values.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></div>`).join('') || '';
  const content = `<section class="product-main section"><div class="product-gallery">${gallery}</div><div class="product-information"><p class="eyebrow">Sophie Barlee</p><h1>${escapeHtml(product.title)}</h1><p class="product-detail-price">${formatPrice(price?.amount, price?.currencyCode)}</p>${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}${options}<button class="button button-dark add-to-cart" type="button" disabled>${product.availableForSale ? 'Add to bag' : 'Out of stock'}</button><p class="preview-note">The cart and checkout use Shopify’s native checkout; this preview does not place orders.</p></div></section>`;
  return shell(catalog, content, { title: `${product.title} — Sophie Barlee`, description: product.description || `Discover ${product.title} at Sophie Barlee.`, image: product.featuredImage?.url || '' });
}
function renderSearch(catalog, query) {
  const term = String(query || '').trim().toLocaleLowerCase('en-GB');
  const matches = term ? catalog.products.filter((product) => `${product.title} ${product.description || ''} ${product.handle}`.toLocaleLowerCase('en-GB').includes(term)) : [];
  const content = `<section class="section search-page"><header class="section-heading"><div><p class="eyebrow">Sophie Barlee</p><h1>Search</h1></div></header><form action="/search" method="get" role="search" class="search-form"><label for="SearchInput">What are you looking for?</label><div class="newsletter-field"><input id="SearchInput" type="search" name="q" value="${escapeHtml(query)}" placeholder="What are you looking for?"><button type="submit">Search <span aria-hidden="true">↗</span></button></div></form>${term ? productGrid(matches, term) : '<p class="catalog-empty">Enter a product name to search the catalogue.</p>'}</section>`;
  return shell(catalog, content, { title: 'Search — Sophie Barlee', description: 'Search products available at Sophie Barlee.' });
}
function renderCart(catalog) {
  const content = `<section class="section cart-page"><header class="section-heading"><div><p class="eyebrow">Sophie Barlee</p><h1>Your bag</h1></div></header><div class="catalog-empty"><h2>Your bag is empty.</h2><p>The native Shopify cart and checkout are not available on this visual preview.</p><a class="button button-dark" href="/collections/all">Continue exploring</a></div></section>`;
  return shell(catalog, content, { title: 'Shopping bag — Sophie Barlee', description: 'This preview shows an empty bag state.' });
}
function render404(catalog) {
  return shell(catalog, '<section class="section not-found-page"><p class="eyebrow">404 · Sophie Barlee</p><h1>This page is unavailable.</h1><p>The address may have changed or the page may no longer exist.</p><a class="button button-dark" href="/">Back to the home page</a></section>', { title: 'Page not found — Sophie Barlee', status: 404 });
}
const mimeTypes = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2' };
async function handleStatic(pathname, response) {
  let file;
  if (pathname.startsWith('/theme-assets/')) file = resolve(ROOT, 'theme/assets', pathname.slice('/theme-assets/'.length));
  else if (pathname.startsWith('/assets/')) file = resolve(ROOT, 'public/assets', pathname.slice('/assets/'.length));
  else return false;
  const base = pathname.startsWith('/theme-assets/') ? resolve(ROOT, 'theme/assets') : resolve(ROOT, 'public/assets');
  if (!file.startsWith(base + sep) && file !== base) { response.writeHead(403); response.end(); return true; }
  try {
    const bytes = await readFile(file);
    response.writeHead(200, { 'content-type': mimeTypes[extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
    response.end(bytes);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Asset not found');
  }
  return true;
}
const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/healthz') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }
  if (url.pathname === '/manus-routes.json') {
    try {
      const routes = await readFile(resolve(ROOT, 'public/manus-routes.json'));
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      response.end(routes);
    } catch { response.writeHead(500); response.end(); }
    return;
  }
  if (await handleStatic(url.pathname, response)) return;
  const catalog = await getCatalog();
  let result;
  if (url.pathname === '/') result = renderHome(catalog);
  else if (url.pathname === '/search') result = renderSearch(catalog, url.searchParams.get('q') || '');
  else if (url.pathname === '/cart') result = renderCart(catalog);
  else if (url.pathname.startsWith('/collections/')) {
    let handle = '';
    try { handle = decodeURIComponent(url.pathname.slice('/collections/'.length)); } catch { handle = ''; }
    result = renderCollection(catalog, handle);
  } else if (url.pathname.startsWith('/products/')) {
    let handle = '';
    try { handle = decodeURIComponent(url.pathname.slice('/products/'.length)); } catch { handle = ''; }
    result = await renderProduct(catalog, handle);
  } else result = render404(catalog);
  response.writeHead(result.status || 200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'strict-origin-when-cross-origin' });
  response.end(result.html);
});
server.listen(PORT, '0.0.0.0', () => console.log(`Sophie Barlee preview listening on port ${PORT}`));
