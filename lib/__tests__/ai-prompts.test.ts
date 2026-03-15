import { describe, it, expect } from 'vitest'
import { classifyPrompt, SAFEGUIDE_SYSTEM_PROMPT } from '../ai/prompts'

describe('AI prompts', () => {
  it('classifyPrompt includes description and parish', () => {
    const prompt = classifyPrompt('Flooding on the main road', 'Kingston', 'near the market')
    expect(prompt).toContain('Flooding on the main road')
    expect(prompt).toContain('Kingston')
    expect(prompt).toContain('near the market')
  })

  it('SAFEGUIDE_SYSTEM_PROMPT mentions Patois', () => {
    expect(SAFEGUIDE_SYSTEM_PROMPT).toContain('Patois')
  })

  it('SAFEGUIDE_SYSTEM_PROMPT instructs not to request personal info', () => {
    expect(SAFEGUIDE_SYSTEM_PROMPT.toLowerCase()).toContain('personal')
  })
})
