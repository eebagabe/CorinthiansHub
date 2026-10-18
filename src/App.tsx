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

function PlayerRow({ jogador }: { jogador: Jogador }) {
  const foto = FOTOS_LOCAIS[jogador.numero] ?? jogador.foto
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 transition-colors hover:bg-stone-100">
          <span className="w-8 text-right text-sm text-stone-400 tabular-nums">{jogador.numero}</span>
          {foto ? (
            <img src={foto} alt="" loading="lazy" className="size-9 rounded-full bg-stone-200 object-cover object-top" />
          ) : (
            <span className="size-9 rounded-full bg-stone-200" />
          )}
          <span className="flex-1 font-medium">{jogador.nome}</span>
          <span className="text-sm text-stone-500">{jogador.posicao}</span>
          <span className="text-stone-400 transition-transform group-open:rotate-90">›</span>
        </summary>
        <div className="px-4 pt-1 pb-4 pl-29 text-sm text-stone-500">Expandido</div>
      </details>
    </li>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="border-b border-stone-200">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <img src={logo} alt="Escudo do Corinthians" className="h-9" />
          <h1 className="text-lg font-semibold tracking-tight">
            Todo Poderoso <span className="font-normal text-stone-400">| Hub</span>
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {POSICOES.map(([posicao, titulo]) => (
          <section key={posicao} className="mb-8">
            <h2 className="mb-2 px-4 text-xs font-medium tracking-widest text-stone-400 uppercase">{titulo}</h2>
            <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
              {jogadores
                .filter((j) => j.posicao === posicao)
                .map((j) => (
                  <PlayerRow key={j.numero} jogador={j} />
                ))}
            </ul>
          </section>
        ))}
      </main>
      <footer className="pb-8 text-center text-xs text-stone-400">Dados: Wikipedia / Wikimedia Commons</footer>
    </div>
  )
}
