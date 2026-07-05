import React from "react"
import { Thermometer, CloudRain, Waves } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { LayerState, LayerId } from "@/types"

interface LayerControlsProps {
  layers: LayerState
  toggleLayer: (id: LayerId) => void
  disabled?: boolean
  radius: number
  setRadius: (value: number) => void
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  toggleLayer,
  disabled = false,
  radius,
  setRadius,
}) => {
  const layerOptions = [
    {
      id: "insat-lst" as LayerId,
      name: "INSAT LST",
      description: "Land Surface Temperature from INSAT-3D/3DR",
      icon: (
        <Thermometer className="size-4 shrink-0 text-text-secondary transition-colors group-hover:text-accent-signal-blue" />
      ),
    },
    {
      id: "imd-rainfall" as LayerId,
      name: "IMD Rainfall",
      description: "Gridded analysis from ground observatories",
      icon: (
        <CloudRain className="size-4 shrink-0 text-text-secondary transition-colors group-hover:text-accent-signal-blue" />
      ),
    },
    {
      id: "ocean-sst" as LayerId,
      name: "Ocean SST",
      description: "Sea Surface Temperature from satellite/ERA5",
      icon: (
        <Waves className="size-4 shrink-0 text-text-secondary transition-colors group-hover:text-accent-signal-blue" />
      ),
    },
  ]

  return (
    <div
      className={`space-y-4 p-5 transition-opacity duration-200 ${disabled ? "opacity-50" : ""}`}
    >
      {/* Title */}
      <h2 className="font-display text-sm font-semibold tracking-[0.05em] text-text-secondary uppercase">
        Layer Controls
      </h2>

      {/* Checkbox list */}
      <div className="space-y-3">
        {layerOptions.map((layer) => {
          const active = layers[layer.id]
          return (
            <div
              key={layer.id}
              onClick={() => {
                if (disabled) return
                toggleLayer(layer.id)
              }}
              className={`group flex items-start gap-3.5 rounded-[8px] border p-3.5 transition-all duration-300 select-none ${
                active
                  ? "border-accent-signal-blue bg-accent-signal-blue/[0.03] shadow-[0_2px_12px_rgba(0,132,255,0.03)] dark:bg-accent-signal-blue/[0.05] dark:shadow-[0_2px_12px_rgba(58,160,255,0.05)]"
                  : "border-border-hairline bg-bg-panel-raised/40 hover:border-border-hairline/80 hover:bg-bg-panel-raised/80"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer active:scale-[0.985]"}`}
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={active}
                  onCheckedChange={() => {
                    if (disabled) return
                    toggleLayer(layer.id)
                  }}
                  disabled={disabled}
                  className={`size-[18px] rounded-[5px] border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none ${
                    active
                      ? "scale-[1.05] border-accent-signal-blue bg-accent-signal-blue text-white shadow-[0_0_8px_rgba(0,132,255,0.25)] dark:shadow-[0_0_8px_rgba(58,160,255,0.35)]"
                      : "border-border-hairline bg-bg-panel group-hover:border-accent-signal-blue/50 group-hover:bg-bg-panel/80"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <div className="flex items-center gap-2">
                  {React.cloneElement(layer.icon as React.ReactElement<any>, {
                    className: `size-4 shrink-0 transition-colors ${
                      active
                        ? "text-accent-signal-blue"
                        : "text-text-secondary group-hover:text-accent-signal-blue"
                    }`,
                  })}
                  <span
                    className={`font-mono text-xs font-semibold tracking-wide transition-colors duration-250 ${active ? "text-accent-signal-blue" : "text-text-primary"} ${disabled ? "opacity-50" : ""}`}
                  >
                    {layer.name}
                  </span>
                </div>
                <span className="text-[10px] leading-normal text-text-secondary">
                  {layer.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Clarity Control (Radius) Slider */}
      <div className="mt-2 space-y-3 border-t border-border-hairline/30 pt-5 text-left">
        <div className="flex justify-between font-mono text-xs">
          <span className="tracking-[0.03em] text-text-secondary uppercase">
            Clarity Control (Radius)
          </span>
          <span className="font-bold text-accent-signal-blue">{radius}px</span>
        </div>
        <Slider
          value={[radius]}
          onValueChange={(val) => setRadius(val[0])}
          min={5}
          max={50}
          step={1}
          disabled={disabled}
          className={`[&_[data-slot=slider-range]]:bg-accent-signal-blue [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:rounded-[2px] [&_[data-slot=slider-thumb]]:border-accent-signal-blue [&_[data-slot=slider-thumb]]:bg-text-primary [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-accent-signal-blue [&_[data-slot=slider-thumb]]:focus-visible:outline-none [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-bg-panel-raised ${
            disabled
              ? "cursor-not-allowed"
              : "hover:cursor-grab active:cursor-grabbing"
          }`}
        />
        <div className="flex justify-between font-mono text-[9px] text-text-secondary">
          <span>5px (Fine)</span>
          <span>25px (Default)</span>
          <span>50px (Coarse)</span>
        </div>
      </div>
    </div>
  )
}

export default LayerControls
