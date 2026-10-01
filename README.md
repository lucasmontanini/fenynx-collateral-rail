# Fenynx Collateral Rail

Portal de monitoramento de garantia e LTV para crédito com XRP e Bitcoin, com a XRP Ledger como trilho.

## Escopo atual

- Token MPT: travado na conta da operação. O valor vem de avaliação do lastro, não de mercado.
- Cesta de garantias: uma operação pode ter várias garantias na mesma conta. O case Brummel (leasing de caminhão, `scripts/05-case-brummel.ts`) trava um token do caminhão, um token do recebível e XRP.
- Tokens RWA com metadados no padrão XLS 89, lidos direto da emissão.
- Sem vault e sem stablecoin. O crédito é concedido fora do ledger. O trilho cuida da garantia e do LTV.
- XRP: travado de verdade em uma conta por operação, com assinatura dupla (Fenynx e agente de garantia).
- Bitcoin: custódia fora da XRPL. O portal registra a quantidade atestada e monitora o LTV.
- Crédito, pagamentos e liquidação ficam registrados como memo na conta da operação. O ledger é o banco de dados.
- Preço de mercado em real, média de Coinbase e Mercado Bitcoin. Simulação de queda pelo oráculo nativo do ledger.
- Produtos: crédito em real e iPhone, com as regras de `lib/domain/case.ts`.
- Ambiente: Devnet. Nada aqui opera em mainnet.

## Telas

- Dashboard, Monitoramento, Operações.
- Ativos em garantia: uma página para XRP, uma para Bitcoin e o lastro do token TERRE02.
- Rede e Configurações.

## Integração e privacidade

- `docs/API_FENYNX.md`: contrato esperado da API da Fenynx.
- `docs/LGPD.md`: como o portal trata dado pessoal e o que falta decidir.

## Rodar

```bash
npm install
npm run setup   # cria carteiras de teste no faucet e grava .env.local
npm run dev
```

O login usa `AUTH_EMAIL`, `AUTH_SENHA_HASH` (scrypt, formato sal:hash) e `AUTH_SEGREDO`. Ver `.env.example`.

## Estrutura

- `lib/domain`: regras puras de crédito, LTV e estado da operação.
- `lib/xrpl`: toda a integração com o ledger. A UI nunca importa `xrpl`.
- `app/acoes.ts`: server actions de gestão.
- `scripts` e `docs/SPIKE_XRPL.md`: spike anterior com XLS 65 e XLS 66 na Devnet, fora do escopo atual.
