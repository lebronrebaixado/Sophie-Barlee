# Sophie-Barlee

A entrega contém um tema **Shopify Online Store 2.0** editável no editor de temas e uma pré-visualização server-rendered deste desenho. O tema é a implementação de comércio; a pré-visualização serve para rever a hierarquia visual e não recebe encomendas.

## Preview público

[Abrir o preview público no GitHub Pages](https://lebronrebaixado.github.io/Sophie-Barlee/). É uma página estática, marcada para não ser indexada, que serve apenas para rever o desenho. Não permite compras, pesquisa de catálogo nem subscrições; não recolhe dados pessoais.

## Pré-visualização

O servidor lê apenas dados públicos do catálogo através da Storefront API configurada no projeto. Não grava dados nem expõe o token no HTML. Para correr localmente em Node 22+, usa `pnpm start` (porta 3000); `pnpm check` verifica a sintaxe JavaScript e Python. A rota `/manus-routes.json` declara as páginas do Preview.

A homepage, coleção, produto, pesquisa e estado vazio do carrinho são servidos como HTML inicial. O Preview está marcado `noindex` porque não é a loja publicada. O carrinho/checkout de compras real só funciona no tema Shopify instalado.

## Tema Shopify

O tema instalável é gerado por `python3 scripts/package-theme.py` em `dist/sophie-barlee-shopify-theme.zip`. No Shopify Admin, abre **Loja online → Temas → Adicionar tema → Carregar ficheiro zip** e instala-o como tema não publicado. Depois, escolhe menus e coleções reais no editor, configura páginas de guia de tamanhos e políticas e testa o carrinho antes de publicar.

O ZIP atualizado inclui cinco imagens editoriais geradas como fallback — hero desktop/mobile, dois banners e campanha panorâmica — e mantém os seletores de imagem editáveis. São imagens de campanha, não fotografias nem prova de artigos disponíveis. Inclui os locales `pt-PT.json` e `en.default.json`; a folha de estilos usa o filtro nativo Shopify `stylesheet_tag`.

A integração disponível nesta sessão não expõe escrita/instalação de temas. Por isso, o ZIP não foi carregado para a loja nem publicado; o tema ativo e os dados comerciais não foram alterados.

## Estado observado

A conta Shopify Sophie Barlee estava autorizada. Não existem produtos ativos e a única coleção devolvida pela Storefront API foi “Home page”, vazia. Não foram criados produtos, preços, stocks, coleções, menus, políticas, contactos, reviews nem descontos.

## Tipografia

Cormorant Garamond e Montserrat são servidas a partir dos assets locais do tema para evitar pedidos do navegador a Google Fonts. Os avisos SIL Open Font License 1.1 acompanham os ficheiros em `theme/assets/` e no ZIP.
