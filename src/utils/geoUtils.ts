/**
 * geoUtils — Geographic ↔ 3D sphere coordinate utilities & Land Masking
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Coordinate convention matches Three.js SphereGeometry:
 *   x = -r · sin(colatitude) · cos(longitude)
 *   y =  r · cos(colatitude)                    (Y = up / North Pole)
 *   z =  r · sin(colatitude) · sin(longitude)
 *
 * => Indian Ocean (~70°E) faces the +Z axis → visible from default camera [0,0,4.5]
 */

export const GLOBE_RADIUS = 2.0

/**
 * Convert geographic coordinates to a 3D position on a sphere.
 * @param lat  Latitude  in degrees (-90 to 90)
 * @param lon  Longitude in degrees (-180 to 180 or 0 to 360)
 * @param radius Sphere radius (default = GLOBE_RADIUS)
 */
export function latLonToVec3(
  lat: number,
  lon: number,
  radius: number = GLOBE_RADIUS
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180) // colatitude
  const theta = lon * (Math.PI / 180)       // longitude in radians
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

/**
 * Recover latitude and longitude from a 3D position on a sphere.
 * @param x, y, z  Position on sphere (any radius)
 */
export function vec3ToLatLon(
  x: number,
  y: number,
  z: number
): [number, number] {
  const r = Math.sqrt(x * x + y * y + z * z)
  const lat = Math.asin(y / r) * (180 / Math.PI)
  const lon = Math.atan2(z, -x) * (180 / Math.PI) // matches SphereGeometry convention
  return [lat, lon]
}

/**
 * Compute the 3D endpoint of a current arrow at (lat, lon).
 */
export function currentArrowEnd(
  lat: number,
  lon: number,
  u: number,
  v: number,
  scale: number = 0.08,
  radius: number = GLOBE_RADIUS
): [number, number, number] {
  const [x, y, z] = latLonToVec3(lat, lon, radius)
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = lon * (Math.PI / 180)

  // East unit vector
  const ex = Math.sin(theta)
  const ey = 0
  const ez = Math.cos(theta)

  // North unit vector
  const nx = Math.sin(phi) * Math.cos(theta)
  const ny = Math.cos(phi)
  const nz = -Math.sin(phi) * Math.sin(theta)

  const dx = (u * ex + v * nx) * scale
  const dy = (u * ey + v * ny) * scale
  const dz = (u * ez + v * nz) * scale

  return [x + dx, y + dy, z + dz]
}

/**
 * High-performance land masking helper for strict coastline clipping.
 * Returns true if (lat, lon) intersects a continental landmass or major island.
 */
export function isLandCoordinate(lat: number, lon: number): boolean {
  // Normalize lon to -180..180
  const nlon = ((((lon + 180) % 360) + 360) % 360) - 180

  // 1. Polar ice caps
  if (lat < -62) return true
  if (lat > 80) return true

  // 2. Sri Lanka (island)
  if (lat >= 5.8 && lat <= 9.9 && nlon >= 79.5 && nlon <= 82.0) {
    return true
  }

  // 3. Indian Subcontinent
  if (lat >= 8.0 && lat <= 22.0) {
    // Peninsula West Coast: ~77.5 at Cape Comorin (8°N), ~73.5 at Goa (15°N), ~72.8 at Mumbai (19°N), ~69.0 at Gujarat (22°N)
    const westCoast = lat < 19.0
      ? 77.5 - ((lat - 8.0) * (77.5 - 72.8)) / 11.0
      : 72.8 - ((lat - 19.0) * (72.8 - 69.0)) / 3.0

    // Peninsula East Coast: ~77.5 at Cape Comorin (8°N), ~80.3 at Chennai (13°N), ~84.5 at Vizag (17.5°N), ~88.0 at Bengal (22°N)
    const eastCoast = 77.5 + ((lat - 8.0) * (88.0 - 77.5)) / 14.0

    if (nlon >= westCoast && nlon <= eastCoast) {
      return true
    }
  }

  // Northern India, Pakistan, Nepal, Bangladesh, Tibet (lat 22°N to 36°N)
  if (lat > 22.0 && lat <= 36.0 && nlon >= 68.0 && nlon <= 92.5) {
    // Arabian Sea / Gulf of Kutch cut
    if (lat < 24.0 && nlon < 69.5) return false
    return true
  }

  // 4. Arabian Peninsula & Middle East
  if (lat >= 12.0 && lat <= 32.0 && nlon >= 34.0 && nlon <= 60.0) {
    // Red Sea cut
    if (nlon >= 33.0 && nlon <= 43.5 && lat >= 12.5 && lat <= 28.5) return false
    // Persian Gulf cut
    if (nlon >= 47.5 && nlon <= 56.5 && lat >= 24.0 && lat <= 30.5) return false
    // Gulf of Oman cut
    if (nlon >= 56.5 && nlon <= 60.0 && lat >= 22.0 && lat <= 26.0) return false
    // Gulf of Aden cut
    if (nlon >= 43.0 && nlon <= 51.5 && lat >= 11.5 && lat <= 15.0) return false
    return true
  }

  // 5. Africa
  if (lat >= -35.0 && lat <= 37.0 && nlon >= -18.0 && nlon <= 52.0) {
    // Madagascar is handled separately below
    if (lat >= -26.0 && lat <= -11.5 && nlon >= 43.0 && nlon <= 51.0) {
      return true
    }

    // East African Coastline:
    // South of Equator (-35 to 0): Mozambique/Tanzania coast is around 32°E to 40°E
    if (lat < 0 && nlon > 41.0) return false
    // Horn of Africa (0 to 12°N): Somalia coast runs from 41°E at 0°N to 51.2°E at 12°N
    if (lat >= 0 && lat <= 12.0) {
      const somaliaCoast = 41.0 + (lat / 12.0) * 10.2
      if (nlon > somaliaCoast) return false
    }
    // North of 12°N: Gulf of Aden / Red Sea handled in cuts above
    if (lat > 12.0 && nlon > 43.5) return false

    return true
  }

  // 6. Southeast Asia & Sunda Region
  if (lat >= 9.5 && lat <= 26.0 && nlon >= 98.5 && nlon <= 110.0) {
    return true // Myanmar, Thailand, Indochina (leaves Andaman Sea 92-98°E as ocean)
  }
  if (lat >= 1.0 && lat <= 9.5 && nlon >= 99.8 && nlon <= 104.5) {
    return true // Malay Peninsula
  }
  // Sumatra diagonal band
  if (lat >= -6.0 && lat <= 5.8 && nlon >= 95.0 && nlon <= 106.0) {
    const centerLon = 95.5 + (5.8 - lat) * 0.95
    if (Math.abs(nlon - centerLon) < 2.4) return true
  }
  // Java
  if (lat >= -8.8 && lat <= -5.8 && nlon >= 105.0 && nlon <= 115.0) {
    return true
  }

  // 7. Australia
  if (lat >= -44.0 && lat <= -10.5 && nlon >= 113.0 && nlon <= 154.0) {
    return true
  }

  // 8. Eurasia (Europe & Northern Asia)
  if (lat >= 36.0 && lat <= 76.0 && nlon >= -10.0 && nlon <= 175.0) {
    // Mediterranean Sea cut
    if (lat <= 45.0 && nlon >= -5.0 && nlon <= 36.0) return false
    return true
  }

  // 9. North America
  if (lat >= 15.0 && lat <= 75.0 && nlon >= -168.0 && nlon <= -50.0) {
    // Gulf of Mexico cut
    if (lat >= 18 && lat <= 30 && nlon >= -98 && nlon <= -82) return false
    return true
  }

  // 10. South America
  if (lat >= -56.0 && lat <= 12.0 && nlon >= -82.0 && nlon <= -34.0) {
    return true
  }

  // 11. Greenland
  if (lat >= 60.0 && lat <= 84.0 && nlon >= -73.0 && nlon <= -12.0) {
    return true
  }

  return false
}

/**
 * Return a human-readable regional ocean basin name for (lat, lon).
 */
export function getRegionName(lat: number, lon: number): string {
  const nlon = ((((lon + 180) % 360) + 360) % 360) - 180

  if (lat >= 5 && lat <= 24 && nlon >= 80 && nlon <= 96) return 'Bay of Bengal'
  if (lat >= 8 && lat <= 26 && nlon >= 50 && nlon <= 78) return 'Arabian Sea'
  if (lat >= 5 && lat <= 16 && nlon >= 92 && nlon <= 99) return 'Andaman Sea'
  if (lat >= -10 && lat <= 5 && nlon >= 50 && nlon <= 100) return 'Equatorial Indian Ocean'
  if (lat >= -35 && lat <= -10 && nlon >= 40 && nlon <= 110) return 'South Indian Ocean'
  if (lat < -35) return 'Southern Ocean'
  return 'Indian Ocean Basin'
}
