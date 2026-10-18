import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { API_URL, ErroApi, admin, token } from '../api'
import { mesesRestantes, tempoRestante } from '../datas'
import { dataParaIso, isoParaData, mascararData, mascararMoeda, moedaParaNumero } from '../mascaras'

// Backoffice: valores como estao guardados (multa internacional em euro, demais em real)
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
  multaNacionalReais: number | null
  multaInternacionalEuros: number | null
  valorAquisicaoReais: number | null // 0 = sem custo
  salarioMensalReais: number
  fimContrato: string | null
  titulos: string[]
  fontes: string | null
  atualizadoEm: string
}

const POSICOES = ['Goleiro', 'Defensor', 'Meio-campista', 'Atacante']
const NUMEROS = ['numero', 'jogos', 'titular', 'jogosSemSofrerGols', 'jogosSelecao'] as const
const TEXTOS = ['nome', 'posicao', 'nacionalidade', 'nomeCompleto', 'fontes'] as const
// moedas e datas ficam mascaradas no formulario e sao convertidas em paraEnvio
type Campos = Record<
  | (typeof NUMEROS)[number]
  | (typeof TEXTOS)[number]
  | 'salarioMensalReais'
  | 'multaNacionalReais'
  | 'multaInternacionalEuros'
  | 'valorAquisicaoReais'
  | 'nascimento'
  | 'fimContrato'
  | 'titulos',
  string
>

// valores opcionais: vazio = nao informado; multa internacional em euro, resto em real
const MOEDAS = [
  ['multaNacionalReais', 'BRL'],
  ['multaInternacionalEuros', 'EUR'],
  ['valorAquisicaoReais', 'BRL'],
] as const

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
  c.salarioMensalReais = j?.salarioMensalReais ? mascararMoeda(String(j.salarioMensalReais), 'BRL') : ''
  for (const [k, moeda] of MOEDAS) c[k] = j?.[k] != null ? mascararMoeda(String(j[k]), moeda) : ''
  c.nascimento = j?.nascimento ? isoParaData(j.nascimento) : ''
  c.fimContrato = j?.fimContrato ? isoParaData(j.fimContrato) : ''
  c.titulos = j?.titulos.join('\n') ?? ''
  c.nacionalidade ||= 'BRA'
  c.posicao ||= 'Goleiro'
  return c
}

/** Monta o JSON da API; datas invalidas voltam em erros, sem enviar. */
function paraEnvio(c: Campos) {
  const corpo: Record<string, unknown> = {}
  const erros: Record<string, string> = {}
  for (const k of NUMEROS) corpo[k] = c[k].trim() === '' ? null : Number(c[k])
  for (const k of TEXTOS) corpo[k] = c[k].trim() === '' ? null : c[k].trim()
  corpo.nacionalidade = c.nacionalidade.trim().toUpperCase()
  corpo.salarioMensalReais = moedaParaNumero(c.salarioMensalReais) ?? 0
  for (const [k] of MOEDAS) corpo[k] = moedaParaNumero(c[k])
  for (const k of ['nascimento', 'fimContrato'] as const) {
    corpo[k] = dataParaIso(c[k])
    if (corpo[k] === undefined) erros[k] = 'Data inválida, use dd/mm/aaaa'
  }
  corpo.titulos = c.titulos
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
  return { corpo, erros }
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

const SECOES = [
  ['Goleiro', 'Goleiros'],
  ['Defensor', 'Defensores'],
  ['Meio-campista', 'Meias'],
  ['Atacante', 'Atacantes'],
] as const

const valorOuTraco = (v: number | null, formato: Intl.NumberFormat) =>
  v != null ? formato.format(v) : <span className="text-stone-400">-</span>

const dataBr = (iso: string) => iso.split('-').reverse().join('/')

function Icone({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}
const ICONES = {
  jogadores:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  contratos: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  editar: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  excluir: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6',
  sair: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

function Acoes({ editar, excluir, nome }: { editar: () => void; excluir?: () => void; nome: string }) {
  const base = 'grid size-8 cursor-pointer place-items-center rounded-lg transition-colors'
  return (
    <div className="flex justify-end gap-1">
      <button
        onClick={editar}
        title="Editar"
        aria-label={`Editar ${nome}`}
        className={`${base} text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white`}
      >
        <Icone d={ICONES.editar} />
      </button>
      {excluir && (
        <button
          onClick={excluir}
          title="Excluir"
          aria-label={`Excluir ${nome}`}
          className={`${base} text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400`}
        >
          <Icone d={ICONES.excluir} />
        </button>
      )}
    </div>
  )
}

function Jogador({ j }: { j: JogadorAdmin }) {
  return (
    <div className="flex items-center gap-3">
      {j.fotoUrl ? (
        <img src={j.fotoUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover object-top" />
      ) : (
        <span className="size-10 shrink-0 rounded-lg bg-stone-200 dark:bg-stone-800" />
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{j.nome}</p>
        {j.nomeCompleto && <p className="truncate text-xs text-stone-400">{j.nomeCompleto}</p>}
      </div>
    </div>
  )
}

function Prazo({ fim }: { fim: string | null }) {
  if (!fim) return <span className="text-stone-400">Sem data</span>
  const meses = mesesRestantes(fim)
  const cor =
    meses < 6
      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
      : meses < 12
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cor}`}>
      {tempoRestante(fim)}
    </span>
  )
}

const th = 'px-4 py-2.5 text-left text-xs font-medium tracking-wider text-stone-400 uppercase'
const td = 'px-4 py-3'
const cartao = 'overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'

function TabelaJogadores({
  lista,
  editar,
  excluir,
}: {
  lista: JogadorAdmin[]
  editar: (j: JogadorAdmin) => void
  excluir: (j: JogadorAdmin) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {SECOES.map(([posicao, titulo]) => {
        const daPosicao = lista.filter((j) => j.posicao === posicao)
        return (
          <section key={posicao} className={cartao}>
            <h3 className="flex items-center gap-2 border-b border-stone-200 px-4 py-3 font-semibold dark:border-stone-800">
              {titulo}
              <span className="rounded-full bg-stone-100 px-2 text-xs font-medium text-stone-500 dark:bg-stone-800">
                {daPosicao.length}
              </span>
            </h3>
            {daPosicao.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-400">Nenhum jogador nesta posição.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 dark:bg-stone-950">
                    <tr>
                      <th className={`${th} w-14`}>Nº</th>
                      <th className={th}>Jogador</th>
                      <th className={th}>Salário/mês</th>
                      <th className={th}>Multa nacional</th>
                      <th className={th}>Multa internacional</th>
                      <th className={th}>Aquisição</th>
                      <th className={th}>Contrato</th>
                      <th className={th}>Atualizado</th>
                      <th className={`${th} text-right`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {daPosicao.map((j) => (
                      <tr key={j.id} className="hover:bg-stone-50 dark:hover:bg-stone-950">
                        <td className={`${td} text-stone-400 tabular-nums`}>{j.numero}</td>
                        <td className={`${td} max-w-72`}>
                          <Jogador j={j} />
                        </td>
                        <td className={`${td} tabular-nums`}>
                          {j.salarioMensalReais ? (
                            reais.format(j.salarioMensalReais)
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                        <td className={`${td} tabular-nums`}>{valorOuTraco(j.multaNacionalReais, reais)}</td>
                        <td className={`${td} tabular-nums`}>{valorOuTraco(j.multaInternacionalEuros, euros)}</td>
                        <td className={`${td} tabular-nums`}>
                          {j.valorAquisicaoReais === 0 ? 'Sem custo' : valorOuTraco(j.valorAquisicaoReais, reais)}
                        </td>
                        <td className={`${td} tabular-nums`}>
                          {j.fimContrato ? dataBr(j.fimContrato) : <span className="text-stone-400">-</span>}
                        </td>
                        <td className={`${td} text-stone-400 tabular-nums`}>{dataBr(j.atualizadoEm)}</td>
                        <td className={td}>
                          <Acoes nome={j.nome} editar={() => editar(j)} excluir={() => excluir(j)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function TabelaContratos({ lista, editar }: { lista: JogadorAdmin[]; editar: (j: JogadorAdmin) => void }) {
  // vence primeiro no topo; sem data no final
  const ordenados = [...lista].sort((a, b) => (a.fimContrato ?? '9999').localeCompare(b.fimContrato ?? '9999'))
  const ate6 = lista.filter((j) => j.fimContrato && mesesRestantes(j.fimContrato) < 6).length
  const semData = lista.filter((j) => !j.fimContrato).length
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950 dark:text-red-300">
          <strong className="tabular-nums">{ate6}</strong> vencem em menos de 6 meses
        </span>
        <span className="rounded-lg bg-stone-100 px-3 py-2 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <strong className="tabular-nums">{semData}</strong> sem data de contrato
        </span>
      </div>
      <div className={cartao}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-950">
              <tr>
                <th className={th}>Jogador</th>
                <th className={th}>Posição</th>
                <th className={th}>Fim do contrato</th>
                <th className={th}>Tempo restante</th>
                <th className={th}>Salário/mês</th>
                <th className={`${th} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {ordenados.map((j) => (
                <tr key={j.id} className="hover:bg-stone-50 dark:hover:bg-stone-950">
                  <td className={`${td} max-w-72`}>
                    <Jogador j={j} />
                  </td>
                  <td className={`${td} text-stone-500`}>{j.posicao}</td>
                  <td className={`${td} tabular-nums`}>
                    {j.fimContrato ? dataBr(j.fimContrato) : <span className="text-stone-400">-</span>}
                  </td>
                  <td className={td}>
                    <Prazo fim={j.fimContrato} />
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {j.salarioMensalReais ? (
                      reais.format(j.salarioMensalReais)
                    ) : (
                      <span className="text-stone-400">-</span>
                    )}
                  </td>
                  <td className={td}>
                    <Acoes nome={j.nome} editar={() => editar(j)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const MENU = [
  ['jogadores', 'Jogadores', 'Elenco por posição'],
  ['contratos', 'Contratos', 'Vencimentos e salários'],
] as const

function Painel({ sair }: { sair: () => void }) {
  const [secao, setSecao] = useState<(typeof MENU)[number][0]>('jogadores')
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

  const fecharModal = () => {
    setEditando(null)
    setVersao((v) => v + 1)
  }

  const excluir = async (j: JogadorAdmin) => {
    if (!confirm(`Excluir ${j.nome}? Essa ação não pode ser desfeita.`)) return
    try {
      await admin(`/api/admin/jogadores/${j.id}`, { method: 'DELETE' })
      setVersao((v) => v + 1)
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) sair()
      else setErro(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const [, titulo, subtitulo] = MENU.find(([id]) => id === secao)!

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      {editando && (
        <Modal fechar={fecharModal}>
          <Formulario jogador={editando === 'novo' ? undefined : editando} sair={sair} fechar={fecharModal} />
        </Modal>
      )}

      <aside className="shrink-0 md:sticky md:top-6 md:w-56">
        <p className="mb-2 px-3 text-xs font-medium tracking-widest text-stone-400 uppercase">Backoffice</p>
        <nav className="flex gap-1 md:flex-col">
          {MENU.map(([id, nome]) => (
            <button
              key={id}
              onClick={() => setSecao(id)}
              aria-current={secao === id ? 'page' : undefined}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:bg-stone-100 aria-[current=page]:bg-stone-900 aria-[current=page]:text-white dark:text-stone-300 dark:hover:bg-stone-800 dark:aria-[current=page]:bg-stone-100 dark:aria-[current=page]:text-stone-900"
            >
              <Icone d={ICONES[id]} />
              {nome}
            </button>
          ))}
          <button
            onClick={sair}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-stone-500 transition-colors hover:bg-stone-100 md:mt-4 dark:hover:bg-stone-800"
          >
            <Icone d={ICONES.sair} />
            Sair
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold">{titulo}</h2>
            <p className="text-sm text-stone-400">
              {subtitulo}
              {jogadores && ` · ${jogadores.length} jogadores`}
            </p>
          </div>
          <button onClick={() => setEditando('novo')} className={`${botaoPrimario} ml-auto`}>
            Novo jogador
          </button>
        </div>
        {erro && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</p>}
        {!jogadores ? (
          <p className="text-sm text-stone-400">Carregando...</p>
        ) : secao === 'jogadores' ? (
          <TabelaJogadores lista={jogadores} editar={setEditando} excluir={excluir} />
        ) : (
          <TabelaContratos lista={jogadores} editar={setEditando} />
        )}
      </div>
    </div>
  )
}

// <dialog> nativo: Esc fecha, foco fica preso no modal e o fundo nao recebe cliques
function Modal({ fechar, children }: { fechar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={fechar}
      // clique no fundo escuro (fora do conteudo) fecha
      onClick={(e) => e.target === e.currentTarget && fechar()}
      className="m-auto max-h-[90vh] w-[min(56rem,calc(100vw-2rem))] rounded-2xl bg-stone-50 text-stone-800 shadow-2xl backdrop:bg-black/50 dark:bg-stone-950 dark:text-stone-200"
    >
      {/* padding no filho: assim so o fundo escuro conta como "fora" */}
      <div className="p-6">{children}</div>
    </dialog>
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
  const [foto, setFoto] = useState<File | null>(null)
  const previa = useMemo(() => foto && URL.createObjectURL(foto), [foto])
  useEffect(() => () => void (previa && URL.revokeObjectURL(previa)), [previa])

  const mudar =
    (k: keyof Campos, mascara: (v: string) => string = (v) => v) =>
    (e: { target: { value: string } }) =>
      setCampos({ ...campos, [k]: mascara(e.target.value) })

  const moeda = (k: 'salarioMensalReais' | (typeof MOEDAS)[number][0], rotulo: string, tipo: 'BRL' | 'EUR') => (
    <Campo rotulo={rotulo} erro={errosCampos[k]}>
      <input
        inputMode="numeric"
        placeholder={tipo === 'BRL' ? 'R$ 0' : '€ 0'}
        value={campos[k]}
        onChange={mudar(k, (v) => mascararMoeda(v, tipo))}
        className={input}
      />
    </Campo>
  )

  const data = (k: 'nascimento' | 'fimContrato', rotulo: string) => (
    <Campo rotulo={rotulo} erro={errosCampos[k]}>
      <input
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={campos[k]}
        onChange={mudar(k, mascararData)}
        className={input}
      />
    </Campo>
  )

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
    const { corpo: dados, erros } = paraEnvio(campos)
    if (Object.keys(erros).length) {
      setErro('Corrija os campos destacados')
      setErrosCampos(erros)
      return
    }
    executar(async () => {
      const corpo = JSON.stringify(dados)
      const salvo = atual
        ? await admin<JogadorAdmin>(`/api/admin/jogadores/${atual.id}`, { method: 'PUT', body: corpo })
        : await admin<JogadorAdmin>('/api/admin/jogadores', { method: 'POST', body: corpo })
      // se a foto falhar, os dados ja estao salvos: tentar de novo vira edicao, sem duplicar o jogador
      setAtual(salvo)
      if (foto) {
        const dados = new FormData()
        dados.append('arquivo', foto)
        await admin(`/api/admin/jogadores/${salvo.id}/foto`, { method: 'POST', body: dados })
      }
      fechar()
    })
  }

  const remover = () => {
    if (atual && confirm(`Excluir ${atual.nome}? Essa ação não pode ser desfeita.`)) {
      executar(async () => {
        await admin(`/api/admin/jogadores/${atual.id}`, { method: 'DELETE' })
        fechar()
      })
    }
  }

  const numero = (k: (typeof NUMEROS)[number], rotulo: string) => (
    <Campo rotulo={rotulo} erro={errosCampos[k]}>
      <input type="number" min={0} value={campos[k]} onChange={mudar(k)} className={input} />
    </Campo>
  )

  return (
    <form onSubmit={salvar} className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{atual ? `Editar ${atual.nome}` : 'Novo jogador'}</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className={`${botaoSecundario} ml-auto`}>
          ✕
        </button>
      </div>

      <div className="flex items-center gap-4">
        {previa || atual?.fotoUrl ? (
          <img src={previa || atual?.fotoUrl || ''} alt="" className="size-24 rounded-lg object-cover object-top" />
        ) : (
          <span className="size-24 rounded-lg bg-stone-200 dark:bg-stone-800" />
        )}
        <Campo
          rotulo={`${atual?.fotoUrl ? 'Trocar' : 'Adicionar'} foto (JPEG, PNG ou WebP, até 5 MB) · enviada ao salvar`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={enviando}
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </Campo>
      </div>

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
          <input
            maxLength={3}
            value={campos.nacionalidade}
            onChange={mudar('nacionalidade', (v) => v.toUpperCase().replace(/[^A-Z]/g, ''))}
            className={input}
          />
        </Campo>
        <div className="col-span-2">
          <Campo rotulo="Nome completo" erro={errosCampos.nomeCompleto}>
            <input value={campos.nomeCompleto} onChange={mudar('nomeCompleto')} className={input} />
          </Campo>
        </div>
        {data('nascimento', 'Nascimento')}
        {data('fimContrato', 'Fim do contrato')}
        {moeda('salarioMensalReais', 'Salário mensal', 'BRL')}
        {moeda('valorAquisicaoReais', 'Valor de aquisição (0 = sem custo)', 'BRL')}
        {moeda('multaNacionalReais', 'Multa nacional', 'BRL')}
        {moeda('multaInternacionalEuros', 'Multa internacional', 'EUR')}
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
            Excluir jogador
          </button>
        )}
      </div>
    </form>
  )
}
