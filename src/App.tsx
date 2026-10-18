import { useEffect, useState } from 'react'
import logo from './assets/logo.svg'
import Elenco from './pages/Elenco'
import Home from './pages/Home'

// shortcut: roteamento por hash (#/elenco), trocar por react-router quando houver rotas com parametros
const PAGINAS = { '': ['Home', Home], elenco: ['Elenco', Elenco] } as const
type Rota = keyof typeof PAGINAS

const rotaAtual = (): Rota => {
  const r = location.hash.replace('#/', '')
  return r in PAGINAS ? (r as Rota) : ''
}

export default function App() {
  const [rota, setRota] = useState(rotaAtual)
  useEffect(() => {
    const onHash = () => setRota(rotaAtual())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])
  const Pagina = PAGINAS[rota][1]

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="border-b border-stone-200">
        <div className="mx-auto flex items-center gap-8 px-4 py-5 lg:w-[90%] lg:px-0">
          <a href="#/" className="flex items-center gap-3">
            <img src={logo} alt="" className="h-9" />
            <h1 className="text-lg font-semibold tracking-tight">
              Todo Poderoso <span className="font-normal text-stone-400">| Hub</span>
            </h1>
          </a>
          <nav className="flex gap-6 text-sm">
            {(Object.keys(PAGINAS) as Rota[]).map((r) => (
              <a
                key={r}
                href={`#/${r}`}
                aria-current={rota === r ? 'page' : undefined}
                className="text-stone-500 transition-colors hover:text-stone-900 aria-[current=page]:font-medium aria-[current=page]:text-stone-900"
              >
                {PAGINAS[r][0]}
              </a>
            ))}
          </nav>
          <details className="group relative ml-auto">
            <summary
              aria-label="Sobre os dados"
              className="grid size-8 cursor-pointer list-none place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 group-open:bg-stone-100 group-open:text-stone-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </summary>
            <p className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-4 text-xs leading-relaxed text-stone-500 shadow-lg">
              As informações deste site são reunidas a partir de fontes públicas, como Wikipedia e Wikimedia Commons, e
              revisadas com cuidado. Ainda assim, podem conter imprecisões ou estar desatualizadas. Trabalhamos
              continuamente para manter os dados corretos e atualizados.
            </p>
          </details>
        </div>
      </header>
      <main className="mx-auto px-4 py-8 lg:w-[90%] lg:px-0">
        <Pagina />
      </main>
    </div>
  )
}
