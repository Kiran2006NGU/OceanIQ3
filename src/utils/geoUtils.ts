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

  // 1. Antarctica
  if (lat < -62) return true

  // 2. Sri Lanka
  if (lat >= 5.8 && lat <= 9.9 && nlon >= 79.5 && nlon <= 81.9) {
    return true
  }

  // 3. Indian Subcontinent Mainland (Precise coastal boundaries)
  if (lat >= 8.1 && lat <= 37.0 && nlon >= 68.0 && nlon <= 97.5) {
    if (lat >= 8.1 && lat <= 20.5) {
      // West coast longitude (Arabian Sea shoreline)
      const westCoastLon = 77.5 - ((lat - 8.1) / (20.5 - 8.1)) * (77.5 - 72.8)
      if (nlon < westCoastLon) return false // Arabian Sea

      // East coast longitude (Bay of Bengal shoreline)
      const eastCoastLon = lat < 13.0
        ? 77.6 + ((lat - 8.1) / (13.0 - 8.1)) * (80.3 - 77.6)
        : 80.3 + ((lat - 13.0) / (20.5 - 13.0)) * (86.8 - 80.3)
      if (nlon > eastCoastLon) return false // Bay of Bengal

      return true
    }

    // Northern subcontinent & Gujarat
    if (lat > 20.5 && lat <= 37.0) {
      if (lat <= 24.5 && nlon < 68.5) return false // Arabian Sea off Gujarat
      if (lat <= 22.0 && nlon > 89.0) return false // Bay of Bengal / Ganges delta mouth
      return true
    }
  }

  // 4. Arabian Peninsula & Middle East
  if (lat >= 12.0 && lat <= 33.0 && nlon >= 35.0 && nlon <= 60.0) {
    // Red Sea cut
    if (nlon >= 36 && nlon <= 43.5 && lat <= 28 && lat >= 12.5) return false
    // Persian Gulf cut
    if (nlon >= 48 && nlon <= 56.5 && lat <= 30.5 && lat >= 24) return false
    return true
  }

  // 5. Africa
  if (lat >= -35.0 && lat <= 37.0 && nlon >= -18.0 && nlon <= 51.5) {
    // Somali Horn and Indian Ocean water boundaries
    if (nlon > 51.5) return false
    if (nlon > 43 && lat > 12) return false
    return true
  }

  // 6. Eurasia (Europe & Northern Asia)
  if (lat >= 35.0 && lat <= 78.0 && nlon >= -10.0 && nlon <= 175.0) {
    return true
  }

  // 7. Southeast Asia, Indochina, Myanmar, Thailand & Malay Peninsula
  if (lat >= 1.0 && lat <= 45.0 && nlon >= 98.0 && nlon <= 125.0) {
    if (lat <= 6.0 && nlon < 100.0) return false // Andaman / Malacca strait
    return true
  }

  // 8. Indonesian Archipelago (Sumatra, Java, Borneo)
  if (lat >= -11.0 && lat <= 6.0 && nlon >= 95.0 && nlon <= 120.0) {
    // Sumatra
    if (nlon >= 95.0 && nlon <= 106.0 && lat >= -6.0 && lat <= 5.8) {
      // Main ridge line of Sumatra
      const sumatraLon = 96.0 + ((lat + 6.0) / 11.8) * 8.0
      if (Math.abs(nlon - sumatraLon) < 2.5) return true
    }
    // Java
    if (lat >= -8.8 && lat <= -5.8 && nlon >= 105.0 && nlon <= 114.5) return true
    // Deep Indian ocean waters south/west of Java/Sumatra
    return false
  }

  // 9. Australia
  if (lat >= -44.0 && lat <= -10.5 && nlon >= 113.0 && nlon <= 154.0) {
    return true
  }

  // 10. Madagascar
  if (lat >= -26.0 && lat <= -11.8 && nlon >= 43.0 && nlon <= 50.8) {
    return true
  }

  // 11. Americas
  if (lat >= -56.0 && lat <= 75.0 && nlon >= -168.0 && nlon <= -34.0) {
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
