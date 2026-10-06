# Residencial Aurora — projeto fictício

Use a versão hospedada. Para executar localmente, com Node.js instalado, rode `node server.cjs` nesta pasta e abra http://127.0.0.1:4173. O modelo usa módulos JavaScript e requer um servidor HTTP, não abertura direta por file://. A biblioteca Three.js 0.186.1 está incluída em `dist/vendor`, com sua licença MIT; não depende de CDN.

## Cenário

- 10 pavimentos residenciais acima do térreo, 4 unidades por pavimento, 40 apartamentos.
- Finais 01 e 02: frente, 47 m² (43 m² internos + 4 m² de sacada).
- Finais 03 e 04: fundos, 43 m², sem sacada.
- Dois dormitórios, estar, cozinha/jantar, banheiro e serviço em ambos os tipos.
- Térreo com portaria e entrada de garagem. Não há estudo de capacidade nem vagas vinculadas.
- Todas as plantas e volumes são conceituais; não constituem projeto arquitetônico, estrutural ou legal.

## Preços

R$ 12.206/m²: média de anúncios residenciais de São Paulo em setembro/2026, FipeZAP divulgado em https://myside.com.br/guia-sao-paulo/valor-metro-quadrado-sao-paulo-sp (consulta em 06/10/2026). Não é média exclusiva de lançamentos ou orçamento de construção.

Fórmula fictícia: arredondar(área × 12.206 × (1 + 0,005 × (andar − 1))). Sem prêmio adicional de sacada. Primeiro andar: 47 m² por R$ 573.682 e 43 m² por R$ 524.858. O último andar usa +4,5%.

28 unidades disponíveis, 6 reservadas e 6 vendidas são dados simulados. A calculadora apenas divide o saldo em 36 parcelas, sem juros/correção; não envia propostas nem integra CRM.

## Testar e substituir

1. Gire o modelo com o controle, selecione uma unidade pelo modelo ou pelo mapa.
2. Veja a planta e abra “Editar unidade de teste” para alterar preço e disponibilidade.
3. Em “Gerenciar dados”, exporte o CSV; edite preços/situações e reimporte a tabela.
4. Alterações existem somente na sessão; recarregar restaura o exemplo. Guarde o CSV e reimporte ao voltar.
5. A importação valida todos os dados antes de substituir o cenário, mantendo 10 andares, áreas, posições e 40 unidades únicas.
6. Outro edifício requer atualizar a geometria, plantas e configuração no código; trocar CSV não altera o projeto físico.

## Arquivos

- `dist/index.html`, `style.css`, `app.js`: aplicação independente.
- `dist/planta-43.svg` e `planta-47.svg`: plantas vetoriais ilustrativas sem escala.
- `dist/aurora-unidades.csv`: tabela inicial editável.
- `dist/unidades.json`: cópia de referência dos dados iniciais; a inicialização do painel está em `app.js`.
- `dist/fachada.png`: referência estética gerada por IA. A imagem produziu 9 fileiras de sacadas, não os 10 pavimentos solicitados. O modelo interativo e o mapa têm a contagem correta. Não apresentar a imagem como renderização fiel.

O modelo é renderizado com WebGL/Three.js: texturas procedurais de reboco, concreto, pavimentação e asfalto, vidros, esquadrias, guarda-corpos, luz e sombras. Não é arquivo BIM/CAD. A fachada gerada por IA é uma imagem separada.

Selecionar uma unidade gira suavemente a câmera para seu lado: final 01 = −25°, 02 = 25°, 03 = −155°, 04 = 155°. A preferência de movimento reduzido elimina a animação. Arraste o modelo ou use o controle para girar manualmente. A rua permanece na frente física do condomínio; o minimapa mostra a câmera em relação à rua. O contorno azul identifica a unidade; placas pequenas indicam disponibilidade, mantendo a aparência dos materiais.

Se WebGL não estiver disponível, a tabela e as plantas continuam acessíveis. Os dados não são compartilhados entre usuários. Integração com CRM e armazenamento compartilhado são etapas posteriores dependentes do serviço e dos acessos reais.

As janelas das 40 unidades acompanham o status em tempo real: Disponível usa material emissivo quente; Reservado e Vendido usam vidro apagado. Alterações individuais, importação CSV e restauração atualizam todas as janelas da unidade, incluindo as laterais. O contorno azul é apenas seleção e não muda a iluminação.


## Demonstração online

https://residencial-aurora-demo-hygor.chocolatemarrom.chatgpt.site/

