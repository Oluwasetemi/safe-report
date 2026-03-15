export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; parish: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'SafeReport/1.0 (safereport.app)' } }
    )
    if (!res.ok) return { address: '', parish: '' }

    const data = await res.json()
    const addr = data.address
    const parish = addr.county || addr.city_district || addr.state_district || ''
    const road = addr.road || addr.pedestrian || ''
    const city = addr.city || addr.town || addr.village || ''
    const address = [road, city, 'Jamaica'].filter(Boolean).join(', ')

    return { address, parish }
  } catch {
    return { address: '', parish: '' }
  }
}
