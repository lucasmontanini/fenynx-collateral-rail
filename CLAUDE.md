# CLAUDE.md — Fenynx XRPL PoC

## Código
- TypeScript estrito, sem `any`.
- Toda integração com XRPL vive em `lib/xrpl/`, atrás da interface `LedgerAdapter`.
- Nenhum componente de UI importa `xrpl` diretamente.
- Server actions para mutação. Sem chamada de rede no cliente.
- Chave privada apenas em variável de ambiente. Nunca commitar seed.
- Um componente por arquivo. Reutilizar os componentes de `components/ui/`.

## Design
- Violeta primário #5C2EEA, violeta escuro #3A1E7A, fonte Work Sans, logo oficial da Fenynx.
- Nunca inventar cor ou variação de logo.
- Light mode, fundo clean, muito respiro.
- Menos texto, mais gráfico. Comparação de números sempre em gráfico.
- Ícones de linha, minimalistas, apenas lucide-react.
- Layout conferido em 1280px e 1440px.
- Proibido emoji em qualquer lugar.
- Proibido travessão e traço em texto de interface.
- Nunca mencionar uso de IA em texto visível.

## Conteúdo
- Sem vault e sem stablecoin no escopo atual. Foco em monitorar garantia e LTV de XRP e Bitcoin.
- Números do fundo vêm de lib/domain/case.ts. Não inventar dado de negócio fora dele.
- Nunca afirmar que a operação está em mainnet. As amendments XLS 65 e XLS 66 dependem de voto de validador.
- Valores em pt-BR.
