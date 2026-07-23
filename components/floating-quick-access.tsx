"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp, LayoutGrid, LineChart, Plus, X, Search, Bookmark, Trash2,
  ChevronRight, Tag, Save, Layers, FolderPlus, Check, Eye, Monitor, Bell, Settings,
  Factory, AlertTriangle, ChevronDown, Folder, FolderOpen, ChevronUp, MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AVAILABLE_TAGS, DCS_GRAPHICS } from "@/lib/process-data"
import { savePersonalizedAlarm } from "@/lib/personalized-alarms"

// --- Types ---
interface TrendGroup {
  id: string
  name: string
  tags: string[]
  unit: string
  updatedAt: string
  folderId?: string  // which folder it belongs to
}

interface TrendFolder {
  id: string
  name: string
  unit?: string
  color?: string
  expanded?: boolean
}

interface DashboardItem {
  id: string
  name: string
  widgets: number
  unit: string
  updatedAt: string
  description: string
}

// --- Initial Data ---
const INITIAL_FOLDERS: TrendFolder[] = [
  { id: "folder-vdu-ejector", name: "VDU Ejector 관련", unit: "VDU", color: "blue", expanded: true },
  { id: "folder-hcr-reactor", name: "HCR Reactor 모니터링", unit: "HCR", color: "amber", expanded: false },
  { id: "folder-cdu-feed", name: "CDU Feed 계통", unit: "CDU", color: "green", expanded: false },
]

const INITIAL_TREND_GROUPS: TrendGroup[] = [
  // VDU Ejector folder
  { id: "tg-vdu-1", name: "Ejector Pressure", tags: ["PI-2001", "PI-2002", "PI-2003"], unit: "VDU", updatedAt: "2026-02-20", folderId: "folder-vdu-ejector" },
  { id: "tg-vdu-2", name: "Ejector Steam Flow", tags: ["FI-2001", "FI-2002"], unit: "VDU", updatedAt: "2026-02-18", folderId: "folder-vdu-ejector" },
  { id: "tg-vdu-3", name: "Vacuum Column Top Temp", tags: ["TI-2001", "TI-2002", "TI-2003"], unit: "VDU", updatedAt: "2026-02-17", folderId: "folder-vdu-ejector" },
  // HCR Reactor folder
  { id: "tg-1", name: "HCR Reactor 온도 모니터링", tags: ["TI-3001", "TI-3002", "TI-3003", "TI-3004"], unit: "HCR", updatedAt: "2026-02-20", folderId: "folder-hcr-reactor" },
  { id: "tg-4", name: "HCR 수소 계통", tags: ["FI-3001", "PI-3001", "TIC-3001"], unit: "HCR", updatedAt: "2026-02-14", folderId: "folder-hcr-reactor" },
  // CDU Feed folder
  { id: "tg-3", name: "CDU Feed 유량 트래킹", tags: ["FI-1001", "TI-1001", "PI-1001"], unit: "CDU", updatedAt: "2026-02-15", folderId: "folder-cdu-feed" },
  // Ungrouped
  { id: "tg-2", name: "VDU 감압탑 압력/온도", tags: ["TI-2001", "TI-2002", "PI-2001", "LI-2001"], unit: "VDU", updatedAt: "2026-02-18" },
]

const INITIAL_DASHBOARDS: DashboardItem[] = [
  { id: "db-1", name: "HCR 일일 운전 현황판", widgets: 8, unit: "HCR", updatedAt: "2026-02-19", description: "Reactor 온도/압력, 유량, 촉매 성능 종합" },
  { id: "db-2", name: "VDU 에너지 효율 대시보드", widgets: 6, unit: "VDU", updatedAt: "2026-02-17", description: "감압탑 에너지 소비, 열회수율 추적" },
  { id: "db-3", name: "공정간 유틸리티 비교", widgets: 10, unit: "전체", updatedAt: "2026-02-16", description: "Steam/전기/냉각수 사용량 공정간 비교" },
]

// --- Trend Generation ---
function generateTagTrend(tagId: string, points = 48) {
  const seed = tagId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
  const prefix = tagId.substring(0, 2)
  let base: number, range: number, unit: string, high: number | null, low: number | null
  if (prefix === "TI") { base = 280 + (seed % 120); range = 15; unit = "deg.C"; high = base + 20; low = base - 30 }
  else if (prefix === "PI") { base = 8 + (seed % 20); range = 2; unit = "kg/cm2"; high = base + 4; low = base - 2 }
  else if (prefix === "FI") { base = 500 + (seed % 1000); range = 50; unit = "m3/h"; high = base + 80; low = base - 80 }
  else if (prefix === "LI") { base = 50; range = 10; unit = "%"; high = 80; low = 20 }
  else { base = 100 + (seed % 200); range = 20; unit = ""; high = null; low = null }
  const values = Array.from({ length: points }, (_, i) => +(base + (rand(seed + i * 7) * range * 2 - range)).toFixed(1))
  return { values, unit, high, low, current: values[values.length - 1] }
}

// --- Chart Components ---
function TrendChart({ values, high, low, color = "#6366f1", isAlert = false, height = "h-28" }: {
  values: number[]; high: number | null; low: number | null; color?: string; isAlert?: boolean; height?: string
}) {
  const allVals = [...values, ...(high ? [high] : []), ...(low ? [low] : [])]
  const maxV = Math.max(...allVals) * 1.02
  const minV = Math.min(...allVals) * 0.98
  const range = maxV - minV || 1
  const W = 500, H = 140
  const pad = { t: 10, b: 10, l: 6, r: 6 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch

  const pathD = values.reduce((acc, v, i) => {
    const x = toX(i), y = toY(v)
    if (i === 0) return `M ${x} ${y}`
    const px = toX(i - 1), py = toY(values[i - 1]), cpx = (px + x) / 2
    return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
  }, "")

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", height)} preserveAspectRatio="xMidYMid meet">
      {high && <line x1={pad.l} y1={toY(high)} x2={W - pad.r} y2={toY(high)} stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" />}
      {low && <line x1={pad.l} y1={toY(low)} x2={W - pad.r} y2={toY(low)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />}
      <path d={`${pathD} L ${toX(values.length - 1)} ${pad.t + ch} L ${toX(0)} ${pad.t + ch} Z`} fill={color} opacity="0.06" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={toX(values.length - 1)} cy={toY(values[values.length - 1])} r={3} fill={isAlert ? "#ef4444" : color} stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

function OverlayTrendChart({ tags, colors }: { tags: { tag: string; values: number[]; high: number | null; low: number | null }[]; colors: string[] }) {
  const allValues = tags.flatMap(t => [...t.values, ...(t.high ? [t.high] : []), ...(t.low ? [t.low] : [])])
  const maxV = Math.max(...allValues) * 1.02
  const minV = Math.min(...allValues) * 0.98
  const range = maxV - minV || 1
  const W = 700, H = 300
  const pad = { t: 16, b: 24, l: 50, r: 16 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const toX = (i: number, len: number) => pad.l + (i / (len - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch

  // Y-axis labels
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + (range * i) / 4)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis grid + labels */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} y1={toY(v)} x2={W - pad.r} y2={toY(v)} stroke="currentColor" strokeOpacity={0.06} />
          <text x={pad.l - 6} y={toY(v) + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{v.toFixed(0)}</text>
        </g>
      ))}
      {/* Each tag line */}
      {tags.map((t, idx) => {
        const pathD = t.values.reduce((acc, v, i) => {
          const x = toX(i, t.values.length), y = toY(v)
          if (i === 0) return `M ${x} ${y}`
          const px = toX(i - 1, t.values.length), py = toY(t.values[i - 1]), cpx = (px + x) / 2
          return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
        }, "")
        const color = colors[idx % colors.length]
        return (
          <g key={t.tag}>
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.85} />
            <circle cx={toX(t.values.length - 1, t.values.length)} cy={toY(t.values[t.values.length - 1])} r={4} fill={color} stroke="white" strokeWidth="1.5" />
          </g>
        )
      })}
      {/* Limit lines from first tag */}
      {tags[0]?.high && <line x1={pad.l} y1={toY(tags[0].high)} x2={W - pad.r} y2={toY(tags[0].high)} stroke="#f87171" strokeWidth="1" strokeDasharray="6 3" opacity={0.6} />}
      {tags[0]?.low && <line x1={pad.l} y1={toY(tags[0].low)} x2={W - pad.r} y2={toY(tags[0].low)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="6 3" opacity={0.6} />}
    </svg>
  )
}

const COLORS = ["#6366f1", "#0d9488", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#10b981"]

// DCS screen -> tag mapping (which tags appear on each DCS graphic)
const DCS_SCREEN_TAGS: Record<string, string[]> = {
  "G-1001": ["TI-1001", "TI-1002", "PI-1001", "FI-1001", "LI-1001", "TIC-1001", "PIC-1001", "FIC-1001"],
  "G-1002": ["TI-1001", "TI-1002", "PI-1001", "LI-1001", "TIC-1001"],
  "G-1003": ["TI-1001", "TI-1002", "FI-1001"],
  "G-1004": ["TI-1001", "PI-1001", "FI-1001", "TIC-1001", "FIC-1001"],
  "G-2001": ["TI-2001", "TI-2002", "PI-2001", "FI-2001", "LI-2001", "TIC-2001", "PIC-2001", "FIC-2001"],
  "G-2002": ["TI-2001", "TI-2002", "PI-2001", "LI-2001"],
  "G-2003": ["PI-2001", "TI-2001", "TIC-2001"],
  "G-2004": ["TI-2002", "FI-2001", "LI-2001", "FIC-2001"],
  "G-3001": ["TI-3001", "TI-3002", "PI-3001", "FI-3001", "LI-3001", "TIC-3001", "PIC-3001", "FIC-2001"],
  "G-3002": ["TI-3001", "TI-3002", "PI-3001", "TIC-3001"],
  "G-3003": ["TI-3001", "TI-3002", "FI-3001", "LI-3001"],
  "G-3004": ["PI-3001", "FI-3001", "PIC-3001", "FIC-2001"],
  "G-4001": ["TI-4001", "TI-4002", "PI-4001", "FI-4001", "LI-4001", "TIC-4001", "PIC-4001", "FIC-2001"],
  "G-4002": ["TI-4001", "TI-4002", "PI-4001", "TIC-4001"],
  "G-4003": ["TI-4002", "PI-4001", "FI-4001", "LI-4001"],
  "G-4004": ["FI-4001", "PI-4001", "PIC-4001", "FIC-2001"],
  "G-5001": ["TI-5001", "TI-5002", "PI-5001", "FI-5001", "LI-5001", "TIC-5001", "PIC-5001", "FIC-2001"],
  "G-5002": ["TI-5001", "TI-5002", "PI-5001", "TIC-5001"],
  "G-5003": ["TI-5002", "FI-5001", "LI-5001"],
  "G-6001": ["TI-6001", "TI-6002", "PI-6001", "FI-6001", "LI-6001", "TIC-6001", "PIC-6001", "FIC-2001"],
  "G-6002": ["TI-6001", "TI-6002", "PI-6001", "TIC-6001"],
  "G-6003": ["TI-6002", "FI-6001", "LI-6001"],
  "G-9001": ["TI-9001", "PI-9001", "FI-9001", "TIC-9001"],
  "G-9002": ["PI-9001", "FI-9001", "LI-9001", "PIC-9001"],
  "G-9003": ["FI-9001", "PI-9001"],
}

// Equipment Hierarchy for process-based selection
interface EquipmentNode { id: string; name: string; tags: string[] }
interface ZoneNode { id: string; name: string; equipment: EquipmentNode[] }
interface ProcessNode { id: string; name: string; zones: ZoneNode[] }

const EQUIPMENT_HIERARCHY: ProcessNode[] = [
  {
    id: "CDU", name: "CDU", zones: [
      { id: "CDU-PRE", name: "Pre-heat Train", equipment: [
        { id: "E-101", name: "E-101 Crude/PA Exchanger", tags: ["TI-1001", "TI-1002"] },
        { id: "E-102", name: "E-102 Crude/Residue Exchanger", tags: ["TI-1001", "PI-1001"] },
      ]},
      { id: "CDU-COL", name: "Atmospheric Column", equipment: [
        { id: "C-101", name: "C-101 Atmospheric Tower", tags: ["TI-1001", "TI-1002", "PI-1001", "LI-1001"] },
        { id: "C-102", name: "C-102 Stabilizer", tags: ["TI-1002", "FI-1001", "LI-1001"] },
      ]},
      { id: "CDU-FUR", name: "Furnace Section", equipment: [
        { id: "H-101", name: "H-101 Crude Heater", tags: ["TI-1001", "TI-1002", "FI-1001"] },
      ]},
    ]
  },
  {
    id: "VDU", name: "VDU", zones: [
      { id: "VDU-COL", name: "Vacuum Column", equipment: [
        { id: "C-201", name: "C-201 Vacuum Tower", tags: ["TI-2001", "TI-2002", "PI-2001", "LI-2001"] },
      ]},
      { id: "VDU-EJC", name: "Ejector System", equipment: [
        { id: "J-201", name: "J-201 Steam Ejector", tags: ["PI-2001", "FI-2001"] },
        { id: "E-201", name: "E-201 Overhead Condenser", tags: ["TI-2001", "FI-2001"] },
      ]},
    ]
  },
  {
    id: "HCR", name: "HCR", zones: [
      { id: "HCR-1ST", name: "1st Stage Reactor", equipment: [
        { id: "C-301", name: "C-301 1st Stage Reactor", tags: ["TI-3001", "TI-3002", "PI-3001", "FI-3001"] },
        { id: "C-103", name: "C-103 Guard Reactor", tags: ["TI-3001", "PI-3001", "FI-3001"] },
        { id: "E-301", name: "E-301 Feed/Effluent Exchanger", tags: ["TI-3001", "TI-3002"] },
      ]},
      { id: "HCR-2ND", name: "2nd Stage Reactor", equipment: [
        { id: "C-302", name: "C-302 2nd Stage Reactor", tags: ["TI-3002", "TI-3003", "PI-3001", "FI-3002"] },
        { id: "E-302", name: "E-302 Inter-stage Cooler", tags: ["TI-3002", "FI-3001"] },
      ]},
      { id: "HCR-FRAC", name: "Fractionator", equipment: [
        { id: "C-303", name: "C-303 Product Fractionator", tags: ["TI-3003", "PI-3001", "LI-3001", "FI-3001"] },
      ]},
      { id: "HCR-H2", name: "H2 System", equipment: [
        { id: "K-301", name: "K-301 Recycle Compressor", tags: ["PI-3001", "FI-3002"] },
        { id: "D-301", name: "D-301 HP Separator", tags: ["LI-3001", "PI-3001", "TI-3001"] },
      ]},
    ]
  },
  {
    id: "CCR", name: "CCR", zones: [
      { id: "CCR-RXR", name: "Reactor Section", equipment: [
        { id: "C-401", name: "C-401 Reforming Reactor #1", tags: ["TI-4001", "TI-4002", "PI-4001"] },
        { id: "C-402", name: "C-402 Reforming Reactor #2", tags: ["TI-4002", "PI-4001", "FI-4001"] },
      ]},
      { id: "CCR-REG", name: "Regenerator", equipment: [
        { id: "R-401", name: "R-401 Catalyst Regenerator", tags: ["TI-4001", "PI-4001", "FI-4001"] },
      ]},
    ]
  },
  {
    id: "DHT", name: "DHT", zones: [
      { id: "DHT-RXR", name: "Reactor Section", equipment: [
        { id: "C-501", name: "C-501 DHT Reactor", tags: ["TI-5001", "TI-5002", "PI-5001", "FI-5001"] },
      ]},
      { id: "DHT-SEP", name: "Separator Section", equipment: [
        { id: "D-501", name: "D-501 HP Separator", tags: ["LI-5001", "PI-5001", "TI-5001"] },
        { id: "D-502", name: "D-502 LP Separator", tags: ["LI-5001", "PI-5001"] },
      ]},
    ]
  },
  {
    id: "NHT", name: "NHT", zones: [
      { id: "NHT-RXR", name: "Reactor Section", equipment: [
        { id: "C-601", name: "C-601 NHT Reactor", tags: ["TI-6001", "TI-6002", "PI-6001", "FI-6001"] },
      ]},
      { id: "NHT-STAB", name: "Stabilizer", equipment: [
        { id: "C-602", name: "C-602 Stabilizer Column", tags: ["TI-6001", "LI-6001", "PI-6001"] },
      ]},
    ]
  },
  {
    id: "Utilities", name: "Utilities", zones: [
      { id: "UTL-STM", name: "Steam System", equipment: [
        { id: "B-901", name: "B-901 Boiler", tags: ["TI-9001", "PI-9001", "FI-9001"] },
      ]},
      { id: "UTL-CW", name: "Cooling Water", equipment: [
        { id: "CT-901", name: "CT-901 Cooling Tower", tags: ["TI-9001", "FI-9001"] },
      ]},
    ]
  },
]

const MAX_TAGS_PER_GROUP = 10

// DCS screen layout: tag positions (%) + equipment shapes for visual schematic
type TagPoint = { tag: string; x: number; y: number; type: "T" | "P" | "F" | "L" | "C" }
type Equipment = { id: string; label: string; x: number; y: number; w: number; h: number; shape: "column" | "vessel" | "exchanger" | "pump" | "furnace" | "drum" }
type PipeLine = { from: [number, number]; to: [number, number] }
type ScreenLayout = { tags: TagPoint[]; equipment: Equipment[]; pipes: PipeLine[] }

function getTagType(tag: string): "T" | "P" | "F" | "L" | "C" {
  if (tag.startsWith("TI")) return "T"
  if (tag.startsWith("PI")) return "P"
  if (tag.startsWith("FI")) return "F"
  if (tag.startsWith("LI")) return "L"
  return "C" // controller
}

function buildScreenLayout(screenNumber: string): ScreenLayout {
  const tags = DCS_SCREEN_TAGS[screenNumber] || []
  const isOverview = screenNumber.endsWith("001")
  const tagCount = tags.length

  // Generate deterministic positions based on screen + tag
  const equipment: Equipment[] = []
  const pipes: PipeLine[] = []
  const tagPoints: TagPoint[] = []

  if (isOverview) {
    // Overview screens: wide layout with multiple equipment
    equipment.push(
      { id: "col-1", label: "Column", x: 15, y: 20, w: 10, h: 50, shape: "column" },
      { id: "hx-1", label: "Exchanger", x: 40, y: 25, w: 14, h: 12, shape: "exchanger" },
      { id: "drum-1", label: "Drum", x: 60, y: 20, w: 12, h: 16, shape: "drum" },
      { id: "pump-1", label: "Pump", x: 75, y: 55, w: 8, h: 8, shape: "pump" },
      { id: "furn-1", label: "Furnace", x: 80, y: 18, w: 12, h: 20, shape: "furnace" },
    )
    pipes.push(
      { from: [25, 35], to: [40, 31] },
      { from: [54, 31], to: [60, 28] },
      { from: [72, 28], to: [80, 28] },
      { from: [20, 70], to: [75, 59] },
      { from: [25, 55], to: [40, 55] },
    )
    // Distribute tags around equipment
    const positions = [
      { x: 12, y: 15 }, { x: 22, y: 45 }, { x: 18, y: 72 }, { x: 37, y: 20 },
      { x: 48, y: 42 }, { x: 58, y: 15 }, { x: 68, y: 38 }, { x: 82, y: 42 },
    ]
    tags.forEach((tag, i) => {
      const pos = positions[i % positions.length]
      tagPoints.push({ tag, x: pos.x + (i * 2) % 5, y: pos.y + (i * 3) % 5, type: getTagType(tag) })
    })
  } else {
    // Detail screens: focused layout
    equipment.push(
      { id: "main-eq", label: "Equipment", x: 30, y: 22, w: 16, h: 40, shape: "column" },
      { id: "hx-2", label: "HX", x: 62, y: 28, w: 14, h: 12, shape: "exchanger" },
      { id: "pump-2", label: "P", x: 70, y: 60, w: 8, h: 8, shape: "pump" },
    )
    pipes.push(
      { from: [46, 35], to: [62, 34] },
      { from: [46, 50], to: [70, 64] },
      { from: [38, 62], to: [38, 75] },
    )
    const positions = [
      { x: 25, y: 18 }, { x: 42, y: 28 }, { x: 28, y: 55 }, { x: 55, y: 22 },
      { x: 68, y: 45 }, { x: 78, y: 55 }, { x: 50, y: 65 }, { x: 15, y: 40 },
    ]
    tags.forEach((tag, i) => {
      const pos = positions[i % positions.length]
      tagPoints.push({ tag, x: pos.x + (i * 3) % 7, y: pos.y + (i * 2) % 6, type: getTagType(tag) })
    })
  }

  return { tags: tagPoints, equipment, pipes }
}

const TAG_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  T: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", label: "Temperature" },
  P: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", label: "Pressure" },
  F: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", label: "Flow" },
  L: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", label: "Level" },
  C: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", label: "Controller" },
}

// find which unit a tag belongs to
function findTagUnit(tag: string): string | null {
  for (const [unit, tags] of Object.entries(AVAILABLE_TAGS)) {
    if (tags.includes(tag)) return unit
  }
  return null
}

export function FloatingQuickAccess() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<"menu" | "trend" | "saved-trends" | "dashboards" | "personalized-alarm">("menu")

  // --- 1) Trend Viewer State (always fresh) ---
  const [trendTab, setTrendTab] = useState<"basic" | "process" | "dcs">("basic")
  const [tagInput, setTagInput] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"individual" | "overlay">("individual")

  // --- DCS tab state ---
  const [dcsTagInput, setDcsTagInput] = useState("")
  const [dcsSuggestions, setDcsSuggestions] = useState<string[]>([])
  const [dcsInitialTag, setDcsInitialTag] = useState<string | null>(null)
  const [dcsUnit, setDcsUnit] = useState<string | null>(null)
  const [dcsScreens, setDcsScreens] = useState<{ number: string; name: string }[]>([])
  const [dcsSelectedScreen, setDcsSelectedScreen] = useState<string | null>(null)
  const [dcsScreenTags, setDcsScreenTags] = useState<string[]>([])
  const [dcsSelectedTags, setDcsSelectedTags] = useState<string[]>([])
  const [dcsShowTrend, setDcsShowTrend] = useState(false)

  // --- Process tab state ---
  const [procProcess, setProcProcess] = useState<string>("")
  const [procZone, setProcZone] = useState<string>("")
  const [procSelectedEquipment, setProcSelectedEquipment] = useState<string[]>([]) // multi-select equipment IDs
  const [procShowTrend, setProcShowTrend] = useState(false)
  const [procTagWarnings, setProcTagWarnings] = useState<Record<string, boolean>>({}) // equipment id -> dismissed

  // --- Save dialog state ---
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new")
  const [newGroupName, setNewGroupName] = useState("")
  const [saveTargetId, setSaveTargetId] = useState("")
  const [savedMsg, setSavedMsg] = useState("")

  // --- 2) Saved Trend Groups (mutable) ---
  const [trendGroups, setTrendGroups] = useState<TrendGroup[]>(INITIAL_TREND_GROUPS)
  const [trendFolders, setTrendFolders] = useState<TrendFolder[]>(INITIAL_FOLDERS)
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newGroupFormName, setNewGroupFormName] = useState("")
  const [newGroupFormUnit, setNewGroupFormUnit] = useState("")
  const [newGroupFormTags, setNewGroupFormTags] = useState("")
  const [newGroupFormFolder, setNewGroupFormFolder] = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderUnit, setNewFolderUnit] = useState("")
  const [selectedFolderGroups, setSelectedFolderGroups] = useState<string[]>([])
  const [loadedFromSaved, setLoadedFromSaved] = useState(false) // Track if we loaded from saved trends
  const [loadedGroupsInfo, setLoadedGroupsInfo] = useState<{name: string; tags: string[]}[]>([]) // Store loaded groups info for display

  // --- 3) Dashboard state ---
  const [dashboards] = useState<DashboardItem[]>(INITIAL_DASHBOARDS)
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardItem | null>(null)

  // --- 4) Personalized Alarm State ---
  const [paTagInput, setPaTagInput] = useState("")
  const [paSuggestions, setPaSuggestions] = useState<string[]>([])
  const [paSelectedTag, setPaSelectedTag] = useState("")
  const [paMin, setPaMin] = useState("")
  const [paMax, setPaMax] = useState("")
  const [paUnit, setPaUnit] = useState("")
  const [paDescription, setPaDescription] = useState("")
  const [paSavedMsg, setPaSavedMsg] = useState("")
  const [paShowScreenTags, setPaShowScreenTags] = useState(false)

  // Context ref for saving back from trend
  const [fromGroupName, setFromGroupName] = useState<string | null>(null)

  // All available tags
  const allTags = useMemo(() => {
    const tags: string[] = []
    Object.values(AVAILABLE_TAGS).forEach(unitTags => {
      unitTags.forEach(tag => { if (!tags.includes(tag)) tags.push(tag) })
    })
    return tags.sort()
  }, [])

  const handleTagInput = useCallback((value: string) => {
    setTagInput(value)
    if (value.length > 0) {
      setSuggestions(allTags.filter(t => t.toLowerCase().includes(value.toLowerCase()) && !activeTags.includes(t)).slice(0, 8))
    } else {
      setSuggestions([])
    }
  }, [allTags, activeTags])

  const addTag = useCallback((tag: string) => {
    if (!activeTags.includes(tag)) setActiveTags(prev => [...prev, tag])
    setTagInput(""); setSuggestions([])
  }, [activeTags])

  const removeTag = useCallback((tag: string) => { setActiveTags(prev => prev.filter(t => t !== tag)) }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const exact = allTags.find(t => t.toLowerCase() === tagInput.trim().toLowerCase())
      if (exact) addTag(exact)
      else if (suggestions.length > 0) addTag(suggestions[0])
    }
  }, [tagInput, suggestions, allTags, addTag])

  // --- DCS tab handlers ---
  const handleDcsTagInput = useCallback((value: string) => {
    setDcsTagInput(value)
    if (value.length > 0) {
      setDcsSuggestions(allTags.filter(t => t.toLowerCase().includes(value.toLowerCase())).slice(0, 8))
    } else {
      setDcsSuggestions([])
    }
  }, [allTags])

  const handleDcsTagSelect = useCallback((tag: string) => {
    setDcsTagInput("")
    setDcsSuggestions([])
    setDcsInitialTag(tag)
    const unit = findTagUnit(tag)
    setDcsUnit(unit)
    if (unit && DCS_GRAPHICS[unit]) {
      // filter screens that contain this tag
      const screens = DCS_GRAPHICS[unit].filter(s => DCS_SCREEN_TAGS[s.number]?.includes(tag))
      setDcsScreens(screens.length > 0 ? screens : DCS_GRAPHICS[unit])
    } else {
      setDcsScreens([])
    }
    setDcsSelectedScreen(null)
    setDcsScreenTags([])
    setDcsSelectedTags([])
    setDcsShowTrend(false)
  }, [])

  const handleDcsScreenSelect = useCallback((screenNumber: string) => {
    setDcsSelectedScreen(screenNumber)
    const tags = DCS_SCREEN_TAGS[screenNumber] || []
    setDcsScreenTags(tags)
    // auto-select initial tag
    setDcsSelectedTags(dcsInitialTag && tags.includes(dcsInitialTag) ? [dcsInitialTag] : [])
    setDcsShowTrend(false)
  }, [dcsInitialTag])

  const toggleDcsTag = useCallback((tag: string) => {
    setDcsSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }, [])

  const handleDcsKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && dcsTagInput.trim()) {
      const exact = allTags.find(t => t.toLowerCase() === dcsTagInput.trim().toLowerCase())
      if (exact) handleDcsTagSelect(exact)
      else if (dcsSuggestions.length > 0) handleDcsTagSelect(dcsSuggestions[0])
    }
  }, [dcsTagInput, dcsSuggestions, allTags, handleDcsTagSelect])

  const resetDcsState = useCallback(() => {
    setDcsTagInput(""); setDcsSuggestions([]); setDcsInitialTag(null); setDcsUnit(null)
    setDcsScreens([]); setDcsSelectedScreen(null); setDcsScreenTags([]); setDcsSelectedTags([]); setDcsShowTrend(false)
  }, [])

  // DCS selected tag trends
  const dcsTagTrends = useMemo(() => dcsSelectedTags.map(tag => ({ tag, ...generateTagTrend(tag) })), [dcsSelectedTags])

  // --- Process tab helpers ---
  const procProcessNode = EQUIPMENT_HIERARCHY.find(p => p.id === procProcess)
  const procZoneNode = procProcessNode?.zones.find(z => z.id === procZone)

  // Equipment groups with their tags (multi-select)
  const procEquipmentGroups = useMemo(() => {
    if (!procZoneNode) return []
    return procSelectedEquipment.map(eqId => {
      const eq = procZoneNode.equipment.find(e => e.id === eqId)
      if (!eq) return null
      return { equipment: eq, trends: eq.tags.map(tag => ({ tag, ...generateTagTrend(tag) })) }
    }).filter(Boolean) as { equipment: EquipmentNode; trends: { tag: string; values: number[]; unit: string; high: number | null; low: number | null; current: number }[] }[]
  }, [procZoneNode, procSelectedEquipment])

  const toggleProcEquipment = useCallback((eqId: string) => {
    setProcSelectedEquipment(prev => {
      if (prev.includes(eqId)) return prev.filter(id => id !== eqId)
      return [...prev, eqId]
    })
    setProcShowTrend(false)
  }, [])

  const procAllTags = useMemo(() => procEquipmentGroups.flatMap(g => g.equipment.tags), [procEquipmentGroups])

  const resetProcState = useCallback(() => {
    setProcProcess(""); setProcZone(""); setProcSelectedEquipment([]); setProcShowTrend(false); setProcTagWarnings({})
  }, [])

  // --- Requirement 1: Always start fresh ---
  const openTrendFresh = () => {
    setActiveTags([])
    setTagInput("")
    setSuggestions([])
    setViewMode("individual")
    setFromGroupName(null)
    setSavedMsg("")
    setTrendTab("basic")
    resetDcsState()
    resetProcState()
    setLoadedFromSaved(false)
    setLoadedGroupsInfo([])
    setActivePanel("trend")
  }

  const openTrendWithTags = (tags: string[], groupName: string | null) => {
    setActiveTags(tags)
    setTagInput("")
    setSuggestions([])
    setViewMode("individual")
    setFromGroupName(groupName)
    setSavedMsg("")
    setActivePanel("trend")
  }

  // --- Personalized Alarm Handlers ---
  const handlePaTagInput = useCallback((value: string) => {
    setPaTagInput(value)
    if (value.length > 0) {
      setPaSuggestions(allTags.filter(t => t.toLowerCase().includes(value.toLowerCase())).slice(0, 8))
    } else {
      setPaSuggestions([])
    }
  }, [allTags])

  const handlePaTagSelect = useCallback((tag: string) => {
    setPaSelectedTag(tag)
    setPaTagInput(tag)
    setPaSuggestions([])
    // auto-detect unit from tag prefix
    const prefix = tag.substring(0, 2)
    if (prefix === "TI") setPaUnit("\u00b0C")
    else if (prefix === "PI") setPaUnit("kg/cm\u00b2")
    else if (prefix === "FI") setPaUnit("m\u00b3/h")
    else if (prefix === "LI") setPaUnit("%")
    else setPaUnit("")
  }, [])

  const handlePaSave = useCallback(() => {
    if (!paSelectedTag) return
    savePersonalizedAlarm({
      tagId: paSelectedTag,
      tagDescription: paDescription || undefined,
      min: paMin ? parseFloat(paMin) : undefined,
      max: paMax ? parseFloat(paMax) : undefined,
      unit: paUnit || "",
      source: "manual",
    })
    setPaSavedMsg(`"${paSelectedTag}" 개인화 알림이 등록되었습니다.`)
    setPaSelectedTag("")
    setPaTagInput("")
    setPaMin("")
    setPaMax("")
    setPaUnit("")
    setPaDescription("")
    setPaShowScreenTags(false)
    setTimeout(() => setPaSavedMsg(""), 3000)
  }, [paSelectedTag, paMin, paMax, paUnit, paDescription])

  const openPersonalizedAlarm = () => {
    setPaTagInput("")
    setPaSuggestions([])
    setPaSelectedTag("")
    setPaMin("")
    setPaMax("")
    setPaUnit("")
    setPaDescription("")
    setPaSavedMsg("")
    setPaShowScreenTags(false)
    setActivePanel("personalized-alarm")
  }

const handleClose = () => {
  setIsOpen(false)
  setActivePanel("menu")
  setSelectedDashboard(null)
  setShowSaveDialog(false)
  setShowNewGroupDialog(false)
  setSavedMsg("")
  resetDcsState()
  setLoadedFromSaved(false)
  setLoadedGroupsInfo([])
  }

  // --- Save trend to group ---
  const handleSaveTrend = () => {
    const tagsToSave = trendTab === "dcs" ? [...dcsSelectedTags] : trendTab === "process" ? [...procAllTags] : [...activeTags]
    const unitLabel = trendTab === "dcs" && dcsUnit ? dcsUnit : trendTab === "process" && procProcess ? procProcess : "사용자"
    if (saveMode === "new" && newGroupName.trim()) {
      const ng: TrendGroup = {
        id: `tg-${Date.now()}`,
        name: newGroupName.trim(),
        tags: tagsToSave,
        unit: unitLabel,
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      setTrendGroups(prev => [ng, ...prev])
      setShowSaveDialog(false)
      setSavedMsg(`"${ng.name}" 묶음이 생성되었습니다.`)
      setNewGroupName("")
    } else if (saveMode === "existing" && saveTargetId) {
      setTrendGroups(prev => prev.map(g => {
        if (g.id === saveTargetId) {
          const merged = Array.from(new Set([...g.tags, ...tagsToSave]))
          return { ...g, tags: merged, updatedAt: new Date().toISOString().slice(0, 10) }
        }
        return g
      }))
      const target = trendGroups.find(g => g.id === saveTargetId)
      setShowSaveDialog(false)
      setSavedMsg(`"${target?.name}" 묶음에 추가되었습니다.`)
    }
  }

  // --- Create new group in saved-trends ---
  const handleCreateGroup = () => {
    if (!newGroupFormName.trim()) return
    const tags = newGroupFormTags.split(",").map(t => t.trim()).filter(Boolean)
    const ng: TrendGroup = {
      id: `tg-${Date.now()}`,
      name: newGroupFormName.trim(),
      tags,
      unit: newGroupFormUnit.trim() || "사용자",
      updatedAt: new Date().toISOString().slice(0, 10),
      folderId: newGroupFormFolder || undefined,
    }
    setTrendGroups(prev => [ng, ...prev])
    setShowNewGroupDialog(false)
    setNewGroupFormName(""); setNewGroupFormUnit(""); setNewGroupFormTags(""); setNewGroupFormFolder("")
  }

  const deleteGroup = (id: string) => { setTrendGroups(prev => prev.filter(g => g.id !== id)) }
  
  // --- Folder management ---
  const toggleFolder = (folderId: string) => {
    setTrendFolders(prev => prev.map(f => f.id === folderId ? { ...f, expanded: !f.expanded } : f))
  }
  
  const createFolder = () => {
    if (!newFolderName.trim()) return
    const newFolder: TrendFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      unit: newFolderUnit.trim() || undefined,
      expanded: true,
    }
    setTrendFolders(prev => [...prev, newFolder])
    setNewFolderName("")
    setNewFolderUnit("")
    setShowNewFolderDialog(false)
  }
  
  const deleteFolder = (folderId: string) => {
    // Move all groups in this folder to ungrouped
    setTrendGroups(prev => prev.map(g => g.folderId === folderId ? { ...g, folderId: undefined } : g))
    setTrendFolders(prev => prev.filter(f => f.id !== folderId))
  }
  
  // Get groups for a folder
  const getGroupsInFolder = (folderId: string) => trendGroups.filter(g => g.folderId === folderId)
  const ungroupedTrendGroups = trendGroups.filter(g => !g.folderId)
  
  // Open folder with all its groups
  const openFolderTrends = (folderId: string) => {
    const folderGroups = getGroupsInFolder(folderId)
    const allTags = folderGroups.flatMap(g => g.tags)
    const uniqueTags = Array.from(new Set(allTags))
    const folder = trendFolders.find(f => f.id === folderId)
    openTrendWithTags(uniqueTags, folder?.name || "폴더")
  }
  
  // Toggle selection of groups within folder for multi-load
  const toggleGroupSelection = (groupId: string) => {
    setSelectedFolderGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }
  
  // Load selected groups - now stores group info for display
  const loadSelectedGroups = () => {
    const selectedGroups = trendGroups.filter(g => selectedFolderGroups.includes(g.id))
    const allTags = selectedGroups.flatMap(g => g.tags)
    const uniqueTags = Array.from(new Set(allTags))
    // Store groups info for grouped display
    setLoadedGroupsInfo(selectedGroups.map(g => ({ name: g.name, tags: g.tags })))
    setLoadedFromSaved(true)
    setActiveTags(uniqueTags)
    setFromGroupName(`${selectedGroups.length}개 그룹`)
    setActivePanel("trend")
    setTrendTab("basic")
    setSelectedFolderGroups([])
  }
  
  // Back to saved trends
  const backToSavedTrends = () => {
    setActiveTags([])
    setLoadedGroupsInfo([])
    setLoadedFromSaved(false)
    setFromGroupName(null)
    setActivePanel("saved-trends")
  }
  
  // Open single group from saved trends
  const openSingleGroupTrend = (group: TrendGroup) => {
    setLoadedGroupsInfo([{ name: group.name, tags: group.tags }])
    setLoadedFromSaved(true)
    setActiveTags(group.tags)
    setFromGroupName(group.name)
    setActivePanel("trend")
    setTrendTab("basic")
  }

  // Tag trends
  const tagTrends = useMemo(() => activeTags.map(tag => ({ tag, ...generateTagTrend(tag) })), [activeTags])

  return (
    <>
      {/* ===== FAB Button ===== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer"
            size="icon"
          >
            <TrendingUp className="h-6 w-6" />
            <span className="sr-only">빠른 조회</span>
          </Button>
        )}

        {isOpen && activePanel === "menu" && (
          <Card className="w-64 shadow-2xl border-border animate-in fade-in slide-in-from-bottom-4 duration-200">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">빠른 조회</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-pointer" onClick={handleClose}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-1">
              <button onClick={openTrendFresh} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <LineChart className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">태그 트렌드 조회</p>
                  <p className="text-xs text-muted-foreground">태그 입력 후 즉시 트렌드 확인</p>
                </div>
              </button>
              <button onClick={() => setActivePanel("saved-trends")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Bookmark className="h-4 w-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">저장된 트렌드 묶음</p>
                  <p className="text-xs text-muted-foreground">사전 저장된 태그 그룹 조회</p>
                </div>
              </button>
              <button onClick={() => setActivePanel("dashboards")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                  <LayoutGrid className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">커스텀 대시보드</p>
                  <p className="text-xs text-muted-foreground">저장된 대시보드 바로 열기</p>
                </div>
              </button>
              <div className="border-t my-1" />
              <button onClick={openPersonalizedAlarm} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">개인화 알림 설정</p>
                  <p className="text-xs text-muted-foreground">변수 Min/Max 기반 알림 등록</p>
                </div>
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== 1) 태그 트렌드 조회 Dialog (Larger, with overlay/save) ===== */}
      <Dialog open={isOpen && activePanel === "trend"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[92vh] !max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                태그 트렌드 조회
                {trendTab === "basic" && fromGroupName && <Badge variant="secondary" className="ml-2 text-xs font-normal">{fromGroupName}</Badge>}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* View mode toggle (basic tab only) */}
                {trendTab === "basic" && activeTags.length >= 2 && (
                  <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setViewMode("individual")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      개별 보기
                    </button>
                    <button
                      onClick={() => setViewMode("overlay")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "overlay" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      겹쳐 보기
                    </button>
                  </div>
                )}
                {/* View mode toggle (DCS tab) */}
                {trendTab === "dcs" && dcsShowTrend && dcsSelectedTags.length >= 2 && (
                  <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setViewMode("individual")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      개별 보기
                    </button>
                    <button
                      onClick={() => setViewMode("overlay")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "overlay" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      겹쳐 보기
                    </button>
                  </div>
                )}
                {/* View mode toggle (process tab) */}
                {trendTab === "process" && procShowTrend && procEquipmentGroups.length > 0 && (
                  <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setViewMode("individual")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      개별 보기
                    </button>
                    <button
                      onClick={() => setViewMode("overlay")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "overlay" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      겹쳐 보기
                    </button>
                  </div>
                )}
                {/* Save button (process tab) */}
                {trendTab === "process" && procAllTags.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => { setShowSaveDialog(true); setSaveMode("new"); setNewGroupName(""); setSaveTargetId("") }}>
                    <Save className="h-3.5 w-3.5" />
                    트렌드 저장
                  </Button>
                )}
                {/* Save button (basic tab) */}
                {trendTab === "basic" && activeTags.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => { setShowSaveDialog(true); setSaveMode("new"); setNewGroupName(""); setSaveTargetId("") }}>
                    <Save className="h-3.5 w-3.5" />
                    트렌드 저장
                  </Button>
                )}
                {/* Save button (DCS tab) */}
                {trendTab === "dcs" && dcsSelectedTags.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => { setShowSaveDialog(true); setSaveMode("new"); setNewGroupName(""); setSaveTargetId("") }}>
                    <Save className="h-3.5 w-3.5" />
                    트렌드 저장
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 shrink-0 bg-muted/30">
            <button
              onClick={() => setTrendTab("basic")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                trendTab === "basic" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LineChart className="h-4 w-4" />
              기본 조회
            </button>
            <button
              onClick={() => setTrendTab("process")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                trendTab === "process" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Factory className="h-4 w-4" />
              공정 정보 기반 조회
            </button>
            <button
              onClick={() => setTrendTab("dcs")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                trendTab === "dcs" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="h-4 w-4" />
              DCS 화면 기반 조회
            </button>
          </div>

          {/* Saved confirmation */}
          {savedMsg && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 shrink-0">
              <Check className="h-4 w-4" />
              {savedMsg}
              <button onClick={() => setSavedMsg("")} className="ml-auto text-green-500 hover:text-green-700 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* ===== BASIC TAB ===== */}
          {trendTab === "basic" && (
            <>
          {/* Tag input */}
          <div className="space-y-2 shrink-0">
            {/* Back to saved trends button (when loaded from saved) */}
            {loadedFromSaved && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-teal-50 border border-teal-200 rounded-md text-xs">
                <Bookmark className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-teal-700">저장된 트렌드에서 불러옴</span>
                <Button variant="ghost" size="sm" className="h-6 ml-auto text-xs px-2 text-teal-700 hover:text-teal-900 hover:bg-teal-100 cursor-pointer" onClick={backToSavedTrends}>
                  저장 목록으로 돌아가기
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={tagInput}
                  onChange={(e) => handleTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="태그 ID를 입력하세요 (예: TI-3001)"
                  className="pl-9"
                  autoFocus
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 py-1 max-h-48 overflow-auto">
                    {suggestions.map(tag => (
                      <button key={tag} onClick={() => addTag(tag)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 cursor-pointer">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Load from saved trends button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs shrink-0 cursor-pointer"
                onClick={() => setActivePanel("saved-trends")}
              >
                <Bookmark className="h-3.5 w-3.5" />
                저장된 트렌드 가져오기
              </Button>
            </div>
            {activeTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeTags.map((tag, i) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1" style={{ borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                    <span className="font-mono text-xs">{tag}</span>
                    <button onClick={() => removeTag(tag)} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground cursor-pointer" onClick={() => { setActiveTags([]); setLoadedGroupsInfo([]); setLoadedFromSaved(false) }}>
                  전체 삭제
                </Button>
              </div>
            )}
          </div>

          {/* Trend display area */}
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            {activeTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">태그를 입력하여 트렌드를 확인하세요</p>
                <p className="text-xs text-muted-foreground max-w-sm">상단 검색창에 태그 ID를 입력하면 실시간 트렌드가 표시됩니다.</p>
              </div>
            ) : loadedGroupsInfo.length > 1 && viewMode === "individual" ? (
              /* ===== Grouped view (when multiple saved groups loaded) ===== */
              <div className="space-y-6 pb-4">
                {loadedGroupsInfo.map((group, groupIndex) => {
                  const groupTrends = group.tags.map(tag => ({ tag, ...generateTagTrend(tag) }))
                  const groupColorBase = groupIndex * 3
                  return (
                    <div key={group.name} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Bookmark className="h-4 w-4 text-teal-600" />
                        <h3 className="text-sm font-semibold">{group.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{group.tags.length}개 태그</Badge>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {groupTrends.map(({ tag, values, unit, high, low, current }, i) => {
                          const isViolation = (high !== null && current > high) || (low !== null && current < low)
                          return (
                            <Card key={tag} className={cn("overflow-hidden", isViolation && "border-red-200")}>
                              <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(groupColorBase + i) % COLORS.length] }} />
                                  <span className="font-mono text-sm font-semibold">{tag}</span>
                                  {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Limit 초과</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground">[{unit}]</span>
                              </div>
                              <div className="px-2">
                                <TrendChart values={values} high={high} low={low} color={COLORS[(groupColorBase + i) % COLORS.length]} isAlert={isViolation} height="h-28" />
                              </div>
                              <div className="px-3 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                                <div>
                                  <span className="text-muted-foreground">현재 </span>
                                  <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>{current} {unit}</span>
                                </div>
                                {high !== null && <div><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></div>}
                                {low !== null && <div><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></div>}
                                <div>
                                  <span className="text-muted-foreground">범위 </span>
                                  <span className="font-medium">{Math.min(...values).toFixed(1)} ~ {Math.max(...values).toFixed(1)}</span>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : viewMode === "overlay" ? (
              /* ===== Overlay view ===== */
              <div className="space-y-3 pb-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 px-1">
                  {tagTrends.map(({ tag, current, unit }, i) => (
                    <div key={tag} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-mono font-medium">{tag}</span>
                      <span className="text-muted-foreground">({current} {unit})</span>
                    </div>
                  ))}
                </div>
                <Card className="p-4">
                  <OverlayTrendChart tags={tagTrends} colors={COLORS} />
                </Card>
                {/* Summary table */}
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium">태그</th>
                      <th className="text-right px-3 py-2 font-medium">현재값</th>
                      <th className="text-right px-3 py-2 font-medium">단위</th>
                      <th className="text-right px-3 py-2 font-medium">High</th>
                      <th className="text-right px-3 py-2 font-medium">Low</th>
                      <th className="text-right px-3 py-2 font-medium">Min</th>
                      <th className="text-right px-3 py-2 font-medium">Max</th>
                    </tr></thead>
                    <tbody>
                      {tagTrends.map(({ tag, values, unit, high, low, current }, i) => (
                        <tr key={tag} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-1.5 font-mono font-medium flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {tag}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">{current}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">{unit}</td>
                          <td className="px-3 py-1.5 text-right text-red-500">{high ?? "-"}</td>
                          <td className="px-3 py-1.5 text-right text-blue-500">{low ?? "-"}</td>
                          <td className="px-3 py-1.5 text-right">{Math.min(...values).toFixed(1)}</td>
                          <td className="px-3 py-1.5 text-right">{Math.max(...values).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ===== Individual view ===== */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-4">
                {tagTrends.map(({ tag, values, unit, high, low, current }, i) => {
                  const isViolation = (high !== null && current > high) || (low !== null && current < low)
                  return (
                    <Card key={tag} className={cn("overflow-hidden", isViolation && "border-red-200")}>
                      <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-mono text-sm font-semibold">{tag}</span>
                          {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Limit 초과</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">[{unit}]</span>
                      </div>
                      <div className="px-2">
                        <TrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} isAlert={isViolation} height="h-28" />
                      </div>
                      <div className="px-3 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                        <div>
                          <span className="text-muted-foreground">현재 </span>
                          <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>{current} {unit}</span>
                        </div>
                        {high !== null && <div><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></div>}
                        {low !== null && <div><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></div>}
                        <div>
                          <span className="text-muted-foreground">범위 </span>
                          <span className="font-medium">{Math.min(...values).toFixed(1)} ~ {Math.max(...values).toFixed(1)}</span>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
            </>
          )}

          {/* ===== PROCESS TAB ===== */}
          {trendTab === "process" && (
            <>
              {/* Process/Zone/Equipment selection */}
              {!procShowTrend && (
                <div className="space-y-4 shrink-0">
                  {/* Step 1: Process */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">1. 공정 선택</p>
                    <div className="flex flex-wrap gap-1.5">
                      {EQUIPMENT_HIERARCHY.map(p => (
                        <button key={p.id} onClick={() => { setProcProcess(p.id); setProcZone(""); setProcSelectedEquipment([]); setProcTagWarnings({}) }}
                          className={cn("px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                            procProcess === p.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                          {p.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Zone */}
                  {procProcessNode && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">2. 구역 선택</p>
                      <div className="flex flex-wrap gap-1.5">
                        {procProcessNode.zones.map(z => (
                          <button key={z.id} onClick={() => { setProcZone(z.id); setProcSelectedEquipment([]); setProcTagWarnings({}) }}
                            className={cn("px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                              procZone === z.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                            {z.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Equipment (multi-select) */}
                  {procZoneNode && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">3. 설비 선택 <span className="text-primary">(다중 선택 가능)</span></p>
                      <div className="grid grid-cols-1 gap-2">
                        {procZoneNode.equipment.map(eq => {
                          const isSelected = procSelectedEquipment.includes(eq.id)
                          const hasWarning = eq.tags.length > MAX_TAGS_PER_GROUP && isSelected && !procTagWarnings[eq.id]
                          return (
                            <div key={eq.id}>
                              <button onClick={() => toggleProcEquipment(eq.id)}
                                className={cn("w-full text-left p-3 rounded-lg border transition-all cursor-pointer",
                                  isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-muted/50")}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isSelected && <div className="w-5 h-5 rounded bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
                                    {!isSelected && <div className="w-5 h-5 rounded border border-border" />}
                                    <span className="font-mono text-sm font-medium">{eq.id}</span>
                                    <span className="text-xs text-muted-foreground">{eq.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {eq.tags.map(tag => (
                                      <span key={tag} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              </button>
                              {/* Warning for >10 tags */}
                              {hasWarning && (
                                <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-amber-800">{eq.id}에 태그가 {eq.tags.length}개입니다. (권장 {MAX_TAGS_PER_GROUP}개 이하)</p>
                                    <p className="text-[11px] text-amber-600 mt-0.5">트렌드 조회 시 가독성이 떨어질 수 있습니다. 일부 태그를 제외하거나, 트렌드에서 개별 확인을 권장합니다.</p>
                                    <button onClick={() => setProcTagWarnings(prev => ({ ...prev, [eq.id]: true }))}
                                      className="mt-1.5 text-[11px] text-amber-700 font-medium hover:underline cursor-pointer">확인, 그대로 진행</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected summary */}
                  {procSelectedEquipment.length > 0 && (
                    <div className="p-3 border border-primary/20 rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium">선택된 설비: {procSelectedEquipment.length}개 / 태그 합계: {procAllTags.length}개</p>
                        <Button size="sm" className="h-7 text-xs gap-1.5 cursor-pointer" onClick={() => setProcShowTrend(true)}>
                          <TrendingUp className="h-3.5 w-3.5" />
                          트렌드 보기
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {procSelectedEquipment.map(eqId => {
                          const eq = procZoneNode?.equipment.find(e => e.id === eqId)
                          return eq ? (
                            <Badge key={eqId} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleProcEquipment(eqId)}>
                              <Factory className="h-3 w-3" />
                              {eq.id}
                              <span className="text-muted-foreground text-[10px]">({eq.tags.length})</span>
                              <X className="h-3 w-3 ml-0.5" />
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!procProcess && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Factory className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">공정을 선택하여 관련 설비의 태그를 조회하세요</p>
                      <p className="text-xs text-muted-foreground max-w-sm">공정 &gt; 구역 &gt; 설비 순으로 선택하면 해당 설비에 연결된 전체 태그가 트렌드로 표시됩니다. 설비를 복수 선택하면 그룹별로 구분되어 표시됩니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Grouped Trend display */}
              {procShowTrend && procEquipmentGroups.length > 0 && (
                <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
                  <div className="space-y-4 pb-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer" onClick={() => setProcShowTrend(false)}>
                        <Factory className="h-3.5 w-3.5" />
                        설비 선택으로 돌아가기
                      </Button>
                      <span className="text-xs text-muted-foreground">{procEquipmentGroups.length}개 그룹, {procAllTags.length}개 태그</span>
                    </div>

                    {procEquipmentGroups.map((group, gi) => (
                      <div key={group.equipment.id} className="space-y-2">
                        {/* Group header */}
                        <div className="flex items-center gap-2 px-1">
                          <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLORS[gi % COLORS.length] }} />
                          <span className="text-sm font-semibold">{group.equipment.id}</span>
                          <span className="text-xs text-muted-foreground">{group.equipment.name}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{group.trends.length}개 태그</Badge>
                        </div>

                        {viewMode === "overlay" && group.trends.length >= 2 ? (
                          <Card className="p-4">
                            <div className="flex flex-wrap gap-3 mb-2">
                              {group.trends.map(({ tag, current, unit }, i) => (
                                <div key={tag} className="flex items-center gap-1.5 text-xs">
                                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="font-mono font-medium">{tag}</span>
                                  <span className="text-muted-foreground">({current} {unit})</span>
                                </div>
                              ))}
                            </div>
                            <OverlayTrendChart tags={group.trends} colors={COLORS} />
                          </Card>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {group.trends.map(({ tag, values, unit, high, low, current }, i) => {
                              const isViolation = (high !== null && current > high) || (low !== null && current < low)
                              return (
                                <Card key={tag} className={cn("overflow-hidden", isViolation && "border-red-200")}>
                                  <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                      <span className="font-mono text-sm font-semibold">{tag}</span>
                                      {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Limit 초과</Badge>}
                                    </div>
                                    <span className="text-xs text-muted-foreground">[{unit}]</span>
                                  </div>
                                  <div className="px-2">
                                    <TrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} isAlert={isViolation} height="h-28" />
                                  </div>
                                  <div className="px-3 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                                    <div>
                                      <span className="text-muted-foreground">현재 </span>
                                      <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>{current} {unit}</span>
                                    </div>
                                    {high !== null && <div><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></div>}
                                    {low !== null && <div><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></div>}
                                    <div>
                                      <span className="text-muted-foreground">범위 </span>
                                      <span className="font-medium">{Math.min(...values).toFixed(1)} ~ {Math.max(...values).toFixed(1)}</span>
                                    </div>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        )}
                        {/* Separator between groups */}
                        {gi < procEquipmentGroups.length - 1 && <div className="border-t border-border/50 pt-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}

          {/* ===== DCS TAB ===== */}
          {trendTab === "dcs" && (
            <>
              {/* Step 1: Tag input */}
              {!dcsInitialTag && (
                <div className="space-y-4 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={dcsTagInput}
                      onChange={(e) => handleDcsTagInput(e.target.value)}
                      onKeyDown={handleDcsKeyDown}
                      placeholder="태그 ID를 입력하세요 (해당 태그의 DCS 화면을 찾습니다)"
                      className="pl-9"
                      autoFocus
                    />
                    {dcsSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 py-1 max-h-48 overflow-auto">
                        {dcsSuggestions.map(tag => (
                          <button key={tag} onClick={() => handleDcsTagSelect(tag)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 cursor-pointer">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{tag}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{findTagUnit(tag) || ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Monitor className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">태그를 입력하여 관련 DCS 화면을 찾으세요</p>
                    <p className="text-xs text-muted-foreground max-w-sm">입력된 태그가 포함된 DCS 그래픽 화면 목록이 표시되며, 해당 화면의 태그를 선택하여 트렌드를 조회할 수 있습니다.</p>
                  </div>
                </div>
              )}

              {/* Step 2: DCS screen list */}
              {dcsInitialTag && !dcsSelectedScreen && (
                <div className="space-y-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs cursor-pointer" onClick={resetDcsState}>
                      <X className="h-3.5 w-3.5" /> 초기화
                    </Button>
                    <Badge variant="secondary" className="font-mono">{dcsInitialTag}</Badge>
                    {dcsUnit && <Badge variant="outline">{dcsUnit}</Badge>}
                    <span className="text-xs text-muted-foreground">태그가 포함된 DCS 화면 {dcsScreens.length}개</span>
                  </div>
                  <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                      {dcsScreens.map(screen => {
                        const screenTags = DCS_SCREEN_TAGS[screen.number] || []
                        const hasInitial = screenTags.includes(dcsInitialTag!)
                        return (
                          <button
                            key={screen.number}
                            onClick={() => handleDcsScreenSelect(screen.number)}
                            className={cn(
                              "text-left p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                              hasInitial ? "border-primary/30 bg-primary/5 hover:border-primary/50" : "border-border hover:border-primary/30 hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Monitor className="h-5 w-5 text-primary" />
                              <span className="font-mono text-sm font-semibold">{screen.number}</span>
                            </div>
                            <p className="text-sm font-medium mb-2">{screen.name}</p>
                            <div className="flex flex-wrap gap-1">
                              {screenTags.map(tag => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "font-mono text-[10px] px-1.5 py-0.5 rounded",
                                    tag === dcsInitialTag ? "bg-primary/10 text-primary font-semibold border border-primary/20" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">{screenTags.length}개 태그</p>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Step 3: Screen selected -> Visual DCS schematic + tag click + trend */}
              {dcsInitialTag && dcsSelectedScreen && (() => {
                const layout = buildScreenLayout(dcsSelectedScreen)
                const screenName = dcsScreens.find(s => s.number === dcsSelectedScreen)?.name || ""

                return (
                  <div className="flex flex-col flex-1 min-h-0 gap-3">
                    {/* Header */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs cursor-pointer" onClick={() => { setDcsSelectedScreen(null); setDcsScreenTags([]); setDcsSelectedTags([]); setDcsShowTrend(false) }}>
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" /> 화면 목록
                      </Button>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/20">
                        <Monitor className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-semibold">{dcsSelectedScreen}</span>
                        <span className="text-xs text-muted-foreground">{screenName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{dcsUnit}</Badge>
                      {dcsSelectedTags.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground ml-auto">{dcsSelectedTags.length}개 선택</span>
                          <Button size="sm" className="h-7 text-xs gap-1.5 cursor-pointer" onClick={() => setDcsShowTrend(true)}>
                            <TrendingUp className="h-3.5 w-3.5" />
                            트렌드 보기
                          </Button>
                        </>
                      )}
                    </div>

                    <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
                      {/* DCS Schematic */}
                      {!dcsShowTrend && (
                        <div className="space-y-3 pb-4">
                          {/* Legend */}
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-muted-foreground">클릭하여 태그 선택:</span>
                            {Object.entries(TAG_TYPE_COLORS).map(([key, c]) => (
                              <div key={key} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded border", c.bg, c.border)}>
                                <span className={cn("font-semibold", c.text)}>{key}</span>
                                <span className="text-muted-foreground">{c.label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Visual DCS Screen */}
                          <Card className="relative overflow-hidden border-2 border-border bg-[#0a1628]" style={{ minHeight: 340 }}>
                            {/* Grid pattern background */}
                            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="dcs-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6366f1" strokeWidth="0.5" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#dcs-grid)" />
                            </svg>

                            {/* Screen title bar */}
                            <div className="relative flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-white/5">
                              <Monitor className="h-3.5 w-3.5 text-cyan-400" />
                              <span className="text-xs font-mono text-cyan-300">{dcsSelectedScreen}</span>
                              <span className="text-[11px] text-white/50">{screenName}</span>
                              <span className="text-[11px] text-white/30 ml-auto">{dcsUnit}</span>
                            </div>

                            {/* Equipment and pipes SVG layer */}
                            <svg className="absolute inset-0 w-full h-full" style={{ top: 28 }} xmlns="http://www.w3.org/2000/svg">
                              {/* Pipes */}
                              {layout.pipes.map((pipe, i) => (
                                <line
                                  key={`pipe-${i}`}
                                  x1={`${pipe.from[0]}%`} y1={`${pipe.from[1]}%`}
                                  x2={`${pipe.to[0]}%`} y2={`${pipe.to[1]}%`}
                                  stroke="#22d3ee" strokeWidth="2" opacity="0.3"
                                  strokeDasharray="4 2"
                                />
                              ))}
                              {/* Equipment shapes */}
                              {layout.equipment.map(eq => (
                                <g key={eq.id}>
                                  {eq.shape === "column" && (
                                    <>
                                      <rect x={`${eq.x}%`} y={`${eq.y}%`} width={`${eq.w}%`} height={`${eq.h}%`}
                                        rx="4" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
                                      {/* Internal trays */}
                                      {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
                                        <line key={i}
                                          x1={`${eq.x + 1}%`} y1={`${eq.y + eq.h * f}%`}
                                          x2={`${eq.x + eq.w - 1}%`} y2={`${eq.y + eq.h * f}%`}
                                          stroke="#38bdf8" strokeWidth="0.5" opacity="0.25"
                                        />
                                      ))}
                                    </>
                                  )}
                                  {eq.shape === "exchanger" && (
                                    <>
                                      <rect x={`${eq.x}%`} y={`${eq.y}%`} width={`${eq.w}%`} height={`${eq.h}%`}
                                        rx="2" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" />
                                      <line x1={`${eq.x + 2}%`} y1={`${eq.y + eq.h / 2}%`}
                                        x2={`${eq.x + eq.w - 2}%`} y2={`${eq.y + eq.h / 2}%`}
                                        stroke="#a78bfa" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 2" />
                                    </>
                                  )}
                                  {eq.shape === "drum" && (
                                    <rect x={`${eq.x}%`} y={`${eq.y}%`} width={`${eq.w}%`} height={`${eq.h}%`}
                                      rx="8" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.4" />
                                  )}
                                  {eq.shape === "pump" && (
                                    <circle cx={`${eq.x + eq.w / 2}%`} cy={`${eq.y + eq.h / 2}%`}
                                      r={`${eq.w / 2}%`} fill="none" stroke="#fb923c" strokeWidth="1.5" opacity="0.4" />
                                  )}
                                  {eq.shape === "furnace" && (
                                    <>
                                      <rect x={`${eq.x}%`} y={`${eq.y}%`} width={`${eq.w}%`} height={`${eq.h}%`}
                                        fill="none" stroke="#f87171" strokeWidth="1.5" opacity="0.4" />
                                      <line x1={`${eq.x + 2}%`} y1={`${eq.y + eq.h - 3}%`}
                                        x2={`${eq.x + eq.w / 3}%`} y2={`${eq.y + eq.h - 8}%`}
                                        stroke="#f87171" strokeWidth="1" opacity="0.3" />
                                      <line x1={`${eq.x + eq.w / 2}%`} y1={`${eq.y + eq.h - 3}%`}
                                        x2={`${eq.x + eq.w * 2 / 3}%`} y2={`${eq.y + eq.h - 8}%`}
                                        stroke="#f87171" strokeWidth="1" opacity="0.3" />
                                    </>
                                  )}
                                  {/* Equipment label */}
                                  <text x={`${eq.x + eq.w / 2}%`} y={`${eq.y + eq.h + 4}%`}
                                    textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">{eq.label}</text>
                                </g>
                              ))}
                            </svg>

                            {/* Clickable tag points */}
                            <div className="relative" style={{ minHeight: 310, paddingTop: 28 }}>
                              {layout.tags.map(pt => {
                                const isSelected = dcsSelectedTags.includes(pt.tag)
                                const isInitial = pt.tag === dcsInitialTag
                                const tc = TAG_TYPE_COLORS[pt.type]
                                const colorIdx = isSelected ? dcsSelectedTags.indexOf(pt.tag) : -1
                                const trendData = (() => {
                                  // show mini value
                                  const base = pt.type === "T" ? 350 : pt.type === "P" ? 15 : pt.type === "F" ? 1000 : 50
                                  return (base + (Math.random() - 0.5) * base * 0.05).toFixed(1)
                                })()
                                const unitLabel = pt.type === "T" ? "\u00b0C" : pt.type === "P" ? "kg/cm\u00b2" : pt.type === "F" ? "m\u00b3/h" : pt.type === "L" ? "%" : ""

                                return (
                                  <button
                                    key={pt.tag}
                                    onClick={() => toggleDcsTag(pt.tag)}
                                    className={cn(
                                      "absolute flex flex-col items-start gap-0 transition-all cursor-pointer group z-10",
                                      isSelected ? "scale-105" : "hover:scale-105"
                                    )}
                                    style={{ left: `${pt.x}%`, top: `${pt.y}%`, transform: "translate(-50%, -50%)" }}
                                    title={`${pt.tag} - 클릭하여 ${isSelected ? '제거' : '추가'}`}
                                  >
                                    {/* Connection line dot */}
                                    <div className={cn(
                                      "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                                      isSelected ? "bg-primary" : "bg-cyan-500/40"
                                    )} />

                                    {/* Tag card */}
                                    <div className={cn(
                                      "rounded-md border px-2 py-1 shadow-lg backdrop-blur-sm transition-all",
                                      isSelected
                                        ? "border-primary bg-primary/20 ring-1 ring-primary/40"
                                        : "border-white/20 bg-white/5 group-hover:border-white/40 group-hover:bg-white/10"
                                    )}>
                                      <div className="flex items-center gap-1.5">
                                        {isSelected && (
                                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[colorIdx % COLORS.length] }} />
                                        )}
                                        {!isSelected && (
                                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", 
                                            pt.type === "T" ? "bg-red-400" : pt.type === "P" ? "bg-blue-400" : pt.type === "F" ? "bg-green-400" : pt.type === "L" ? "bg-amber-400" : "bg-violet-400"
                                          )} />
                                        )}
                                        <span className={cn(
                                          "font-mono text-[10px] font-semibold",
                                          isSelected ? "text-primary" : "text-white/80"
                                        )}>
                                          {pt.tag}
                                        </span>
                                        {isInitial && <span className="text-[8px] text-cyan-400 font-medium">*</span>}
                                      </div>
                                      <div className={cn(
                                        "font-mono text-[11px] font-bold mt-0.5",
                                        isSelected ? "text-white" : "text-white/60"
                                      )}>
                                        {trendData} <span className="text-[9px] font-normal opacity-60">{unitLabel}</span>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </Card>

                          {/* Selected tags summary */}
                          {dcsSelectedTags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">선택된 태그:</span>
                              {dcsSelectedTags.map((tag, i) => (
                                <Badge key={tag} variant="secondary" className="gap-1 font-mono text-xs cursor-pointer" onClick={() => toggleDcsTag(tag)}>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  {tag}
                                  <X className="h-3 w-3 ml-0.5" />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* DCS Trend display */}
                      {dcsShowTrend && dcsSelectedTags.length > 0 && (
                        <div className="space-y-3 pb-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer" onClick={() => setDcsShowTrend(false)}>
                              <Monitor className="h-3.5 w-3.5" />
                              DCS 화면으로 돌아가기
                            </Button>
                            <span className="text-xs text-muted-foreground">{dcsSelectedTags.length}개 태그 트렌드</span>
                          </div>

                          {viewMode === "overlay" && dcsSelectedTags.length >= 2 ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-3 px-1">
                                {dcsTagTrends.map(({ tag, current, unit }, i) => (
                                  <div key={tag} className="flex items-center gap-1.5 text-xs">
                                    <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="font-mono font-medium">{tag}</span>
                                    <span className="text-muted-foreground">({current} {unit})</span>
                                  </div>
                                ))}
                              </div>
                              <Card className="p-4">
                                <OverlayTrendChart tags={dcsTagTrends} colors={COLORS} />
                              </Card>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {dcsTagTrends.map(({ tag, values, unit, high, low, current }, i) => {
                                const isViolation = (high !== null && current > high) || (low !== null && current < low)
                                return (
                                  <Card key={tag} className={cn("overflow-hidden", isViolation && "border-red-200")}>
                                    <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="font-mono text-sm font-semibold">{tag}</span>
                                        {tag === dcsInitialTag && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary/30 text-primary">입력</Badge>}
                                        {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Limit 초과</Badge>}
                                      </div>
                                      <span className="text-xs text-muted-foreground">[{unit}]</span>
                                    </div>
                                    <div className="px-2">
                                      <TrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} isAlert={isViolation} height="h-28" />
                                    </div>
                                    <div className="px-3 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                                      <div>
                                        <span className="text-muted-foreground">현재 </span>
                                        <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>{current} {unit}</span>
                                      </div>
                                      {high !== null && <div><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></div>}
                                      {low !== null && <div><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></div>}
                                      <div>
                                        <span className="text-muted-foreground">범위 </span>
                                        <span className="font-medium">{Math.min(...values).toFixed(1)} ~ {Math.max(...values).toFixed(1)}</span>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )
              })()}
            </>
          )}

        </DialogContent>
      </Dialog>

      {/* ===== Save Trend Dialog (sub) ===== */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              트렌드 저장
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">현재 조회중인 {activeTags.length}개 태그를 트렌드 묶음으로 저장합니다.</p>
            <div className="flex flex-wrap gap-1">
              {activeTags.map(tag => <Badge key={tag} variant="secondary" className="font-mono text-xs">{tag}</Badge>)}
            </div>
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setSaveMode("new")}
                className={cn("flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors cursor-pointer",
                  saveMode === "new" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <FolderPlus className="h-4 w-4 mb-1 mx-auto" />
                <div>새 묶음 만들기</div>
              </button>
              <button
                onClick={() => setSaveMode("existing")}
                className={cn("flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors cursor-pointer",
                  saveMode === "existing" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Bookmark className="h-4 w-4 mb-1 mx-auto" />
                <div>기존 묶음에 추가</div>
              </button>
            </div>
            {saveMode === "new" ? (
              <div className="space-y-2">
                <Label className="text-sm">묶음 이름</Label>
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="예: HCR Reactor 온도 트래킹" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">대상 묶음 선택</Label>
                <div className="space-y-1.5 max-h-40 overflow-auto">
                  {trendGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSaveTargetId(g.id)}
                      className={cn("w-full text-left px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer",
                        saveTargetId === g.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.tags.length}개 태그 | {g.unit}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="cursor-pointer">취소</Button>
            <Button onClick={handleSaveTrend} disabled={(saveMode === "new" && !newGroupName.trim()) || (saveMode === "existing" && !saveTargetId)} className="cursor-pointer">
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 2) 저장된 트렌드 묶음 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "saved-trends"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-teal-600" />
                저장된 트렌드 묶음
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => setShowNewFolderDialog(true)}>
                  <FolderPlus className="h-3.5 w-3.5" />
                  새 폴더
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => setShowNewGroupDialog(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  새 묶음
                </Button>
              </div>
            </div>
            {selectedFolderGroups.length > 0 && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">{selectedFolderGroups.length}개 선택됨</span>
                <Button size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={loadSelectedGroups}>
                  <Eye className="h-3.5 w-3.5" />
                  선택 항목 불러오기
                </Button>
                <Button variant="ghost" size="sm" className="text-xs cursor-pointer" onClick={() => setSelectedFolderGroups([])}>
                  선택 해제
                </Button>
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            {trendGroups.length === 0 && trendFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">저장된 트렌드 묶음이 없습니다</p>
                <p className="text-xs text-muted-foreground">위의 버튼으로 폴더 또는 묶음을 생성하세요.</p>
              </div>
            ) : (
              <div className="space-y-3 pr-2 pb-4">
                {/* Folders */}
                {trendFolders.map(folder => {
                  const folderGroups = getGroupsInFolder(folder.id)
                  const folderColor = folder.color === "blue" ? "border-blue-200 bg-blue-50/50" 
                    : folder.color === "amber" ? "border-amber-200 bg-amber-50/50"
                    : folder.color === "green" ? "border-green-200 bg-green-50/50"
                    : "border-border bg-muted/30"
                  const iconColor = folder.color === "blue" ? "text-blue-600" 
                    : folder.color === "amber" ? "text-amber-600"
                    : folder.color === "green" ? "text-green-600"
                    : "text-muted-foreground"
                  
                  return (
                    <div key={folder.id} className={cn("rounded-lg border", folderColor)}>
                      {/* Folder header */}
                      <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                        {folder.expanded ? <FolderOpen className={cn("h-5 w-5", iconColor)} /> : <Folder className={cn("h-5 w-5", iconColor)} />}
                        <span className="font-medium text-sm flex-1">{folder.name}</span>
                        {folder.unit && <Badge variant="outline" className="text-xs">{folder.unit}</Badge>}
                        <span className="text-xs text-muted-foreground">{folderGroups.length}개 묶음</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs cursor-pointer" 
                          onClick={(e) => { e.stopPropagation(); openFolderTrends(folder.id) }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          전체
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id) }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                        </Button>
                        {folder.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      
                      {/* Folder contents */}
                      {folder.expanded && folderGroups.length > 0 && (
                        <div className="px-3 pb-3 space-y-2">
                          {folderGroups.map(group => (
                            <div key={group.id} className="relative group/item flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedFolderGroups.includes(group.id)}
                                onChange={() => toggleGroupSelection(group.id)}
                                className="mt-3 h-4 w-4 rounded border-border cursor-pointer"
                              />
                              <button
                                onClick={() => openSingleGroupTrend(group)}
                                className="flex-1 text-left p-2.5 rounded-md border border-border bg-background hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{group.name}</span>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{group.tags.length}개 태그</span>
                                  <span className="text-xs text-muted-foreground">{group.updatedAt}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {group.tags.slice(0, 5).map(tag => (
                                    <span key={tag} className="font-mono text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                                  ))}
                                  {group.tags.length > 5 && <span className="text-[10px] text-muted-foreground">+{group.tags.length - 5}</span>}
                                </div>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                                className="opacity-0 group-hover/item:opacity-100 transition-opacity h-7 w-7 mt-2 rounded-md border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Ungrouped items */}
                {ungroupedTrendGroups.length > 0 && (
                  <div className="space-y-2">
                    {trendFolders.length > 0 && <p className="text-xs text-muted-foreground font-medium px-1 pt-2">폴더 미지정</p>}
                    {ungroupedTrendGroups.map(group => (
                      <div key={group.id} className="relative group/item flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFolderGroups.includes(group.id)}
                          onChange={() => toggleGroupSelection(group.id)}
                          className="mt-3 h-4 w-4 rounded border-border cursor-pointer"
                        />
                        <button
                          onClick={() => openSingleGroupTrend(group)}
                          className="flex-1 text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium">{group.name}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">{group.unit}</Badge>
                            <span className="text-xs text-muted-foreground">{group.tags.length}개 태그</span>
                            <span className="text-xs text-muted-foreground ml-auto">{group.updatedAt}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {group.tags.map(tag => (
                              <span key={tag} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity h-7 w-7 mt-2 rounded-md border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New group creation sub-dialog */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              새 트렌드 묶음 만들기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">묶음 이름</Label>
              <Input value={newGroupFormName} onChange={e => setNewGroupFormName(e.target.value)} placeholder="예: HCR Reactor 핵심 태그" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">폴더 (선택)</Label>
              <select 
                value={newGroupFormFolder} 
                onChange={e => setNewGroupFormFolder(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">폴더 미지정</option>
                {trendFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">공정 단위</Label>
              <Input value={newGroupFormUnit} onChange={e => setNewGroupFormUnit(e.target.value)} placeholder="예: HCR, VDU, CDU" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">태그 ID (쉼표로 구분)</Label>
              <Input value={newGroupFormTags} onChange={e => setNewGroupFormTags(e.target.value)} placeholder="예: TI-3001, TI-3002, PI-3001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupDialog(false)} className="cursor-pointer">취소</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupFormName.trim()} className="cursor-pointer">생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New folder creation dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-teal-600" />
              새 폴더 만들기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">폴더 이름</Label>
              <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="예: VDU Ejector 관련" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">공정 단위 (선택)</Label>
              <Input value={newFolderUnit} onChange={e => setNewFolderUnit(e.target.value)} placeholder="예: VDU, HCR" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)} className="cursor-pointer">취소</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()} className="cursor-pointer">생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 3) 커스텀 대시보드 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "dashboards" && !selectedDashboard} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-amber-600" />
              커스텀 대시보드
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pr-2">
              {dashboards.map(db => (
                <button
                  key={db.id}
                  onClick={() => { setSelectedDashboard(db) }}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-amber-300 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium group-hover:text-amber-700 transition-colors">{db.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{db.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{db.unit}</Badge>
                    <span className="text-xs text-muted-foreground">위젯 {db.widgets}개</span>
                    <span className="text-xs text-muted-foreground ml-auto">{db.updatedAt}</span>
                  </div>
                </button>
              ))}
              {/* Link to full page */}
              <button
                onClick={() => { handleClose(); router.push("/operations/custom-dashboard") }}
                className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
              >
                커스텀 대시보드 관리 페이지로 이동
              </button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ===== Dashboard Rendered View ===== */}
      <Dialog open={isOpen && activePanel === "dashboards" && !!selectedDashboard} onOpenChange={(open) => { if (!open) { setSelectedDashboard(null); handleClose() } }}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-amber-600" />
                {selectedDashboard?.name}
                <Badge variant="outline" className="ml-2 text-xs">{selectedDashboard?.unit}</Badge>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => { handleClose(); router.push(`/operations/custom-dashboard?id=${selectedDashboard?.id}`) }}>
                  <Eye className="h-3.5 w-3.5" />
                  전체화면 보기
                </Button>
                <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setSelectedDashboard(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            {selectedDashboard && <DashboardRenderer dashboard={selectedDashboard} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ===== Personalized Alarm Dialog ===== */}
      <Dialog open={isOpen && activePanel === "personalized-alarm"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                <DialogTitle>개인화 알림 설정</DialogTitle>
              </div>
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            <div className="space-y-4 pb-4">
              {paSavedMsg && (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" />
                  {paSavedMsg}
                </div>
              )}

              {/* Tag Input */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">변수 (Tag ID)</Label>
                <div className="relative">
                  <Input
                    value={paTagInput}
                    onChange={(e) => handlePaTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && paSuggestions.length > 0) {
                        handlePaTagSelect(paSuggestions[0])
                      }
                    }}
                    placeholder="Tag ID를 입력하세요 (예: TI-1001)"
                    className="text-sm"
                  />
                  {paSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {paSuggestions.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handlePaTagSelect(tag)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{tag}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Screen Tags - Quick Select */}
                <button
                  onClick={() => setPaShowScreenTags(!paShowScreenTags)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  {paShowScreenTags ? "화면 태그 리스트 닫기" : "현재 화면 태그에서 선택하기"}
                  <ChevronRight className={cn("h-3 w-3 transition-transform", paShowScreenTags && "rotate-90")} />
                </button>

                {paShowScreenTags && (
                  <div className="border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
                    <p className="text-[10px] text-muted-foreground mb-2">주요 공정 태그 목록에서 선택:</p>
                    <div className="space-y-2">
                      {Object.entries(AVAILABLE_TAGS).slice(0, 6).map(([unit, tags]) => (
                        <div key={unit}>
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1">{unit}</p>
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 8).map(tag => (
                              <button
                                key={tag}
                                onClick={() => handlePaTagSelect(tag)}
                                className={cn(
                                  "px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer transition-colors",
                                  paSelectedTag === tag ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                                )}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">설명 (선택)</Label>
                <Input
                  value={paDescription}
                  onChange={(e) => setPaDescription(e.target.value)}
                  placeholder="알림 설명 (예: Column Top Temp 상한 감시)"
                  className="text-sm"
                />
              </div>

              {/* Min/Max Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Min (하한)</Label>
                  <Input
                    type="number"
                    value={paMin}
                    onChange={(e) => setPaMin(e.target.value)}
                    placeholder="Min"
                    className="text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Max (상한)</Label>
                  <Input
                    type="number"
                    value={paMax}
                    onChange={(e) => setPaMax(e.target.value)}
                    placeholder="Max"
                    className="text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">단위</Label>
                  <Input
                    value={paUnit}
                    onChange={(e) => setPaUnit(e.target.value)}
                    placeholder="단위"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Selected Summary */}
              {paSelectedTag && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs font-medium mb-2">등록 요약</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Tag:</span> <span className="font-mono font-medium">{paSelectedTag}</span></div>
                    {paDescription && <div><span className="text-muted-foreground">설명:</span> {paDescription}</div>}
                    {paMin && <div><span className="text-muted-foreground">Min:</span> <span className="font-mono">{paMin} {paUnit}</span></div>}
                    {paMax && <div><span className="text-muted-foreground">Max:</span> <span className="font-mono">{paMax} {paUnit}</span></div>}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} className="cursor-pointer">취소</Button>
            <Button disabled={!paSelectedTag || (!paMin && !paMax)} onClick={handlePaSave} className="cursor-pointer gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              알림 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ===== Dashboard Renderer =====
function DashboardRenderer({ dashboard }: { dashboard: DashboardItem }) {
  // Generate mock widgets
  const widgets = useMemo(() => {
    const seed = dashboard.id.charCodeAt(3) || 1
    const types: ("trend" | "kpi" | "table" | "gauge")[] = ["trend", "kpi", "trend", "gauge", "table", "trend", "kpi", "trend", "gauge", "table"]
    const tagPools: Record<string, string[]> = {
      "HCR": ["TI-3001", "TI-3002", "PI-3001", "FI-3001", "TI-3003", "TI-3004", "FI-3002", "PDI-3001"],
      "VDU": ["TI-2001", "TI-2002", "PI-2001", "LI-2001", "FI-2001", "TI-2003"],
      "전체": ["TI-3001", "PI-2001", "FI-1001", "TI-1001", "LI-2001", "TI-2002", "FI-3001", "PI-3001", "TI-3003", "FI-2001"],
    }
    const tags = tagPools[dashboard.unit] || tagPools["전체"]
    return Array.from({ length: dashboard.widgets }, (_, i) => ({
      id: `w-${i}`,
      type: types[i % types.length],
      tag: tags[i % tags.length],
      title: `${tags[i % tags.length]} ${types[i % types.length] === "trend" ? "트렌드" : types[i % types.length] === "kpi" ? "KPI" : types[i % types.length] === "table" ? "데이터 테이블" : "게이지"}`,
      ...generateTagTrend(tags[i % tags.length], 30),
    }))
  }, [dashboard])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
      {widgets.map((w, idx) => {
        if (w.type === "kpi") {
          const isOver = w.high !== null && w.current > w.high
          return (
            <Card key={w.id} className="p-4">
              <p className="text-xs text-muted-foreground mb-1 font-mono">{w.tag}</p>
              <p className={cn("text-2xl font-bold tabular-nums", isOver ? "text-red-600" : "text-foreground")}>{w.current}</p>
              <p className="text-xs text-muted-foreground">{w.unit}</p>
              {w.high !== null && <p className="text-xs mt-1">H: <span className="text-red-500 font-medium">{w.high}</span></p>}
            </Card>
          )
        }
        if (w.type === "gauge") {
          const pct = w.high ? Math.min(100, (w.current / w.high) * 100) : 50
          const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e"
          return (
            <Card key={w.id} className="p-4 flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-2 font-mono">{w.tag}</p>
              <svg viewBox="0 0 120 80" className="w-24 h-16">
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="8" strokeLinecap="round" />
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${pct * 1.57} 157`} />
                <text x="60" y="65" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">{pct.toFixed(0)}%</text>
              </svg>
              <p className="text-xs text-muted-foreground mt-1">{w.current} {w.unit}</p>
            </Card>
          )
        }
        if (w.type === "table") {
          return (
            <Card key={w.id} className="col-span-2 p-3">
              <p className="text-xs font-medium mb-2">{w.title}</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1 px-2">시간</th>
                  <th className="text-right py-1 px-2">값</th>
                  <th className="text-right py-1 px-2">상태</th>
                </tr></thead>
                <tbody>
                  {w.values.slice(-5).map((v, i) => {
                    const isOver = w.high !== null && v > w.high
                    return (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-1 px-2 text-muted-foreground">{`${String(8 + i * 2).padStart(2, "0")}:00`}</td>
                        <td className="py-1 px-2 text-right font-mono">{v}</td>
                        <td className="py-1 px-2 text-right">
                          <span className={cn("inline-block w-2 h-2 rounded-full", isOver ? "bg-red-500" : "bg-green-500")} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          )
        }
        // trend (default, also spans 2 cols)
        const isViolation = w.high !== null && w.current > w.high
        return (
          <Card key={w.id} className={cn("col-span-2 overflow-hidden", isViolation && "border-red-200")}>
            <div className="px-3 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">{w.tag}</span>
                {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">초과</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{w.current} {w.unit}</span>
            </div>
            <div className="px-1">
              <TrendChart values={w.values} high={w.high} low={w.low} color={COLORS[idx % COLORS.length]} isAlert={isViolation} height="h-20" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
