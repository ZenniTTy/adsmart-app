# Uso

Depois de [configurado](configuracao.md), basta conversar com o Claude no Claude Desktop.

Ainda não configurou? Peça **"Me ajude a configurar a AdSmart"**: o Claude usa o guia de configuração da extensão e conduz os passos com você, um por vez.

## Consultas e análises

Consultas nunca alteram nada na sua conta. Cada consulta devolve até 100 linhas por padrão e no máximo 1.000; para ver mais, peça um recorte menor, por exemplo por período ou por campanha.

- *"Quais contas eu tenho acesso?"*
- *"Resumo de custo, cliques e conversões por campanha nos últimos 30 dias."*
- *"Quais termos de pesquisa gastaram mais de R$ 50 sem converter este mês?"*
- *"Quanto de parcela de impressões estou perdendo por orçamento e por classificação?"*
- *"Quais anúncios estão reprovados ou com restrições?"*
- *"O que mudou na conta na última semana?"*

## Alterações

Toda alteração segue três etapas:

1. **Prévia.** O Claude prepara a alteração e o Google a valida sem aplicar nada. Você vê o antes e depois, com o nome e o ID de cada campanha, grupo ou palavra-chave, por exemplo *orçamento diário da campanha "Black Friday" (1234567890): R$ 50,00 → R$ 80,00*. Aumentos acima de 50%, orçamentos compartilhados, remoções e anúncios que voltam para revisão aparecem em destaque. A prévia também avisa se a campanha está em fase de aprendizado ou foi alterada nos últimos 14 dias.
2. **Confirmação.** Você confirma no chat, por exemplo *"pode aplicar"*.
3. **Aplicação.** A alteração é aplicada de uma vez só (ou tudo, ou nada) e registrada no seu computador.

Você pode pedir várias alterações juntas (até 100 por vez, na mesma conta): uma prévia e uma confirmação valem para o lote. A prévia vale por 15 minutos; se algo mudar na conta nesse meio tempo, a AdSmart não aplica e pede uma nova prévia.

Se você escolher **Sempre permitir** para a ferramenta *aplicar* no Claude Desktop, o Claude aplica as alterações assim que você confirmar no chat, sem abrir outra janela. Tudo fica no histórico e pode ser desfeito.

Palavras-chave novas nascem ativas: começam a rodar se o grupo e a campanha estiverem ativos.

Exemplos:

- *"Pausa a campanha Institucional."*
- *"Adiciona 'grátis' e 'curso online' como palavras-chave negativas na campanha Pesquisa."*
- *"Sobe em 20% o orçamento das campanhas com CPA abaixo de R$ 30."*
- *"Cria um anúncio responsivo no grupo X com estes títulos: ..."*

Por segurança, campanhas, grupos e anúncios novos são criados **pausados**. Peça ao Claude para ativá-los depois de revisar.

## Desfazer

Alterações podem ser revertidas pelo chat:

- *"Desfaz a última alteração."*
- *"Mostra as alterações feitas hoje e desfaz a do orçamento."*

Desfazer também mostra uma prévia e espera sua confirmação. Se alguém mudou o item depois da AdSmart (por exemplo, na interface do Google Ads), a AdSmart não desfaz automaticamente, para não apagar a decisão de outra pessoa.

Remoções definitivas não podem ser desfeitas. Por isso, a AdSmart prefere pausar em vez de remover. Uma palavra-chave adicionada pela AdSmart é desfeita por remoção; se você quiser recriá-la depois, ela ganha um novo ID e começa sem histórico.

## Histórico

Cada alteração aplicada fica registrada no seu computador, no arquivo `historico.jsonl` da pasta `.adsmart` da sua pasta pessoal, com data, conta, valores anteriores e novos. Peça *"mostra o histórico de alterações"* para ver as últimas. As alterações também aparecem no **Histórico de alterações** do Google Ads.
