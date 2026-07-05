import React from "react"
import { Activity, AlertTriangle } from "lucide-react"
import { Map } from "@/components/ui/map/map"
import {
  MapControls,
  MapZoom,
  MapOrientation,
  MapFullscreen,
  MapGeolocate,
} from "@/components/ui/map/controls"
import { MapHeatmap } from "@/components/ui/map/heatmap"
import type {
  StateFeatureCollection,
  MultiGridStats,
  HeatmapFeature,
} from "@/components/ui/map/heatmap"
import type { LayerState, SimulationState, TimeState, Region } from "@/types"
import { MOCK_DATE_ENTRIES } from "@/data/dates"

interface MapPanelProps {
  geoJSONData: StateFeatureCollection | null
  loadingGeoJSON: boolean
  isSwitching?: boolean
  error?: string | null
  onRetry?: () => void
  layers: LayerState
  simulation: SimulationState
  time: TimeState
  region: Region
  center: [number, number]
  zoom: number
  resolution: number
  palette: "default" | "warm" | "cool" | "emerald"
  opacity: number
  radius: number
  selectedNode: HeatmapFeature["properties"] | null
  setSelectedNode: (node: HeatmapFeature["properties"] | null) => void
  gridStats: MultiGridStats | null
  setGridStats: (stats: MultiGridStats | null) => void
}

export const MapPanel: React.FC<MapPanelProps> = ({
  geoJSONData,
  loadingGeoJSON,
  isSwitching = false,
  error = null,
  onRetry = () => {},
  layers,
  simulation,
  time,
  region,
  center,
  zoom,
  resolution,
  palette,
  opacity,
  radius,
  setSelectedNode,
  gridStats,
  setGridStats,
}) => {
  // Check if any layer is toggled on (if not, we render the empty state)
  const isAnyLayerActive =
    layers["insat-lst"] || layers["imd-rainfall"] || layers["ocean-sst"]

  // Debounce the currentDate by 150ms to prevent lag during dragging
  const [debouncedDate, setDebouncedDate] = React.useState(time.currentDate)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDate(time.currentDate)
    }, 150)

    return () => {
      clearTimeout(handler)
    }
  }, [time.currentDate])

  // Determine if the selected date has data
  const currentEntry = MOCK_DATE_ENTRIES.find((d) => d.date === debouncedDate)
  const hasDataForDate = currentEntry ? currentEntry.hasData : true

  // Format date display: e.g. "2026-06-22" -> "Jun 22"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const [, monthStr, day] = dateStr.split("-")
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const monthIndex = parseInt(monthStr, 10) - 1
    const month = months[monthIndex] || months[5]
    return `${month} ${day}`
  }

  return (
    <main className="relative min-h-[300px] flex-1 overflow-hidden bg-bg-void">
      <div className="relative h-full w-full">
        {error ? (
          /* Error State - Unable to load data for region */
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg-void p-6 text-center select-none">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-dashed border-red-500/30 bg-red-500/5 text-red-500">
              <AlertTriangle className="size-6 animate-pulse text-red-500" />
            </div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-text-primary uppercase">
              Unable to load climate data for this region
            </h3>
            <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-text-secondary">
              Please check connection settings or select another active sector.
            </p>
            <button
              onClick={onRetry}
              className="mt-5 cursor-pointer rounded bg-accent-ember px-5 py-2 font-mono text-xs font-semibold tracking-wider text-white uppercase shadow-lg shadow-accent-ember/10 transition-colors hover:bg-accent-ember/90 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none"
            >
              Retry
            </button>
          </div>
        ) : !isAnyLayerActive ? (
          /* Empty State - No layers selected */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-void/90 p-6 text-center select-none">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-dashed border-border-hairline text-text-secondary">
              <Activity className="size-6 animate-pulse opacity-40" />
            </div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-text-primary uppercase">
              No layers selected
            </h3>
            <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-text-secondary">
              Toggle a layer on the left to view climate data.
            </p>
          </div>
        ) : !hasDataForDate ? (
          /* Empty State - No data for date */
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-void/90 p-6 text-center select-none">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-dashed border-border-hairline text-text-secondary">
              <Activity className="size-6 animate-pulse opacity-40" />
            </div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-text-primary uppercase">
              No data available
            </h3>
            <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-text-secondary">
              No data available for {formatDate(debouncedDate)}. Try a different
              date.
            </p>
          </div>
        ) : (
          /* Normal State - Render Map */
          <>
            <Map center={center} zoom={zoom}>
              <MapControls position="bottom-right">
                <MapZoom />
                <MapOrientation />
                <MapGeolocate />
                <MapFullscreen />
              </MapControls>
              <MapHeatmap
                visible={isAnyLayerActive}
                geoJSONData={geoJSONData}
                resolution={resolution}
                layers={layers}
                palette={palette}
                opacity={opacity}
                radius={radius}
                onNodeSelect={setSelectedNode}
                onGridStats={setGridStats}
                currentDate={debouncedDate}
                simulation={simulation}
              />
            </Map>
            {/* Signature Live-Scan Pulse (Radar sweep) */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
              <div className="live-scan-radial size-[45%] rounded-full border border-accent-signal-blue/5 bg-radial from-accent-signal-blue/15 via-accent-signal-blue/5 to-transparent" />
            </div>
          </>
        )}

        {/* Ambient Loading Layer */}
        {(loadingGeoJSON || isSwitching || simulation.isRunning) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg-void/80 backdrop-blur-sm select-none">
            <Activity className="mb-3 size-10 animate-pulse text-accent-ember" />
            <p className="font-mono text-xs font-semibold tracking-wider text-text-primary uppercase">
              {simulation.isRunning
                ? "Computing What-If Simulation..."
                : "Loading climate data..."}
            </p>
            <p className="mt-1 font-mono text-[10px] text-text-secondary">
              Interpolating telemetry grid arrays
            </p>
          </div>
        )}

        {/* What-If Scenario Active Badge */}
        {simulation.isActive &&
          simulation.applied &&
          !error &&
          hasDataForDate && (
            <div className="absolute top-5 left-5 z-10 flex items-center gap-2.5 rounded border border-accent-ember bg-accent-ember/90 px-4 py-2 font-mono text-xs font-semibold tracking-wider text-white uppercase shadow-[0_4px_16px_rgba(255,106,43,0.15)] select-none">
              <span className="size-2 animate-ping rounded-full bg-white"></span>
              Showing: What-If Scenario
              <span className="ml-0.5 border-l border-white/30 pl-2.5 text-[10px] opacity-90">
                Rain: {simulation.applied.rainfallMod > 0 ? "+" : ""}
                {simulation.applied.rainfallMod}%{" • "}
                Temp: {simulation.applied.tempOffset > 0 ? "+" : ""}
                {simulation.applied.tempOffset}°C
              </span>
            </div>
          )}

        {/* Color Spectrum Legend overlay */}
        {isAnyLayerActive && hasDataForDate && !error && gridStats && (
          <div className="absolute bottom-5 left-5 z-10 flex min-w-[240px] flex-col gap-4 rounded-[6px] border border-border-hairline bg-bg-panel/90 p-4 shadow-lg backdrop-blur-md select-none">
            {Object.entries(layers)
              .filter(
                ([layerId, active]) =>
                  active && gridStats[layerId as keyof MultiGridStats]
              )
              .map(([layerId]) => {
                const id = layerId as keyof MultiGridStats
                const stats = gridStats[id]!

                // Define layer-specific titles, units, and color classes matching their palettes
                let label = ""
                let unit = ""
                let gradientColors: string[] = []

                if (id === "insat-lst") {
                  label = "INSAT LST"
                  unit = "°C"
                  gradientColors = [
                    "bg-yellow-100",
                    "bg-orange-300",
                    "bg-orange-500",
                    "bg-red-600",
                    "bg-red-950",
                  ]
                } else if (id === "imd-rainfall") {
                  label = "IMD Rainfall"
                  unit = "mm"
                  gradientColors = [
                    "bg-sky-100",
                    "bg-sky-300",
                    "bg-sky-500",
                    "bg-blue-600",
                    "bg-blue-950",
                  ]
                } else if (id === "ocean-sst") {
                  label = "Ocean SST"
                  unit = "°C"
                  gradientColors = [
                    "bg-violet-800",
                    "bg-blue-600",
                    "bg-cyan-400",
                    "bg-emerald-400",
                    "bg-yellow-300",
                    "bg-orange-400",
                    "bg-red-600",
                  ]
                }

                // Check simulation offsets
                let displayMin = stats.min
                let displayAvg = stats.avg
                let displayMax = stats.max

                if (simulation.isActive && simulation.applied) {
                  if (id === "imd-rainfall") {
                    const mod = 1 + simulation.applied.rainfallMod / 100
                    displayMin = Math.max(0, stats.min * mod)
                    displayAvg = Math.max(0, stats.avg * mod)
                    displayMax = Math.max(0, stats.max * mod)
                  } else if (id === "insat-lst") {
                    displayMin = stats.min + simulation.applied.tempOffset
                    displayAvg = stats.avg + simulation.applied.tempOffset
                    displayMax = stats.max + simulation.applied.tempOffset
                  }
                }

                return (
                  <div
                    key={id}
                    className="space-y-1.5 border-b border-border-hairline/30 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-wider text-text-secondary uppercase">
                      <span>{label}</span>
                      {simulation.isActive &&
                        (id === "insat-lst" || id === "imd-rainfall") && (
                          <span className="font-mono text-[9px] font-bold text-accent-ember">
                            Modified
                          </span>
                        )}
                    </div>

                    {/* Gradient visualization */}
                    <div className="flex h-2 w-full overflow-hidden rounded-[2px]">
                      {gradientColors.map((colorClass, idx) => (
                        <div key={idx} className={`flex-1 ${colorClass}`} />
                      ))}
                    </div>

                    <div className="flex justify-between font-mono text-[9px] text-text-primary">
                      <span>
                        {id === "imd-rainfall"
                          ? displayMin.toFixed(0)
                          : displayMin.toFixed(1)}
                        {unit}
                      </span>
                      <span className="text-text-secondary">
                        Avg:{" "}
                        {id === "imd-rainfall"
                          ? displayAvg.toFixed(0)
                          : displayAvg.toFixed(1)}
                        {unit}
                      </span>
                      <span>
                        {id === "imd-rainfall"
                          ? displayMax.toFixed(0)
                          : displayMax.toFixed(1)}
                        {unit}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </main>
  )
}

export default MapPanel
