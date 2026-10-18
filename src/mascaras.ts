// Mascaras do backoffice. Valores sao inteiros (sem centavos), como o backend guarda.
const formatos = {
  BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
  EUR: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
}

const digitos = (v: string) => v.replace(/\D/g, '')

export function mascararMoeda(v: string, moeda: keyof typeof formatos) {
  const d = digitos(v)
    .replace(/^0+(?=\d)/, '')
    .slice(0, 15)
  return d ? formatos[moeda].format(Number(d)) : ''
}

export const moedaParaNumero = (v: string) => (digitos(v) ? Number(digitos(v)) : null)

export function mascararData(v: string) {
  const d = digitos(v).slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/')
}

export const isoParaData = (iso: string) => iso.split('-').reverse().join('/')

/** dd/mm/aaaa -> aaaa-mm-dd; vazio -> null; data inexistente ou incompleta -> undefined */
export function dataParaIso(v: string): string | null | undefined {
  if (!v.trim()) return null
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim())
  if (!m) return undefined
  const [, d, mes, a] = m.map(Number)
  const data = new Date(Date.UTC(a, mes - 1, d))
  const valida = a >= 1900 && data.getUTCFullYear() === a && data.getUTCMonth() === mes - 1 && data.getUTCDate() === d
  return valida ? `${m[3]}-${m[2]}-${m[1]}` : undefined
}
