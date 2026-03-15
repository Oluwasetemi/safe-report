export default async function ReportConfirmationPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = await paramsPromise
  return <main className="min-h-screen p-4">Report Confirmation {params.id} — TODO</main>
}
