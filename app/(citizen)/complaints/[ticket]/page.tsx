export default async function ComplaintPage({
  params: paramsPromise,
}: {
  params: Promise<{ ticket: string }>
}) {
  const params = await paramsPromise
  return <main className="min-h-screen p-4">Complaint {params.ticket} — TODO</main>
}
