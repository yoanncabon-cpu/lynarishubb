export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
