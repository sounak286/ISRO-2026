import React from "react"
import { Activity, Info } from "lucide-react"
import type { HeatmapFeature } from "@/components/ui/map/heatmap"

interface MeshInspectorProps {
  selectedNode: HeatmapFeature["properties"] | null
  setSelectedNode: (node: HeatmapFeature["properties"] | null) => void
  paramInfo: { label: string; unit: string; icon: React.ReactNode }
}

export const MeshInspector: React.FC<MeshInspectorProps> = ({
  selectedNode,
  setSelectedNode,
  paramInfo,
}) => {
  return (
    <div className="bg-paper space-y-4 rounded-xl border border-hairline p-5 shadow-[0_2px_8px_rgba(26,26,26,0.08)]">
      <span className="text-ink flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider uppercase">
        <Activity className="size-3.5 text-primary" />
        Interactive Mesh Inspector
      </span>

      {selectedNode ? (
        <div className="space-y-3.5">
          <div className="flex items-start justify-between">
            <div className="text-left">
              <h4 className="text-ink text-xs font-bold">
                {selectedNode.name}
              </h4>
              <span className="text-graphite font-mono text-[9px] tracking-wider uppercase">
                Region: {selectedNode.state}
              </span>
            </div>
            <span className="text-on-primary rounded bg-primary px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-wide uppercase shadow-sm">
              {paramInfo.label}
            </span>
          </div>

          <div className="my-1 grid grid-cols-2 gap-2 border-y border-hairline py-3 font-mono text-xs">
            <div className="space-y-1 text-left">
              <span className="text-graphite text-[8px] tracking-wider uppercase">
                Latitude
              </span>
              <div className="text-ink font-bold">20.59° N</div>
            </div>
            <div className="space-y-1 text-left">
              <span className="text-graphite text-[8px] tracking-wider uppercase">
                Longitude
              </span>
              <div className="text-ink font-bold">78.96° E</div>
            </div>
          </div>

          <div className="bg-cloud flex items-center justify-between rounded-lg border border-hairline p-3.5">
            <span className="text-graphite font-mono text-[10px] font-bold tracking-wider uppercase">
              Current Reading
            </span>
            <span className="font-mono text-sm font-bold text-primary">
              {selectedNode.value_lst ??
                selectedNode.value_rain ??
                selectedNode.value_sst ??
                0}
              {paramInfo.unit}
            </span>
          </div>

          <button
            onClick={() => setSelectedNode(null)}
            className="text-graphite hover:bg-cloud w-full cursor-pointer rounded border border-hairline py-2 text-center font-mono text-[10px] font-bold transition-colors"
          >
            Clear Selection
          </button>
        </div>
      ) : (
        <div className="bg-cloud border-hairline-strong flex flex-col items-center justify-center rounded-xl border border-dashed p-4 py-6 text-center">
          <Info className="text-steel mb-2 size-5" />
          <p className="text-graphite text-[11px] leading-relaxed">
            Click any location inside the Indian subcontinent boundaries to
            inspect that sector's micro-climate mesh node readings.
          </p>
        </div>
      )}
    </div>
  )
}

export default MeshInspector
