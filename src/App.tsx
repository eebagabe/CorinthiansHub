import { useState } from 'react'
import logo from './assets/logo.svg'
import jogadores from './data/players.json'

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
    import.meta.glob<string>('./assets/players/*', { eager: true, import: 'default', query: '?url' }),
  ).map(([caminho, url]) => [caminho.split('/').pop()!.split('.')[0], url]),
)

function PlayerCard({ jogador, aberto, onToggle }: { jogador: Jogador; aberto: boolean; onToggle: () => void }) {
  const foto = FOTOS_LOCAIS[jogador.numero] ?? jogador.foto
  return (
    <li className={`flex rounded-xl transition-colors ${aberto ? 'bg-stone-100' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className="w-52 shrink-0 cursor-pointer rounded-xl p-2 text-left transition-colors hover:bg-stone-100"
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
        <span className="block text-sm text-stone-500">{jogador.posicao}</span>
      </button>
      <div
        className={`overflow-hidden transition-[width] duration-300 ${aberto ? 'w-64' : 'w-0'}`}
        aria-hidden={!aberto}
      >
        <div className="w-64 p-4 text-sm text-stone-500">Expandido</div>
      </div>
    </li>
  )
}

export default function App() {
  const [aberto, setAberto] = useState<number | null>(null)
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="border-b border-stone-200">
        <div className="mx-auto flex items-center gap-3 px-4 py-5 lg:w-[90%] lg:px-0">
          <img src={logo} alt="Escudo do Corinthians" className="h-9" />
          <h1 className="text-lg font-semibold tracking-tight">
            Todo Poderoso <span className="font-normal text-stone-400">| Hub</span>
          </h1>
        </div>
      </header>
      <main className="mx-auto px-4 py-8 lg:w-[90%] lg:px-0">
        {POSICOES.map(([posicao, titulo]) => (
          <section key={posicao} className="mb-10">
            <h2 className="mb-2 px-2 text-xs font-medium tracking-widest text-stone-400 uppercase">{titulo}</h2>
            <ul className="flex flex-wrap gap-2">
              {jogadores
                .filter((j) => j.posicao === posicao)
                .map((j) => (
                  <PlayerCard
                    key={j.numero}
                    jogador={j}
                    aberto={aberto === j.numero}
                    onToggle={() => setAberto(aberto === j.numero ? null : j.numero)}
                  />
                ))}
            </ul>
          </section>
        ))}
      </main>
      <footer className="pb-8 text-center text-xs text-stone-400">Dados: Wikipedia / Wikimedia Commons</footer>
    </div>
  )
}
