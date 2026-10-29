# Notas de investigação técnica

- A documentação Shopify descreve Hydrogen como um SDK para storefronts JavaScript renderizados no servidor, com Storefront API client, request handlers e suporte de carrinho. A versão de documentação consultada é `2026-10`. Fonte: [Hydrogen](https://shopify.dev/docs/api/hydrogen/latest).
- Os cart server handlers atuais expõem `/api/cart`; os handlers podem ser registados antes do router com `handleShopifyRoutes`, usando cookie para o ID do carrinho. Fonte: [Cart server handlers](https://shopify.dev/docs/api/hydrogen/2026-10/cart/cart-server-handlers).
- Os cart forms atuais suportam submits com formulários HTML e progressive enhancement. Fonte: [Cart forms](https://shopify.dev/docs/api/hydrogen/2026-10/cart/cart-forms).
- A página de overview de carrinho encontrada está marcada como documentação Legacy para Hydrogen 2026-04 e anteriores; para a versão 2026-10 prevalece a referência atual. Fonte: [Cart overview](https://shopify.dev/docs/storefronts/headless/hydrogen/cart).
- A escolha final é Liquid/Online Store 2.0 porque o pedido exige edição da homepage e dos banners no editor de temas Shopify. Hydrogen foi rejeitado para esta entrega, apesar de ser o default de novas montras headless, porque não satisfaz essa capacidade do editor nativo.

## Observações da loja consultada

- Conta Shopify autorizada: Sophie Barlee.
- `shopify_get_products` para `status:active`: nenhum produto devolvido.
- Storefront API versão consultada: `2026-10`; a consulta pública devolveu zero produtos e uma coleção automática “Home page” vazia.
- Não foi efetuada qualquer mutação Shopify de produtos, coleções, menus, temas ou publicação.
