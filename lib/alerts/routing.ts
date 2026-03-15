import type { Category } from '../types'

type DepartmentType = 'police' | 'fire' | 'ambulance' | 'odpem' | 'parish_council' | 'jps'

const ROUTING: Record<Category, DepartmentType[]> = {
  fire_explosion:    ['fire', 'ambulance'],
  flash_flood:       ['police', 'odpem'],
  medical_emergency: ['police', 'ambulance'],
  building_collapse: ['fire', 'ambulance', 'odpem'],
  downed_power_line: ['fire', 'odpem', 'jps'],
  crime:             ['police'],
  violence:          ['police'],
  road_collapse:     ['police', 'parish_council'],
  pothole:           ['parish_council'],
  power_outage:      ['jps'],
  environmental:     ['odpem', 'parish_council'],
  road_hazard:       ['police', 'parish_council'],
  other:             ['police'],
}

export function getDepartmentsForCategory(category: Category): DepartmentType[] {
  return ROUTING[category] ?? ['police']
}
