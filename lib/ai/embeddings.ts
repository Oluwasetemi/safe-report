import { VoyageAIClient as VoyageAI } from 'voyageai'

const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY! })

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await voyage.embed({
    input: text,
    model: 'voyage-3',
  })
  return result.data[0].embedding
}
