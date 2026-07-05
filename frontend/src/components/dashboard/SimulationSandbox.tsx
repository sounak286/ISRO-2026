import React from "react"
import { Slider } from "@/components/ui/slider"
import type { SimulationState, SimulationParams } from "@/types"

interface SimulationSandboxProps {
  simulation: SimulationState
  setParam: (key: keyof SimulationParams, value: number) => void
  run: () => Promise<void>
  reset: () => void
  disabled?: boolean
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  simulation,
  setParam,
  run,
  reset,
  disabled = false,
}) => {
  const { pending, applied, isActive, isRunning } = simulation

  // Run is disabled if both sliders are at baseline 0 OR there is no running simulation OR sidebar is disabled
  const isPendingAtBaseline =
    pending.rainfallMod === 0 && pending.tempOffset === 0
  const isRunDisabled = isPendingAtBaseline || isRunning || disabled

  // Reset is disabled if simulation is not currently active/applied OR sidebar is disabled
  const isResetDisabled = (!isActive && !applied) || disabled

  const handleRainfallChange = (val: number[]) => {
    setParam("rainfallMod", val[0])
  }

  const handleTempChange = (val: number[]) => {
    setParam("tempOffset", val[0])
  }

  const formatPercent = (val: number) => {
    return val > 0 ? `+${val}%` : `${val}%`
  }

  const formatTemp = (val: number) => {
    return val > 0 ? `+${val.toFixed(1)}°C` : `${val.toFixed(1)}°C`
  }

  return (
    <div
      className={`space-y-4 p-5 transition-opacity duration-200 ${disabled ? "opacity-50" : ""}`}
    >
      {/* Title */}
      <h2 className="font-display text-sm font-semibold tracking-[0.05em] text-text-secondary uppercase">
        Simulation Sandbox
      </h2>

      {/* Sliders Container */}
      <div className="space-y-4">
        {/* Rainfall Mod */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-text-secondary uppercase">
              Rainfall Modifier
            </span>
            <span className="font-bold text-accent-signal-blue">
              {formatPercent(pending.rainfallMod)}
            </span>
          </div>
          <Slider
            value={[pending.rainfallMod]}
            onValueChange={handleRainfallChange}
            min={-50}
            max={50}
            step={5}
            disabled={disabled}
            className={`[&_[data-slot=slider-range]]:bg-accent-signal-blue [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:rounded-[2px] [&_[data-slot=slider-thumb]]:border-accent-signal-blue [&_[data-slot=slider-thumb]]:bg-text-primary [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-accent-signal-blue [&_[data-slot=slider-thumb]]:focus-visible:outline-none [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-bg-panel-raised ${
              disabled
                ? "cursor-not-allowed"
                : "hover:cursor-grab active:cursor-grabbing"
            }`}
          />
          <div className="flex justify-between font-mono text-[9px] text-text-secondary">
            <span>-50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Temp Offset */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-text-secondary uppercase">
              Temperature Offset
            </span>
            <span className="font-bold text-accent-signal-blue">
              {formatTemp(pending.tempOffset)}
            </span>
          </div>
          <Slider
            value={[pending.tempOffset]}
            onValueChange={handleTempChange}
            min={-2}
            max={5}
            step={0.5}
            disabled={disabled}
            className={`[&_[data-slot=slider-range]]:bg-accent-signal-blue [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:rounded-[2px] [&_[data-slot=slider-thumb]]:border-accent-signal-blue [&_[data-slot=slider-thumb]]:bg-text-primary [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-accent-signal-blue [&_[data-slot=slider-thumb]]:focus-visible:outline-none [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-bg-panel-raised ${
              disabled
                ? "cursor-not-allowed"
                : "hover:cursor-grab active:cursor-grabbing"
            }`}
          />
          <div className="flex justify-between font-mono text-[9px] text-text-secondary">
            <span>-2.0°C</span>
            <span>0.0°C</span>
            <span>+5.0°C</span>
          </div>
        </div>
      </div>

      {/* Simulation Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={run}
          disabled={isRunDisabled}
          className="w-full cursor-pointer rounded-[4px] bg-accent-ember py-2.5 text-center text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-accent-ember/90 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-bg-panel-raised disabled:text-text-secondary"
        >
          {isRunning ? "Running Scenario..." : "Run Simulation"}
        </button>

        <button
          onClick={reset}
          disabled={isResetDisabled}
          className="w-full rounded-[4px] border border-border-hairline bg-transparent py-2 text-center text-[11px] font-medium text-text-primary transition-colors hover:border-accent-signal-blue/60 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:border-border-hairline disabled:text-text-secondary"
        >
          Reset to Baseline
        </button>
      </div>
    </div>
  )
}

export default SimulationSandbox
