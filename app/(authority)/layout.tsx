export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[var(--surface-raised)] border-r border-[var(--border)]">
        Authority Sidebar — TODO
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
