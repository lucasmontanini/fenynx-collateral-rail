# Spike XRPL na Devnet

Execucao de 2026-10-01T01:49:01.628Z em wss://s.devnet.rippletest.net:51233. 55 transacoes validadas.
Gerado por `npm run relatorio` a partir de `docs/spike-devnet.json`. Nada aqui e simulado.

## Objetos no ledger

- Vault: `9B3D357EBD6B742EBBECC39811DC3275E46DB5CEE2CE9782C1DB894BBF9085EF`
- Loan broker: `9B5B4069B9D9A94A76D2F332C9866A0CA87AEAF13EB57E35EBD56FF300DA77CD`
- MPT de colateral: `0057B292CA5F357BA9128AB01C864D245EBA2AAC57D09043`
- Emprestimo op1: `E19D6EB9D786A0FD20AC5B2EEBA55F179058BBE777931A88CDFAA6BC9F2E2D10`
- Emprestimo op2: `D569C5B01D127219F23156EDDDFAAA4686E4205B0D1A8F3AA076F6D5240F3DE7`
- Emprestimo op4: `4858D410F68D6A3BDB7048083EA2025602DA200DD1146855D3B045CB6B0F6B21`
- Conta da operacao op1: `rWmi1m1mHoehcXQ7YvPMZZ45iHPX5n6N8`
- Conta da operacao op2: `rESqKp1XboJFYyJkjrtqy92XryKDeSCfNJ`
- Conta da operacao op3: `rhHzL7vcm2YwoyfQeproxJbPksE5BJo6bs`
- Conta da operacao op4: `raLB6WDWhEr52Xn8yLbRXLc8Zya5GxWWA3`

## Contas de teste

- EMISSOR_BRL: `rMb6Dip3Du1FThoAsybJF4ht4H5Tf5Y5ki`
- FENYNX: `rN1tjjv63R5e65K8vEYbUKRzVDYzvwJgbA`
- AGENTE_GARANTIA: `rZnpXnoYwghhwNSWueh6dcqpXRzhUCMFQ`
- INVESTIDOR: `r3YdSYHDfBkrFahUetctwSBYubmp77HvYq`
- TOMADOR: `rJKkXRNPc4TGSvpjS71LoxE9AKLgY5dngB`
- FORMADOR_MERCADO: `rQHu6hvjzx7NrqjRJbEALDreaqjxzVDaFd`
- TOKENIZADORA: `rKTsYyvGQUDALLMxjBTKAQ8NViNrZADWMk`

## Resultados medidos

- Vault 9B3D357EBD6B742EBBECC39811DC3275E46DB5CEE2CE9782C1DB894BBF9085EF com 3000 BRL disponiveis
- LTV de entrada 50.0% nivel entrada
- Principal 200 BRL, liquido desembolsado 196 BRL
- Parcela 66.67 BRL paga, principal em aberto 133.33 BRL, liberados 13.333272 XRP, seguem travados 26.666728 XRP
- Quitacao antecipada cobrou 133.3336 BRL de um teto de 133.34 BRL
- Preco cai de 10 para 6 BRL, LTV 83.3% nivel realizacao
- Vendidos 33.335004 XRP por 200.01 BRL
- Excedente devolvido ao cliente: 6.664996 XRP e 0.00998325723 BRL
- MPT 0057B292CA5F357BA9128AB01C864D245EBA2AAC57D09043 travado, saldo na conta 50000
- Saldo de MPT na conta apos liberar 0
- Cover de 300.00 para 280.00 BRL, ativos do vault de 3000.00 para 2820.00 BRL

## A. Stablecoin de real

| Passo | Transacao | Hash |
|---|---|---|
| DefaultRipple no emissor e trust lines | AccountSet | [D2A9F8BD5E9E](https://devnet.xrpl.org/transactions/D2A9F8BD5E9EBAA7BF3979BD735038483BCBA2B9E7DF04BDB3376E84D10B8B4C) |
| DefaultRipple no emissor e trust lines | TrustSet | [3CABC1A9923C](https://devnet.xrpl.org/transactions/3CABC1A9923CF6B4412FF15B19D39C1D8F946AEDB11B9BA0E39AC88DCD488215) |
| DefaultRipple no emissor e trust lines | TrustSet | [0204F99C8CEF](https://devnet.xrpl.org/transactions/0204F99C8CEFFBC569CD715730DD688CA1634D1B88F72A3D93D2386D1B5920DF) |
| DefaultRipple no emissor e trust lines | TrustSet | [799B59676475](https://devnet.xrpl.org/transactions/799B596764755A02F8D0BF87FEFFE0706CDCB04DE7045602B5F4236F6E45B8B2) |
| DefaultRipple no emissor e trust lines | TrustSet | [1CF55C977731](https://devnet.xrpl.org/transactions/1CF55C977731D6BA5DB40061A116C2362AC9B8B68ED234A7727240F312D64A33) |
| Emissao para o investidor | Payment | [D20262FDAC38](https://devnet.xrpl.org/transactions/D20262FDAC3803FB41FD6766ED8D7454C1385E71A432910217CFE7A2DF9B361E) |
| Emissao para a Fenynx | Payment | [D4E3CDC29ED9](https://devnet.xrpl.org/transactions/D4E3CDC29ED91B05F1244E77162C4FCFE33576A3F4D2208FB1C3257BD7911B66) |
| Emissao para o formador de mercado | Payment | [92FC0E26E2C0](https://devnet.xrpl.org/transactions/92FC0E26E2C002E874748B849558CBAF67864D8EF41443B1966A4D933E76E96E) |
| Saldo proprio do tomador | Payment | [98F870DB6398](https://devnet.xrpl.org/transactions/98F870DB63982A42BD01631655BC5D29E2E1C11766903F11D5603678F0A4D0A2) |
## B. Funding com XLS 65 e XLS 66

| Passo | Transacao | Hash |
|---|---|---|
| Vault fechado em BRL | VaultCreate | [436F98F7D88C](https://devnet.xrpl.org/transactions/436F98F7D88CE46E8D2E486D229BBA4376080BE568310B417DB4139ED3602E01) |
| Deposito do investidor na janela de captacao | VaultDeposit | [671FC321D17F](https://devnet.xrpl.org/transactions/671FC321D17F0CD6A86028FB47990825589F80AF554E89B5011A691B5394749D) |
| Loan broker da Fenynx | LoanBrokerSet | [DF7EAB3E888D](https://devnet.xrpl.org/transactions/DF7EAB3E888DF344C3FF6F5DC18545F8B4F30B8C17CA639E59B19164B09C547F) |
| First loss capital | LoanBrokerCoverDeposit | [3D3D520B5BE4](https://devnet.xrpl.org/transactions/3D3D520B5BE46E08EDE987405BB381BD586CF1FEC7033053B5F1A41B36E8D38E) |
## C. Operacao 1, curso normal com liberacao parcial

| Passo | Transacao | Hash |
|---|---|---|
| Conta da operacao com multisig e chave mestra desativada | Payment | [9BEC7D2E1B2B](https://devnet.xrpl.org/transactions/9BEC7D2E1B2B6EA126C38B2E12E1E49C69218045881F828634873D0ACC0BA294) |
| Conta da operacao com multisig e chave mestra desativada | SignerListSet | [B41B0A006A20](https://devnet.xrpl.org/transactions/B41B0A006A20A729F487E2EFA35C9666F3FD4F2D57A4210D7A451ADF94414DA6) |
| Conta da operacao com multisig e chave mestra desativada | AccountSet | [5D713C44018E](https://devnet.xrpl.org/transactions/5D713C44018E1E038AE5CED49ED23064D930DF1C814D2268C6B46E38F2F1D073) |
| Conta da operacao com multisig e chave mestra desativada | TrustSet | [BF96431FBC2D](https://devnet.xrpl.org/transactions/BF96431FBC2DC9A4E9DB7140862A9C61A18564EB0656ABFBE682E32C971BD328) |
| Cliente trava XRP | Payment | [10A7DBF06A98](https://devnet.xrpl.org/transactions/10A7DBF06A9844EF220CBDC1087BD407D3625B42FE9676E36F7DEE8C2A73D398) |
| LoanSet com contra assinatura multisig | LoanSet | [0FE26EC3154B](https://devnet.xrpl.org/transactions/0FE26EC3154B16EF3FF21834137748F9C58278A4646E8AA1DF748DED78FE95A2) |
| Desembolso ao cliente | Payment | [D75290A27A1E](https://devnet.xrpl.org/transactions/D75290A27A1E84D323BB73AFEB3F9A52D7ACAC14DC789A28650E292C8E525341) |
| Pagamento do cliente chega em BRL | Payment | [0571E301AC1C](https://devnet.xrpl.org/transactions/0571E301AC1C7E258548D0601118438F88471EFB1797C2E94609770E9F42562C) |
| LoanPay da parcela 1 | LoanPay | [1F0E3C1413E0](https://devnet.xrpl.org/transactions/1F0E3C1413E051F2F03FDBC5AA4B5920B31B35153C7E30E1E69A107D490BBE26) |
| Liberacao parcial do colateral | Payment | [B1C6EA38A6F2](https://devnet.xrpl.org/transactions/B1C6EA38A6F23A5C595E7BD59132A25AF08EFC125F6CFA5491733AACA4CAF8AE) |
| Cliente aporta o saldo | Payment | [D0E183FE8008](https://devnet.xrpl.org/transactions/D0E183FE8008133EE76F15213E78C6FAF9333633F34C5A9B7CE4CB88E4046CCA) |
| LoanPay de quitacao antecipada | LoanPay | [F93F4DED4757](https://devnet.xrpl.org/transactions/F93F4DED4757BE4E70F0335E759751B4CDE680BD08EF8A1FCF8D1335B32C2880) |
| Liberacao total do colateral | Payment | [3C2EA6855AB5](https://devnet.xrpl.org/transactions/3C2EA6855AB54A9F872256F9DB6E4999F9A9351EB7DD7E16586B524FD0C8C75C) |
## D. Operacao 2, queda de preco e liquidacao na DEX

| Passo | Transacao | Hash |
|---|---|---|
| Conta da operacao | Payment | [6B8C20ECFB04](https://devnet.xrpl.org/transactions/6B8C20ECFB040DA4930AEA030D35E6AC797126EA09F2C8DDCA3F49E93A19A0EA) |
| Conta da operacao | SignerListSet | [1F2D084F10F9](https://devnet.xrpl.org/transactions/1F2D084F10F9150A2EF5C86792868C7F3613CD569386D0CF064F0A6275E6B314) |
| Conta da operacao | AccountSet | [11EB69C52A72](https://devnet.xrpl.org/transactions/11EB69C52A726809303677156C99FA52FCFA148F5177F96E67E6C35DB05602AC) |
| Conta da operacao | TrustSet | [107ED467D209](https://devnet.xrpl.org/transactions/107ED467D209BB549AC90BE26C4FEF206EAA39E5CED6BFB891D0F81294929DFD) |
| Cliente trava XRP | Payment | [7447270F8911](https://devnet.xrpl.org/transactions/7447270F8911A3B1C65626E00B6EF410CF69033B884BBAB7B91B969EC7E7B0A1) |
| LoanSet | LoanSet | [654B93BFFF93](https://devnet.xrpl.org/transactions/654B93BFFF9322408CF0E6274112C518CC00B75F5FB4ED29818126E65F44C20C) |
| Desembolso ao cliente | Payment | [8BE49E7A271F](https://devnet.xrpl.org/transactions/8BE49E7A271F9FC2F44D12B7670C3AFB3E5602EE6604BD3EBE32A6BF66D8F093) |
| Formador de mercado compra XRP ao preco de estresse | OfferCreate | [E5A598F168DF](https://devnet.xrpl.org/transactions/E5A598F168DFC356CA58960D2A2178B1473A290C946B938E0548E6A0EAEDB22A) |
| Venda do colateral na DEX nativa | OfferCreate | [2D46979EDC23](https://devnet.xrpl.org/transactions/2D46979EDC234F27C094DBAF79A384C145DD8BEC70ED1E360B84698F4074C205) |
| LoanPay de quitacao com o produto da venda | LoanPay | [B1A6B3FDC43C](https://devnet.xrpl.org/transactions/B1A6B3FDC43CA7CF74FB8580CE21DD99C0C4C83AFBB9ADA15518CE5E33626D6C) |
| Devolucao do excedente em BRL | Payment | [BE733986E416](https://devnet.xrpl.org/transactions/BE733986E416EC59DE781AAD180FA2BCB47D4671E9BE793CC8E71883DDEEE2CB) |
| Devolucao do excedente em XRP | Payment | [601406D731B6](https://devnet.xrpl.org/transactions/601406D731B69F0B453377158F47B64209A1368C6515AA9575FE0530C7A3ABEF) |
## E. Operacao 3, MPT como colateral

| Passo | Transacao | Hash |
|---|---|---|
| Tokenizadora emite MPT e entrega ao cliente | MPTokenIssuanceCreate | [A557AD181DB1](https://devnet.xrpl.org/transactions/A557AD181DB1B89E551B63D0C9A15E50D845B314E75D493178D7E8D097A99C4E) |
| Tokenizadora emite MPT e entrega ao cliente | MPTokenAuthorize | [A5A01DD899D4](https://devnet.xrpl.org/transactions/A5A01DD899D4461575ADB74DE9686E99BEB048001BD718C18402DB6301EB4609) |
| Tokenizadora emite MPT e entrega ao cliente | Payment | [C8680DB20665](https://devnet.xrpl.org/transactions/C8680DB20665E2AFA861BC2F9E27A711883219EEC8CFA020B74EC7D4E2C79AAD) |
| Conta da operacao | Payment | [4A90899C878D](https://devnet.xrpl.org/transactions/4A90899C878D789D98CCFCF53F9F46BE2F6A5FB2A17E626DD7D014431C1C8A9E) |
| Conta da operacao | SignerListSet | [EB5A6FF6DCE0](https://devnet.xrpl.org/transactions/EB5A6FF6DCE04D06158FF28F22B305C520C9B3A5B98070B5423E14A63A8B3C87) |
| Conta da operacao | AccountSet | [0C45D666A7F2](https://devnet.xrpl.org/transactions/0C45D666A7F2BC4EBFA61D70578E16D6A19FC128BAA59A064294FED5E4046E84) |
| Conta da operacao | TrustSet | [23EC6619BE14](https://devnet.xrpl.org/transactions/23EC6619BE1410D00A8DC12E99EA7A8B3CB38D1BCABF97884339422B860699A2) |
| Trava do MPT | MPTokenAuthorize | [60326DE44080](https://devnet.xrpl.org/transactions/60326DE440803D26118E0657723BBD1638B0EF955CA609EC4921FFFFFA5699BF) |
| Trava do MPT | Payment | [E427DA5A1213](https://devnet.xrpl.org/transactions/E427DA5A1213DCA3D8C199E0C95400CF6549ABC117A41D6F115096AEC61EA43D) |
| Liberacao do MPT | Payment | [1E1FFDD4F752](https://devnet.xrpl.org/transactions/1E1FFDD4F752EA1A3B7D7E1D2D7EA9C3C41D8D46FBF2EDDE93F5B45A87E68155) |
## F. Operacao 4, inadimplencia e first loss capital

| Passo | Transacao | Hash |
|---|---|---|
| Conta da operacao | Payment | [5C278FD1582E](https://devnet.xrpl.org/transactions/5C278FD1582E58E7ABA6E6F54C0E154FD9C76D1D39F6B5A2F51A296CB110981F) |
| Conta da operacao | SignerListSet | [AD69DE194195](https://devnet.xrpl.org/transactions/AD69DE19419578CA0A23BEBA5CCEC38FDCD6157BEFDBEB0376BB4BB84B63FA2E) |
| Conta da operacao | AccountSet | [72DF18D746A8](https://devnet.xrpl.org/transactions/72DF18D746A839EF31693629B87C1B26ECFFDADDB05F17AA7AF2101BF58371C8) |
| Conta da operacao | TrustSet | [7235E942D323](https://devnet.xrpl.org/transactions/7235E942D3236EF415644FF1C4DBF8FC1616531324ADB77F5F15EC20FEDFD228) |
| LoanSet | LoanSet | [6131F7B6800D](https://devnet.xrpl.org/transactions/6131F7B6800D5FA10AE46E7E40845A7DB8D6B850CC474DD301C4C0EEBF10FF98) |
| Desembolso ao cliente | Payment | [BDC71F4AD44E](https://devnet.xrpl.org/transactions/BDC71F4AD44E10A0945A8CA90AE21B57C485EC0317526D6E7B85741AE0A8F829) |
| LoanManage com tfLoanDefault | LoanManage | [2497C927C55E](https://devnet.xrpl.org/transactions/2497C927C55EB58A6AFEB6B29E915802B66BC61800D888A07CDB864E085F6CE6) |
