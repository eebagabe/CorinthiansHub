/** Meses inteiros ate a data (aaaa-mm-dd); negativo se ja passou. */
export function mesesRestantes(fim: string, hoje = new Date()) {
  const [a, m, d] = fim.split('-').map(Number)
  return (a - hoje.getFullYear()) * 12 + (m - 1 - hoje.getMonth()) - (d < hoje.getDate() ? 1 : 0)
}

export function tempoRestante(fim: string, hoje = new Date()) {
  const meses = mesesRestantes(fim, hoje)
  if (meses < 0) return 'encerrado'
  if (meses < 1) return 'menos de 1 mês'
  const [anos, resto] = [Math.floor(meses / 12), meses % 12]
  return [anos && `${anos} ${anos > 1 ? 'anos' : 'ano'}`, resto && `${resto} ${resto > 1 ? 'meses' : 'mês'}`]
    .filter(Boolean)
    .join(' e ')
}
