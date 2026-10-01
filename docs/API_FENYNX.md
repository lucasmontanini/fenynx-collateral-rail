# Integração com a API da Fenynx

O portal está preparado para receber empréstimos, LTV e tomadores da API da Fenynx.
O contrato abaixo é uma **proposta**: ainda não recebemos a documentação real. Ao receber,
ajustar `lib/fenynx/contrato.ts` e `lib/fenynx/cliente.ts`, que são os únicos pontos de contato.

## Configuração

| Variável | Uso |
|---|---|
| `FENYNX_API_URL` | Endereço base da API |
| `FENYNX_API_KEY` | Chave enviada em `Authorization: Bearer` |
| `PRIVACIDADE_SEGREDO` | Segredo que gera o código do cliente |

Sem as três, a integração fica desligada e o portal mostra só as operações do trilho.

## Endpoints esperados

`GET /v1/emprestimos` devolve `{ "items": [Emprestimo] }`.
`GET /v1/emprestimos/{id}` devolve um `Emprestimo`.

```json
{
  "id": "emp_123",
  "produto": "credito",
  "ativo": "BTC",
  "modelo": null,
  "garantia_quantidade": 0.05,
  "principal_brl": 10000,
  "tac_brl": 200,
  "taxa_mensal": 0.014,
  "prazo_meses": 12,
  "saldo_devedor_brl": 10200,
  "ltv": 0.5,
  "status": "ativa",
  "iniciado_em": "2026-10-01T00:00:00Z",
  "conta_xrpl": "r...",
  "tomador": { "id": "u_1", "nome": "...", "documento": "..." }
}
```

`produto`: `credito` ou `iphone`. `ativo`: `XRP` ou `BTC`. `status`: `aguardando`, `ativa`, `quitada` ou `liquidada`.

## O que o portal faz com isso

- Empréstimo com `conta_xrpl` igual a uma conta do trilho: a operação ganha o código do cliente
  e o LTV e o saldo informados pela Fenynx, lado a lado com os calculados pelo portal.
- Empréstimo sem conta no trilho: entra na carteira como operação monitorada, marcada como fora do trilho.
- O LTV do portal usa o preço de mercado do momento. O da Fenynx aparece para conferência.
