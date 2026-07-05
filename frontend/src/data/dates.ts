import type { DateRange, DateEntry } from "@/types"

export const MOCK_DATE_RANGE: DateRange = {
  start: "2026-06-01",
  end: "2026-06-30",
  dates: [
    "2026-06-01",
    "2026-06-02",
    "2026-06-03",
    "2026-06-04",
    "2026-06-05",
    "2026-06-06",
    "2026-06-07",
    "2026-06-08",
    "2026-06-09",
    "2026-06-10",
    "2026-06-11",
    "2026-06-12",
    "2026-06-13",
    "2026-06-14",
    "2026-06-15",
    "2026-06-16",
    "2026-06-17",
    "2026-06-18",
    "2026-06-19", // observed  ← "Now"
    "2026-06-20", // forecasted
    "2026-06-21", // forecasted
    "2026-06-22", // forecasted
    "2026-06-23", // forecasted
    "2026-06-24", // forecasted
    "2026-06-25", // forecasted
    "2026-06-26", // forecasted
    "2026-06-27", // forecasted
    "2026-06-28", // forecasted
    "2026-06-29", // forecasted
    "2026-06-30", // forecasted
  ],
}

export const MOCK_DATE_ENTRIES: DateEntry[] = [
  { date: "2026-06-01", type: "observed", hasData: true },
  { date: "2026-06-02", type: "observed", hasData: true },
  { date: "2026-06-03", type: "observed", hasData: true },
  { date: "2026-06-04", type: "observed", hasData: true },
  { date: "2026-06-05", type: "observed", hasData: true },
  { date: "2026-06-06", type: "observed", hasData: true },
  { date: "2026-06-07", type: "observed", hasData: true },
  { date: "2026-06-08", type: "observed", hasData: true },
  { date: "2026-06-09", type: "observed", hasData: true },
  { date: "2026-06-10", type: "observed", hasData: true },
  { date: "2026-06-11", type: "observed", hasData: true },
  { date: "2026-06-12", type: "observed", hasData: true },
  { date: "2026-06-13", type: "observed", hasData: true },
  { date: "2026-06-14", type: "observed", hasData: true },
  { date: "2026-06-15", type: "observed", hasData: true },
  { date: "2026-06-16", type: "observed", hasData: true },
  { date: "2026-06-17", type: "observed", hasData: true },
  { date: "2026-06-18", type: "observed", hasData: true },
  { date: "2026-06-19", type: "observed", hasData: true },
  { date: "2026-06-20", type: "forecasted", hasData: true },
  { date: "2026-06-21", type: "forecasted", hasData: true },
  { date: "2026-06-22", type: "forecasted", hasData: true },
  { date: "2026-06-23", type: "forecasted", hasData: true },
  { date: "2026-06-24", type: "forecasted", hasData: true },
  { date: "2026-06-25", type: "forecasted", hasData: true },
  { date: "2026-06-26", type: "forecasted", hasData: true },
  { date: "2026-06-27", type: "forecasted", hasData: true },
  { date: "2026-06-28", type: "forecasted", hasData: true },
  { date: "2026-06-29", type: "forecasted", hasData: true },
  { date: "2026-06-30", type: "forecasted", hasData: true },
]

export const NOW_DATE = "2026-06-19"
export const NOW_INDEX = 18
