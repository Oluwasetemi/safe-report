import Link from 'next/link'

export default async function ComplaintPage({
  params: paramsPromise,
}: {
  params: Promise<{ ticket: string }>
}) {
  const params = await paramsPromise
  return (
    <main className="min-h-screen p-4" style={{ background: 'var(--surface-base)', color: 'var(--text-primary)' }}>
      <Link
        href="/"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-barlow-condensed)', textDecoration: 'none', letterSpacing: 1, marginBottom: 24 }}
      >
        ← HOME
      </Link>
      <p style={{ color: 'var(--text-muted)' }}>Complaint {params.ticket} — TODO</p>
    </main>
  )
}
