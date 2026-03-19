// Nominatim returns full names ("Saint Andrew") but our DB stores abbreviated names ("St. Andrew")
const PARISH_NORMALIZE: Record<string, string> = {
  'saint andrew':    'St. Andrew',
  'saint ann':       'St. Ann',
  'saint catherine': 'St. Catherine',
  'saint elizabeth': 'St. Elizabeth',
  'saint james':     'St. James',
  'saint mary':      'St. Mary',
  'saint thomas':    'St. Thomas',
  'kingston':        'Kingston',
  'clarendon':       'Clarendon',
  'hanover':         'Hanover',
  'manchester':      'Manchester',
  'portland':        'Portland',
  'trelawny':        'Trelawny',
  'westmoreland':    'Westmoreland',
}

export function normalizeParish(raw: string): string {
  return PARISH_NORMALIZE[raw.toLowerCase().trim()] ?? raw
}

export async function forwardGeocode(
  address: string
): Promise<{ lat: number; lng: number; address: string; parish: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)
  try {
    const q = encodeURIComponent(`${address}, Jamaica`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=jm`,
      { headers: { 'User-Agent': 'SafeReport/1.0 (safereport.app)' }, signal: controller.signal }
    )
    if (!res.ok) return null

    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) return null

    const top = results[0]
    const lat = parseFloat(top.lat)
    const lng = parseFloat(top.lon)
    if (isNaN(lat) || isNaN(lng)) return null

    // Resolve parish from the display_name field (Nominatim forward results
    // don't always include address breakdown at the same depth as /reverse)
    const displayName: string = top.display_name ?? ''
    let parish = ''
    for (const [raw, normalized] of Object.entries(PARISH_NORMALIZE)) {
      if (displayName.toLowerCase().includes(raw)) {
        parish = normalized
        break
      }
    }

    return { lat, lng, address: top.display_name ?? address, parish }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; parish: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'SafeReport/1.0 (safereport.app)' } }
    )
    if (!res.ok) return { address: '', parish: '' }

    const data = await res.json()
    const addr = data.address
    const rawParish = addr.county || addr.city_district || addr.state_district || ''
    const parish = normalizeParish(rawParish)
    const road = addr.road || addr.pedestrian || ''
    const city = addr.city || addr.town || addr.village || ''
    const address = [road, city, 'Jamaica'].filter(Boolean).join(', ')

    return { address, parish }
  } catch {
    return { address: '', parish: '' }
  }
}
