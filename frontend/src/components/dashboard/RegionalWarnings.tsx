import React from "react"
import { AlertTriangle } from "lucide-react"

interface Warning {
  title: string
  desc: string
  state: string
  level: string
}

interface RegionalWarningsProps {
  activeWarnings: Warning[]
}

export const RegionalWarnings: React.FC<RegionalWarningsProps> = ({
  activeWarnings,
}) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden p-4">
      <span className="text-graphite mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
        <AlertTriangle className="text-bloom-coral size-3.5" />
        Regional Climate Advisories
      </span>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto">
        {activeWarnings.map((w, idx) => (
          <div
            key={idx}
            className={`bg-cloud flex flex-col gap-1 rounded border-l-4 border-hairline p-3`}
            style={{
              borderLeftColor:
                w.level === "danger"
                  ? "var(--bloom-coral)"
                  : w.level === "warning"
                    ? "var(--color-primary-bright)"
                    : "var(--color-primary)",
            }}
          >
            <div className="flex items-start justify-between">
              <span className="text-ink text-xs font-semibold">{w.title}</span>
              <span className="bg-canvas text-graphite py-0.2 rounded border border-hairline px-1.5 font-mono text-[9px] font-bold uppercase">
                {w.state}
              </span>
            </div>
            <p className="text-graphite text-[10px] leading-relaxed">
              {w.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RegionalWarnings
