import type { NextConfig } from 'next'

// O pacote xrpl e empacotado junto com o servidor. Como modulo externo ele falha
// em producao ao carregar dependencias ESM por require.
const nextConfig: NextConfig = {}

export default nextConfig
