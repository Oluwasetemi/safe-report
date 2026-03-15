import { generateObject, generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { ALL_CATEGORIES, type Category, type Severity } from '../types'
import { generateEmbedding } from './embeddings'
import { findDuplicate } from './dedup'
import { classifyPrompt } from './prompts'

const ClassificationSchema = z.object({
  category:       z.enum(ALL_CATEGORIES as [Category, ...Category[]]),
  subcategory:    z.string(),
  severity:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  urgencySignals: z.array(z.string()),
  confidence:     z.number().min(0).max(1),
})

export interface ClassifyInput {
  description: string
  parish: string
  lat: number
  lng: number
  landmarks?: string
}

export interface ClassifyResult {
  category: Category
  subcategory: string
  severity: Severity
  urgencySignals: string[]
  confidence: number
  aiSummary: string
  embedding: number[]
  isDuplicate: boolean
  parentId?: string
}

export async function classifyReport(input: ClassifyInput): Promise<ClassifyResult> {
  const { description, parish, lat, lng, landmarks } = input

  // Step 1: AI classification
  const { object } = await generateObject({
    model:  anthropic('claude-sonnet-4-5'),
    schema: ClassificationSchema,
    prompt: classifyPrompt(description, parish, landmarks),
  })

  // Step 2: Generate embedding
  const embedding = await generateEmbedding(description)

  // Step 3: Check for duplicate
  const parentId = await findDuplicate(embedding, lat, lng)
  if (parentId) {
    return {
      ...object,
      aiSummary: '',
      embedding,
      isDuplicate: true,
      parentId,
    }
  }

  // Step 4: Upgrade severity if urgency signals present
  let severity: Severity = object.severity
  if (object.urgencySignals.length > 0 && (severity === 'LOW' || severity === 'MEDIUM')) {
    severity = 'HIGH'
  }

  // Step 5: Generate AI summary
  const { text: aiSummary } = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    prompt: `Write a 1-2 sentence factual summary of this incident for display on a public safety map.
Parish: ${parish}
Category: ${object.category}
Description: "${description}"
Keep it concise and factual. Do not include personal details.`,
  })

  return {
    ...object,
    severity,
    aiSummary,
    embedding,
    isDuplicate: false,
  }
}
