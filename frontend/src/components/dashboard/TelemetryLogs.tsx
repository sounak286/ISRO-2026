import React from "react"

interface TelemetryLogsProps {
  liveLogs: string[]
}

export const TelemetryLogs: React.FC<TelemetryLogsProps> = ({ liveLogs }) => {
  return (
    <div className="flex flex-[1.4] flex-col overflow-hidden border-r border-hairline p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-graphite flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
          <span className="size-1.5 animate-ping rounded-full bg-emerald-500"></span>
          Active Meteorological Telemetry Stream
        </span>
        <span className="text-graphite bg-cloud rounded px-2 py-0.5 font-mono text-[9px]">
          Interval: 1800ms
        </span>
      </div>

      <div className="bg-cloud text-ink custom-scrollbar flex-1 space-y-1.5 overflow-y-auto rounded-md border border-hairline p-3.5 font-mono text-[10.5px] leading-relaxed">
        {liveLogs.map((log, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              index === 0
                ? "border-l-2 border-primary pl-1 font-bold text-primary"
                : "text-ink/80"
            }`}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TelemetryLogs
