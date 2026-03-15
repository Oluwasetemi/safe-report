export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Category =
  | 'fire_explosion'
  | 'flash_flood'
  | 'medical_emergency'
  | 'building_collapse'
  | 'downed_power_line'
  | 'crime'
  | 'road_collapse'
  | 'pothole'
  | 'power_outage'
  | 'environmental'
  | 'violence'
  | 'road_hazard'
  | 'other'

export const ALL_CATEGORIES: Category[] = [
  'fire_explosion',
  'flash_flood',
  'medical_emergency',
  'building_collapse',
  'downed_power_line',
  'crime',
  'road_collapse',
  'pothole',
  'power_outage',
  'environmental',
  'violence',
  'road_hazard',
  'other',
]

export type ReportStatus = 'active' | 'acknowledged' | 'en_route' | 'resolved' | 'expired' | 'flagged'

export interface Report {
  id: string
  device_fingerprint: string
  lat: number
  lng: number
  accuracy?: number
  address?: string
  parish?: string
  description: string
  photo_url?: string
  voice_transcript?: string
  category: Category
  subcategory?: string
  severity: Severity
  ai_summary?: string
  ai_confidence?: number
  is_duplicate: boolean
  parent_incident_id?: string
  embedding?: number[]
  confidence_score: number
  corroboration_count: number
  reporter_trust_multiplier?: number
  status: ReportStatus
  departments_alerted?: string[]
  alerts_sent_at?: string
  acknowledged_by?: string
  acknowledged_at?: string
  en_route_at?: string
  resolved_at?: string
  resolution_description?: string
  is_crime: boolean
  suspect_description?: string
  direction_of_travel?: string
  contact_number?: string
  police_ref_number?: string
  ticket_number?: string
  escalated: boolean
  flagged: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

export interface ReporterProfile {
  fingerprint: string
  display_name?: string
  trust_level: number
  total_points: number
  monthly_points: number
  total_reports: number
  verified_reports: number
  accuracy_rate: number
  joined_at: string
}

export interface AuthorityOrg {
  id: string
  name: string
  type: 'police' | 'fire' | 'ambulance' | 'odpem' | 'parish_council' | 'jps'
  parish: string[]
  alert_phone?: string
  alert_whatsapp?: string
  alert_email?: string
}

export interface AuthorityUser {
  id: string
  org_id: string
  name: string
  role: string
  org?: AuthorityOrg
}

export interface AlertPayload {
  reportId: string
  category: Category
  severity: Severity
  address: string
  parish: string
  lat: number
  lng: number
  aiSummary: string
  timestamp: string
  mapUrl: string
  respondUrl: string
}

// PartyKit event types
export type ServerEvent =
  | { type: 'SNAPSHOT'; incidents: Report[] }
  | { type: 'INCIDENT_CREATED'; incident: Report }
  | { type: 'INCIDENT_UPDATED'; incident: Report }
  | { type: 'INCIDENT_RESOLVED'; incidentId: string }
  | { type: 'INCIDENT_CORROBORATED'; incidentId: string; confidenceScore: number; count: number }
  | { type: 'STATUS_UPDATE'; incidentId: string; status: ReportStatus; authorityName: string }
  | { type: 'PROXIMITY_ALERT'; incident: Report; distanceMeters: number }

export type ClientEvent =
  | { type: 'CORROBORATE'; incidentId: string }
  | { type: 'LOCATION_UPDATE'; lat: number; lng: number }

export interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  type: 'citizen' | 'authority'
  lat: number | null
  lng: number | null
  org_id: string | null
  created_at: string
}
