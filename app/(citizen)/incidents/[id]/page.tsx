export default async function IncidentPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = await paramsPromise
  return <main className="min-h-screen p-4">Incident {params.id} — TODO</main>
}
