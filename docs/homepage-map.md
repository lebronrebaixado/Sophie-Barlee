# Mapa visual da homepage — Sophie Barlee

**Base analisada:** o anexo desta sessão contém o briefing textual, mas não inclui a imagem visual de referência. O mapa abaixo traduz a sequência de secções descrita no prompt; não representa uma inspeção visual da imagem em falta.

## Percurso vertical

```text
┌──────────────────────────────────────────────────────────────┐
│ 01  Barra superior: “Descobre a nova coleção Sophie Barlee.” │
├──────────────────────────────────────────────────────────────┤
│ 02  Wordmark     Novidades | Roupa | ...     Pesquisar  Sacola│
├──────────────────────────────────────────────────────────────┤
│ 03  HERO panorâmico — campanha + título + CTA                │
│     “Descobre o teu próximo look.”       [Explorar coleção]   │
├──────────────────────────────────────────────────────────────┤
│ 04  CATEGORIAS visuais — rail horizontal; só coleções reais  │
├──────────────────────────────────────────────────────────────┤
│ 05  “Descobre as coleções” — grelha editorial configurável   │
├──────────────────────────────────────────────────────────────┤
│ 06  COLEÇÕES EM DESTAQUE — até 5 cartões Shopify             │
├──────────────────────────────────────────────────────────────┤
│ 07  EDITORIAL — Everyday Elegance | The Accessories Edit     │
├──────────────────────────────────────────────────────────────┤
│ 08  THE SOPHIE EDIT — banner de campanha panorâmico           │
├──────────────────────────────────────────────────────────────┤
│ 09  “Em destaque” — seleções/coleções reais configuráveis     │
├──────────────────────────────────────────────────────────────┤
│ 10  NOVAS CHEGADAS — produtos do catálogo ou estado vazio    │
├──────────────────────────────────────────────────────────────┤
│ 11  NEWSLETTER — email + consentimento explícito              │
├──────────────────────────────────────────────────────────────┤
│ 12  RODAPÉ — apoio, políticas/páginas existentes e contacto   │
└──────────────────────────────────────────────────────────────┘

MOBILE: barra → cabeçalho compacto/menu → hero vertical → rails deslizáveis → banners empilhados → produtos reais/estado vazio → newsletter → rodapé.
```

## Correspondência entre briefing e implementação

| Bloco | Adaptação Sophie Barlee | Fonte dos dados e limite |
|---|---|---|
| Barra + cabeçalho | Mensagem editável, wordmark próprio e menu Shopify | Menu gerido no Shopify; pesquisa e carrinho nativos |
| Hero | Fotografia editorial original, copy e CTA descritos no briefing | Destino selecionável no editor; CTA não aponta para coleção inexistente |
| Categorias | Trilho de imagens e nomes de categoria | Coleções Shopify selecionadas; esconder categorias sem conteúdo |
| Coleções | Cinco propostas editoriais para curadoria | Mostrar só coleções selecionadas com artigos adequados |
| Banners | Everyday Elegance e The Accessories Edit | Imagem/texto/ligação substituíveis no editor |
| Campanha | The Sophie Edit, banner de grande largura | Campos configuráveis; sem desconto ou promessa não confirmada |
| Destaques/novidades | Cards de produto verdadeiros com preço e variantes Shopify | Catálogo real; estado vazio hoje, sem artigos artificiais |
| Newsletter/rodapé | Consentimento claro, links e dados existentes | Email/consentimento e políticas reais; contactos em branco até serem fornecidos |

## Estado do catálogo observado

Na loja selecionada, a consulta de produtos ativos devolveu **zero produtos**. A Storefront API devolveu apenas a coleção automática “Home page”, vazia. Assim, a primeira versão usa o estado sem produtos e deixa merchandising dinâmico pronto para ser preenchido no editor Shopify. Não apresenta cartões de artigos fictícios.
