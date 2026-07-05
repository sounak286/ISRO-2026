import { useState } from "react"
import { type LayerId, type LayerState, DEFAULT_LAYER_STATE } from "@/types"

export const useLayers = () => {
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYER_STATE)

  const toggleLayer = (layerId: LayerId) => {
    setLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }

  return {
    layers,
    toggleLayer,
  }
}
