import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import ProfilePanel from './ProfilePanel.jsx'
import ControlsPanel from './ControlsPanel.jsx'

const PALETTES = {
  thermal: ['#0000ff', '#ff0000'],
  haline:  ['#0044aa', '#00cc66'],
  viridis: ['#440154', '#fde725'],
}

// Helpers for Sub-step A
function createHeatmapCanvas(data, uniqueLats, uniqueLons, minVal, maxVal, palette, logScale) {
  const width = uniqueLons.length;
  const height = uniqueLats.length;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  
  const palColors = PALETTES[palette] || PALETTES.thermal;
  const color1 = new THREE.Color(palColors[0]);
  const color2 = new THREE.Color(palColors[1]);
  const tempColor = new THREE.Color();
  
  // Create quick lookup maps for performance
  const lonMap = new Map(uniqueLons.map((v, i) => [v, i]));
  const latMap = new Map(uniqueLats.map((v, i) => [v, i]));

  data.forEach(d => {
    const x = lonMap.get(d.lon);
    const y = height - 1 - latMap.get(d.lat);
    if (x === undefined || y === undefined) return;
    
    let normalized = (d.value - minVal) / (maxVal - minVal || 1);
    if (logScale) {
      const shift = minVal <= 0 ? Math.abs(minVal) + 1 : 0;
      const shiftedVal = d.value + shift;
      const shiftedMin = minVal + shift;
      const shiftedMax = maxVal + shift;
      normalized = (Math.log(shiftedVal) - Math.log(shiftedMin)) / (Math.log(shiftedMax) - Math.log(shiftedMin) || 1);
    }
    normalized = Math.max(0, Math.min(1, normalized));
    
    if (palette === 'thermal') {
       tempColor.setHSL(0.66 * (1.0 - normalized), 1.0, 0.5);
    } else {
       tempColor.lerpColors(color1, color2, normalized);
    }
    
    const idx = (y * width + x) * 4;
    imgData.data[idx] = tempColor.r * 255;
    imgData.data[idx+1] = tempColor.g * 255;
    imgData.data[idx+2] = tempColor.b * 255;
    imgData.data[idx+3] = 255; 
  });
  
  ctx.putImageData(imgData, 0, 0);
  
  // Smoothly upscale to 512x512
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 512;
  outCanvas.height = 512;
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = true;
  outCtx.drawImage(canvas, 0, 0, 512, 512);

  return outCanvas;
}

function createWallCanvas(dataSlices, perpPoints, isConstLat, constValue, minVal, maxVal, palette, logScale) {
  const width = perpPoints.length;
  const height = dataSlices.length;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  
  const palColors = PALETTES[palette] || PALETTES.thermal;
  const color1 = new THREE.Color(palColors[0]);
  const color2 = new THREE.Color(palColors[1]);
  const tempColor = new THREE.Color();
  const perpMap = new Map(perpPoints.map((v, i) => [v, i]));

  dataSlices.forEach((sliceData, y) => {
    // Filter to just this edge
    const edgeData = sliceData.filter(d => isConstLat ? d.lat === constValue : d.lon === constValue);
    edgeData.forEach(d => {
      const pVal = isConstLat ? d.lon : d.lat;
      const x = perpMap.get(pVal);
      if (x === undefined) return;

      let normalized = (d.value - minVal) / (maxVal - minVal || 1);
      if (logScale) {
        const shift = minVal <= 0 ? Math.abs(minVal) + 1 : 0;
        const shiftedVal = d.value + shift;
        const shiftedMin = minVal + shift;
        const shiftedMax = maxVal + shift;
        normalized = (Math.log(shiftedVal) - Math.log(shiftedMin)) / (Math.log(shiftedMax) - Math.log(shiftedMin) || 1);
      }
      normalized = Math.max(0, Math.min(1, normalized));
      
      if (palette === 'thermal') {
         tempColor.setHSL(0.66 * (1.0 - normalized), 1.0, 0.5);
      } else {
         tempColor.lerpColors(color1, color2, normalized);
      }
      
      // y=0 is top depth
      const idx = (y * width + x) * 4;
      imgData.data[idx] = tempColor.r * 255;
      imgData.data[idx+1] = tempColor.g * 255;
      imgData.data[idx+2] = tempColor.b * 255;
      imgData.data[idx+3] = 255; 
    });
  });
  
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export default function OceanScene() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const volumeGroupRef = useRef(null)
  const markersRef = useRef(null)
  const coordCenterRef = useRef({ latCenter: 0, lonCenter: 0 })
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const labelsContainerRef = useRef(null)

  const [metadata, setMetadata] = useState(null)
  const [activeVar, setActiveVar] = useState(null)
  const [activeDepth, setActiveDepth] = useState(null)
  const [activeTime, setActiveTime] = useState(null)
  const [valueRange, setValueRange] = useState({ min: 0, max: 100 })

  // BUG FIX 1: Sync colorMin/colorMax from the grid's computed value range
  useEffect(() => {
    if (valueRange.min !== 0 || valueRange.max !== 100) {
      setColorMin(valueRange.min)
      setColorMax(valueRange.max)
    }
  }, [valueRange])
  const [isPlaying, setIsPlaying] = useState(false)
  
  const [showDiscrepancy, setShowDiscrepancy] = useState(true)
  const [showSatellite, setShowSatellite] = useState(false)
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(null)
  const [surfacePointInfo, setSurfacePointInfo] = useState(null)
  
  // New state to trigger re-rendering of volume when grid data is ready
  const [gridDataReady, setGridDataReady] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [palette, setPalette] = useState('thermal')
  const [colorMin, setColorMin] = useState(0)
  const [colorMax, setColorMax] = useState(0)
  const [logScale, setLogScale] = useState(false)
  const [opacity, setOpacity] = useState(0.9)
  const [vertExag, setVertExag] = useState(1.0)
  const [outreachMode, setOutreachMode] = useState(false)
  const [isoValue, setIsoValue] = useState(28.0)
  const [showIso, setShowIso] = useState(false)
  const gridDataRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const pointerDownTimeRef = useRef(0)
  const hoveredInstrumentIdRef = useRef(null)
  const earthMeshRef = useRef(null)

  // X-Ray Earth Mode for seeing inside the globe
  useEffect(() => {
    if (!earthMeshRef.current) return
    const isDiving = activeDepth > 0.0 || selectedInstrumentId
    if (isDiving) {
        earthMeshRef.current.material.transparent = true
        earthMeshRef.current.material.opacity = 0.35
    } else {
        earthMeshRef.current.material.transparent = false
        earthMeshRef.current.material.opacity = 1.0
    }
  }, [activeDepth, selectedInstrumentId, gridDataReady])

  const onMarkerClick = (id) => {
    if (outreachMode) return
    setSelectedInstrumentId(id)
    // Fetch profile to show in panel
    fetch(`/api/instruments/${id}/profile`)
      .then(r => r.json())
      .then(profile => setSelectedProfile(profile))
      .catch(console.error)
  }

  const VAR_FRIENDLY = { thetao: 'Ocean Temperature', so: 'Ocean Salinity', uo: 'Current (Eastward)', vo: 'Current (Northward)' }
  const VAR_SHORT = { thetao: 'Temperature', so: 'Salinity', uo: 'Current U', vo: 'Current V' }

  // Animation Loop for Time
  useEffect(() => {
    if (!isPlaying || !metadata || !metadata.times || metadata.times.length === 0) return
    const interval = setInterval(() => {
      setActiveTime(prev => {
        const idx = metadata.times.indexOf(prev)
        const nextIdx = (idx + 1) % metadata.times.length
        return metadata.times[nextIdx]
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, metadata])

  // Initialize Three.js
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x0a0e1a)
    renderer.shadowMap.enabled = false  // No shadows — data vis must show true colors
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.012)

    const R = 20; // Earth radius
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 40)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = R + 1
    controls.maxDistance = 120
    controls.target.set(0, 0, 0)

    // Base Earth Globe
    const earthGeo = new THREE.SphereGeometry(R, 64, 64)
    // High-res static Earth texture (NASA Blue Marble / Equirectangular)
    const earthUrl = '/textures/earth-blue-marble.jpg'
    const earthTex = new THREE.TextureLoader().load(earthUrl)
    earthTex.colorSpace = THREE.SRGBColorSpace
    const earthMat = new THREE.MeshBasicMaterial({ map: earthTex })
    const earthMesh = new THREE.Mesh(earthGeo, earthMat)
    earthMeshRef.current = earthMesh
    scene.add(earthMesh)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    ambientLight.castShadow = false
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)
    dirLight.position.set(10, 15, 10)
    dirLight.castShadow = false
    scene.add(dirLight)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333333, 0.2)
    hemiLight.castShadow = false
    scene.add(hemiLight)

    // Realistic Starfield Background
    const starsGeo = new THREE.BufferGeometry()
    const starsPts = []
    for(let i=0; i<3000; i++) {
       const x = THREE.MathUtils.randFloatSpread(400)
       const y = THREE.MathUtils.randFloatSpread(400)
       const z = THREE.MathUtils.randFloatSpread(400)
       // Keep stars far away
       if (x*x + y*y + z*z > 10000) {
          starsPts.push(x, y, z)
       }
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPts, 3))
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.9 })
    const starField = new THREE.Points(starsGeo, starsMat)
    scene.add(starField)

    const tempV = new THREE.Vector3()
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      
      if (markersRef.current && labelsContainerRef.current) {
        markersRef.current.children.forEach(mesh => {
          if (mesh.userData.labelDiv) {
            // Only render label if it is hovered
            if (mesh.userData.id !== hoveredInstrumentIdRef.current) {
              if (mesh.userData.labelDiv.style.display !== 'none') {
                 mesh.userData.labelDiv.style.display = 'none'
              }
              return
            }
            
            if (mesh.userData.endPosition) {
              tempV.copy(mesh.position).add(mesh.userData.endPosition)
            } else {
              tempV.copy(mesh.position)
            }
            // Apply group transforms (vertical exaggeration)
            tempV.applyMatrix4(markersRef.current.matrixWorld)
            // No +0.5 here since it should be right at the end of the glider path
            tempV.y -= 0.1 // slightly below the end of the path
            
            tempV.project(camera)
            
            if (tempV.z > 1) {
              if (mesh.userData.labelDiv.style.display !== 'none') mesh.userData.labelDiv.style.display = 'none'
            } else {
              const x = (tempV.x * 0.5 + 0.5) * container.clientWidth
              const y = (tempV.y * -0.5 + 0.5) * container.clientHeight
              if (mesh.userData.labelDiv.style.display !== 'block') mesh.userData.labelDiv.style.display = 'block'
              mesh.userData.labelDiv.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
            }
          }
        })
      }
      
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    /* ── Interaction handlers ──────── */
    container.addEventListener('pointerdown', () => pointerDownTimeRef.current = Date.now())
    container.addEventListener('pointerup', (e) => {
      if (Date.now() - pointerDownTimeRef.current > 200) return
      if (!markersRef.current || !cameraRef.current) return
      
      const rect = container.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      
      // Check marker intersections first
      const markerIntersects = raycasterRef.current.intersectObjects(markersRef.current.children, true)
      if (markerIntersects.length > 0) {
        let instrumentMesh = markerIntersects[0].object
        while (instrumentMesh && !instrumentMesh.userData?.isInstrument) {
          instrumentMesh = instrumentMesh.parent
        }
        if (instrumentMesh) {
          onMarkerClick(instrumentMesh.userData.id)
          setSurfacePointInfo(null)
          return
        }
      }
      
      // Check surface intersections
      if (volumeGroupRef.current) {
         const surfaceIntersects = raycasterRef.current.intersectObjects(volumeGroupRef.current.children, true)
         const validSurface = surfaceIntersects.find(i => i.object.userData.isVolumePart)
         if (validSurface) {
            const p = validSurface.point
            const normP = p.clone().normalize()
            const clickedLat = Math.asin(normP.y) * 180 / Math.PI
            const clickedLon = Math.atan2(normP.z, normP.x) * 180 / Math.PI
            
            // Convert 3D world coordinate to 2D screen coordinate for the popup
            const tempV = p.clone()
            tempV.project(cameraRef.current)
            const sx = (tempV.x * 0.5 + 0.5) * rect.width
            const sy = (tempV.y * -0.5 + 0.5) * rect.height
            
            let value = null;
            if (gridDataRef.current && gridDataRef.current.validData) {
              const pts = gridDataRef.current.validData;
              let minDist = Infinity;
              for (let pt of pts) {
                const d = Math.pow(pt.lat - clickedLat, 2) + Math.pow(pt.lon - clickedLon, 2);
                if (d < minDist) { minDist = d; value = pt.value; }
              }
            }

            setSurfacePointInfo({
               lat: clickedLat,
               lon: clickedLon,
               val: value,
               x: sx,
               y: sy
            })
            return
         }
      }
      
      setSurfacePointInfo(null)
    })

    container.addEventListener('pointermove', (e) => {
      if (!markersRef.current || !cameraRef.current) return
      
      const rect = container.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(markersRef.current.children, true)
      let foundId = null
      if (intersects.length > 0) {
        let instrumentMesh = intersects[0].object
        while (instrumentMesh && !instrumentMesh.userData?.isInstrument) {
          instrumentMesh = instrumentMesh.parent
        }
        if (instrumentMesh) {
          foundId = instrumentMesh.userData.id
        }
      }
      
      if (hoveredInstrumentIdRef.current !== foundId) {
        hoveredInstrumentIdRef.current = foundId
        container.style.cursor = foundId ? 'pointer' : 'default'
      }
    })

    /* ── End Interaction handlers ──────── */

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // Initial API Fetch
  useEffect(() => {
    fetch('/api/variables')
      .then(r => r.json())
      .then(data => {
        setMetadata(data)
        if (data.variables?.length > 0) setActiveVar(data.variables[0])
        if (data.depths?.length > 0) setActiveDepth(data.depths[0])
        if (data.times?.length > 0) setActiveTime(data.times[0])
      })
      .catch(console.error)
  }, [])

  // Fetch and render grid — TRUE 3D VOLUME BOX
  useEffect(() => {
    if (!activeVar || activeDepth == null || !activeTime || !sceneRef.current) return

    fetch(`/api/grid?variable=${activeVar}&depth=${activeDepth}&time=${activeTime}`)
      .then(r => r.json())
      .then(data => {
        const scene = sceneRef.current
        if (!volumeGroupRef.current) {
          volumeGroupRef.current = new THREE.Group()
          scene.add(volumeGroupRef.current)
        }
        const group = volumeGroupRef.current

        // Clean up previous volume meshes
        const toRemove = []
        group.children.forEach(c => {
          if (c.userData?.isVolumePart) toRemove.push(c)
        })
        toRemove.forEach(c => {
          group.remove(c)
          c.geometry?.dispose()
          if (c.material?.map) c.material.map.dispose()
          c.material?.dispose()
        })
        
        if (!data || data.length === 0) return

        const rawPoints = Array.isArray(data) ? data : data.points
        const validData = rawPoints.filter(d => d.value != null && !isNaN(d.value) && d.value > -100 && d.value < 1000)
        let minVal = Infinity, maxVal = -Infinity
        const uniqueLats = new Set(), uniqueLons = new Set()
        validData.forEach(d => {
          if (d.value < minVal) minVal = d.value
          if (d.value > maxVal) maxVal = d.value
          uniqueLats.add(d.lat)
          uniqueLons.add(d.lon)
        })
        setValueRange({ min: minVal, max: maxVal })

        // Use true grid dimensions if provided, otherwise fallback to extracted unique coordinates
        const sortedLats = (data.lats && Array.isArray(data.lats)) ? data.lats : [...uniqueLats].sort((a,b) => a-b)
        const sortedLons = (data.lons && Array.isArray(data.lons)) ? data.lons : [...uniqueLons].sort((a,b) => a-b)
        coordCenterRef.current = { latCenter: (sortedLats[0] + sortedLats[sortedLats.length-1]) / 2, lonCenter: (sortedLons[0] + sortedLons[sortedLons.length-1]) / 2 }
        gridDataRef.current = { validData, sortedLats, sortedLons, minVal, maxVal }
        
        // Signal that new data is ready to trigger the render effect
        setGridDataReady(Date.now())
      })
      .catch(console.error)
  }, [activeVar, activeDepth, activeTime])

  // EFFECT: Render the 3D grid based on current grid data and visualization settings
  useEffect(() => {
    if (!gridDataReady || !gridDataRef.current || !sceneRef.current) return

    const { validData, sortedLats, sortedLons } = gridDataRef.current
    const scene = sceneRef.current
    if (!volumeGroupRef.current) {
      volumeGroupRef.current = new THREE.Group()
      scene.add(volumeGroupRef.current)
    }
    const group = volumeGroupRef.current

    // Clean up previous volume meshes
    const toRemove = []
    group.children.forEach(c => {
      if (c.userData?.isVolumePart) toRemove.push(c)
    })
    toRemove.forEach(c => {
      group.remove(c)
      c.geometry?.dispose()
      if (c.material?.map) c.material.map.dispose()
      c.material?.dispose()
    })

    const minLat = sortedLats[0], maxLat = sortedLats[sortedLats.length-1]
    const minLon = sortedLons[0], maxLon = sortedLons[sortedLons.length-1]
    const maxDepthVal = metadata?.depths ? Math.max(...metadata.depths) : 5000
    
    // R is 20 for the base globe.
    const R_BASE = 20
    const GLOBE_DEPTH_SCALE = 0.0002 // 1000m -> 0.2 units
    
    // UV Mapping to match ESRI Earth
    const phiStart = (90 - maxLat) * Math.PI / 180
    const phiLength = (maxLat - minLat) * Math.PI / 180
    const thetaStart = (minLon + 180) * Math.PI / 180
    let thetaLength = (maxLon - minLon) * Math.PI / 180
    if (maxLon - minLon >= 359.0) thetaLength = 2 * Math.PI

    const currentMin = colorMin !== 0 ? colorMin : gridDataRef.current.minVal
    const currentMax = colorMax !== 0 ? colorMax : gridDataRef.current.maxVal

    const canvas = createHeatmapCanvas(validData, sortedLats, sortedLons, currentMin, currentMax, palette, logScale)
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false

    // === TOP SURFACE (ocean surface patch) ===
    const topR = R_BASE + 0.05
    const topGeo = new THREE.SphereGeometry(topR, 64, 64, thetaStart, thetaLength, phiStart, phiLength)
    
    // X-Ray Mode: Make surface highly transparent if we are looking at a deeper slice
    const isDeepSlice = activeDepth > 0;
    const surfaceOpacity = isDeepSlice ? (opacity * 0.15) : (opacity * 0.85);

    const topPlane = new THREE.Mesh(
      topGeo,
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: surfaceOpacity, side: THREE.DoubleSide, alphaTest: 0.05 })
    )
    topPlane.userData = { isVolumePart: true, isSurface: true }
    group.add(topPlane)

    // === FLOATING DEPTH SLICE ===
    const sliceR = topR - (activeDepth * GLOBE_DEPTH_SCALE)
    const sliceGeo = new THREE.SphereGeometry(sliceR, 64, 64, thetaStart, thetaLength, phiStart, phiLength)
    const slicePlane = new THREE.Mesh(
      sliceGeo,
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: opacity * 0.9, side: THREE.DoubleSide, alphaTest: 0.05 })
    )
    slicePlane.visible = isDeepSlice
    slicePlane.userData = { isVolumePart: true, isSlicePlane: true }
    group.add(slicePlane)

    group.userData.DEPTH_SCALE = GLOBE_DEPTH_SCALE
    group.userData.R_BASE = R_BASE

    // === Spherical mapping complete. Flat decorations removed. ===
    
    // Trigger marker re-render if needed
    if (markersRef.current) {
        markersRef.current.position.y = 0; // force a minor update
    }
    
  }, [gridDataReady, colorMin, colorMax, palette, logScale, opacity, activeDepth, metadata])

  // === ISOSURFACE / CONTOUR LINES ===
  useEffect(() => {
    if (!volumeGroupRef.current || !gridDataRef.current) return
    const group = volumeGroupRef.current

    // Remove old contour lines
    const oldContours = []
    group.children.forEach(c => { if (c.userData?.isContourLine) oldContours.push(c) })
    oldContours.forEach(c => { group.remove(c); c.geometry?.dispose(); c.material?.dispose() })

    if (!showIso || !gridDataRef.current.validData) return

    const { validData, sortedLats, sortedLons } = gridDataRef.current
    const W = sortedLons[sortedLons.length-1] - sortedLons[0]
    const D = sortedLats[sortedLats.length-1] - sortedLats[0]
    const DEPTH_SCALE = group.userData.DEPTH_SCALE || 1.2
    const sliceY = -(activeDepth * DEPTH_SCALE)

    // Build a 2D grid for marching squares
    const nLat = sortedLats.length, nLon = sortedLons.length
    const grid2D = new Array(nLat).fill(null).map(() => new Array(nLon).fill(NaN))
    const latMap = new Map(sortedLats.map((v, i) => [v, i]))
    const lonMap = new Map(sortedLons.map((v, i) => [v, i]))
    validData.forEach(d => {
      const li = latMap.get(d.lat), lo = lonMap.get(d.lon)
      if (li !== undefined && lo !== undefined) grid2D[li][lo] = d.value
    })

    // Marching squares: extract contour segments at isoValue
    const segments = []
    for (let i = 0; i < nLat - 1; i++) {
      for (let j = 0; j < nLon - 1; j++) {
        const v = [grid2D[i][j], grid2D[i][j+1], grid2D[i+1][j+1], grid2D[i+1][j]]
        if (v.some(x => isNaN(x))) continue

        const b = v.map(x => x >= isoValue ? 1 : 0)
        const idx = b[0] * 8 + b[1] * 4 + b[2] * 2 + b[3]
        if (idx === 0 || idx === 15) continue

        // Linear interpolation helper
        const lerp = (va, vb, pa, pb) => {
          const t = (isoValue - va) / (vb - va || 1)
          return [pa[0] + t * (pb[0] - pa[0]), pa[1] + t * (pb[1] - pa[1])]
        }

        const corners = [
          [sortedLons[j], sortedLats[i]],
          [sortedLons[j+1], sortedLats[i]],
          [sortedLons[j+1], sortedLats[i+1]],
          [sortedLons[j], sortedLats[i+1]]
        ]

        // Edge midpoints via interpolation
        const edges = [
          lerp(v[0], v[1], corners[0], corners[1]), // top
          lerp(v[1], v[2], corners[1], corners[2]), // right
          lerp(v[2], v[3], corners[2], corners[3]), // bottom
          lerp(v[3], v[0], corners[3], corners[0]), // left
        ]

        // Lookup table for which edges to connect (simplified)
        const edgePairs = {
          1: [[2,3]], 2: [[1,2]], 3: [[1,3]], 4: [[0,1]], 5: [[0,3],[1,2]],
          6: [[0,2]], 7: [[0,3]], 8: [[0,3]], 9: [[0,2]], 10: [[0,1],[2,3]],
          11: [[0,1]], 12: [[1,3]], 13: [[1,2]], 14: [[2,3]]
        }

        const pairs = edgePairs[idx] || []
        pairs.forEach(([a, b]) => {
          segments.push([edges[a], edges[b]])
        })
      }
    }

    if (segments.length === 0) return

    const center = coordCenterRef.current
    segments.forEach(([p1, p2]) => {
      const R_BASE = group.userData.R_BASE || 20
      const DS = group.userData.DEPTH_SCALE || 0.0002
      const sliceR = R_BASE - (activeDepth * DS) + 0.05
      
      const getSpherical = (lon, lat) => {
        const radLat = lat * Math.PI / 180
        const radLon = lon * Math.PI / 180
        return new THREE.Vector3(
          sliceR * Math.cos(radLat) * Math.cos(radLon),
          sliceR * Math.sin(radLat),
          sliceR * Math.cos(radLat) * Math.sin(radLon)
        )
      }
      
      const pts = [getSpherical(p1[0], p1[1]), getSpherical(p2[0], p2[1])]
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2, transparent: true, opacity: 0.9 }))
      line.userData = { isContourLine: true, isVolumePart: false }
      group.add(line)
    })
  }, [showIso, isoValue, gridDataReady, activeDepth])

  // === CURRENT VECTOR ARROWS (when uo or vo is active) ===
  useEffect(() => {
    if (!volumeGroupRef.current) return
    const group = volumeGroupRef.current

    // Remove old arrows
    const oldArrows = []
    group.children.forEach(c => { if (c.userData?.isCurrentArrow) oldArrows.push(c) })
    oldArrows.forEach(c => { group.remove(c); c.geometry?.dispose(); c.material?.dispose() })

    // Only show arrows for current variables
    if (activeVar !== 'uo' && activeVar !== 'vo') return
    if (!gridDataRef.current?.validData) return

    const { validData, sortedLats, sortedLons } = gridDataRef.current
    const DEPTH_SCALE = group.userData.DEPTH_SCALE || 1.2
    const sliceY = -(activeDepth * DEPTH_SCALE)
    const center = coordCenterRef.current
    const currentMin = colorMin !== 0 ? colorMin : gridDataRef.current.minVal
    const currentMax = colorMax !== 0 ? colorMax : gridDataRef.current.maxVal

    // Subsample for performance (every 3rd point)
    const step = 3
    const palColors = PALETTES[palette] || PALETTES.thermal
    const c1 = new THREE.Color(palColors[0])
    const c2 = new THREE.Color(palColors[1])
    const tempC = new THREE.Color()

    for (let i = 0; i < validData.length; i += step) {
      const d = validData[i]
      const magnitude = Math.abs(d.value)
      const direction = d.value >= 0 ? 1 : -1

      let normalized = (d.value - currentMin) / (currentMax - currentMin || 1)
      normalized = Math.max(0, Math.min(1, normalized))
      if (palette === 'thermal') tempC.setHSL(0.66 * (1.0 - normalized), 1.0, 0.5)
      else tempC.lerpColors(c1, c2, normalized)

      const radLat = d.lat * Math.PI / 180
      const radLon = d.lon * Math.PI / 180
      const R_BASE = group.userData.R_BASE || 20
      const DS = group.userData.DEPTH_SCALE || 0.0002
      const sliceR = R_BASE - (activeDepth * DS) + 0.06 // Slightly above slice
      
      const px = sliceR * Math.cos(radLat) * Math.cos(radLon)
      const py = sliceR * Math.sin(radLat)
      const pz = sliceR * Math.cos(radLat) * Math.sin(radLon)

      const arrowGroup = new THREE.Group()
      arrowGroup.position.set(px, py, pz)
      arrowGroup.lookAt(0, 0, 0)
      
      // lookAt(0,0,0) points local +Z towards center (Down).
      // Local +Y aligns with world +Y (North).
      // Local +X points West. Local -X points East.
      const dirX = activeVar === 'uo' ? -direction : 0
      const dirY = activeVar === 'vo' ? direction : 0
      const localDir = new THREE.Vector3(dirX, dirY, 0).normalize()

      const arrowLen = Math.min(0.8, magnitude * 2)
      if (arrowLen < 0.02) continue

      const arrow = new THREE.ArrowHelper(localDir, new THREE.Vector3(0,0,0), arrowLen, tempC.getHex(), 0.15, 0.08)
      arrowGroup.userData = { isCurrentArrow: true }
      arrowGroup.add(arrow)
      group.add(arrowGroup)
    }
  }, [activeVar, gridDataReady, activeDepth, colorMin, colorMax, palette])

  // Live update vertical exaggeration
  useEffect(() => {
    if (!volumeGroupRef.current) return
    volumeGroupRef.current.scale.set(1, vertExag, 1)
    if (markersRef.current) {
      markersRef.current.scale.set(1, vertExag, 1)
    }
  }, [vertExag])

  // Fetch Instruments & Draw Profiles
  useEffect(() => {
    // BUG FIX 2: Wait until grid data has loaded so coordCenterRef is set
    if (!coordCenterRef.current || (coordCenterRef.current.latCenter === 0 && coordCenterRef.current.lonCenter === 0)) return
    if (!sceneRef.current) return

    fetch('/api/instruments')
      .then(r => r.json())
      .then(async (instruments) => {
        const scene = sceneRef.current
        if (!volumeGroupRef.current) return
        if (markersRef.current) {
          // Cleanup old DOM labels
          markersRef.current.children.forEach(c => {
             if (c.userData.labelDiv) c.userData.labelDiv.remove()
             c.geometry?.dispose()
             c.material?.dispose()
             if (c.children) {
                 c.children.forEach(cc => {
                    cc.geometry?.dispose()
                    cc.material?.dispose()
                 })
             }
          })
          scene.remove(markersRef.current)
        }
        
        if (labelsContainerRef.current) {
          labelsContainerRef.current.innerHTML = ''
        }
        
        const group = new THREE.Group()
        const latCenter = coordCenterRef.current.latCenter
        const lonCenter = coordCenterRef.current.lonCenter

        // Load profiles for each instrument
        const promises = instruments.map(inst => 
          fetch(`/api/instruments/${inst.id}/profile`)
            .then(r => r.json())
            .catch(() => null)
        )
        const profiles = await Promise.all(promises)

        const palColors = PALETTES[palette] || PALETTES.thermal
        const c1 = new THREE.Color(palColors[0])
        const c2 = new THREE.Color(palColors[1])
        const tempC = new THREE.Color()

        instruments.forEach((inst, idx) => {
          const profile = profiles[idx]
          if (!profile || profile.length < 2) return

          const R_BASE = volumeGroupRef.current?.userData?.R_BASE || 20
          const phi = (90 - inst.lat) * Math.PI / 180
          const theta = (inst.lon + 180) * Math.PI / 180
          const pos = new THREE.Vector3().setFromSphericalCoords(R_BASE, phi, theta)
          
          const px = pos.x
          const py = pos.y
          const pz = pos.z
          
          profile.sort((a,b) => a.depth - b.depth)
          const DS = volumeGroupRef.current?.userData?.DEPTH_SCALE || 0.0002
          
          const randomSeed = inst.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
          const driftDirX = Math.sin(randomSeed)
          const driftDirZ = Math.cos(randomSeed)
          const maxDrift = 1.2
          
          const points = profile.map((p, i) => {
             const depthRatio = Math.min(1.0, p.depth / (metadata?.depths ? Math.max(...metadata.depths) : 2000))
             // Zig-zag pattern
             const zz = (i % 2 === 0) ? 0.3 : -0.3
             const currentDrift = maxDrift * depthRatio
             // Dive along the local +Z axis (lookAt(0,0,0) makes -Z point to core, but wait, if it points to core, depth should be positive Z or negative Z?)
             // Let's use -Z for depth (into the core)
             return new THREE.Vector3(driftDirX * currentDrift + driftDirZ * zz, driftDirZ * currentDrift - driftDirX * zz, -(p.depth * DS))
          })
          
          // Use tension=0 for sharp straight line segments
          const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0)
          
          const tubularSegments = profile.length - 1
          const radialSegments = 4
          const geo = new THREE.TubeGeometry(path, tubularSegments, 0.04, radialSegments, false)

          const colors = new Float32Array(geo.attributes.position.count * 3)
          const mn = colorMin, mx = colorMax

          // Determine vertex colors based on the value (temp or salinity)
          for (let i = 0; i <= tubularSegments; i++) {
             const p = profile[Math.min(i, profile.length - 1)]
             const pVal = activeVar === 'so' ? p.salinity : p.temperature
             let normalized = (pVal - mn) / (mx - mn || 1)
             normalized = Math.max(0, Math.min(1, normalized))
             
             if (palette === 'thermal') tempC.setHSL(0.66 * (1.0 - normalized), 1.0, 0.5)
             else tempC.lerpColors(c1, c2, normalized)
             
             // Apply to all radial vertices for this segment
             for (let j = 0; j <= radialSegments; j++) {
                const vIdx = i * (radialSegments + 1) + j
                colors[vIdx * 3] = tempC.r
                colors[vIdx * 3 + 1] = tempC.g
                colors[vIdx * 3 + 2] = tempC.b
             }
          }
          geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

          const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.position.set(px, py, pz)
          mesh.lookAt(0, 0, 0)
          
          // Glider 3D Model at the end of the path
          const gliderGroup = new THREE.Group()
          const bodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12)
          bodyGeo.rotateZ(Math.PI / 2) // Lie flat
          const gliderMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
          const body = new THREE.Mesh(bodyGeo, gliderMat)
          
          const noseGeo = new THREE.SphereGeometry(0.06, 12, 12)
          const nose = new THREE.Mesh(noseGeo, gliderMat)
          nose.position.x = 0.3
          
          const tailGeo = new THREE.SphereGeometry(0.06, 12, 12)
          const tail = new THREE.Mesh(tailGeo, gliderMat)
          tail.position.x = -0.3
          
          gliderGroup.add(body, nose, tail)
          
          const endPoint = points[points.length - 1]
          gliderGroup.position.copy(endPoint)
          // Point glider in the general direction of drift
          gliderGroup.lookAt(new THREE.Vector3(endPoint.x + driftDirX, endPoint.y, endPoint.z + driftDirZ))
          mesh.add(gliderGroup)

          // Discrepancy Ring
          let diff = 0
          if (gridDataRef.current?.validData) {
            const gridPts = gridDataRef.current.validData
            let closest = gridPts[0]
            let minDist = Infinity
            for(let g of gridPts) {
               const d = Math.pow(g.lat - inst.lat, 2) + Math.pow(g.lon - inst.lon, 2)
               if(d < minDist) { minDist = d; closest = g }
            }
            const instVal = activeVar === 'so' ? profile[0].salinity : profile[0].temperature
            diff = instVal - closest.value
          }
          // Small badge for discrepancy on the tube
          const badgeGeo = new THREE.SphereGeometry(0.18, 16, 16)
          const absDiff = Math.abs(diff)
          const badgeColor = diff > 0 ? 0xff3333 : (diff < 0 ? 0x3388ff : 0x888888)
          const badgeMat = new THREE.MeshBasicMaterial({ color: badgeColor })
          const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat)
          // Position badge at the top of the tube
          badgeMesh.position.set(0, -(profile[0].depth * DS), 0)
          badgeMesh.userData.isDiscrepancyRing = true
          badgeMesh.visible = showDiscrepancy
          mesh.add(badgeMesh)

          mesh.userData = { 
            id: inst.id, 
            isInstrument: true,
            latestTemp: profile[0].temperature,
            latestSalt: profile[0].salinity,
            endPosition: points[points.length - 1]
          }
          
          if (labelsContainerRef.current) {
            const labelDiv = document.createElement('div')
            labelDiv.style.position = 'absolute'
            labelDiv.style.top = '0'
            labelDiv.style.left = '0'
            labelDiv.style.pointerEvents = 'none'
            labelDiv.style.background = 'rgba(15, 23, 42, 0.7)'
            labelDiv.style.border = '1px solid rgba(255, 255, 255, 0.1)'
            labelDiv.style.padding = '6px 12px'
            labelDiv.style.borderRadius = '6px'
            labelDiv.style.color = '#e2e8f0'
            labelDiv.style.fontSize = '0.75rem'
            labelDiv.style.whiteSpace = 'nowrap'
            labelDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)'
            labelDiv.style.zIndex = '20'
            labelDiv.style.backdropFilter = 'blur(8px)'
            
            const timeStr = activeTime ? new Date(activeTime).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', timeZone:'UTC'}) + ' UTC' : '14:30 UTC'
            
            labelDiv.innerHTML = `<span style="color:#ffffff;font-weight:600;">Glider ID: ${inst.id}</span> | Temp: ${profile[0].temperature.toFixed(1)}&deg;C | Salinity: ${profile[0].salinity.toFixed(1)} PSU | Time: ${timeStr}`
            labelsContainerRef.current.appendChild(labelDiv)
            mesh.userData.labelDiv = labelDiv
          }

          group.add(mesh)
        })

        group.scale.set(1, vertExag, 1)
        scene.add(group)
        markersRef.current = group
      })
      .catch(console.error)
  }, [palette, colorMin, colorMax, activeVar, activeDepth, activeTime])

  // Toggle Discrepancy Rings Visibility
  useEffect(() => {
    if (!markersRef.current) return
    markersRef.current.children.forEach(tubeMesh => {
      const ring = tubeMesh.children.find(c => c.userData?.isDiscrepancyRing)
      if (ring) ring.visible = showDiscrepancy
    })
  }, [showDiscrepancy])

  // Satellite Overlay (NASA GIBS) has been removed because the global ESRI map serves this purpose natively.

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={labelsContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }} />
      
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
          AQUA-VIS
        </h1>
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>INCOIS Forecaster Decision Support — Global Ocean State</p>
      </div>

      {/* Surface Interaction Popup */}
      {surfacePointInfo && !outreachMode && (
        <div style={{
          position: 'absolute',
          left: surfacePointInfo.x,
          top: surfacePointInfo.y,
          transform: 'translate(-50%, -100%) translateY(-10px)',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          padding: '8px 12px',
          borderRadius: '8px',
          color: '#e2e8f0',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          zIndex: 25,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: 6, borderBottom: '1px solid rgba(59, 130, 246, 0.4)', paddingBottom: 4 }}>
            Point Data
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>{VAR_SHORT[activeVar] || 'Value'}:</span> {surfacePointInfo.val !== null ? surfacePointInfo.val.toFixed(2) : 'N/A'}
          </div>
          <div style={{ marginBottom: 4 }}><span style={{ color: '#94a3b8' }}>Lat:</span> {surfacePointInfo.lat.toFixed(3)}°</div>
          <div><span style={{ color: '#94a3b8' }}>Lon:</span> {surfacePointInfo.lon.toFixed(3)}°</div>
        </div>
      )}

      {/* Outreach Mode Toggle - top right */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 15 }}>
        <button
          onClick={() => setOutreachMode(!outreachMode)}
          style={{
            background: outreachMode ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.15)',
            border: `1px solid ${outreachMode ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}`,
            color: outreachMode ? '#10b981' : '#a5b4fc',
            padding: '6px 16px',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {outreachMode ? '🎓 Expert Mode' : '🌊 Outreach Mode'}
        </button>
      </div>

      {/* Outreach caption */}
      {outreachMode && activeVar && activeDepth !== null && activeTime && (
        <div style={{
          position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none', textAlign: 'center',
          maxWidth: 600,
        }} className="glass-panel p-3">
          <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
            Showing <strong style={{ color: '#6366f1' }}>{VAR_FRIENDLY[activeVar] || activeVar}</strong> Globally at{' '}
            <strong style={{ color: '#06b6d4' }}>{activeDepth}m depth</strong> on{' '}
            <strong style={{ color: '#f97316' }}>{new Date(activeTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
            Click on a green marker to view an Argo float's depth profile.
          </p>
        </div>
      )}

      {/* Controls Panel - docked right (hide in outreach mode) */}
      {!outreachMode && (
        <ControlsPanel
          metadata={metadata}
          activeVar={activeVar} setActiveVar={setActiveVar}
          activeDepth={activeDepth} setActiveDepth={setActiveDepth}
          palette={palette} setPalette={setPalette}
          colorMin={colorMin} setColorMin={setColorMin}
          colorMax={colorMax} setColorMax={setColorMax}
          logScale={logScale} setLogScale={setLogScale}
          opacity={opacity} setOpacity={setOpacity}
          vertExag={vertExag} setVertExag={setVertExag}
          showDiscrepancy={showDiscrepancy} setShowDiscrepancy={setShowDiscrepancy}
          showSatellite={showSatellite} setShowSatellite={setShowSatellite}
          isoValue={isoValue} setIsoValue={setIsoValue}
          showIso={showIso} setShowIso={setShowIso}
        />
      )}

      {/* Simplified variable selector in outreach mode */}
      {outreachMode && metadata && (
        <div style={{ position: 'absolute', top: 70, left: 16, zIndex: 15 }} className="glass-panel p-3">
          <select
            value={activeVar || ''}
            onChange={(e) => setActiveVar(e.target.value)}
            style={{
              background: 'rgba(15,23,42,0.8)', color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6,
              padding: '6px 10px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
            }}
          >
            {metadata.variables?.map(v => (
              <option key={v} value={v}>{VAR_FRIENDLY[v] || v}</option>
            ))}
          </select>
        </div>
      )}

      {/* Vertical Legend Overlay */}
      <div style={{ position: 'absolute', bottom: 90, right: 24, zIndex: 10, display: 'flex', gap: 24, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
        
        {/* Model Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>Model</span>
          <div style={{ display: 'flex', height: 120 }}>
            <div style={{ width: 12, borderRadius: 6, background: `linear-gradient(to top, ${(PALETTES[palette] || PALETTES.thermal)[0]}, ${(PALETTES[palette] || PALETTES.thermal)[1]})` }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginLeft: 8, fontSize: '0.7rem', color: '#94a3b8', height: '100%' }}>
              <span>{colorMax.toFixed(1)}</span>
              <span>{colorMin.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Glider Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>Glider</span>
          <div style={{ display: 'flex', height: 120 }}>
            <div style={{ width: 12, borderRadius: 6, background: `linear-gradient(to top, ${(PALETTES[palette] || PALETTES.thermal)[0]}, ${(PALETTES[palette] || PALETTES.thermal)[1]})` }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginLeft: 8, fontSize: '0.7rem', color: '#94a3b8', height: '100%' }}>
              <span>{colorMax.toFixed(1)}</span>
              <span>{colorMin.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Timeline Bar */}
      {metadata && metadata.times && activeTime !== null && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%',
          zIndex: 10,
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(99,102,241,0.25)',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', gap: 24
        }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? '#ef4444' : '#10b981',
              color: '#fff', border: 'none', borderRadius: 4,
              padding: '6px 16px', fontSize: '0.85rem', fontWeight: 'bold',
              cursor: 'pointer', textTransform: 'uppercase', minWidth: 80
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>{new Date(metadata.times[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {new Date(activeTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span>{new Date(metadata.times[metadata.times.length - 1]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            
            <div style={{ position: 'relative', height: 24 }}>
              <input
                type="range"
                min={0} max={metadata.times.length - 1} step={1}
                value={metadata.times.indexOf(activeTime)}
                onChange={(e) => setActiveTime(metadata.times[Number(e.target.value)])}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1', position: 'absolute', top: 0, left: 0, zIndex: 5 }}
              />
              
              {/* Milestone Markers */}
              {(() => {
                const total = Math.max(1, metadata.times.length - 1)
                const milestones = [
                  { label: 'Model updates', index: 0, sub: new Date(metadata.times[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) },
                  { label: 'Key updates', index: Math.floor(total / 2), sub: 'Temp & Salinity' },
                  { label: 'Latest Argo reading', index: total, sub: new Date(metadata.times[total]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
                ]
                return milestones.map((m, i) => {
                  const leftPct = (m.index / total) * 100
                  let align = 'center';
                  let tx = '-50%';
                  if (i === 0) { align = 'flex-start'; tx = '0%'; }
                  if (i === milestones.length - 1) { align = 'flex-end'; tx = '-100%'; }
                  return (
                    <div key={i} style={{ position: 'absolute', left: `calc(${leftPct}% - 1px)`, top: 12, display: 'flex', flexDirection: 'column', alignItems: align, width: 100, transform: `translateX(${tx})`, zIndex: 1 }}>
                      <div style={{ width: 2, height: 6, background: '#64748b', alignSelf: 'center', marginLeft: tx === '0%' ? '-1px' : (tx === '-100%' ? '1px' : '0') }} />
                      <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600, marginTop: 2, textAlign: align === 'flex-start' ? 'left' : (align === 'flex-end' ? 'right' : 'center'), lineHeight: 1.1 }}>{m.label}</span>
                      <span style={{ fontSize: '0.6rem', color: '#64748b', textAlign: align === 'flex-start' ? 'left' : (align === 'flex-end' ? 'right' : 'center') }}>{m.sub}</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Profile side panel */}
      {selectedProfile && (
        <ProfilePanel
          profile={selectedProfile}
          instrumentId={selectedInstrumentId}
          outreachMode={outreachMode}
          onClose={() => { setSelectedProfile(null); setSelectedInstrumentId(null); }}
        />
      )}
    </div>
  )
}
