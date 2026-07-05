import React from "react"
import { Activity } from "lucide-react"
import type { GridStats } from "@/components/ui/map/heatmap"

interface SpatialStatsProps {
  gridStats: GridStats | null
  paramInfo: { label: string; unit: string; icon: React.ReactNode }
}

export const SpatialStats: React.FC<SpatialStatsProps> = ({
  gridStats,
  paramInfo,
}) => {
  return (
    <div className="bg-paper space-y-4 rounded-xl border border-hairline p-5 shadow-[0_2px_8px_rgba(26,26,26,0.08)]">
      <span className="text-ink flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider uppercase">
        <Activity className="size-3.5 text-primary" />
        Grid Spatial Statistics
      </span>

      {gridStats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-cloud rounded-lg border border-hairline p-2.5">
              <div className="text-graphite font-mono text-[8px] font-bold tracking-wider uppercase">
                Min Value
              </div>
              <div className="text-ink mt-0.5 font-mono text-xs font-bold">
                {gridStats.min.toFixed(1)}
                {paramInfo.unit}
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
              <div className="font-mono text-[8px] font-bold tracking-wider text-primary uppercase">
                Grid Mean
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-primary">
                {gridStats.avg.toFixed(1)}
                {paramInfo.unit}
              </div>
            </div>
            <div className="bg-cloud rounded-lg border border-hairline p-2.5">
              <div className="text-graphite font-mono text-[8px] font-bold tracking-wider uppercase">
                Max Value
              </div>
              <div className="text-ink mt-0.5 font-mono text-xs font-bold">
                {gridStats.max.toFixed(1)}
                {paramInfo.unit}
              </div>
            </div>
          </div>

          <div className="text-graphite flex items-center justify-between pt-1 font-mono text-[10px]">
            <span>Mesh Density Points:</span>
            <span className="text-ink font-bold">
              {gridStats.pointCount} nodes
            </span>
          </div>

          {/* State breakdown */}
          <div className="space-y-2 border-t border-hairline pt-3">
            <span className="text-graphite block font-mono text-[9px] font-bold tracking-wider uppercase">
              Top Regions Average ({paramInfo.label})
            </span>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Highest */}
              <div className="space-y-1.5">
                <div className="font-mono text-[8px] font-bold tracking-wider text-emerald-500 uppercase">
                  Highest Average
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  {gridStats.topHighest.map(
                    (st: { state: string; value: number }, i: number) => (
                      <div
                        key={i}
                        className="bg-cloud/50 flex items-center justify-between rounded px-2 py-1"
                      >
                        <span
                          className="text-ink max-w-[85px] truncate text-left"
                          title={st.state}
                        >
                          {st.state}
                        </span>
                        <span className="text-ink font-bold">
                          {st.value}
                          {paramInfo.unit}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Lowest */}
              <div className="space-y-1.5">
                <div className="font-mono text-[8px] font-bold tracking-wider text-primary uppercase">
                  Lowest Average
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  {gridStats.topLowest.map(
                    (st: { state: string; value: number }, i: number) => (
                      <div
                        key={i}
                        className="bg-cloud/50 flex items-center justify-between rounded px-2 py-1"
                      >
                        <span
                          className="text-ink max-w-[85px] truncate text-left"
                          title={st.state}
                        >
                          {st.state}
                        </span>
                        <span className="text-ink font-bold">
                          {st.value}
                          {paramInfo.unit}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-graphite py-4 text-center text-xs">
          Loading grid analysis parameters...
        </p>
      )}
    </div>
  )
}

export default SpatialStats
