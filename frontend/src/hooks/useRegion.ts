import { useState, useRef, useEffect } from "react"
import { MOCK_REGIONS, DEFAULT_REGION_ID } from "@/data/regions"

export const useRegion = () => {
  const [regionId, setRegionId] = useState<string>(DEFAULT_REGION_ID)
  const [selectedRegionId, setSelectedRegionId] =
    useState<string>(DEFAULT_REGION_ID)
  const [isSwitching, setIsSwitching] = useState<boolean>(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const region = MOCK_REGIONS.find((r) => r.id === regionId) || MOCK_REGIONS[0]

  const setRegion = (id: string) => {
    const found = MOCK_REGIONS.some((r) => r.id === id)
    if (found) {
      setSelectedRegionId(id)
      setIsSwitching(true)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setRegionId(id)
        setIsSwitching(false)
      }, 500) // 500ms simulated delay
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    region,
    selectedRegionId,
    setRegion,
    regions: MOCK_REGIONS,
    isSwitching,
  }
}
