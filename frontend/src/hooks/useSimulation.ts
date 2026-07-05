import { useState } from "react"
import {
  type SimulationState,
  type SimulationParams,
  DEFAULT_SIMULATION_STATE,
} from "@/types"

export const useSimulation = () => {
  const [simulation, setSimulation] = useState<SimulationState>(
    DEFAULT_SIMULATION_STATE
  )

  const setParam = (key: keyof SimulationParams, value: number) => {
    setSimulation((prev) => ({
      ...prev,
      pending: {
        ...prev.pending,
        [key]: value,
      },
    }))
  }

  const run = async (): Promise<void> => {
    setSimulation((prev) => ({
      ...prev,
      isRunning: true,
    }))

    // Simulate model inference time (400-600ms)
    await new Promise((resolve) => setTimeout(resolve, 500))

    setSimulation((prev) => ({
      ...prev,
      applied: { ...prev.pending },
      isActive: true,
      isRunning: false,
    }))
  }

  const reset = () => {
    setSimulation({
      pending: { rainfallMod: 0, tempOffset: 0 },
      applied: null,
      isActive: false,
      isRunning: false,
    })
  }

  return {
    simulation,
    setParam,
    run,
    reset,
  }
}
