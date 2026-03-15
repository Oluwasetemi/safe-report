import { redirect } from 'next/navigation'

// /incidents/[id] is a legacy route — canonical URL is /report/[id]
export default async function IncidentDetailRedirect({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await paramsPromise
  redirect(`/report/${id}`)
}
