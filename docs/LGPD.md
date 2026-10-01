# Dados pessoais no portal

Notas de engenharia. Não substituem a avaliação do jurídico e do encarregado de dados.

## O que foi implementado

- **Nome fora do portal.** O nome e o documento do tomador chegam da API da Fenynx e são
  descartados em `lib/fenynx/cliente.ts`. O resto do portal só conhece o código do cliente.
- **Código do cliente.** HMAC SHA 256 do documento com `PRIVACIDADE_SEGREDO`. É estável, não
  reversível sem o segredo e continua sendo dado pessoal para quem tem o segredo.
- **Nada pessoal no ledger.** A XRPL é pública e imutável. Nem nome, nem documento, nem o código
  do cliente são gravados em memo. O vínculo entre conta e cliente fica na API da Fenynx.
- **Consulta sob demanda.** O nome só aparece quando um usuário logado clica em consultar.
  Cada consulta gera um registro com quem pediu, quando e para qual empréstimo.
- **Cifra pronta.** `lib/privacidade/cofre.ts` cifra com AES 256 GCM, para o dia em que o portal
  precisar guardar dado pessoal. Hoje ele não guarda.

## O que falta decidir

- Base legal e finalidade de cada dado tratado.
- Onde guardar os nomes, se o portal precisar guardar: hoje não há banco de dados.
- Onde guardar a trilha de consultas. Hoje ela vai para o log do servidor, que tem retenção curta.
- Prazo de retenção e rotina de eliminação.
- Perfis de acesso: hoje existe um único usuário.
- Rotação de `PRIVACIDADE_SEGREDO` e `PRIVACIDADE_CHAVE`.
