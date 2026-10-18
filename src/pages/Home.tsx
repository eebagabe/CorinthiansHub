import logo from '../assets/logo.svg'

export default function Home() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <img src={logo} alt="Escudo do Corinthians" className="w-48 md:w-64" />
    </div>
  )
}
