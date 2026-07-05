import React from "react"
import { Compass, Database, SunMedium, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import type { Region } from "@/types"
import type { StateFeatureCollection } from "@/components/ui/map/heatmap"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HeaderProps {
  selectedRegionId: string
  isSwitching: boolean
  setRegion: (id: string) => void
  regions: Region[]
  loadingGeoJSON: boolean
  geoJSONData: StateFeatureCollection | null
}

export const Header: React.FC<HeaderProps> = ({
  selectedRegionId,
  isSwitching,
  setRegion,
  regions,
  loadingGeoJSON,
  geoJSONData,
}) => {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-panel px-6 select-none">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded bg-accent-signal-blue text-white shadow-sm shadow-accent-signal-blue/10 transition-colors duration-200 hover:bg-accent-signal-blue/90">
          <Compass className="size-4 rotate-12" />
        </div>
        <div>
          <span className="font-heading text-lg font-semibold tracking-[0.5px] text-text-primary uppercase">
            Indian Climate Twin
          </span>
          <span className="ml-3 rounded bg-accent-signal-blue/15 px-2 py-0.5 font-mono text-[10px] tracking-wider text-accent-signal-blue uppercase transition-colors duration-200">
            0.25° grid console
          </span>
        </div>
      </div>

      {/* Middle: Region Selector Dropdown */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-secondary uppercase">
          Active Sector:
        </span>
        <Select
          value={selectedRegionId}
          onValueChange={setRegion}
          disabled={isSwitching || loadingGeoJSON}
        >
          <SelectTrigger className="h-8 w-[200px] cursor-pointer rounded-md border-border-hairline bg-bg-panel-raised font-mono text-xs text-text-primary shadow-sm transition-all duration-200 hover:border-accent-signal-blue/50 hover:bg-bg-panel focus-visible:ring-2 focus-visible:ring-accent-signal-blue/40">
            <SelectValue placeholder="Select active sector..." />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="z-50 min-w-[200px] rounded-md border border-border-hairline bg-bg-panel p-1 text-text-primary shadow-lg"
          >
            {regions.map((r) => (
              <SelectItem
                key={r.id}
                value={r.id}
                className="cursor-pointer rounded-sm py-1.5 pr-8 pl-2.5 font-mono text-xs text-text-primary transition-colors duration-150 hover:bg-bg-panel-raised focus:bg-bg-panel-raised"
              >
                {r.name} (
                {r.type === "macro-region"
                  ? "Macro"
                  : r.type === "state"
                    ? "State"
                    : "District"}
                )
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right side: Status and Theme toggle */}
      <div className="flex items-center gap-5 text-xs">
        <div className="flex items-center gap-2 font-mono text-text-secondary">
          <Database className="size-3.5 text-accent-signal-blue" />
          <span>Mesh Status:</span>
          {loadingGeoJSON ? (
            <span className="inline-block size-2 animate-pulse rounded-full bg-severity-warning"></span>
          ) : geoJSONData ? (
            <span className="font-semibold text-emerald-500 uppercase">
              Connected
            </span>
          ) : (
            <span className="font-semibold text-destructive uppercase">
              Disconnected
            </span>
          )}
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex size-8 cursor-pointer items-center justify-center rounded border border-border-hairline bg-bg-panel-raised text-text-primary transition-colors hover:bg-bg-panel hover:text-white focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none"
          title="Toggle UI Theme"
        >
          {theme === "dark" ? (
            <SunMedium className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
