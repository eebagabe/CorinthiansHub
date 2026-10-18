import { useEffect, useState } from 'react'
import logo from './assets/logo.svg'
import Admin from './pages/Admin'
import Elenco from './pages/Elenco'
import Home from './pages/Home'

// shortcut: roteamento por hash (#/elenco), trocar por react-router quando houver rotas com parametros
const PAGINAS = { '': ['Home', Home], elenco: ['Elenco', Elenco], admin: ['Admin', Admin] } as const
type Rota = keyof typeof PAGINAS
// backoffice fica fora do menu publico: acesso so pelo endereco #/admin
const MENU: Rota[] = ['', 'elenco']

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

  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', escuro)
    try {
      localStorage.setItem('tema', escuro ? 'escuro' : 'claro')
    } catch {
      // sem storage (aba privada), o tema so nao fica salvo
    }
  }, [escuro])

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex items-center gap-8 px-4 py-5 lg:w-[90%] lg:px-0">
          <a href="#/" className="flex items-center gap-3">
            <img src={logo} alt="" className="h-9" />
            <h1 className="text-lg font-semibold tracking-tight">
              Todo Poderoso <span className="font-normal text-stone-400 dark:text-stone-500">| Hub</span>
            </h1>
          </a>
          <nav className="flex gap-6 text-sm">
            {MENU.map((r) => (
              <a
                key={r}
                href={`#/${r}`}
                aria-current={rota === r ? 'page' : undefined}
                className="text-stone-500 transition-colors hover:text-stone-900 aria-[current=page]:font-medium aria-[current=page]:text-stone-900 dark:text-stone-400 dark:hover:text-white dark:aria-[current=page]:text-white"
              >
                {PAGINAS[r][0]}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <details className="group relative">
              <summary
                aria-label="Sobre os dados"
                className="grid size-8 cursor-pointer list-none place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 group-open:bg-stone-100 group-open:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 dark:group-open:bg-stone-800 dark:group-open:text-stone-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="size-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </summary>
              <p className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-4 text-xs leading-relaxed text-stone-500 shadow-lg dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
                As informações deste site são reunidas a partir de fontes públicas, como Wikipedia e Wikimedia Commons,
                e revisadas com cuidado. Ainda assim, podem conter imprecisões ou estar desatualizadas. Trabalhamos
                continuamente para manter os dados corretos e atualizados.
              </p>
            </details>
            <button
              type="button"
              role="switch"
              aria-checked={escuro}
              aria-label="Modo escuro"
              onClick={() => setEscuro(!escuro)}
              className="relative ml-2 h-7 w-13 cursor-pointer rounded-full bg-stone-200 transition-colors dark:bg-stone-700"
            >
              {/* escudo escuro com o modo desligado, escudo claro com o modo ligado */}
              <span className="absolute top-0.5 left-0.5 grid size-6 place-items-center rounded-full bg-white shadow transition-transform dark:translate-x-6 dark:bg-stone-900">
                <img src={logo} alt="" className={`h-4 grayscale ${escuro ? 'invert' : 'brightness-50'}`} />
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto px-4 py-8 lg:w-[90%] lg:px-0">
        <Pagina />
      </main>
    </div>
  )
}
