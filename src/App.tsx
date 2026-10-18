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

function PlayerCard({ jogador }: { jogador: Jogador }) {
  const foto = FOTOS_LOCAIS[jogador.numero] ?? jogador.foto
  return (
    <article className="relative overflow-hidden rounded-lg bg-neutral-900 text-center">
      {foto ? (
        <img
          src={foto}
          alt={jogador.nome}
          loading="lazy"
          className="aspect-3/4 w-full bg-neutral-800 object-cover object-top"
        />
      ) : (
        <div className="grid aspect-3/4 w-full place-items-center bg-neutral-800 text-6xl text-neutral-600">
          {jogador.numero}
        </div>
      )}
      <span className="absolute top-2 left-2 rounded bg-black px-2 py-0.5 font-bold">{jogador.numero}</span>
      <h3 className="mx-2 mt-2.5 font-semibold">{jogador.nome}</h3>
      <p className="mb-3 text-sm text-neutral-400">{jogador.posicao}</p>
    </article>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center gap-4 border-b-2 border-white bg-black px-6 py-4">
        <img src={logo} alt="Escudo do Corinthians" className="h-16" />
        <h1 className="text-2xl font-bold tracking-widest uppercase">Elenco Profissional</h1>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        {POSICOES.map(([posicao, titulo]) => (
          <section key={posicao}>
            <h2 className="my-6 border-l-4 border-white pl-2.5 text-xl font-bold uppercase">{titulo}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
              {jogadores
                .filter((j) => j.posicao === posicao)
                .map((j) => (
                  <PlayerCard key={j.numero} jogador={j} />
                ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="p-6 text-center text-xs text-neutral-500">Dados e fotos: Wikipedia / Wikimedia Commons</footer>
    </div>
  )
}
