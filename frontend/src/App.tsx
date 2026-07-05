import { useEffect, useState } from "react"

// Hooks
import { useRegion } from "@/hooks/useRegion"
import { useLayers } from "@/hooks/useLayers"
import { useSimulation } from "@/hooks/useSimulation"
import { useTimeControls } from "@/hooks/useTimeControls"
import { useAlerts } from "@/hooks/useAlerts"

// Components
import { Header } from "@/components/dashboard/Header"
import { LayerControls } from "@/components/dashboard/LayerControls"
import { SimulationSandbox } from "@/components/dashboard/SimulationSandbox"
import { MapPanel } from "@/components/dashboard/MapPanel"
import { TimeControls } from "@/components/dashboard/TimeControls"
import { AlertsBar } from "@/components/dashboard/AlertsBar"

// Types
import type {
  StateFeatureCollection,
  MultiGridStats,
  HeatmapFeature,
} from "@/components/ui/map/heatmap"

export function App() {
  // State Hooks
  const { region, selectedRegionId, setRegion, regions, isSwitching } =
    useRegion()
  const { layers, toggleLayer } = useLayers()
  const { simulation, setParam, run, reset } = useSimulation()
  const {
    time,
    setDate,
    play,
    pause,
    stepForward,
    stepBackward,
    skipToStart,
    skipToEnd,
  } = useTimeControls()
  const { activeAlerts, dismissAlert } = useAlerts(region.id, time.currentDate)

  // Viewport State for map pan/zoom synchronization
  const [viewport, setViewport] = useState<{
    center: [number, number]
    zoom: number
  }>({
    center: region.center as [number, number],
    zoom: region.zoom,
  })

  // Error state for region data loading
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

  // Sync viewport with region state changes and check if data exists
  useEffect(() => {
    setViewport({
      center: region.center as [number, number],
      zoom: region.zoom,
    })

    if (!region.hasData) {
      setError("Unable to load climate data for this region.")
    } else {
      setError(null)
    }
  }, [region])

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      setIsRetrying(false)
      // Keeps error active since region.hasData is still false
    }, 500)
  }

  const mapIsLoading = isSwitching || isRetrying

  // GeoJSON data load state
  const [geoJSONData, setGeoJSONData] = useState<StateFeatureCollection | null>(
    null
  )
  const [loadingGeoJSON, setLoadingGeoJSON] = useState<boolean>(true)

  // Map settings
  const resolution = 0.25
  const palette = "default"
  const opacity = 0.8
  const [radius, setRadius] = useState<number>(25)

  // Interaction states
  const [selectedNode, setSelectedNode] = useState<
    HeatmapFeature["properties"] | null
  >(null)
  const [gridStats, setGridStats] = useState<MultiGridStats | null>(null)

  // Load geojson boundary on mount with simulated loading delay
  useEffect(() => {
    fetch("/india_states.geojson")
      .then((res) => {
        if (!res.ok)
          throw new Error(
            "Unable to retrieve India states GeoJSON grid bounds."
          )
        return res.json()
      })
      .then((data) => {
        setTimeout(() => {
          setGeoJSONData(data)
          setLoadingGeoJSON(false)
        }, 500) // 500ms simulated delay for initial load
      })
      .catch((err) => {
        console.error(err)
        setLoadingGeoJSON(false)
      })
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-void font-sans text-text-primary antialiased">
      {/* 1. Header Bar */}
      <Header
        selectedRegionId={selectedRegionId}
        isSwitching={mapIsLoading}
        setRegion={setRegion}
        regions={regions}
        loadingGeoJSON={loadingGeoJSON}
        geoJSONData={geoJSONData}
      />

      {/* 2. Main Dashboard Container */}
      <div className="flex flex-1 flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-border-hairline bg-bg-panel">
          <div className="custom-scrollbar flex flex-1 flex-col divide-y divide-border-hairline overflow-y-auto">
            <LayerControls
              layers={layers}
              toggleLayer={toggleLayer}
              disabled={mapIsLoading || loadingGeoJSON}
              radius={radius}
              setRadius={setRadius}
            />
            <SimulationSandbox
              simulation={simulation}
              setParam={setParam}
              run={run}
              reset={reset}
              disabled={mapIsLoading || loadingGeoJSON}
            />
          </div>
        </aside>

        {/* Right Map + Time controls area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MapPanel
            geoJSONData={geoJSONData}
            loadingGeoJSON={loadingGeoJSON}
            isSwitching={mapIsLoading}
            error={error}
            onRetry={handleRetry}
            layers={layers}
            simulation={simulation}
            time={time}
            region={region}
            center={viewport.center}
            zoom={viewport.zoom}
            resolution={resolution}
            palette={palette}
            opacity={opacity}
            radius={radius}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            gridStats={gridStats}
            setGridStats={setGridStats}
          />
          <TimeControls
            time={time}
            setDate={setDate}
            play={play}
            pause={pause}
            stepForward={stepForward}
            stepBackward={stepBackward}
            skipToStart={skipToStart}
            skipToEnd={skipToEnd}
            isLoading={loadingGeoJSON || mapIsLoading || simulation.isRunning}
          />
        </div>
      </div>

      {/* 3. Bottom Anomaly Alerts Bar */}
      <AlertsBar
        activeAlerts={error ? [] : activeAlerts}
        dismissAlert={dismissAlert}
        onViewAlertOnMap={(coords) =>
          setViewport({ center: coords, zoom: 9.0 })
        }
      />
    </div>
  )
}

export default App
