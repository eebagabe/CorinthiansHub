import { useState } from 'react'
import { flushSync } from 'react-dom'
import jogadores from '../data/players.json'

const POSICOES = [
  ['Goleiro', 'Goleiros'],
  ['Defensor', 'Defensores'],
  ['Meio-campista', 'Meio-campistas'],
  ['Atacante', 'Atacantes'],
] as const

type Jogador = (typeof jogadores)[number]

// Foto local em src/assets/players/<numero>.<ext> tem prioridade sobre a da Wikipedia
const FOTOS_LOCAIS = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/players/*', { eager: true, import: 'default', query: '?url' }),
  ).map(([caminho, url]) => [caminho.split('/').pop()!.split('.')[0], url]),
)

function PlayerCard({ jogador, aberto, onToggle }: { jogador: Jogador; aberto: boolean; onToggle: () => void }) {
  const foto = FOTOS_LOCAIS[jogador.numero] ?? jogador.foto
  return (
    <li
      style={{ viewTransitionName: `jogador-${jogador.numero}` }}
      className={`flex rounded-xl ${aberto ? 'bg-stone-900 text-white shadow-lg' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className={`w-64 shrink-0 cursor-pointer rounded-xl p-2 text-left transition-colors ${aberto ? '' : 'hover:bg-stone-100'}`}
      >
        {foto ? (
          <img src={foto} alt="" loading="lazy" className="aspect-square w-full rounded-lg bg-stone-200 object-cover object-top" />
        ) : (
          <span className="block aspect-square w-full rounded-lg bg-stone-200" />
        )}
        <span className="mt-3 flex items-baseline gap-2">
          <span className="text-sm text-stone-400 tabular-nums">{jogador.numero}</span>
          <span className="font-medium">{jogador.nome}</span>
        </span>
        <span className={`block text-sm ${aberto ? 'text-stone-300' : 'text-stone-500'}`}>{jogador.posicao}</span>
      </button>
      {aberto && <div className="w-64 p-4 text-sm text-stone-300">Expandido</div>}
    </li>
  )
}

export default function Elenco() {
  const [aberto, setAberto] = useState<number | null>(null)

  function toggle(j: Jogador) {
    const atualizar = () => flushSync(() => setAberto(aberto === j.numero ? null : j.numero))
    // View Transitions anima o card subindo para o topo; sem suporte, so troca direto
    if (document.startViewTransition) document.startViewTransition(atualizar)
    else atualizar()
    if (aberto !== j.numero) document.getElementById(j.posicao)?.scrollIntoView({ behavior: 'smooth' })
  }

  return POSICOES.map(([posicao, titulo]) => (
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
  ))
}
