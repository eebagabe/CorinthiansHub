import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { API_URL, ErroApi, admin, token } from '../api'

// Backoffice: valores como estao guardados (valor de mercado em euro, salario em real)
type JogadorAdmin = {
  id: number
  numero: number
  nome: string
  posicao: string
  nacionalidade: string
  fotoUrl: string | null
  nomeCompleto: string | null
  nascimento: string | null
  jogos: number | null
  titular: number | null
  jogosSemSofrerGols: number | null
  jogosSelecao: number | null
  valorMercadoEuros: number | null
  salarioMensalReais: number
  fimContrato: string | null
  titulos: string[]
  fontes: string | null
  atualizadoEm: string
}

const POSICOES = ['Goleiro', 'Defensor', 'Meio-campista', 'Atacante']
const NUMEROS = ['numero', 'jogos', 'titular', 'jogosSemSofrerGols', 'jogosSelecao', 'valorMercadoEuros'] as const
const TEXTOS = ['nome', 'posicao', 'nacionalidade', 'nomeCompleto', 'nascimento', 'fimContrato', 'fontes'] as const
type Campos = Record<(typeof NUMEROS)[number] | (typeof TEXTOS)[number] | 'salarioMensalReais' | 'titulos', string>

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const euros = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const input =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900'
const botao =
  'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-50'
const botaoPrimario = `${botao} bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white`
const botaoSecundario = `${botao} border border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800`

function paraCampos(j?: JogadorAdmin): Campos {
  const c = {} as Campos
  for (const k of [...NUMEROS, ...TEXTOS]) c[k] = j?.[k] == null ? '' : String(j[k])
  c.salarioMensalReais = j?.salarioMensalReais ? String(j.salarioMensalReais) : ''
  c.titulos = j?.titulos.join('\n') ?? ''
  c.nacionalidade ||= 'BRA'
  c.posicao ||= 'Goleiro'
  return c
}

function paraEnvio(c: Campos) {
  const corpo: Record<string, unknown> = {}
  for (const k of NUMEROS) corpo[k] = c[k].trim() === '' ? null : Number(c[k])
  for (const k of TEXTOS) corpo[k] = c[k].trim() === '' ? null : c[k].trim()
  corpo.nacionalidade = c.nacionalidade.trim().toUpperCase()
  corpo.salarioMensalReais = c.salarioMensalReais.trim() === '' ? 0 : Number(c.salarioMensalReais)
  corpo.titulos = c.titulos
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
  return corpo
}

export default function Admin() {
  const [logado, setLogado] = useState(() => token.ler() !== null)
  // referencia estavel: o Painel usa sair como dependencia do efeito de carga
  const sair = useCallback(() => {
    token.apagar()
    setLogado(false)
  }, [])
  return logado ? <Painel sair={sair} /> : <Login entrar={() => setLogado(true)} />
}

function Login({ entrar }: { entrar: () => void }) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const dados = new FormData(e.currentTarget)
    setEnviando(true)
    setErro('')
    try {
      const resposta = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dados.get('email'), senha: dados.get('senha') }),
      })
      const corpo = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(corpo.erro ?? 'Não foi possível entrar')
      token.salvar(corpo)
      entrar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto mt-16 flex max-w-sm flex-col gap-3">
      <h2 className="text-lg font-semibold">Backoffice</h2>
      <input name="email" type="email" required autoComplete="username" placeholder="Email" className={input} />
      <input
        name="senha"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Senha"
        className={input}
      />
      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
      <button disabled={enviando} className={botaoPrimario}>
        Entrar
      </button>
    </form>
  )
}

function Painel({ sair }: { sair: () => void }) {
  const [jogadores, setJogadores] = useState<JogadorAdmin[] | null>(null)
  const [editando, setEditando] = useState<JogadorAdmin | 'novo' | null>(null)
  const [erro, setErro] = useState('')

  // incrementar recarrega a lista (ex.: depois de salvar)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    admin<JogadorAdmin[]>('/api/admin/jogadores')
      .then(setJogadores)
      .catch((e) => {
        if (e instanceof ErroApi && e.status === 401) sair()
        else setErro(e instanceof Error ? e.message : 'Erro ao carregar')
      })
  }, [versao, sair])

  if (editando) {
    return (
      <Formulario
        jogador={editando === 'novo' ? undefined : editando}
        sair={sair}
        fechar={() => {
          setEditando(null)
          setVersao((v) => v + 1)
        }}
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold">Jogadores</h2>
        <button onClick={() => setEditando('novo')} className={`${botaoPrimario} ml-auto`}>
          Novo jogador
        </button>
        <button onClick={sair} className={botaoSecundario}>
          Sair
        </button>
      </div>
      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
      {!jogadores ? (
        <p className="text-sm text-stone-400">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs tracking-wider text-stone-400 uppercase">
              <tr>
                {['Nº', 'Nome', 'Posição', 'Salário/mês', 'Mercado', 'Contrato', 'Atualizado'].map((t) => (
                  <th key={t} className="px-3 py-2 font-medium">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {jogadores.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => setEditando(j)}
                  className="cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-900"
                >
                  <td className="px-3 py-2 tabular-nums">{j.numero}</td>
                  <td className="px-3 py-2 font-medium">{j.nome}</td>
                  <td className="px-3 py-2">{j.posicao}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {j.salarioMensalReais ? reais.format(j.salarioMensalReais) : '-'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {j.valorMercadoEuros != null ? euros.format(j.valorMercadoEuros) : '-'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{j.fimContrato?.split('-').reverse().join('/') ?? '-'}</td>
                  <td className="px-3 py-2 text-stone-400 tabular-nums">
                    {j.atualizadoEm.split('-').reverse().join('/')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
      {rotulo}
      {children}
      {erro && <span className="text-red-600 dark:text-red-400">{erro}</span>}
    </label>
  )
}

function Formulario({ jogador, fechar, sair }: { jogador?: JogadorAdmin; fechar: () => void; sair: () => void }) {
  const [campos, setCampos] = useState(() => paraCampos(jogador))
  const [atual, setAtual] = useState(jogador)
  const [erro, setErro] = useState('')
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  const mudar = (k: keyof Campos) => (e: { target: { value: string } }) => setCampos({ ...campos, [k]: e.target.value })

  async function executar(acao: () => Promise<void>) {
    setEnviando(true)
    setErro('')
    setErrosCampos({})
    try {
      await acao()
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) return sair()
      setErro(e instanceof Error ? e.message : 'Erro inesperado')
      if (e instanceof ErroApi) setErrosCampos(e.campos)
    } finally {
      setEnviando(false)
    }
  }

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    executar(async () => {
      const corpo = JSON.stringify(paraEnvio(campos))
      if (atual) await admin(`/api/admin/jogadores/${atual.id}`, { method: 'PUT', body: corpo })
      else await admin('/api/admin/jogadores', { method: 'POST', body: corpo })
      fechar()
    })
  }

  const remover = () => {
    if (atual && confirm(`Remover ${atual.nome}? Essa ação não pode ser desfeita.`)) {
      executar(async () => {
        await admin(`/api/admin/jogadores/${atual.id}`, { method: 'DELETE' })
        fechar()
      })
    }
  }

  const enviarFoto = (arquivo: File | undefined) => {
    if (!arquivo || !atual) return
    executar(async () => {
      const dados = new FormData()
      dados.append('arquivo', arquivo)
      const salvo = await admin<JogadorAdmin>(`/api/admin/jogadores/${atual.id}/foto`, { method: 'POST', body: dados })
      setAtual(salvo)
    })
  }

  const numero = (k: (typeof NUMEROS)[number] | 'salarioMensalReais', rotulo: string) => (
    <Campo rotulo={rotulo} erro={errosCampos[k]}>
      <input type="number" min={0} value={campos[k]} onChange={mudar(k)} className={input} />
    </Campo>
  )

  return (
    <form onSubmit={salvar} className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{atual ? `Editar ${atual.nome}` : 'Novo jogador'}</h2>
        <button type="button" onClick={fechar} className={`${botaoSecundario} ml-auto`}>
          Voltar
        </button>
      </div>

      {atual && (
        <div className="flex items-center gap-4">
          {atual.fotoUrl ? (
            <img src={atual.fotoUrl} alt="" className="size-24 rounded-lg object-cover object-top" />
          ) : (
            <span className="size-24 rounded-lg bg-stone-200 dark:bg-stone-800" />
          )}
          <Campo rotulo="Trocar foto (JPEG, PNG ou WebP, até 5 MB)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={enviando}
              onChange={(e) => enviarFoto(e.target.files?.[0])}
              className="text-sm"
            />
          </Campo>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {numero('numero', 'Número')}
        <Campo rotulo="Nome" erro={errosCampos.nome}>
          <input required value={campos.nome} onChange={mudar('nome')} className={input} />
        </Campo>
        <Campo rotulo="Posição" erro={errosCampos.posicao}>
          <select value={campos.posicao} onChange={mudar('posicao')} className={input}>
            {POSICOES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Nacionalidade (ISO, ex.: BRA)" erro={errosCampos.nacionalidade}>
          <input maxLength={3} value={campos.nacionalidade} onChange={mudar('nacionalidade')} className={input} />
        </Campo>
        <div className="col-span-2">
          <Campo rotulo="Nome completo" erro={errosCampos.nomeCompleto}>
            <input value={campos.nomeCompleto} onChange={mudar('nomeCompleto')} className={input} />
          </Campo>
        </div>
        <Campo rotulo="Nascimento" erro={errosCampos.nascimento}>
          <input type="date" value={campos.nascimento} onChange={mudar('nascimento')} className={input} />
        </Campo>
        <Campo rotulo="Fim do contrato" erro={errosCampos.fimContrato}>
          <input type="date" value={campos.fimContrato} onChange={mudar('fimContrato')} className={input} />
        </Campo>
        {numero('salarioMensalReais', 'Salário mensal (R$)')}
        {numero('valorMercadoEuros', 'Valor de mercado (€)')}
        {numero('jogos', 'Jogos pelo Corinthians')}
        {numero('titular', 'Jogos como titular')}
        {numero('jogosSemSofrerGols', 'Jogos sem sofrer gols')}
        {numero('jogosSelecao', 'Jogos pela seleção')}
        <div className="col-span-2">
          <Campo rotulo="Títulos pelo Corinthians (um por linha)" erro={errosCampos.titulos}>
            <textarea rows={4} value={campos.titulos} onChange={mudar('titulos')} className={input} />
          </Campo>
        </div>
        <div className="col-span-2">
          <Campo rotulo="Fontes (apps, notícias, links)" erro={errosCampos.fontes}>
            <textarea rows={4} value={campos.fontes} onChange={mudar('fontes')} className={input} />
          </Campo>
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
      <div className="flex gap-3">
        <button disabled={enviando} className={botaoPrimario}>
          Salvar
        </button>
        {atual && (
          <button
            type="button"
            disabled={enviando}
            onClick={remover}
            className={`${botaoSecundario} ml-auto text-red-600`}
          >
            Remover jogador
          </button>
        )}
      </div>
    </form>
  )
}
