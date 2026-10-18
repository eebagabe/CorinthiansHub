// Vazio em dev (proxy do Vite para o backend); na Vercel, VITE_API_URL aponta para o backend publico
export const API_URL = import.meta.env.VITE_API_URL ?? ''

const CHAVE_TOKEN = 'corinthianshub.token'

// sessionStorage: o login some ao fechar a aba
export const token = {
  ler: () => {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE_TOKEN) ?? 'null') as {
        token: string
        expiraEm: string
      } | null
      return salvo && new Date(salvo.expiraEm) > new Date() ? salvo.token : null
    } catch {
      return null
    }
  },
  salvar: (valor: { token: string; expiraEm: string }) => {
    try {
      sessionStorage.setItem(CHAVE_TOKEN, JSON.stringify(valor))
    } catch {
      // sem storage (aba privada restrita): o login vale so ate recarregar a pagina
    }
  },
  apagar: () => {
    try {
      sessionStorage.removeItem(CHAVE_TOKEN)
    } catch {
      // nada a apagar
    }
  },
}

export class ErroApi extends Error {
  readonly status: number
  readonly campos: Record<string, string>

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem)
    this.status = status
    this.campos = campos
  }
}

/** Chamada autenticada ao backoffice; lanca ErroApi com a mensagem do backend. */
export async function admin<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const t = token.ler()
  const headers = new Headers(init.headers)
  if (t) headers.set('Authorization', `Bearer ${t}`)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')
  const resposta = await fetch(`${API_URL}${caminho}`, { ...init, headers })
  if (resposta.status === 401) token.apagar()
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}))
    throw new ErroApi(resposta.status, corpo.erro ?? `Erro ${resposta.status}`, corpo.campos)
  }
  return resposta.status === 204 ? (undefined as T) : resposta.json()
}
