import { describe, it, expect } from 'vitest'
import { getDepartmentsForCategory } from '../alerts/routing'

describe('getDepartmentsForCategory', () => {
  it('routes fire to fire and ambulance', () => {
    expect(getDepartmentsForCategory('fire_explosion')).toEqual(
      expect.arrayContaining(['fire', 'ambulance'])
    )
  })

  it('routes crime to police only', () => {
    expect(getDepartmentsForCategory('crime')).toEqual(['police'])
  })

  it('routes power_outage to jps only', () => {
    expect(getDepartmentsForCategory('power_outage')).toEqual(['jps'])
  })

  it('routes building_collapse to fire, ambulance, odpem', () => {
    const depts = getDepartmentsForCategory('building_collapse')
    expect(depts).toEqual(expect.arrayContaining(['fire', 'ambulance', 'odpem']))
  })

  it('routes unknown categories to police as fallback', () => {
    expect(getDepartmentsForCategory('other')).toEqual(expect.arrayContaining(['police']))
  })
})
