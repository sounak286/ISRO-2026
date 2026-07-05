import React, { useState, useEffect } from "react"
import { AlertTriangle, AlertOctagon, Info, X } from "lucide-react"
import type { Alert } from "@/types"

interface AlertsBarProps {
  activeAlerts: Alert[]
  dismissAlert: (id: string) => void
  onViewAlertOnMap?: (coordinates: [number, number]) => void
}

export const AlertsBar: React.FC<AlertsBarProps> = ({
  activeAlerts,
  dismissAlert,
  onViewAlertOnMap,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  // Listen for Escape key to close the modal
  useEffect(() => {
    if (!selectedAlert) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAlert(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedAlert])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return AlertOctagon
      case "warning":
        return AlertTriangle
      default:
        return Info
    }
  }

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          border: "border-l-severity-critical",
          iconColor: "text-severity-critical",
          badgeBg:
            "bg-severity-critical/10 text-severity-critical border-severity-critical/20",
        }
      case "warning":
        return {
          border: "border-l-severity-warning",
          iconColor: "text-severity-warning",
          badgeBg:
            "bg-severity-warning/10 text-severity-warning border-severity-warning/20",
        }
      default:
        return {
          border: "border-l-severity-info",
          iconColor: "text-severity-info",
          badgeBg:
            "bg-severity-info/10 text-severity-info border-severity-info/20",
        }
    }
  }

  const hasAlerts = activeAlerts.length > 0
  const isTickerMode = activeAlerts.length >= 3

  return (
    <div className="relative flex h-12 shrink-0 items-center overflow-hidden border-t border-border-hairline bg-panel px-6 select-none">
      {/* Label/Title on the far left */}
      <div className="mr-4 flex shrink-0 items-center gap-2 border-r border-border-hairline pr-4 font-mono text-[10px] font-bold tracking-wider text-text-secondary uppercase">
        <AlertTriangle className="size-4 text-accent-ember" />
        <span>Anomaly Ticker</span>
      </div>

      {/* Alerts Row/Ticker */}
      {hasAlerts ? (
        isTickerMode ? (
          /* Scrolling Ticker mode (>= 3 alerts) */
          <div className="relative flex h-full flex-1 items-center overflow-hidden">
            {/* Left & Right fading overlays to give a cool console/instrument fade-out effect */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--bg-panel)] to-transparent" />
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-gradient-to-l from-[var(--bg-panel)] to-transparent" />

            <div className="animate-ticker-scroll flex items-center gap-3 py-1 whitespace-nowrap">
              {/* Loop twice to make the scrolling ticker infinite/seamless */}
              {Array.from({ length: 2 }).map((_, loopIdx) => (
                <div key={loopIdx} className="flex shrink-0 gap-3">
                  {activeAlerts.map((alert) => {
                    const colors = getSeverityColors(alert.severity)
                    const Icon = getSeverityIcon(alert.severity)
                    return (
                      <button
                        type="button"
                        key={`${alert.id}-${loopIdx}`}
                        onClick={() => setSelectedAlert(alert)}
                        className={`flex items-center gap-2.5 rounded-[4px] border border-l-4 border-border-hairline px-3 py-1.5 ${colors.border} max-w-[280px] shrink-0 cursor-pointer bg-bg-panel-raised text-left transition-all hover:bg-bg-panel-raised/85 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none`}
                      >
                        <Icon
                          className={`size-3.5 shrink-0 ${colors.iconColor}`}
                        />
                        <span className="truncate text-[11px] font-medium text-text-primary">
                          {alert.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Static row mode (1-2 alerts) */
          <div className="custom-scrollbar flex flex-1 items-center gap-3 overflow-x-auto py-1">
            {activeAlerts.map((alert) => {
              const colors = getSeverityColors(alert.severity)
              const Icon = getSeverityIcon(alert.severity)
              return (
                <button
                  type="button"
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`flex items-center gap-2.5 rounded-[4px] border border-l-4 border-border-hairline px-3 py-1.5 ${colors.border} max-w-[280px] shrink-0 cursor-pointer bg-bg-panel-raised text-left transition-all hover:bg-bg-panel-raised/85 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none`}
                >
                  <Icon className={`size-3.5 shrink-0 ${colors.iconColor}`} />
                  <span className="truncate text-[11px] font-medium text-text-primary">
                    {alert.title}
                  </span>
                </button>
              )
            })}
          </div>
        )
      ) : (
        /* Empty State - No active alerts */
        <div className="flex flex-1 items-center gap-3 py-1">
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-text-secondary">
            <Info className="size-3.5 opacity-60" />
            <span>No active alerts for this region and date.</span>
          </div>
        </div>
      )}

      {/* Alert Detail Modal Overlay */}
      {selectedAlert && (
        <div
          onClick={() => setSelectedAlert(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-void/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-in overflow-hidden rounded-[6px] border border-border-hairline bg-bg-panel-raised shadow-2xl duration-200 zoom-in-95 fade-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-hairline px-5 py-4">
              <span
                className={`rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${getSeverityColors(selectedAlert.severity).badgeBg}`}
              >
                {selectedAlert.severity} alert
              </span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="cursor-pointer rounded p-1 text-text-secondary transition-colors hover:bg-bg-panel hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-5 text-left">
              <div>
                <h3 className="font-display text-sm font-semibold tracking-wide text-text-primary uppercase">
                  {selectedAlert.title}
                </h3>
                <span className="mt-1 block font-mono text-[10px] text-text-secondary uppercase">
                  Affected Zone: {selectedAlert.affectedZone}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-text-secondary">
                {selectedAlert.description}
              </p>

              {/* Technical readings */}
              {(selectedAlert.thresholdValue ||
                selectedAlert.observedValue) && (
                <div className="grid grid-cols-2 gap-3 rounded-[4px] border border-border-hairline bg-bg-panel p-3 font-mono text-[10px]">
                  {selectedAlert.thresholdValue && (
                    <div className="space-y-0.5">
                      <span className="text-text-secondary uppercase">
                        Trigger Threshold
                      </span>
                      <div className="font-bold text-text-primary">
                        {selectedAlert.thresholdValue}
                        {selectedAlert.parameter === "temp" ||
                        selectedAlert.parameter === "ocean-sst"
                          ? "°C"
                          : "mm"}
                      </div>
                    </div>
                  )}
                  {selectedAlert.observedValue && (
                    <div className="space-y-0.5">
                      <span className="text-text-secondary uppercase">
                        Observed Value
                      </span>
                      <div className="font-bold text-accent-ember">
                        {selectedAlert.observedValue}
                        {selectedAlert.parameter === "temp" ||
                        selectedAlert.parameter === "ocean-sst"
                          ? "°C"
                          : "mm"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-border-hairline bg-bg-panel px-5 py-3.5">
              <button
                onClick={() => {
                  dismissAlert(selectedAlert.id)
                  setSelectedAlert(null)
                }}
                className="flex-1 cursor-pointer rounded-[4px] border border-border-hairline py-2 text-center text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-panel-raised hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none"
              >
                Dismiss Alert
              </button>

              {selectedAlert.coordinates && onViewAlertOnMap && (
                <button
                  onClick={() => {
                    onViewAlertOnMap(
                      selectedAlert.coordinates as [number, number]
                    )
                    setSelectedAlert(null)
                  }}
                  className="flex-1 cursor-pointer rounded-[4px] border border-border-hairline py-2 text-center text-xs font-semibold text-text-primary transition-colors hover:bg-bg-panel-raised focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none"
                >
                  View on Map
                </button>
              )}

              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 cursor-pointer rounded-[4px] bg-accent-ember py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-accent-ember/90 focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsBar
