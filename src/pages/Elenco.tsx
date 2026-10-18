import { useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { API_URL } from '../api'
import { tempoRestante } from '../datas'

const POSICOES = [
  ['Goleiro', 'Goleiros'],
  ['Defensor', 'Defensores'],
  ['Meio-campista', 'Meio-campistas'],
  ['Atacante', 'Atacantes'],
] as const

// GET /api/jogadores (backend); campos de detalhe ficam null enquanto nao foram coletados
type Jogador = {
  numero: number
  nome: string
  posicao: string
  fotoUrl: string | null
  nomeCompleto: string | null
  nascimento: string | null
  jogos: number | null
  titular: number | null
  jogosSemSofrerGols: number | null
  jogosSelecao: number | null
  multaNacionalReais: number | null
  multaInternacionalReais: number | null
  valorAquisicaoReais: number | null // 0 = sem custo
  fimContrato: string | null
  salarioMensalReais: number // estimativa; 0 = nao encontrado
  titulos: string[]
  atualizadoEm: string
}

const data = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString('pt-BR')
const reais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function idade(nascimento: string) {
  const [a, m, d] = nascimento.split('-').map(Number)
  const hoje = new Date()
  return hoje.getFullYear() - a - (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d) ? 1 : 0)
}

function PlayerCard({ jogador, aberto, onToggle }: { jogador: Jogador; aberto: boolean; onToggle: () => void }) {
  const foto = jogador.fotoUrl
  return (
    <li
      style={{ viewTransitionName: `jogador-${jogador.numero}` }}
      className={`flex rounded-xl ${aberto ? 'bg-stone-900 text-white shadow-lg dark:bg-stone-100 dark:text-stone-900' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className={`w-64 shrink-0 cursor-pointer self-start rounded-xl p-2 text-left transition-colors ${aberto ? '' : 'hover:bg-stone-100 dark:hover:bg-stone-900'}`}
      >
        {foto ? (
          <img
            src={foto}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-lg bg-stone-200 object-cover dark:bg-stone-800 object-top"
          />
        ) : (
          <span className="block aspect-square w-full rounded-lg bg-stone-200 dark:bg-stone-800" />
        )}
        <span className="mt-3 flex items-baseline gap-2">
          <span className="text-sm text-stone-400 tabular-nums">{jogador.numero}</span>
          <span className="font-medium">{jogador.nome}</span>
        </span>
        <span
          className={`block text-sm ${aberto ? 'text-stone-300 dark:text-stone-600' : 'text-stone-500 dark:text-stone-400'}`}
        >
          {jogador.posicao}
        </span>
      </button>
      {aberto && <Detalhes jogador={jogador} />}
    </li>
  )
}

function Detalhes({ jogador: j }: { jogador: Jogador }) {
  const itens = (
    [
      ['Idade', j.nascimento && `${idade(j.nascimento)} anos`],
      ['Multa nacional', j.multaNacionalReais != null && reais.format(j.multaNacionalReais)],
      ['Multa internacional', j.multaInternacionalReais != null && reais.format(j.multaInternacionalReais)],
      [
        'Aquisição',
        j.valorAquisicaoReais === 0
          ? 'Sem custo'
          : j.valorAquisicaoReais != null && reais.format(j.valorAquisicaoReais),
      ],
      ['Salário estimado', j.salarioMensalReais > 0 && `${reais.format(j.salarioMensalReais)}/mês`],
      ['Jogos pelo Corinthians', j.jogos],
      ['Jogos como titular', j.titular],
      ['Jogos sem sofrer gols', j.jogosSemSofrerGols],
      ['Jogos pela seleção', j.jogosSelecao],
      ['Títulos pelo Corinthians', j.titulos.length > 0 && <Titulos key="titulos" titulos={j.titulos} />],
    ] as [string, ReactNode][]
  ).filter(([, valor]) => valor !== null && valor !== undefined && valor !== false) // sem dado, sem secao
  return (
    <div className="flex w-96 flex-col gap-4 p-4 text-sm">
      {j.nomeCompleto && (
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500">Nome completo</p>
          <p className="font-medium">{j.nomeCompleto}</p>
        </div>
      )}
      {itens.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {itens.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-xs text-stone-400 dark:text-stone-500">{rotulo}</dt>
              <dd className="font-medium tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {j.fimContrato && (
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500">Contrato</p>
          <p className="font-medium">
            até {data(j.fimContrato)}
            <span className="font-normal text-stone-400 dark:text-stone-500"> · {tempoRestante(j.fimContrato)}</span>
          </p>
        </div>
      )}
      <p className="mt-auto text-[11px] text-stone-500">
        Atualizado em {data(j.atualizadoEm)} · jogos: ogol.com.br · salário, multas, aquisição e contrato: levantamento
        em apps e imprensa
      </p>
    </div>
  )
}

function Titulos({ titulos }: { titulos: string[] }) {
  return (
    <span className="group/titulos relative inline-flex items-center gap-1.5">
      {titulos.length}
      <span
        tabIndex={0}
        aria-label={`Ver títulos: ${titulos.join(', ')}`}
        className="grid size-4 cursor-help place-items-center rounded-full border border-current text-[10px] leading-none opacity-60 outline-none hover:opacity-100 focus-visible:opacity-100"
      >
        i
      </span>
      <ul
        role="tooltip"
        className="invisible absolute bottom-full left-0 z-20 mb-2 w-max max-w-64 rounded-lg bg-white px-3 py-2 text-xs font-normal text-stone-700 opacity-0 shadow-lg transition-opacity group-focus-within/titulos:visible group-focus-within/titulos:opacity-100 group-hover/titulos:visible group-hover/titulos:opacity-100 dark:bg-stone-900 dark:text-stone-200"
      >
        {titulos.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </span>
  )
}

export default function Elenco() {
  const [jogadores, setJogadores] = useState<Jogador[] | null>(null)
  const [erro, setErro] = useState(false)
  const [aberto, setAberto] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/jogadores`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setJogadores)
      .catch(() => setErro(true))
  }, [])

  if (erro)
    return <p className="text-sm text-stone-500">Não foi possível carregar o elenco. Tente novamente mais tarde.</p>
  if (!jogadores) return <p className="text-sm text-stone-400">Carregando elenco...</p>

  function toggle(j: Jogador) {
    const atualizar = () => flushSync(() => setAberto(aberto === j.numero ? null : j.numero))
    // View Transitions anima o card subindo para o topo; sem suporte, so troca direto
    if (document.startViewTransition) document.startViewTransition(atualizar)
    else atualizar()
    if (aberto !== j.numero) document.getElementById(j.posicao)?.scrollIntoView({ behavior: 'smooth' })
  }

  const comSalario = jogadores.filter((j) => j.salarioMensalReais > 0)
  const folhaMensal = comSalario.reduce((soma, j) => soma + j.salarioMensalReais, 0)

  return (
    <>
      <div className="mb-10 px-2">
        <p className="text-xs font-medium tracking-widest text-stone-400 uppercase">Folha salarial estimada</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {reais.format(folhaMensal)}
          <span className="text-base font-normal text-stone-400">/mês</span>
        </p>
        <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
          Soma de {comSalario.length} de {jogadores.length} jogadores com salário encontrado · estimativa de apps e
          imprensa, o clube não divulga salários
        </p>
      </div>
      {POSICOES.map(([posicao, titulo]) => (
        <section key={posicao} id={posicao} className="mb-10 scroll-mt-4">
          <h2 className="mb-2 px-2 text-xs font-medium tracking-widest text-stone-400 uppercase">{titulo}</h2>
          <ul className="flex flex-wrap gap-2">
            {jogadores
              .filter((j) => j.posicao === posicao)
              .sort((a, b) => Number(b.numero === aberto) - Number(a.numero === aberto))
              .map((j) => (
                <PlayerCard key={j.numero} jogador={j} aberto={aberto === j.numero} onToggle={() => toggle(j)} />
              ))}
          </ul>
        </section>
      ))}
    </>
  )
}
