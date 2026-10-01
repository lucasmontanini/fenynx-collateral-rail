/** Linha compacta de historico de preco, sem eixos. */
export function Sparkline({ valores, rotulo }: { valores: number[]; rotulo: string }) {
  if (valores.length < 2) return <div className="h-10" />
  const largura = 160
  const altura = 40
  const minimo = Math.min(...valores)
  const amplitude = Math.max(...valores) - minimo || 1
  const pontos = valores
    .map((v, i) => `${(i / (valores.length - 1)) * largura},${altura - 3 - ((v - minimo) / amplitude) * (altura - 6)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="h-10 w-full" preserveAspectRatio="none" role="img" aria-label={rotulo}>
      <polyline points={pontos} fill="none" stroke="#5c2eea" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
