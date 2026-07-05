import { useState, useMemo } from "react"
import type { Alert } from "@/types"
import { MOCK_ALERTS } from "@/data/alerts"

export const useAlerts = (regionId: string, currentDate: string) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Map MOCK_ALERTS to include their current active state based on dismissals
  const alerts = useMemo((): Alert[] => {
    return MOCK_ALERTS.map((alert) => ({
      ...alert,
      isActive: alert.isActive && !dismissedIds.includes(alert.id),
    }))
  }, [dismissedIds])

  // Filter alerts that are active, belong to the selected region, and cover the current date
  const activeAlerts = useMemo((): Alert[] => {
    return alerts.filter((alert) => {
      if (!alert.isActive) return false
      if (alert.regionId !== regionId) return false

      const start = alert.dateRange.start
      const end = alert.dateRange.end
      return currentDate >= start && currentDate <= end
    })
  }, [alerts, regionId, currentDate])

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => [...prev, id])
  }

  return {
    alerts,
    activeAlerts,
    dismissAlert,
  }
}

export default useAlerts
