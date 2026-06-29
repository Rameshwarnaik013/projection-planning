// Plant / Line production reference data, derived from Conditions.xlsx.
//
// Source columns: Plant, Line, Per Day Production, Monthly capacity (= Per Day
// Production x 25 working days). We keep the per-day production aggregated by
// Plant + Line so capacities can be re-derived for any number of days:
//
//   capacity(days) = numberOfDays x sum(Per Day Production)
//
// The "Number of days" defaults to 25, which reproduces the sheet's Monthly
// capacity exactly. The duplicate Purnea "FFS 1 (RnF FFS)" row in the source
// sheet is intentionally excluded.

export const DEFAULT_DAYS = 25;

// The Line values double as the Bottleneck-Analysis process list.
export const LINES = ["Packing Line", "Roasting Line", "Mixing Line"] as const;
export type Line = (typeof LINES)[number];

// App factories map onto source-sheet plant names. Purnea sits in Bihar.
// UD and South have no rows in Conditions.xlsx, so they stay manual entry.
export const FACTORY_TO_PLANT: Record<string, string | null> = {
  Indore: "Indore",
  Bihar: "Purnea",
  Kundli: "Kundli",
  UD: null,
  South: null,
};

// Aggregated Per Day Production by plant, then by line.
const PER_DAY_PRODUCTION: Record<string, Partial<Record<Line, number>>> = {
  Indore: {
    "Packing Line": 599598,
    "Roasting Line": 12000,
    "Mixing Line": 4800,
  },
  Kundli: {
    "Packing Line": 936000,
    "Roasting Line": 6000,
    "Mixing Line": 120000,
  },
  Purnea: {
    "Packing Line": 179520,
    "Roasting Line": 6120,
    // No Mixing Line at Purnea.
  },
};

function plantOf(factory: string): string | null {
  return FACTORY_TO_PLANT[factory] ?? null;
}

// Per Day Production for one plant + line (0 when there is no data).
export function linePerDay(factory: string, line: Line): number {
  const plant = plantOf(factory);
  if (!plant) return 0;
  return PER_DAY_PRODUCTION[plant]?.[line] ?? 0;
}

// Sum of Per Day Production across every line of a plant.
function plantPerDay(factory: string): number {
  const plant = plantOf(factory);
  if (!plant) return 0;
  return Object.values(PER_DAY_PRODUCTION[plant] ?? {}).reduce((a, b) => a + b, 0);
}

// Capacity Planning capacity = days x Packing-Line Per Day Production.
export function packingCapacity(factory: string, days: number): number {
  return Math.round(linePerDay(factory, "Packing Line") * days);
}

// Bottleneck Current Capacity for a line = days x that line's Per Day Production.
export function lineCapacity(factory: string, line: Line, days: number): number {
  return Math.round(linePerDay(factory, line) * days);
}

// True when we have reference rows for this factory (drives auto-fill UX).
export function hasConditionsData(factory: string): boolean {
  return plantPerDay(factory) > 0;
}
