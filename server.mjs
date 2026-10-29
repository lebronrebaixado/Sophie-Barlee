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
  try { return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: currencyCode || 'EUR' }).format(value); }
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
  return `<article class="product-card"><a class="product-photo" href="/products/${encodeURIComponent(product.handle)}" aria-label="${escapeHtml(product.title)}">${image?.url ? `<img src="${safeUrl(image.url)}" alt="${escapeHtml(image.altText || product.title)}" loading="lazy">` : '<span class="image-placeholder" aria-hidden="true"></span>'}${product.availableForSale ? '' : '<span class="product-status">Indisponível</span>'}</a><div class="product-card-copy"><a href="/products/${encodeURIComponent(product.handle)}">${escapeHtml(product.title)}</a><span class="product-price">${formatPrice(price?.amount, price?.currencyCode)}</span></div></article>`;
}
function nav(catalog) {
  if (!catalog.collections.length) return '<a href="/collections/all">Coleções</a>';
  return catalog.collections.slice(0, 6).map((collection) => `<a href="/collections/${encodeURIComponent(collection.handle)}">${escapeHtml(collection.title)}</a>`).join('');
}
function header(catalog) {
  return `<div class="announcement">Descobre a nova coleção Sophie Barlee.</div><header class="site-header"><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle><span class="sr-only">Abrir menu</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span></button><a class="wordmark" href="/" aria-label="Sophie Barlee, página inicial"><span class="wordmark-mark" aria-hidden="true">S</span><span>SOPHIE BARLEE</span></a><nav id="primary-navigation" class="primary-navigation" aria-label="Navegação principal" data-primary-navigation>${nav(catalog)}</nav><div class="header-actions"><a class="header-link" href="/search">Pesquisar</a><a class="header-link" href="/cart" aria-label="Carrinho">Sacola <span class="cart-count">0</span></a></div></header>`;
}
function productGrid(products, query = '') {
  if (!products.length) {
    const title = query ? 'Não encontrámos resultados para esta pesquisa.' : 'Ainda não há artigos disponíveis.';
    const copy = query ? 'Experimenta outra palavra ou explora as coleções disponíveis.' : 'As novidades aparecem aqui quando os artigos estiverem disponíveis na loja.';
    return `<div class="catalog-empty"><p class="eyebrow">A seleção Sophie Barlee</p><h3>${title}</h3><p>${copy}</p></div>`;
  }
  return `<div class="product-grid">${products.map(productCard).join('')}</div>`;
}
function collectionCards(collections) {
  if (!collections.length) return '';
  return `<section class="section collection-section" aria-labelledby="collections-title"><div class="section-heading"><div><p class="eyebrow">Escolhe o teu próximo capítulo</p><h2 id="collections-title">Descobre as coleções</h2></div></div><div class="collection-grid">${collections.slice(0, 5).map((collection, index) => {
    const image = collection.image?.url || collection.products?.nodes?.[0]?.featuredImage?.url;
    return `<a class="collection-card" href="/collections/${encodeURIComponent(collection.handle)}"><div class="collection-image">${image ? `<img src="${safeUrl(image)}" alt="${escapeHtml(collection.image?.altText || collection.title)}" loading="lazy">` : '<span class="image-placeholder" aria-hidden="true"></span>'}<span class="collection-index">0${index + 1}</span></div><h3>${escapeHtml(collection.title)}</h3><span class="text-link">Descobrir <span aria-hidden="true">↗</span></span></a>`;
  }).join('')}</div></section>`;
}
function categoryRail(collections) {
  if (!collections.length) return '';
  return `<section class="category-rail section" aria-label="Explorar coleções"><div class="rail-heading"><div><p class="eyebrow">Encontra o teu ritmo</p><h2>Explora por coleção</h2></div></div><div class="rail-scroll">${collections.slice(0, 7).map((collection) => `<a class="category-tile" href="/collections/${encodeURIComponent(collection.handle)}">${collection.image?.url ? `<img src="${safeUrl(collection.image.url)}" alt="${escapeHtml(collection.image.altText || collection.title)}" loading="lazy">` : ''}<span class="category-label">${escapeHtml(collection.title)}</span><span class="category-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>`;
}
function policyLinks(shop) {
  if (!shop) return '';
  return [shop.shippingPolicy, shop.refundPolicy, shop.privacyPolicy, shop.termsOfService].filter((policy) => policy?.url).map((policy) => `<a href="${safeUrl(policy.url)}">${escapeHtml(policy.title)}</a>`).join('');
}
function shell(catalog, content, { title = 'Sophie Barlee — Define o teu estilo', description = 'Peças que acompanham o teu estilo, do quotidiano às ocasiões especiais.', image = '', status = 200 } = {}) {
  const policies = policyLinks(catalog.shop);
  const imageTag = safeUrl(image);
  const html = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f7f4ee"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Sophie Barlee"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">${imageTag ? `<meta property="og:image" content="${imageTag}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageTag}">` : ''}<link rel="stylesheet" href="/theme-assets/sophie.css"><script src="/theme-assets/sophie.js" defer></script></head><body><a class="skip-link" href="#main">Saltar para o conteúdo</a>${header(catalog)}<main id="main">${content}</main><footer class="site-footer"><div class="footer-main"><div class="footer-brand"><a class="footer-wordmark" href="/">SOPHIE BARLEE</a><p>Define o teu estilo. Escreve as tuas regras.</p></div><nav class="footer-policies" aria-label="Políticas da loja">${policies || '<span>As políticas da loja serão ligadas no Shopify.</span>'}</nav></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Sophie Barlee</span><span>O teu estilo. A tua assinatura.</span></div></footer>${catalog.connected ? '' : '<p class="connection-note">Não foi possível consultar o catálogo Shopify neste momento. Esta pré-visualização não altera nem armazena dados da loja.</p>'}</body></html>`;
  return { status, html };
}
function renderHome(catalog) {
  const products = catalog.products.filter((product) => product.availableForSale);
  const categories = categoryRail(catalog.collections);
  const editorial = `<section class="editorial section" aria-label="Linhas editoriais"><a class="editorial-panel" href="/collections/all"><img src="${STORAGE_IMAGES.everyday}" alt="Retrato editorial de moda feminina em tons de marfim e areia" loading="lazy"><span class="editorial-overlay"><span class="eyebrow">Para todos os dias</span><strong>Everyday Elegance</strong><span>Peças versáteis para elevar os teus looks diários.</span><span class="text-link">Descobrir a coleção <span aria-hidden="true">↗</span></span></span></a><a class="editorial-panel" href="/collections/all"><img src="${STORAGE_IMAGES.accessories}" alt="Retrato editorial com acessórios discretos" loading="lazy"><span class="editorial-overlay"><span class="eyebrow">O detalhe final</span><strong>The Accessories Edit</strong><span>Os detalhes que dão personalidade a cada coordenado.</span><span class="text-link">Explorar acessórios <span aria-hidden="true">↗</span></span></span></a></section>`;
  const content = `<section class="hero"><picture><source media="(max-width: 700px)" srcset="${STORAGE_IMAGES.heroMobile}"><img class="hero-image" src="${STORAGE_IMAGES.hero}" alt="Campanha editorial Sophie Barlee num interior urbano de tons quentes"></picture><div class="hero-shade"></div><div class="hero-copy"><p class="eyebrow">SOPHIE BARLEE · NOVA ESTAÇÃO</p><h1>Descobre o teu<br>próximo look.</h1><p>Peças que acompanham o teu estilo, do quotidiano às ocasiões especiais.</p><a class="button button-light" href="/collections/all">Explorar a coleção <span aria-hidden="true">↗</span></a></div><span class="hero-caption">O teu estilo. A tua assinatura.</span></section>${categories}${collectionCards(catalog.collections)}${editorial}<section class="campaign"><img class="campaign-image" src="${STORAGE_IMAGES.campaign}" alt="Campanha editorial com três mulheres em looks contemporâneos" loading="lazy"><div class="campaign-shade"></div><div class="campaign-copy"><p class="eyebrow">UMA EXPRESSÃO PESSOAL</p><h2>THE SOPHIE EDIT</h2><p>Uma seleção de peças para expressares o teu estilo.</p><a class="button button-light" href="/collections/all">Descobrir a seleção <span aria-hidden="true">↗</span></a></div></section><section class="section arrivals" aria-labelledby="arrivals-title"><div class="section-heading"><div><p class="eyebrow">Descobre primeiro</p><h2 id="arrivals-title">Novas chegadas</h2></div></div>${productGrid(products)}</section><section class="newsletter"><div class="newsletter-copy"><p class="eyebrow">Recebe novidades</p><h2>Entra no universo<br>Sophie Barlee.</h2><p>Recebe novidades, inspirações de estilo e informações sobre novas coleções.</p></div><form class="newsletter-form" data-preview-newsletter><label for="newsletter-email">O teu endereço de email</label><div class="newsletter-field"><input id="newsletter-email" name="email" type="email" autocomplete="email" required placeholder="nome@email.pt"><button type="submit">Subscrever <span aria-hidden="true">↗</span></button></div><label class="consent"><input type="checkbox" name="consent" required><span>Concordo em receber novidades por email. Posso cancelar a subscrição em qualquer momento.</span></label><p class="form-feedback" aria-live="polite"></p></form></section>`;
  return shell(catalog, content, { image: '' });
}
function renderCollection(catalog, handle) {
  const isAll = handle === 'all';
  const collection = isAll ? null : catalog.collections.find((item) => item.handle === handle);
  const products = isAll ? catalog.products.filter((product) => product.availableForSale) : (collection?.products?.nodes || []).filter((product) => product.availableForSale);
  if (!isAll && !collection) return shell(catalog, '<section class="section not-found-page"><p class="eyebrow">404 · Sophie Barlee</p><h1>Esta coleção não está disponível.</h1><a class="button button-dark" href="/">Voltar à página inicial</a></section>', { title: 'Coleção não encontrada — Sophie Barlee', status: 404 });
  const title = isAll ? 'Todas as peças' : collection.title;
  const description = collection?.description || 'Descobre as peças Sophie Barlee disponíveis nesta coleção.';
  const image = collection?.image?.url || '';
  const content = `<section class="section collection-page"><header class="collection-heading">${image ? `<img class="collection-hero-image" src="${safeUrl(image)}" alt="${escapeHtml(collection.image?.altText || title)}">` : ''}<p class="eyebrow">Sophie Barlee · Coleções</p><h1>${escapeHtml(title)}</h1>${!isAll && collection.description ? `<p class="collection-description">${escapeHtml(collection.description)}</p>` : ''}<p class="collection-count">${products.length} ${products.length === 1 ? 'artigo' : 'artigos'} nesta pré-visualização</p></header>${productGrid(products)}</section>`;
  return shell(catalog, content, { title: `${title} — Sophie Barlee`, description, image });
}
async function renderProduct(catalog, handle) {
  const product = await getProduct(handle);
  if (!product) return shell(catalog, '<section class="section not-found-page"><p class="eyebrow">404 · Sophie Barlee</p><h1>Este artigo não está disponível.</h1><a class="button button-dark" href="/collections/all">Explorar a coleção</a></section>', { title: 'Artigo não encontrado — Sophie Barlee', status: 404 });
  const imageNodes = product.images?.nodes || [];
  const variant = product.variants?.nodes?.find((item) => item.availableForSale) || product.variants?.nodes?.[0];
  const price = variant?.price || product.priceRange?.minVariantPrice;
  const gallery = imageNodes.map((image) => `<figure class="product-gallery-item"><img src="${safeUrl(image.url)}" alt="${escapeHtml(image.altText || product.title)}" loading="lazy"></figure>`).join('');
  const options = product.options?.filter((option) => option.name !== 'Title' && option.values?.length > 1).map((option) => `<div class="variant-option"><label for="preview-option-${escapeHtml(option.name)}">${escapeHtml(option.name)}</label><select id="preview-option-${escapeHtml(option.name)}" disabled>${option.values.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></div>`).join('') || '';
  const content = `<section class="product-main section"><div class="product-gallery">${gallery}</div><div class="product-information"><p class="eyebrow">Sophie Barlee</p><h1>${escapeHtml(product.title)}</h1><p class="product-detail-price">${formatPrice(price?.amount, price?.currencyCode)}</p>${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}${options}<button class="button button-dark add-to-cart" type="button" disabled>${product.availableForSale ? 'Carrinho ativo no tema Shopify' : 'Indisponível'}</button><p class="preview-note">O carrinho e o checkout são nativos no tema Shopify; esta pré-visualização não inicia compras.</p></div></section>`;
  return shell(catalog, content, { title: `${product.title} — Sophie Barlee`, description: product.description || `Descobre ${product.title} na Sophie Barlee.`, image: product.featuredImage?.url || '' });
}
function renderSearch(catalog, query) {
  const term = String(query || '').trim().toLocaleLowerCase('pt-PT');
  const matches = term ? catalog.products.filter((product) => `${product.title} ${product.description || ''} ${product.handle}`.toLocaleLowerCase('pt-PT').includes(term)) : [];
  const content = `<section class="section search-page"><header class="section-heading"><div><p class="eyebrow">Sophie Barlee</p><h1>Pesquisa</h1></div></header><form action="/search" method="get" role="search" class="search-form"><label for="SearchInput">O que procuras?</label><div class="newsletter-field"><input id="SearchInput" type="search" name="q" value="${escapeHtml(query)}" placeholder="O que procuras?"><button type="submit">Pesquisar <span aria-hidden="true">↗</span></button></div></form>${term ? productGrid(matches, term) : '<p class="catalog-empty">Escreve o nome de um artigo para pesquisar no catálogo.</p>'}</section>`;
  return shell(catalog, content, { title: 'Pesquisa — Sophie Barlee', description: 'Pesquisa artigos disponíveis na Sophie Barlee.' });
}
function renderCart(catalog) {
  const content = `<section class="section cart-page"><header class="section-heading"><div><p class="eyebrow">Sophie Barlee</p><h1>O teu carrinho</h1></div></header><div class="catalog-empty"><h2>O teu carrinho está vazio.</h2><p>O carrinho e o checkout nativos estarão disponíveis no tema Shopify instalado.</p><a class="button button-dark" href="/collections/all">Continuar a explorar</a></div></section>`;
  return shell(catalog, content, { title: 'Carrinho — Sophie Barlee', description: 'A pré-visualização mostra o estado vazio do carrinho.' });
}
function render404(catalog) {
  return shell(catalog, '<section class="section not-found-page"><p class="eyebrow">404 · Sophie Barlee</p><h1>Esta página não está disponível.</h1><p>O endereço pode ter mudado ou a página já não existe.</p><a class="button button-dark" href="/">Voltar à página inicial</a></section>', { title: 'Página não encontrada — Sophie Barlee', status: 404 });
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
