# Análise de Churn de Clientes

Dashboard de análise de cancelamento (churn) de clientes de telecomunicações, feito em **Power BI** e com uma versão web interativa em **HTML, CSS e JavaScript**.

**Resultado principal:** de 7.032 clientes, 1.869 cancelaram, uma taxa de churn de **26,6%**.

> Painel online: https://lucaborgeslima.github.io/Projeto-Churn-/

## Fonte dos dados

- Dataset público do **Kaggle**

## Tratamento e modelagem

1. **Limpeza no Power Query:** ajuste de tipos, tratamento de valores vazios e criação da faixa de tempo de casa (`Faixa Tenure`). As colunas `MonthlyCharges` e `TotalCharges` são lidas com a localidade en-US, porque o CSV usa ponto como separador decimal.
2. **Modelo dimensional:** tabela fato e tabela dimensão relacionadas no Power BI (tabelas `Churn` e `Service`).
3. **Medidas em DAX:** taxa de churn, clientes ativos e cancelados, tempo médio de casa de ativos e cancelados, entre outras.

## Principais conclusões

| Grupo | Taxa de churn |
|---|---|
| Base geral | 26,6% |
| Primeiros 6 meses de casa | 53,3% |
| Contrato mensal | 42,7% |
| Contrato de 2 anos | 2,8% |
| Internet por fibra óptica | 41,9% |
| Internet DSL | 19,0% |
| Pagamento com cheque eletrônico | 45,3% |
| Sem suporte técnico | 41,6% |
| Com suporte técnico | 15,2% |
| Clientes idosos | 41,7% |

Os cancelamentos representam **US$ 139.131 por mês** em mensalidades perdidas, 30,5% da receita mensal da base.

Clientes ativos ficam em média **37,7 meses**; os que cancelam saem com cerca de **18,0 meses**. O risco é maior no começo da relação, em contratos mensais e sem suporte técnico.

## Recomendações

Os valores em dólar (US$) são as mensalidades dos clientes que cancelaram. O painel traz uma seção "Onde agir primeiro", calculada sobre a base completa:

1. **Perfil de maior risco:** contrato mensal, fibra, sem suporte técnico e até 12 meses de casa, com 71,1% de churn (592 de 833). Custo: US$ 48.490 por mês.
2. **Contrato anual desde cedo:** clientes novos em contrato mensal cancelam 51,4%, contra 7,2% nos contratos longos (amostra de 181). Custo: US$ 68.301 por mês.
3. **Suporte técnico na fibra:** 49,4% de churn sem suporte, 22,6% com suporte. Custo: US$ 94.901 por mês.
4. **Pagamento automático:** no contrato mensal, 53,7% de churn com cheque eletrônico, 33,5% com pagamento automático. Custo: US$ 77.316 por mês.

## Painel web

Versão interativa que roda direto no navegador, sem servidor.

- Clique em uma coluna para filtrar KPIs e todos os gráficos.
- Combine filtros de grupos diferentes. Os filtros ativos aparecem como chips e o botão **Limpar filtros** (ou a tecla Esc) remove todos.
- Alterne entre **Taxa de churn** e **Nº de cancelados**.
- O cartão **Receita mensal perdida** também responde aos filtros.
- Grupos com menos de 30 clientes aparecem com `*`.
- O botão **Pausar pulso** liga e desliga o brilho animado da coluna mais alta.

## Tecnologias

Power BI · Power Query · DAX · HTML · CSS · JavaScript · Claude Code
