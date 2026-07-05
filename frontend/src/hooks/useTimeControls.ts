import { useState, useEffect } from "react"
import type { TimeState, DateRange } from "@/types"
import { MOCK_DATE_RANGE, NOW_DATE, NOW_INDEX } from "@/data/dates"

export const useTimeControls = (dateRange: DateRange = MOCK_DATE_RANGE) => {
  const [time, setTime] = useState<TimeState>({
    currentDate: NOW_DATE,
    availableRange: dateRange,
    nowIndex: NOW_INDEX,
    isPlaying: false,
    playbackIntervalMs: 1000,
  })

  const setDate = (date: string) => {
    if (dateRange.dates.includes(date)) {
      setTime((prev) => ({
        ...prev,
        currentDate: date,
      }))
    }
  }

  const play = () => {
    setTime((prev) => {
      const idx = prev.availableRange.dates.indexOf(prev.currentDate)
      const isAtEnd = idx === prev.availableRange.dates.length - 1
      return {
        ...prev,
        isPlaying: true,
        currentDate: isAtEnd ? prev.availableRange.start : prev.currentDate,
      }
    })
  }

  const pause = () => {
    setTime((prev) => ({ ...prev, isPlaying: false }))
  }

  const stepForward = () => {
    setTime((prev) => {
      const idx = prev.availableRange.dates.indexOf(prev.currentDate)
      if (idx !== -1 && idx < prev.availableRange.dates.length - 1) {
        return {
          ...prev,
          currentDate: prev.availableRange.dates[idx + 1],
        }
      }
      return prev
    })
  }

  const stepBackward = () => {
    setTime((prev) => {
      const idx = prev.availableRange.dates.indexOf(prev.currentDate)
      if (idx > 0) {
        return {
          ...prev,
          currentDate: prev.availableRange.dates[idx - 1],
        }
      }
      return prev
    })
  }

  const skipToStart = () => {
    setTime((prev) => ({
      ...prev,
      currentDate: prev.availableRange.start,
    }))
  }

  const skipToEnd = () => {
    setTime((prev) => ({
      ...prev,
      currentDate: prev.availableRange.end,
    }))
  }

  // Playback effect
  useEffect(() => {
    if (!time.isPlaying) return

    const interval = setInterval(() => {
      setTime((prev) => {
        const idx = prev.availableRange.dates.indexOf(prev.currentDate)
        if (idx !== -1 && idx < prev.availableRange.dates.length - 1) {
          return {
            ...prev,
            currentDate: prev.availableRange.dates[idx + 1],
          }
        } else {
          // Auto-stop at the end
          return {
            ...prev,
            isPlaying: false,
          }
        }
      })
    }, time.playbackIntervalMs)

    return () => clearInterval(interval)
  }, [time.isPlaying, time.playbackIntervalMs])

  return {
    time,
    setDate,
    play,
    pause,
    stepForward,
    stepBackward,
    skipToStart,
    skipToEnd,
  }
}
export default useTimeControls
