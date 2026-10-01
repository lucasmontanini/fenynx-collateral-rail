import { abrirCestaBrummel } from '../lib/xrpl/operacoes'
import { comLedger } from '../lib/xrpl/servidor'

/** Abre na Devnet o case Brummel: leasing de caminhao com cesta de tres garantias. */
const conta = await comLedger(abrirCestaBrummel)
console.log(`cesta Brummel ${conta}`)
