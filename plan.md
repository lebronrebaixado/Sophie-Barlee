# Plano — SOPHIE BARLEE

## Decisão de implementação

Construir um tema **Shopify Online Store 2.0 em Liquid**, com secções configuráveis no editor de temas. Esta escolha cumpre diretamente os requisitos de a homepage, banners, imagens, textos, ligações, coleções e navegação serem editáveis no Shopify. Não usar Hydrogen headless: embora a integração Storefront tenha sido ligada, um storefront Hydrogen não disponibiliza estas secções no editor nativo de temas.

O acesso Shopify autorizado confirma que a loja existente «Sophie Barlee» não tem produtos ativos. A Storefront API mostra apenas a coleção automática «Home page», também vazia. Não semear artigos, variantes, preços, avaliações, stock, contactos, dados legais, menus ou condições comerciais. O tema será dinâmico e mostrará produtos/coleções apenas quando os dados reais e as ligações forem configurados.

O anexo disponível contém o briefing textual, mas não a imagem de referência descrita. O mapa de homepage será derivado da arquitetura textual do briefing, sem afirmar uma análise visual da imagem em falta.

## Âmbito

- Criar um tema Liquid completo, preparado para Shopify Online Store 2.0, com secções editáveis, modelos de homepage, coleção, produto, pesquisa, carrinho, página e 404.
- Priorizar a homepage e a identidade visual; criar modelos de produto e coleção conectados aos objetos Shopify e ao inventário real.
- Incluir navegação, pesquisa, links internos, formulários nativos de carrinho/newsletter e estados sem catálogo. Não simular checkout nem pagamento fora da Shopify.
- Criar uma pré-visualização responsiva para revisão visual e um ZIP do tema com instruções de instalação. A pré-visualização não é a loja Shopify nem prova de publicação do tema.
- Não carregar produtos ou criar coleções por conta própria; não instalar apps, comprar serviços, alterar o tema atualmente ativo, publicar, ativar o checkout, ou preencher dados comerciais/legais sem autorização.

## Mapa da homepage

1. Barra superior — copy editável “Descobre a nova coleção Sophie Barlee.”
2. Cabeçalho — wordmark, menu Shopify configurável, pesquisa, conta quando disponível e carrinho; favoritos só se houver suporte real.
3. Hero — imagem e copy editáveis: “Descobre o teu próximo look.”, “Peças que acompanham o teu estilo, do quotidiano às ocasiões especiais.”, CTA “Explorar a coleção”.
4. Categorias — faixa deslizável, alimentada por coleções reais e sem Últimas Oportunidades se não for aplicável.
5. “Descobre as coleções” — blocos de coleções Shopify selecionáveis no editor; mostrar apenas blocos preenchidos e coleções reais.
6. Coleções em destaque — até cinco cartões configuráveis, sem destinos fictícios.
7. Banners editoriais — “Everyday Elegance” e “The Accessories Edit”, ambos editáveis.
8. Campanha — banner panorâmico “THE SOPHIE EDIT”, com imagem, copy e ligação editáveis.
9. “Em destaque” — seleções reais de coleções/produtos, opcionais.
10. Novas chegadas — produtos reais Shopify, preço/variantes/stock conforme catálogo; estado vazio informativo quando não existirem produtos.
11. Newsletter — inscrição voluntária, checkbox não pré-selecionado e copy de consentimento explícita.
12. Rodapé — páginas e políticas Shopify existentes, menu de apoio e contactos apenas quando fornecidos.

## Sistema visual

- **Movimento:** editorial contemporâneo europeu, com composição de campanha e bastante espaço de leitura.
- **Princípios:** hierarquia editorial; merchandising condicionado a dados reais; navegação direta; componentes simples de manter.
- **Paleta:** marfim `#F7F4EE`, areia `#D9CCBC`, taupe `#A59686`, castanho profundo `#40342E`, preto suave `#252525` e branco. Neutros quentes enquadram fotografia e ajudam a leitura sem transformar a loja numa composição promocional.
- **Layout:** hero panorâmico; trilhos horizontais de imagens; grelhas com densidade progressiva; banners editoriais assimétricos; mobile com navegação compacta e secções empilhadas.
- **Motivos:** wordmark serifado com espaçamento controlado; filetes finos taupe; número editorial discreto nas etiquetas de secção.
- **Tipografia:** Cormorant Garamond para títulos e Montserrat para navegação/corpo, em ficheiros locais sob SIL OFL 1.1 para evitar pedidos de fontes a terceiros; fallback robusto e preços legíveis.
- **Interação:** alvos tácteis confortáveis, focus visível, menu acessível, controlos claros, formulários nativos e estados de vazio recuperáveis.
- **Motion:** transições curtas por opacity/transform, sem animação essencial; suportar `prefers-reduced-motion`.
- **Essência da marca:** moda feminina contemporânea que acompanha diferentes versões de cada mulher; feminina, confiante, cosmopolita.
- **Voz:** “Define o teu estilo. Escreve as tuas regras.” / “O teu estilo. A tua assinatura.”
- **Wordmark:** Sophie Barlee em serifada editorial com inicial “S” monogramática desenhada à parte; sem imitar a marca de referência.
- **Cor distintiva:** castanho profundo `#40342E` sobre marfim, complementado por taupe.

## Estrutura de ficheiros

- `theme/`: tema Shopify Liquid OS 2.0 — layouts, templates JSON, secções, snippets, assets CSS/JS, configuração e localization.
- `server.mjs`, `public/` e `package.json`: pré-visualização independente server-rendered servida pelo projecto Webdev, incluindo rotas reais de produto/coleção/pesquisa/carrinho vazio; não substitui a renderização real Shopify.
- `docs/homepage-map.md`, `docs/homepage-map.mmd` e `docs/homepage-map.png`: mapa da arquitectura pedida em texto, fonte renderizável e diagrama PNG.
- `scripts/package-theme.py`: validação estrutural e criação do ZIP do tema.
- `README.md`: passos de instalação como tema de rascunho, seleção de menu/coleções, adição das imagens e validações antes de publicação.
- `TODO.md`: critérios originais agrupados por resultados independentes, com estado sustentado por evidência.

## Dados, dependências e riscos

- Fonte dos artigos, preços, variantes, imagens de produto, disponibilidade e coleções: catálogo Shopify da loja autorizada.
- Coleções temáticas sugeridas são merchandising, não entidades a criar automaticamente.
- As imagens editoriais geradas são campanha/mood imagery; não são representações nem prova de produtos disponíveis.
- O tema nativo poderá ser instalado/visualizado pelo utilizador no Shopify, mas não será enviado para a conta nem publicado nesta fase, pois a integração disponível não expõe uma operação autorizada para escrever/ativar temas.
- A loja fica pré-lançamento. O proprietário deve validar catálogo, fornecedor, fotografias, composição, tamanhos, margem, envios, devoluções, direitos, privacidade e requisitos fiscais/legais antes de colocar artigos à venda.

## Conclusão do trabalho

Entrega considerada pronta quando o tema contém a arquitectura da homepage e os templates Shopify requeridos; secções editáveis leem objetos reais; a homepage e o modelo de produto/coleção têm estados sem dados; o pacote ZIP e as instruções são produzidos; a pré-visualização local é servida e revista em ecrãs largo/estreito; os critérios de acessibilidade, copy honesta, reduced motion e SEO são verificados; não houve publicação nem alterações a produtos, coleções ou tema ativo.
