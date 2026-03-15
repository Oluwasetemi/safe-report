export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: text, model: 'voyage-3' }),
  })

  if (!res.ok) {
    throw new Error(`Voyage AI embedding failed: ${res.status} ${await res.text()}`)
  }

  const json = await res.json() as { data: { embedding: number[] }[] }
  return json.data[0]?.embedding ?? []
}
