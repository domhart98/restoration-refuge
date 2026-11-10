export default function Footer() {
  return(
    <footer className="border-t border-purple-100 bg-purple-50 px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} Restoration Refuge Massage Studio
        </p>

        <p>Relax. Restore. Refocus.</p>
      </div>
    </footer>
  )
}