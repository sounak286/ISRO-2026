import React from "react"
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import type { TimeState } from "@/types"
import { MOCK_DATE_ENTRIES } from "@/data/dates"
import { Slider as SliderPrimitive } from "radix-ui"

interface TimeControlsProps {
  time: TimeState
  setDate: (date: string) => void
  play: () => void
  pause: () => void
  stepForward: () => void
  stepBackward: () => void
  skipToStart: () => void
  skipToEnd: () => void
  isLoading?: boolean
}

export const TimeControls: React.FC<TimeControlsProps> = ({
  time,
  setDate,
  play,
  pause,
  stepForward,
  stepBackward,
  skipToStart,
  skipToEnd,
  isLoading = false,
}) => {
  const { currentDate, availableRange, isPlaying, nowIndex } = time
  const dates = availableRange.dates
  const currentIndex = dates.indexOf(currentDate)

  const isAtStart = currentIndex === 0
  const isAtEnd = currentIndex === dates.length - 1

  // Format date display: e.g. "2026-06-19" -> "Jun 19"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const [, monthStr, day] = dateStr.split("-")
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const monthIndex = parseInt(monthStr, 10) - 1
    const month = months[monthIndex] || months[5]
    return `${month} ${day}`
  }

  const currentEntry = MOCK_DATE_ENTRIES.find((d) => d.date === currentDate)
  const isForecast = currentEntry?.type === "forecasted"

  // Calculate now percentage for boundary and track coloring
  // In the mock range of 8 dates (index 0 to 7), index 4 is the Now date (Jun 19)
  const nowPercentage =
    dates.length > 1 ? (nowIndex / (dates.length - 1)) * 100 : 57.14

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-t border-border-hairline bg-bg-panel px-6 font-mono select-none">
      {/* 1. Left side: Transport Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={skipToStart}
          disabled={isAtStart || isLoading}
          className="flex size-8 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-panel-raised hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          title="Skip to Start"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          onClick={stepBackward}
          disabled={isAtStart || isLoading}
          className="flex size-8 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-panel-raised hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          title="Step Backward"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={isPlaying ? pause : play}
          disabled={isLoading}
          className="flex size-8 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-panel-raised hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4 text-accent-signal-blue" />
          )}
        </button>
        <button
          onClick={stepForward}
          disabled={isAtEnd || isLoading}
          className="flex size-8 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-panel-raised hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          title="Step Forward"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={skipToEnd}
          disabled={isAtEnd || isLoading}
          className="flex size-8 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-panel-raised hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          title="Skip to End"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>

      {/* 2. Middle side: Timeline Scrubber */}
      <div className="relative mx-6 flex h-full max-w-[50%] flex-1 items-center">
        {dates.length > 0 && (
          <SliderPrimitive.Root
            min={0}
            max={dates.length - 1}
            step={1}
            value={[currentIndex]}
            onValueChange={(val) => setDate(dates[val[0]])}
            disabled={isLoading}
            className="relative flex h-5 w-full cursor-pointer touch-none items-center select-none disabled:cursor-not-allowed data-disabled:opacity-50"
          >
            {/* Scrubber background tracks */}
            <SliderPrimitive.Track className="relative flex h-1 grow overflow-visible rounded-[1px] bg-bg-panel-raised">
              {/* Observed portion */}
              <div
                className="absolute top-0 left-0 h-full rounded-l-[1px] bg-accent-signal-blue"
                style={{ width: `${nowPercentage}%` }}
              />
              {/* Forecasted portion */}
              <div
                className="absolute top-0 h-full rounded-r-[1px] border-l border-dashed border-border-hairline bg-accent-signal-blue/20"
                style={{ left: `${nowPercentage}%`, right: 0 }}
              />
              {/* "Now" indicator boundary mark */}
              <div
                className="absolute top-1/2 z-10 h-3.5 w-[2px] -translate-y-1/2 bg-accent-ember"
                style={{ left: `${nowPercentage}%` }}
                title="Now Boundary"
              />
            </SliderPrimitive.Track>

            {/* Date Ticks */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex h-4 -translate-y-1/2 justify-between">
              {dates.map((d, i) => {
                const isObservedNow = i === nowIndex
                return (
                  <div
                    key={d}
                    className="flex size-4 flex-col items-center justify-center"
                    style={{
                      position: "absolute",
                      left: `${(i / (dates.length - 1)) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div
                      className={`size-1.5 rounded-[1px] border transition-all ${
                        isObservedNow
                          ? "border-accent-ember bg-accent-ember"
                          : i < nowIndex
                            ? "border-border-hairline bg-bg-panel-raised"
                            : "border-dashed border-border-hairline bg-bg-panel-raised"
                      }`}
                    />
                  </div>
                )
              })}
            </div>

            {/* Draggable thumb */}
            <SliderPrimitive.Thumb
              className="z-20 block size-3 cursor-grab rounded-[1px] border border-accent-signal-blue bg-text-primary transition-all focus-visible:ring-2 focus-visible:ring-accent-signal-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel focus-visible:outline-none active:cursor-grabbing"
              aria-label="Select Date"
            />
          </SliderPrimitive.Root>
        )}
      </div>

      {/* 3. Right side: Date readout & Status */}
      <div className="flex items-center gap-3">
        <span
          className={`rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
            isForecast
              ? "border-accent-ember/30 bg-accent-ember/10 text-accent-ember"
              : "border-accent-signal-blue/30 bg-accent-signal-blue/10 text-accent-signal-blue"
          }`}
        >
          {isForecast ? "Forecast" : "Observed"}
        </span>
        <span className="text-sm font-semibold text-text-primary">
          {formatDate(currentDate)}
        </span>
      </div>
    </div>
  )
}

export default TimeControls
