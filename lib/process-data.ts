import type { ProcessData } from "./types"

export function getProcessData(unit: string, fromTime?: string, toTime?: string): ProcessData[] {
  const baseData: Record<string, ProcessData[]> = {
    VDU: [
      {
        timestamp: fromTime || "2024-01-15T08:00:00Z",
        mode: "High Sulfur Mode",
        throughput: 145000,
        throughputUnit: "BPD",
        temperature: 380,
        pressure: 15.2,
        kpis: [
          { name: "Product Quality", value: 98.5, unit: "%", status: "Normal" },
          { name: "Energy Efficiency", value: 92.3, unit: "%", status: "Normal" },
          { name: "Yield", value: 87.1, unit: "%", status: "Normal" },
        ],
        notes: "Stable operation with optimal product specifications",
      },
    ],
    HCR: [
      {
        timestamp: fromTime || "2024-01-20T10:00:00Z",
        mode: "Standard Operation",
        throughput: 85000,
        throughputUnit: "BPD",
        temperature: 420,
        pressure: 35.8,
        kpis: [
          { name: "Catalyst Activity", value: 85.2, unit: "%", status: "Warning" },
          { name: "Conversion Rate", value: 91.5, unit: "%", status: "Normal" },
          { name: "Selectivity", value: 88.9, unit: "%", status: "Normal" },
        ],
        notes: "Catalyst performance showing slight decline, monitoring required",
      },
    ],
    DHT: [
      {
        timestamp: fromTime || "2024-01-25T14:00:00Z",
        mode: "Energy Saving Mode",
        throughput: 62000,
        throughputUnit: "BPD",
        temperature: 340,
        pressure: 22.5,
        kpis: [
          { name: "Desulfurization", value: 99.2, unit: "%", status: "Normal" },
          { name: "H2 Consumption", value: 105.3, unit: "SCF/BBL", status: "Warning" },
          { name: "Product Spec", value: 97.8, unit: "%", status: "Normal" },
        ],
        notes: "High H2 consumption observed, potential for energy optimization",
      },
    ],
    Utilities: [
      {
        timestamp: fromTime || "2024-01-10T12:00:00Z",
        mode: "Normal Operation",
        throughput: 350,
        throughputUnit: "T/H",
        temperature: 185,
        pressure: 42.0,
        kpis: [
          { name: "Steam Quality", value: 99.5, unit: "%", status: "Normal" },
          { name: "Reliability", value: 94.2, unit: "%", status: "Normal" },
          { name: "Energy Loss", value: 3.8, unit: "%", status: "Normal" },
        ],
        notes: "Steam system operating within specifications",
      },
    ],
    CDU: [
      {
        timestamp: fromTime || "2024-01-01T08:00:00Z",
        mode: "Standard Mode",
        throughput: 120000,
        throughputUnit: "BPD",
        temperature: 360,
        pressure: 12.8,
        kpis: [
          { name: "Pressure Drop", value: 95.4, unit: "%", status: "Normal" },
          { name: "Flow Rate", value: 89.6, unit: "%", status: "Normal" },
          { name: "Temperature Control", value: 93.2, unit: "%", status: "Normal" },
        ],
        notes: "Operational parameters within acceptable range",
      },
    ],
    CCR: [
      {
        timestamp: fromTime || "2024-01-18T09:00:00Z",
        mode: "Optimized Mode",
        throughput: 100000,
        throughputUnit: "BPD",
        temperature: 400,
        pressure: 18.3,
        kpis: [
          { name: "Regeneration Efficiency", value: 97.1, unit: "%", status: "Normal" },
          { name: "Reactor Utilization", value: 86.4, unit: "%", status: "Normal" },
          { name: "Net Gas Yield", value: 91.9, unit: "%", status: "Normal" },
        ],
        notes: "Efficient operation with minor adjustments needed",
      },
    ],
    NHT: [
      {
        timestamp: fromTime || "2024-01-22T11:00:00Z",
        mode: "Maintenance Mode",
        throughput: 75000,
        throughputUnit: "BPD",
        temperature: 370,
        pressure: 20.1,
        kpis: [
          { name: "Splitter Efficiency", value: 94.8, unit: "%", status: "Normal" },
          { name: "Reactor Pressure", value: 88.2, unit: "%", status: "Normal" },
          { name: "Gas Consumption", value: 96.5, unit: "%", status: "Normal" },
        ],
        notes: "System under maintenance with reduced throughput",
      },
    ],
  }

  return baseData[unit] || []
}

export function findSimilarTickets(currentTicket: {
  id: string
  unit?: string
  tags?: string[]
}): { score: number; reason: string }[] {
  // Mock similar ticket suggestions
  const suggestions = [
    {
      score: 85,
      reason: "Same unit (VDU) with similar throughput issue - 3 months ago",
    },
    {
      score: 72,
      reason: "Related tag FIC-1001 mentioned in furnace optimization ticket",
    },
    {
      score: 68,
      reason: "VDU temperature control issue with similar symptoms",
    },
  ]

  return suggestions
}

export const UNIT_OWNERS: Record<string, string> = {
  CDU: "이철수",
  VDU: "박영희",
  HCR: "김민준",
  CCR: "정수연",
  DHT: "강태영",
  NHT: "조미라",
  Utilities: "윤성호",
}

export const AVAILABLE_TAGS: Record<string, string[]> = {
  CDU: ["TI-1001", "TI-1002", "PI-1001", "FI-1001", "LI-1001", "TIC-1001", "PIC-1001", "FIC-1001"],
  VDU: ["TI-2001", "TI-2002", "PI-2001", "FI-2001", "LI-2001", "TIC-2001", "PIC-2001", "FIC-2001"],
  HCR: ["TI-3001", "TI-3002", "PI-3001", "FI-3001", "LI-3001", "TIC-3001", "PIC-3001", "FIC-2001"],
  CCR: ["TI-4001", "TI-4002", "PI-4001", "FI-4001", "LI-4001", "TIC-4001", "PIC-4001", "FIC-2001"],
  DHT: ["TI-5001", "TI-5002", "PI-5001", "FI-5001", "LI-5001", "TIC-5001", "PIC-5001", "FIC-2001"],
  NHT: ["TI-6001", "TI-6002", "PI-6001", "FI-6001", "LI-6001", "TIC-6001", "PIC-6001", "FIC-2001"],
  Utilities: ["TI-9001", "PI-9001", "FI-9001", "LI-9001", "TIC-9001", "PIC-9001"],
}

export const DCS_GRAPHICS: Record<string, { number: string; name: string }[]> = {
  CDU: [
    { number: "G-1001", name: "CDU Overview" },
    { number: "G-1002", name: "Atmospheric Column" },
    { number: "G-1003", name: "Preheat Train" },
    { number: "G-1004", name: "Furnace Section" },
  ],
  VDU: [
    { number: "G-2001", name: "VDU Overview" },
    { number: "G-2002", name: "Vacuum Column" },
    { number: "G-2003", name: "Ejector System" },
    { number: "G-2004", name: "HVGO Section" },
  ],
  HCR: [
    { number: "G-3001", name: "HCR Overview" },
    { number: "G-3002", name: "Reactor Section" },
    { number: "G-3003", name: "Fractionator" },
    { number: "G-3004", name: "H2 System" },
  ],
  CCR: [
    { number: "G-4001", name: "CCR Overview" },
    { number: "G-4002", name: "Reactor Train" },
    { number: "G-4003", name: "Regenerator" },
    { number: "G-4004", name: "Net Gas" },
  ],
  DHT: [
    { number: "G-5001", name: "DHT Overview" },
    { number: "G-5002", name: "Reactor" },
    { number: "G-5003", name: "Stripper" },
  ],
  NHT: [
    { number: "G-6001", name: "NHT Overview" },
    { number: "G-6002", name: "Reactor" },
    { number: "G-6003", name: "Splitter" },
  ],
  Utilities: [
    { number: "G-9001", name: "Steam System" },
    { number: "G-9002", name: "Cooling Water" },
    { number: "G-9003", name: "Fuel Gas" },
  ],
}

export function generateTrendData(
  tags: string[],
  fromDate: string,
  toDate: string,
): { time: string; values: Record<string, number> }[] {
  const data: { time: string; values: Record<string, number> }[] = []
  const start = new Date(fromDate)
  const end = new Date(toDate)
  const diffHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))
  const points = Math.min(24, diffHours)

  for (let i = 0; i < points; i++) {
    const time = new Date(start.getTime() + (i / points) * (end.getTime() - start.getTime()))
    const values: Record<string, number> = {}
    tags.forEach((tag) => {
      const baseValue = tag.startsWith("TI") ? 350 : tag.startsWith("PI") ? 15 : tag.startsWith("FI") ? 1000 : 50
      values[tag] = baseValue + (Math.random() - 0.5) * baseValue * 0.1
    })
    data.push({ time: time.toISOString(), values })
  }
  return data
}

export function getDCSScreenData(unit: string, graphicNumber: string, timestamp: string): Record<string, number> {
  const tags = AVAILABLE_TAGS[unit] || []
  const data: Record<string, number> = {}
  tags.forEach((tag) => {
    const baseValue = tag.startsWith("TI") ? 350 : tag.startsWith("PI") ? 15 : tag.startsWith("FI") ? 1000 : 50
    data[tag] = baseValue + (Math.random() - 0.5) * baseValue * 0.05
  })
  return data
}
