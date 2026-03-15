import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

describe('CategoryPicker', () => {
  it('renders all categories', async () => {
    const { CategoryPicker } = await import('../category-picker')
    render(<CategoryPicker value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/Fire \/ Explosion/i)).toBeDefined()
    expect(screen.getByText(/Flash Flood/i)).toBeDefined()
    expect(screen.getByText(/Crime/i)).toBeDefined()
  })

  it('calls onChange with selected category', async () => {
    const onChange = vi.fn()
    const { CategoryPicker } = await import('../category-picker')
    render(<CategoryPicker value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText(/Fire \/ Explosion/i))
    expect(onChange).toHaveBeenCalledWith('fire_explosion')
  })
})
