"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  LayoutGrid, Plus, ArrowLeft, Settings, Trash2, Clock, Edit2,
  BarChart3, TrendingUp, Gauge, Table, X, Check, Search, Layers,
  Monitor, GripVertical, Maximize2, Minimize2, Eye, Component,
  FolderOpen, Folder, FolderPlus, User, Users, Building, Globe,
  ChevronRight, ChevronDown, MoreVertical, Lock, Share2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { AVAILABLE_TAGS } from "@/lib/process-data"

// =========================================================================
// Types
// =========================================================================

// Folder permission types
type FolderPermission = "personal" | "team" | "department" | "company"

interface DashboardFolder {
  id: string
  name: string
  permission: FolderPermission
  teamId?: string // for team permission
  teamName?: string
  icon?: string
  createdAt: string
  dashboardIds: string[]
}

interface EquipmentGroup {
  equipmentId: string
  equipmentName: string
  tags: string[]
}

interface WidgetConfig {
  id: string
  type: "trend" | "kpi" | "gauge" | "table" | "oop-component"
  title: string
  colSpan: number
  configured: boolean
  // Free widget fields
  tags?: string[]
  process?: string
  zone?: string
  equipment?: string
  equipmentGroups?: EquipmentGroup[] // multi-equipment support
  displayMode?: "individual" | "overlay"
  // Legacy single-tag (for pre-existing widgets)
  tag?: string
  // OOP component
  componentId?: string
  componentCategory?: string
}

interface DashboardItem {
  id: string
  name: string
  description: string
  unit: string
  widgets: WidgetConfig[]
  updatedAt: string
  folderId?: string // folder association
}

// Permission config
const PERMISSION_CONFIG: Record<FolderPermission, { label: string; icon: string; description: string; color: string }> = {
  personal: { label: "개인용", icon: "user", description: "나만 볼 수 있는 폴더", color: "blue" },
  team: { label: "팀 공용", icon: "users", description: "소속 팀 전체 공유", color: "green" },
  department: { label: "부서 공용", icon: "building", description: "부서 전체 공유", color: "amber" },
  company: { label: "전사 공용", icon: "globe", description: "회사 전체 공유", color: "purple" },
}

const TEAM_OPTIONS = [
  { id: "proc-eng", name: "공정기술팀" },
  { id: "maint", name: "장치기술팀" },
  { id: "ops", name: "운전팀" },
  { id: "safety", name: "안전환경팀" },
  { id: "dx", name: "DX팀" },
]

// Initial folders
const INITIAL_FOLDERS: DashboardFolder[] = [
  { id: "folder-personal", name: "내 대시보드", permission: "personal", createdAt: "2026-01-15", dashboardIds: ["db-1"] },
  { id: "folder-proc-team", name: "공정기술팀 공용", permission: "team", teamId: "proc-eng", teamName: "공정기술팀", createdAt: "2026-01-10", dashboardIds: ["db-2", "db-3"] },
  { id: "folder-company", name: "전사 표준 대시보드", permission: "company", createdAt: "2025-12-01", dashboardIds: [] },
]

// =========================================================================
// Equipment Hierarchy
// =========================================================================
interface EquipmentNode { id: string; name: string; tags: string[] }
interface ZoneNode { id: string; name: string; equipment: EquipmentNode[] }
interface ProcessNode { id: string; name: string; zones: ZoneNode[] }

const EQUIPMENT_HIERARCHY: ProcessNode[] = [
  {
    id: "CDU", name: "CDU (Crude Distillation Unit)", zones: [
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
    id: "VDU", name: "VDU (Vacuum Distillation Unit)", zones: [
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
    id: "HCR", name: "HCR (Hydrocracker)", zones: [
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
    id: "CCR", name: "CCR (Continuous Catalytic Reformer)", zones: [
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
    id: "DHT", name: "DHT (Diesel Hydrotreater)", zones: [
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
    id: "NHT", name: "NHT (Naphtha Hydrotreater)", zones: [
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

// =========================================================================
// OOP Component Library (existing components in the system)
// =========================================================================
interface OOPComponent {
  id: string
  name: string
  category: string
  description: string
  sourcePage: string
  icon: string // category icon reference
}

const OOP_COMPONENTS: OOPComponent[] = [
  // 건전성 모니터링
  { id: "oop-health-overview", name: "설비 건전성 종합 현황", category: "건전성 모니터링", description: "전 공정 설비 건전성 스코어 및 상태 요약", sourcePage: "/operations/health/overview", icon: "health" },
  { id: "oop-health-heatmap", name: "건전성 히트맵", category: "건전성 모니터링", description: "공정별 설비 건��성 히트맵 시각화", sourcePage: "/operations/health/overview", icon: "health" },
  { id: "oop-health-alerts", name: "건전성 주의 설비 목록", category: "건전성 모니터링", description: "스코어 60 이하 설비 리스트 및 상세", sourcePage: "/operations/health/overview", icon: "health" },
  { id: "oop-fouling-trend", name: "Fouling 트렌드", category: "건전성 모니터링", description: "열교환기 Fouling Factor 추이", sourcePage: "/operations/health/exchanger", icon: "health" },
  { id: "oop-corrosion-map", name: "부식 맵", category: "건전성 모니터링", description: "배관 두께 감소 추이 및 잔여 수명", sourcePage: "/operations/health/piping", icon: "health" },

  // 실시간 감시
  { id: "oop-process-overview", name: "공정 운전 현황 요약", category: "실시간 감시", description: "주요 변수 현재값 및 이상 유무 종합", sourcePage: "/operations/monitoring", icon: "monitor" },
  { id: "oop-alarm-summary", name: "알람 현황 요약", category: "실시간 감시", description: "활성 알람 건수 및 등급별 분류", sourcePage: "/alerts", icon: "monitor" },
  { id: "oop-tag-snapshot", name: "주요 태그 스냅샷", category: "실시간 감시", description: "주요 운전 태그 현재값 대시보드", sourcePage: "/operations/monitoring", icon: "monitor" },
  { id: "oop-dcs-status", name: "DCS 화면 상태", category: "실시간 감시", description: "DCS 그래픽 화면 연결 상태", sourcePage: "/operations/monitoring", icon: "monitor" },

  // 공정간 비교
  { id: "oop-energy-compare", name: "에너지 소비 비교", category: "공정간 비교", description: "공정별 에너지 사용량 비교 차트", sourcePage: "/optimization/energy", icon: "compare" },
  { id: "oop-yield-compare", name: "수율 비교", category: "공정간 비교", description: "공정별 제품 수율 비교 차트", sourcePage: "/optimization/process", icon: "compare" },
  { id: "oop-kpi-compare", name: "KPI 비교표", category: "공정간 비교", description: "공정별 주요 KPI 비교 테이블", sourcePage: "/review/monthly", icon: "compare" },

  // 에너지/최적화
  { id: "oop-energy-flow", name: "에너지 플로우", category: "에너지/최적화", description: "에너지 흐름 Sankey 다이어그램", sourcePage: "/optimization/energy", icon: "energy" },
  { id: "oop-pinch-analysis", name: "Pinch 분석 요약", category: "에너지/최적화", description: "열교환 네트워크 Pinch Point 분석", sourcePage: "/optimization/energy", icon: "energy" },
  { id: "oop-optimization-rec", name: "최적화 추천 현황", category: "에너지/최적화", description: "AI 기반 운전 최적화 추천 목록", sourcePage: "/optimization/ai-ml", icon: "energy" },
]

const OOP_CATEGORIES = [...new Set(OOP_COMPONENTS.map(c => c.category))]

// =========================================================================
// Table data groups (pre-structured)
// =========================================================================
interface TableGroup {
  id: string; name: string; process: string; description: string
  columns: string[]; tags: string[]
}
const TABLE_GROUPS: TableGroup[] = [
  { id: "tg-hcr-reactor", name: "HCR Reactor Temperatures", process: "HCR", description: "1st/2nd Stage Reactor 온도 종합", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["TI-3001", "TI-3002", "TI-3003"] },
  { id: "tg-hcr-pressure", name: "HCR Pressure Profile", process: "HCR", description: "Reactor/Separator 압력 종합", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["PI-3001"] },
  { id: "tg-cdu-column", name: "CDU Column Profile", process: "CDU", description: "상압탑 온도/압력/레벨 종합", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["TI-1001", "TI-1002", "PI-1001", "LI-1001", "FI-1001"] },
  { id: "tg-vdu-vacuum", name: "VDU Vacuum Profile", process: "VDU", description: "감압탑 운전 변수 종합", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["TI-2001", "TI-2002", "PI-2001", "LI-2001", "FI-2001"] },
  { id: "tg-dht-reactor", name: "DHT Reactor Summary", process: "DHT", description: "DHT Reactor 운전 종합", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["TI-5001", "TI-5002", "PI-5001", "FI-5001", "LI-5001"] },
  { id: "tg-ccr-reformer", name: "CCR Reformer Summary", process: "CCR", description: "Reformer 운전 종합", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["TI-4001", "TI-4002", "PI-4001", "FI-4001"] },
  { id: "tg-utility-steam", name: "Steam System Summary", process: "Utilities", description: "보일러/스팀 운전 요약", columns: ["Tag", "Description", "현재값", "단위", "High", "Low", "상태"], tags: ["TI-9001", "PI-9001", "FI-9001"] },
]

// =========================================================================
// Helpers
// =========================================================================
function generateTagTrend(tagId: string, points = 30) {
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

const COLORS = ["#6366f1", "#0d9488", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#10b981"]

function TrendChart({ values, high, low, color = "#6366f1", height = "h-24" }: {
  values: number[]; high: number | null; low: number | null; color?: string; height?: string
}) {
  const allVals = [...values, ...(high ? [high] : []), ...(low ? [low] : [])]
  const maxV = Math.max(...allVals) * 1.02, minV = Math.min(...allVals) * 0.98
  const range = maxV - minV || 1
  const W = 500, H = 130
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
  const isAlert = (high !== null && values[values.length - 1] > high)
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

function OverlayTrendChart({ tags, colors }: { tags: { tag: string; values: number[]; unit: string }[]; colors: string[] }) {
  if (tags.length === 0) return null
  const W = 500, H = 160
  const pad = { t: 12, b: 12, l: 6, r: 6 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const allVals = tags.flatMap(t => t.values)
  const maxV = Math.max(...allVals) * 1.02, minV = Math.min(...allVals) * 0.98
  const range = maxV - minV || 1
  const toX = (i: number, len: number) => pad.l + (i / (len - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
      {tags.map(({ tag, values }, ti) => {
        const pathD = values.reduce((acc, v, i) => {
          const x = toX(i, values.length), y = toY(v)
          if (i === 0) return `M ${x} ${y}`
          const px = toX(i - 1, values.length), py = toY(values[i - 1]), cpx = (px + x) / 2
          return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
        }, "")
        return (
          <g key={tag}>
            <path d={pathD} fill="none" stroke={colors[ti % colors.length]} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx={toX(values.length - 1, values.length)} cy={toY(values[values.length - 1])} r={3} fill={colors[ti % colors.length]} stroke="white" strokeWidth="1.5" />
          </g>
        )
      })}
    </svg>
  )
}

// =========================================================================
// Initial Dashboards
// =========================================================================
const INITIAL_DASHBOARDS: DashboardItem[] = [
  {
    id: "db-1", name: "HCR 일일 운전 현황판", description: "Reactor 온도/압력, 유량, 촉매 성능 종합", unit: "HCR", updatedAt: "2026-02-19",
    widgets: [
      { id: "w1", type: "trend", tag: "TI-3001", title: "Reactor Inlet 온도", colSpan: 2, configured: true, tags: ["TI-3001"], process: "HCR", displayMode: "individual" },
      { id: "w2", type: "kpi", tag: "TI-3002", title: "Reactor Outlet 온도", colSpan: 1, configured: true },
      { id: "w3", type: "gauge", tag: "PI-3001", title: "Reactor 압력", colSpan: 1, configured: true },
      { id: "w4", type: "trend", tag: "FI-3001", title: "Feed 유량", colSpan: 2, configured: true, tags: ["FI-3001"], displayMode: "individual" },
      { id: "w5", type: "table", tag: "TI-3003", title: "Bed#1 온도 로그", colSpan: 2, configured: true },
      { id: "w6", type: "kpi", tag: "FI-3002", title: "H2 Makeup", colSpan: 1, configured: true },
      { id: "w7", type: "gauge", tag: "PDI-3001", title: "Reactor dP", colSpan: 1, configured: true },
    ],
  },
  {
    id: "db-2", name: "VDU 에너지 효율 대시보드", description: "감압탑 에너지 소비, 열회수율 추적", unit: "VDU", updatedAt: "2026-02-17",
    widgets: [
      { id: "w1", type: "trend", tag: "TI-2001", title: "Column Top 온도", colSpan: 2, configured: true, tags: ["TI-2001"], displayMode: "individual" },
      { id: "w2", type: "trend", tag: "TI-2002", title: "Column Bottom 온도", colSpan: 2, configured: true, tags: ["TI-2002"], displayMode: "individual" },
      { id: "w3", type: "kpi", tag: "PI-2001", title: "Column 압력", colSpan: 1, configured: true },
      { id: "w4", type: "gauge", tag: "LI-2001", title: "Bottom Level", colSpan: 1, configured: true },
      { id: "w5", type: "table", tag: "FI-2001", title: "Feed 유량 로그", colSpan: 2, configured: true },
    ],
  },
  {
    id: "db-3", name: "공정간 유틸리티 비교", description: "Steam/전기/냉각수 사용량 공정간 비교", unit: "전체", updatedAt: "2026-02-16",
    widgets: [
      { id: "w1", type: "trend", tag: "TI-3001", title: "HCR 열소비", colSpan: 2, configured: true, tags: ["TI-3001"], displayMode: "individual" },
      { id: "w2", type: "trend", tag: "TI-2001", title: "VDU 열소비", colSpan: 2, configured: true, tags: ["TI-2001"], displayMode: "individual" },
      { id: "w3", type: "kpi", tag: "TI-1001", title: "CDU Column Top", colSpan: 1, configured: true },
      { id: "w4", type: "kpi", tag: "PI-1001", title: "CDU 압력", colSpan: 1, configured: true },
      { id: "w5", type: "gauge", tag: "FI-1001", title: "Crude Feed", colSpan: 1, configured: true },
      { id: "w6", type: "gauge", tag: "LI-2001", title: "VDU Level", colSpan: 1, configured: true },
    ],
  },
]

// =========================================================================
// Main Component
// =========================================================================
export default function CustomDashboardPage() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get("id")

  const [dashboards, setDashboards] = useState<DashboardItem[]>(INITIAL_DASHBOARDS)
  const [folders, setFolders] = useState<DashboardFolder[]>(INITIAL_FOLDERS)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(INITIAL_FOLDERS.map(f => f.id)))
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newUnit, setNewUnit] = useState("")
  const [newFolderId, setNewFolderId] = useState<string>("")

  // Folder dialog state
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<DashboardFolder | null>(null)
  const [folderName, setFolderName] = useState("")
  const [folderPermission, setFolderPermission] = useState<FolderPermission>("personal")
  const [folderTeamId, setFolderTeamId] = useState("")

  // Add widget dialog
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [addWidgetTab, setAddWidgetTab] = useState<"oop" | "trend" | "table">("oop")
  const [oopCategoryFilter, setOopCategoryFilter] = useState<string>("전체")
  const [oopSearch, setOopSearch] = useState("")

  // Widget config dialog
  const [configWidgetId, setConfigWidgetId] = useState<string | null>(null)
  const [cfgProcess, setCfgProcess] = useState<string>("")
  const [cfgZone, setCfgZone] = useState<string>("")
  const [cfgEquipment, setCfgEquipment] = useState<string>("")
  const [cfgEquipmentList, setCfgEquipmentList] = useState<string[]>([]) // multi-select
  const [cfgTags, setCfgTags] = useState<string[]>([])
  const [cfgDisplayMode, setCfgDisplayMode] = useState<"individual" | "overlay">("individual")
  const [cfgTitle, setCfgTitle] = useState("")
  const [cfgColSpan, setCfgColSpan] = useState(2)
  // Table config
  const [cfgTableGroupId, setCfgTableGroupId] = useState<string>("")

  const selected = dashboards.find(d => d.id === selectedId) || null

  const updateDashboard = useCallback((fn: (d: DashboardItem) => DashboardItem) => {
    setDashboards(prev => prev.map(d => d.id === selectedId ? fn(d) : d))
  }, [selectedId])

  // ========== Folder CRUD ==========
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const openFolderDialog = (folder?: DashboardFolder) => {
    if (folder) {
      setEditingFolder(folder)
      setFolderName(folder.name)
      setFolderPermission(folder.permission)
      setFolderTeamId(folder.teamId || "")
    } else {
      setEditingFolder(null)
      setFolderName("")
      setFolderPermission("personal")
      setFolderTeamId("")
    }
    setShowFolderDialog(true)
  }

  const handleSaveFolder = () => {
    if (!folderName.trim()) return
    if (editingFolder) {
      // Update existing folder
      setFolders(prev => prev.map(f => f.id === editingFolder.id ? {
        ...f,
        name: folderName.trim(),
        permission: folderPermission,
        teamId: folderPermission === "team" ? folderTeamId : undefined,
        teamName: folderPermission === "team" ? TEAM_OPTIONS.find(t => t.id === folderTeamId)?.name : undefined,
      } : f))
    } else {
      // Create new folder
      const newFolder: DashboardFolder = {
        id: `folder-${Date.now()}`,
        name: folderName.trim(),
        permission: folderPermission,
        teamId: folderPermission === "team" ? folderTeamId : undefined,
        teamName: folderPermission === "team" ? TEAM_OPTIONS.find(t => t.id === folderTeamId)?.name : undefined,
        createdAt: new Date().toISOString().slice(0, 10),
        dashboardIds: [],
      }
      setFolders(prev => [...prev, newFolder])
      setExpandedFolders(prev => new Set([...prev, newFolder.id]))
    }
    setShowFolderDialog(false)
  }

  const handleDeleteFolder = (folderId: string) => {
    // Move dashboards from this folder to unassigned
    const folder = folders.find(f => f.id === folderId)
    if (folder) {
      setDashboards(prev => prev.map(d => 
        folder.dashboardIds.includes(d.id) ? { ...d, folderId: undefined } : d
      ))
    }
    setFolders(prev => prev.filter(f => f.id !== folderId))
  }

  const getPermissionIcon = (permission: FolderPermission) => {
    switch (permission) {
      case "personal": return <User className="h-4 w-4" />
      case "team": return <Users className="h-4 w-4" />
      case "department": return <Building className="h-4 w-4" />
      case "company": return <Globe className="h-4 w-4" />
    }
  }

  // ========== Dashboard CRUD ==========
  const handleCreate = () => {
    if (!newName.trim()) return
    const nd: DashboardItem = {
      id: `db-${Date.now()}`, name: newName.trim(), description: newDesc.trim(),
      unit: newUnit.trim() || "사용자", updatedAt: new Date().toISOString().slice(0, 10), widgets: [],
      folderId: newFolderId || undefined,
    }
    // If folder selected, add to folder's dashboardIds
    if (newFolderId) {
      setFolders(prev => prev.map(f => f.id === newFolderId ? { ...f, dashboardIds: [...f.dashboardIds, nd.id] } : f))
    }
    setDashboards(prev => [nd, ...prev])
    setSelectedId(nd.id)
    setShowCreateDialog(false)
    setNewName(""); setNewDesc(""); setNewUnit(""); setNewFolderId("")
  }
  const handleDelete = (id: string) => {
    // Remove from folder
    setFolders(prev => prev.map(f => ({ ...f, dashboardIds: f.dashboardIds.filter(did => did !== id) })))
    setDashboards(prev => prev.filter(d => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveDashboardToFolder = (dashboardId: string, targetFolderId: string | null) => {
    // Remove from all folders first
    setFolders(prev => prev.map(f => ({ ...f, dashboardIds: f.dashboardIds.filter(id => id !== dashboardId) })))
    // Add to target folder if specified
    if (targetFolderId) {
      setFolders(prev => prev.map(f => f.id === targetFolderId ? { ...f, dashboardIds: [...f.dashboardIds, dashboardId] } : f))
    }
    setDashboards(prev => prev.map(d => d.id === dashboardId ? { ...d, folderId: targetFolderId || undefined } : d))
  }

  // Get dashboards not in any folder
  const unassignedDashboards = useMemo(() => {
    const assignedIds = new Set(folders.flatMap(f => f.dashboardIds))
    return dashboards.filter(d => !assignedIds.has(d.id))
  }, [folders, dashboards])

  // ========== Widget Add ==========
  const addOopWidget = (comp: OOPComponent) => {
    const w: WidgetConfig = {
      id: `w-${Date.now()}`, type: "oop-component", title: comp.name, colSpan: 2,
      configured: true, componentId: comp.id, componentCategory: comp.category,
    }
    updateDashboard(d => ({ ...d, widgets: [...d.widgets, w], updatedAt: new Date().toISOString().slice(0, 10) }))
    setShowAddWidget(false)
  }

  const addFreeTrend = () => {
    const w: WidgetConfig = {
      id: `w-${Date.now()}`, type: "trend", title: "새 트렌드 위젯", colSpan: 2,
      configured: false, tags: [], displayMode: "individual",
    }
    updateDashboard(d => ({ ...d, widgets: [...d.widgets, w], updatedAt: new Date().toISOString().slice(0, 10) }))
    setShowAddWidget(false)
    // auto-open config
    setTimeout(() => openConfig(w), 100)
  }

  const addFreeTable = () => {
    const w: WidgetConfig = {
      id: `w-${Date.now()}`, type: "table", title: "새 테이블 위젯", colSpan: 2,
      configured: false, tags: [],
    }
    updateDashboard(d => ({ ...d, widgets: [...d.widgets, w], updatedAt: new Date().toISOString().slice(0, 10) }))
    setShowAddWidget(false)
    setTimeout(() => openConfig(w), 100)
  }

  // ========== Widget Config ==========
  const openConfig = (w: WidgetConfig) => {
    setConfigWidgetId(w.id)
    setCfgProcess(w.process || "")
    setCfgZone(w.zone || "")
    setCfgEquipment(w.equipment || "")
    setCfgEquipmentList(w.equipmentGroups?.map(g => g.equipmentId) || (w.equipment ? [w.equipment] : []))
    setCfgTags(w.tags || (w.tag ? [w.tag] : []))
    setCfgDisplayMode(w.displayMode || "individual")
    setCfgTitle(w.title)
    setCfgColSpan(w.colSpan)
    setCfgTableGroupId("")
  }

  const cfgProcessNode = EQUIPMENT_HIERARCHY.find(p => p.id === cfgProcess)
  const cfgZoneNode = cfgProcessNode?.zones.find(z => z.id === cfgZone)
  const cfgEquipNode = cfgZoneNode?.equipment.find(e => e.id === cfgEquipment)

  const handleSelectEquipment = (eqId: string) => {
    setCfgEquipment(eqId)
    // Toggle multi-select
    setCfgEquipmentList(prev => {
      const next = prev.includes(eqId) ? prev.filter(id => id !== eqId) : [...prev, eqId]
      // Aggregate all tags from selected equipment
      if (cfgZoneNode) {
        const allTags = next.flatMap(id => {
          const eq = cfgZoneNode.equipment.find(e => e.id === id)
          return eq ? eq.tags : []
        })
        setCfgTags([...new Set(allTags)])
      }
      return next
    })
  }

  const handleSelectTableGroup = (groupId: string) => {
    setCfgTableGroupId(groupId)
    const group = TABLE_GROUPS.find(g => g.id === groupId)
    if (group) {
      setCfgTags(group.tags)
      setCfgTitle(group.name)
      setCfgProcess(group.process)
    }
  }

  // Build equipment groups from current selection
  const cfgEquipmentGroups: EquipmentGroup[] = cfgEquipmentList.map(eqId => {
    const eq = cfgZoneNode?.equipment.find(e => e.id === eqId)
    return eq ? { equipmentId: eq.id, equipmentName: eq.name, tags: eq.tags } : null
  }).filter(Boolean) as EquipmentGroup[]

  const saveConfig = () => {
    if (!configWidgetId) return
    updateDashboard(d => ({
      ...d,
      widgets: d.widgets.map(w => w.id === configWidgetId ? {
        ...w, configured: true, title: cfgTitle, colSpan: cfgColSpan,
        process: cfgProcess, zone: cfgZone, equipment: cfgEquipmentList[0] || cfgEquipment,
        equipmentGroups: cfgEquipmentGroups.length > 0 ? cfgEquipmentGroups : undefined,
        tags: cfgTags, tag: cfgTags[0] || w.tag, displayMode: cfgDisplayMode,
      } : w),
      updatedAt: new Date().toISOString().slice(0, 10),
    }))
    setConfigWidgetId(null)
  }

  const removeWidget = (widgetId: string) => {
    updateDashboard(d => ({ ...d, widgets: d.widgets.filter(w => w.id !== widgetId) }))
  }

  const resizeWidget = (widgetId: string, delta: number) => {
    updateDashboard(d => ({
      ...d,
      widgets: d.widgets.map(w => w.id === widgetId ? { ...w, colSpan: Math.max(1, Math.min(4, w.colSpan + delta)) } : w),
    }))
  }

  const configWidget = selected?.widgets.find(w => w.id === configWidgetId) || null

  // OOP filter
  const filteredOop = OOP_COMPONENTS.filter(c => {
    if (oopCategoryFilter !== "전체" && c.category !== oopCategoryFilter) return false
    if (oopSearch && !c.name.toLowerCase().includes(oopSearch.toLowerCase()) && !c.description.toLowerCase().includes(oopSearch.toLowerCase())) return false
    return true
  })

  // Dashboard card component
  const DashboardCard = ({ db }: { db: DashboardItem }) => (
    <Card key={db.id} className="hover:shadow-md transition-shadow cursor-pointer group relative" onClick={() => setSelectedId(db.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <LayoutGrid className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted cursor-pointer">
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem className="text-xs" onClick={() => setSelectedId(db.id)}>
                <Eye className="h-3.5 w-3.5 mr-2" />열기
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs">
                <Share2 className="h-3.5 w-3.5 mr-2" />폴더 이동
              </DropdownMenuItem>
              {folders.map(f => (
                <DropdownMenuItem key={f.id} className="text-xs pl-6" onClick={() => moveDashboardToFolder(db.id, f.id)}>
                  {getPermissionIcon(f.permission)}
                  <span className="ml-2">{f.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-red-600" onClick={() => handleDelete(db.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">{db.name}</h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{db.description}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{db.unit}</Badge>
          <span className="text-[10px] text-muted-foreground">{db.widgets.length}개</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{db.updatedAt}</span>
        </div>
      </CardContent>
    </Card>
  )

  // ===== List View =====
  if (!selected) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                커스텀 대시보드
              </h1>
              <p className="text-sm text-muted-foreground mt-1">폴더별로 대시보드를 정리하고 권한을 설정할 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1.5 cursor-pointer" onClick={() => openFolderDialog()}>
                <FolderPlus className="h-4 w-4" />
                새 폴더
              </Button>
              <Button className="gap-1.5 cursor-pointer" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                새 대시보드
              </Button>
            </div>
          </div>

          {/* Folder-based dashboard list */}
          <div className="space-y-4">
            {folders.map(folder => {
              const folderDashboards = dashboards.filter(d => folder.dashboardIds.includes(d.id))
              const isExpanded = expandedFolders.has(folder.id)
              const permConfig = PERMISSION_CONFIG[folder.permission]
              
              return (
                <Collapsible key={folder.id} open={isExpanded} onOpenChange={() => toggleFolder(folder.id)}>
                  <div className="border rounded-lg bg-card">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", 
                            permConfig.color === "blue" && "bg-blue-100 text-blue-600",
                            permConfig.color === "green" && "bg-green-100 text-green-600",
                            permConfig.color === "amber" && "bg-amber-100 text-amber-600",
                            permConfig.color === "purple" && "bg-purple-100 text-purple-600"
                          )}>
                            {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{folder.name}</span>
                              <Badge variant="secondary" className={cn("text-[10px]",
                                permConfig.color === "blue" && "bg-blue-100 text-blue-700",
                                permConfig.color === "green" && "bg-green-100 text-green-700",
                                permConfig.color === "amber" && "bg-amber-100 text-amber-700",
                                permConfig.color === "purple" && "bg-purple-100 text-purple-700"
                              )}>
                                {getPermissionIcon(folder.permission)}
                                <span className="ml-1">{permConfig.label}</span>
                              </Badge>
                              {folder.teamName && (
                                <span className="text-xs text-muted-foreground">({folder.teamName})</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{folderDashboards.length}개 대시보드</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs" onClick={() => openFolderDialog(folder)}>
                              <Settings className="h-3.5 w-3.5 mr-2" />폴더 설정
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs text-red-600" onClick={() => handleDeleteFolder(folder.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" />폴더 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        {folderDashboards.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground border-t">
                            이 폴더에 대시보드가 없습니다
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t">
                            {folderDashboards.map(db => <DashboardCard key={db.id} db={db} />)}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}

            {/* Unassigned dashboards */}
            {unassignedDashboards.length > 0 && (
              <div className="border rounded-lg bg-card">
                <div className="flex items-center gap-3 p-3 border-b">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">미분류 대시보드</span>
                    <p className="text-xs text-muted-foreground">{unassignedDashboards.length}개</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                  {unassignedDashboards.map(db => <DashboardCard key={db.id} db={db} />)}
                </div>
              </div>
            )}

            {/* Empty state */}
            {folders.length === 0 && dashboards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">아직 생성된 대시보드가 없습니다</p>
                <p className="text-xs text-muted-foreground mb-4">{"폴더를 만들고 대시보드를 정리해보세요."}</p>
              </div>
            )}
          </div>

          {/* Create Dashboard Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />새 대시보드 만들기</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="text-sm">대시보드 이름</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="예: HCR 촉매 성능 대시보드" /></div>
                <div className="space-y-2"><Label className="text-sm">설명</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="대시보드의 용도나 범위를 입력하세요" /></div>
                <div className="space-y-2"><Label className="text-sm">공정 단위</Label><Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="예: HCR, VDU, CDU, 전체" /></div>
                <div className="space-y-2">
                  <Label className="text-sm">저장 폴더</Label>
                  <Select value={newFolderId} onValueChange={setNewFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="폴더 선택 (선택사항)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">미분류</SelectItem>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          <div className="flex items-center gap-2">
                            {getPermissionIcon(f.permission)}
                            <span>{f.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="cursor-pointer">취소</Button>
                <Button onClick={handleCreate} disabled={!newName.trim()} className="cursor-pointer">생성</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Folder Settings Dialog */}
          <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingFolder ? <Settings className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
                  {editingFolder ? "폴더 설정" : "새 폴더 만들기"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">폴더 이름</Label>
                  <Input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="예: 내 대시보드, 팀 공용 등" />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm">접근 권한</Label>
                  <RadioGroup value={folderPermission} onValueChange={(v) => setFolderPermission(v as FolderPermission)} className="space-y-2">
                    {(Object.entries(PERMISSION_CONFIG) as [FolderPermission, typeof PERMISSION_CONFIG["personal"]][]).map(([key, config]) => (
                      <div key={key} className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        folderPermission === key ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      )} onClick={() => setFolderPermission(key)}>
                        <RadioGroupItem value={key} id={key} />
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center",
                          config.color === "blue" && "bg-blue-100 text-blue-600",
                          config.color === "green" && "bg-green-100 text-green-600",
                          config.color === "amber" && "bg-amber-100 text-amber-600",
                          config.color === "purple" && "bg-purple-100 text-purple-600"
                        )}>
                          {key === "personal" && <User className="h-4 w-4" />}
                          {key === "team" && <Users className="h-4 w-4" />}
                          {key === "department" && <Building className="h-4 w-4" />}
                          {key === "company" && <Globe className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{config.label}</Label>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Team selection for team permission */}
                {folderPermission === "team" && (
                  <div className="space-y-2">
                    <Label className="text-sm">공유 대상 팀</Label>
                    <Select value={folderTeamId} onValueChange={setFolderTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="팀 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_OPTIONS.map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFolderDialog(false)} className="cursor-pointer">취소</Button>
                <Button onClick={handleSaveFolder} disabled={!folderName.trim() || (folderPermission === "team" && !folderTeamId)} className="cursor-pointer">
                  {editingFolder ? "저장" : "생성"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    )
  }

  // ===== Detail View =====
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5 cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> 목록
            </Button>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-amber-600" />{selected.name}
            </h1>
            <Badge variant="outline">{selected.unit}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{selected.updatedAt}</span>
            <Button onClick={() => { setShowAddWidget(true); setAddWidgetTab("oop"); setOopSearch(""); setOopCategoryFilter("전체") }} className="gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" /> 위젯 추가
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{selected.description}</p>

        {/* Widgets Grid */}
        {selected.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-lg">
            <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">아직 위젯이 없습니다</p>
            <p className="text-xs text-muted-foreground mb-4">위젯을 추가하여 대시보드를 구성해보세요.</p>
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer"
              onClick={() => { setShowAddWidget(true); setAddWidgetTab("oop") }}>
              <Plus className="h-4 w-4" /> 위젯 추가
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {selected.widgets.map((w, idx) => {
              const span = w.colSpan === 1 ? "col-span-1" : w.colSpan === 3 ? "col-span-3" : w.colSpan === 4 ? "col-span-4" : "col-span-2"

              // Unconfigured placeholder
              if (!w.configured) {
                return (
                  <Card key={w.id} className={cn("border-2 border-dashed border-border", span)}>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        {w.type === "trend" ? <TrendingUp className="h-5 w-5 text-muted-foreground" /> : <Table className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <p className="text-sm font-medium mb-1">{w.type === "trend" ? "트렌드 위젯" : "테이블 위젯"}</p>
                      <p className="text-xs text-muted-foreground mb-3">설정이 필요합니다</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => openConfig(w)}>
                          <Settings className="h-3.5 w-3.5" /> 설정
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => removeWidget(w.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              // OOP component widget
              if (w.type === "oop-component") {
                const comp = OOP_COMPONENTS.find(c => c.id === w.componentId)
                return (
                  <Card key={w.id} className={cn("group relative overflow-hidden", span)}>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => resizeWidget(w.id, -1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted" title="축소">
                        <Minimize2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => resizeWidget(w.id, 1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted" title="확대">
                        <Maximize2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeWidget(w.id)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <Component className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{w.title}</p>
                          <p className="text-[11px] text-muted-foreground">{comp?.category}</p>
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-muted/30 p-4 min-h-[100px] flex flex-col items-center justify-center text-center">
                        <Eye className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">{comp?.description}</p>
                        <p className="text-[11px] text-primary mt-1 font-mono">{comp?.sourcePage}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              // Configured trend widget
              if (w.type === "trend" && w.tags && w.tags.length > 0) {
                const tagTrends = w.tags.map(t => ({ tag: t, ...generateTagTrend(t) }))
                const hasGroups = w.equipmentGroups && w.equipmentGroups.length > 1

                return (
                  <Card key={w.id} className={cn("group relative overflow-hidden", span)}>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => openConfig(w)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted" title="설정">
                        <Settings className="h-3 w-3" />
                      </button>
                      <button onClick={() => resizeWidget(w.id, -1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Minimize2 className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, 1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Maximize2 className="h-3 w-3" /></button>
                      <button onClick={() => removeWidget(w.id)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                    </div>
                    <div className="px-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-xs font-medium">{w.title}</span>
                        {w.process && <Badge variant="outline" className="text-[10px] h-4">{w.process}</Badge>}
                        {hasGroups && <Badge variant="secondary" className="text-[10px] h-4">{w.equipmentGroups!.length}개 그룹</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {w.displayMode === "overlay" && <Badge variant="secondary" className="text-[10px] h-4">겹쳐보기</Badge>}
                        <span className="text-[11px] text-muted-foreground">{w.tags?.length || 0}개 태그</span>
                      </div>
                    </div>
                    <div className="px-2 pb-1">
                      {hasGroups ? (
                        /* Grouped display: separate section per equipment */
                        <div className="space-y-2">
                          {w.equipmentGroups!.map((group, gi) => {
                            const groupTrends = group.tags.map(t => ({ tag: t, ...generateTagTrend(t) }))
                            return (
                              <div key={group.equipmentId}>
                                <div className="flex items-center gap-1.5 px-2 pt-1.5">
                                  <div className="h-4 w-1 rounded-full" style={{ backgroundColor: COLORS[gi % COLORS.length] }} />
                                  <span className="text-[11px] font-semibold">{group.equipmentId}</span>
                                  <span className="text-[10px] text-muted-foreground">{group.equipmentName}</span>
                                </div>
                                {w.displayMode === "overlay" && groupTrends.length >= 2 ? (
                                  <div>
                                    <div className="flex flex-wrap gap-2 px-2 py-0.5">
                                      {groupTrends.map(({ tag, current, unit }, i) => (
                                        <div key={tag} className="flex items-center gap-1 text-[10px]">
                                          <div className="w-2 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                          <span className="font-mono">{tag}</span>
                                          <span className="text-muted-foreground">{current}{unit}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <OverlayTrendChart tags={groupTrends} colors={COLORS} />
                                  </div>
                                ) : (
                                  groupTrends.map(({ tag, values, unit, high, low, current }, i) => {
                                    const isAlert = high !== null && current > high
                                    return (
                                      <div key={tag}>
                                        <div className="px-2 pt-0.5 flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="font-mono text-[11px]">{tag}</span>
                                            {isAlert && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">초과</Badge>}
                                          </div>
                                          <span className="text-[11px] font-semibold">{current} <span className="font-normal text-muted-foreground">{unit}</span></span>
                                        </div>
                                        <TrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} height="h-16" />
                                      </div>
                                    )
                                  })
                                )}
                                {gi < w.equipmentGroups!.length - 1 && <div className="border-t border-border/30 mx-2" />}
                              </div>
                            )
                          })}
                        </div>
                      ) : w.displayMode === "overlay" && tagTrends.length >= 2 ? (
                        <div>
                          <div className="flex flex-wrap gap-2 px-2 py-1">
                            {tagTrends.map(({ tag, current, unit }, i) => (
                              <div key={tag} className="flex items-center gap-1 text-[11px]">
                                <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="font-mono">{tag}</span>
                                <span className="text-muted-foreground">{current}{unit}</span>
                              </div>
                            ))}
                          </div>
                          <OverlayTrendChart tags={tagTrends} colors={COLORS} />
                        </div>
                      ) : (
                        tagTrends.map(({ tag, values, unit, high, low, current }, i) => {
                          const isAlert = high !== null && current > high
                          return (
                            <div key={tag}>
                              <div className="px-2 pt-1 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="font-mono text-[11px]">{tag}</span>
                                  {isAlert && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">초과</Badge>}
                                </div>
                                <span className="text-[11px] font-semibold">{current} <span className="font-normal text-muted-foreground">{unit}</span></span>
                              </div>
                              <TrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} height="h-20" />
                            </div>
                          )
                        })
                      )}
                    </div>
                  </Card>
                )
              }

              // Configured table widget
              if (w.type === "table") {
                const tableTags = w.tags && w.tags.length > 0 ? w.tags : (w.tag ? [w.tag] : [])
                const tagData = tableTags.map(t => ({ tag: t, ...generateTagTrend(t) }))
                const hasTableGroups = w.equipmentGroups && w.equipmentGroups.length > 1

                const renderTableRows = (tags: { tag: string; current: number; unit: string; high: number | null; low: number | null }[]) => (
                  tags.map(({ tag, current, unit, high, low }) => {
                    const over = high !== null && current > high
                    const under = low !== null && current < low
                    return (
                      <tr key={tag} className="border-b border-border/30">
                        <td className="py-1.5 px-2 font-mono font-medium">{tag}</td>
                        <td className={cn("py-1.5 px-2 text-right font-mono font-medium", (over || under) ? "text-red-600" : "")}>{current}</td>
                        <td className="py-1.5 px-2 text-right text-muted-foreground">{unit}</td>
                        <td className="py-1.5 px-2 text-right text-red-400 font-mono">{high ?? "-"}</td>
                        <td className="py-1.5 px-2 text-right text-blue-400 font-mono">{low ?? "-"}</td>
                        <td className="py-1.5 px-2 text-right">
                          <span className={cn("inline-block w-2 h-2 rounded-full", (over || under) ? "bg-red-500" : "bg-green-500")} />
                        </td>
                      </tr>
                    )
                  })
                )

                return (
                  <Card key={w.id} className={cn("group relative overflow-hidden", span)}>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => openConfig(w)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Settings className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, -1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Minimize2 className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, 1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Maximize2 className="h-3 w-3" /></button>
                      <button onClick={() => removeWidget(w.id)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-xs font-medium">{w.title}</span>
                        {w.process && <Badge variant="outline" className="text-[10px] h-4">{w.process}</Badge>}
                        {hasTableGroups && <Badge variant="secondary" className="text-[10px] h-4">{w.equipmentGroups!.length}개 그룹</Badge>}
                      </div>

                      {hasTableGroups ? (
                        /* Grouped table display */
                        <div className="space-y-3">
                          {w.equipmentGroups!.map((group, gi) => {
                            const groupTagData = group.tags.map(t => ({ tag: t, ...generateTagTrend(t) }))
                            return (
                              <div key={group.equipmentId}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <div className="h-3.5 w-1 rounded-full" style={{ backgroundColor: COLORS[gi % COLORS.length] }} />
                                  <span className="text-[11px] font-semibold">{group.equipmentId}</span>
                                  <span className="text-[10px] text-muted-foreground">{group.equipmentName}</span>
                                </div>
                                <table className="w-full text-xs">
                                  <thead><tr className="border-b border-border text-muted-foreground">
                                    <th className="text-left py-1.5 px-2">Tag</th>
                                    <th className="text-right py-1.5 px-2">현재값</th>
                                    <th className="text-right py-1.5 px-2">단위</th>
                                    <th className="text-right py-1.5 px-2">High</th>
                                    <th className="text-right py-1.5 px-2">Low</th>
                                    <th className="text-right py-1.5 px-2">상태</th>
                                  </tr></thead>
                                  <tbody>
                                    {renderTableRows(groupTagData)}
                                  </tbody>
                                </table>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-1.5 px-2">Tag</th>
                          <th className="text-right py-1.5 px-2">현재값</th>
                          <th className="text-right py-1.5 px-2">단위</th>
                          <th className="text-right py-1.5 px-2">High</th>
                          <th className="text-right py-1.5 px-2">Low</th>
                          <th className="text-right py-1.5 px-2">상태</th>
                        </tr></thead>
                        <tbody>
                          {tagData.map(({ tag, current, unit, high, low }) => {
                            const over = high !== null && current > high
                            const under = low !== null && current < low
                            return (
                              <tr key={tag} className="border-b border-border/30">
                                <td className="py-1.5 px-2 font-mono font-medium">{tag}</td>
                                <td className={cn("py-1.5 px-2 text-right font-mono font-medium", (over || under) ? "text-red-600" : "")}>{current}</td>
                                <td className="py-1.5 px-2 text-right text-muted-foreground">{unit}</td>
                                <td className="py-1.5 px-2 text-right text-red-400 font-mono">{high ?? "-"}</td>
                                <td className="py-1.5 px-2 text-right text-blue-400 font-mono">{low ?? "-"}</td>
                                <td className="py-1.5 px-2 text-right">
                                  <span className={cn("inline-block w-2 h-2 rounded-full", (over || under) ? "bg-red-500" : "bg-green-500")} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      )}
                    </CardContent>
                  </Card>
                )
              }

              // KPI widget (legacy)
              if (w.type === "kpi" && w.tag) {
                const trend = generateTagTrend(w.tag)
                const isAlert = trend.high !== null && trend.current > trend.high
                return (
                  <Card key={w.id} className={cn("group relative", span)}>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => resizeWidget(w.id, -1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Minimize2 className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, 1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Maximize2 className="h-3 w-3" /></button>
                      <button onClick={() => removeWidget(w.id)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">{w.title}</p>
                        <span className="font-mono text-[10px] text-muted-foreground">{w.tag}</span>
                      </div>
                      <p className={cn("text-3xl font-bold tabular-nums", isAlert ? "text-red-600" : "text-foreground")}>{trend.current}</p>
                      <p className="text-xs text-muted-foreground mt-1">{trend.unit}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {trend.high !== null && <span>H: <span className="text-red-500 font-medium">{trend.high}</span></span>}
                        {trend.low !== null && <span>L: <span className="text-blue-500 font-medium">{trend.low}</span></span>}
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              // Gauge widget (legacy)
              if (w.type === "gauge" && w.tag) {
                const trend = generateTagTrend(w.tag)
                const pct = trend.high ? Math.min(100, (trend.current / trend.high) * 100) : 50
                const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e"
                return (
                  <Card key={w.id} className={cn("group relative flex flex-col items-center", span)}>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => resizeWidget(w.id, -1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Minimize2 className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, 1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Maximize2 className="h-3 w-3" /></button>
                      <button onClick={() => removeWidget(w.id)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                    </div>
                    <CardContent className="p-4 flex flex-col items-center">
                      <p className="text-xs text-muted-foreground mb-2 self-start">{w.title}</p>
                      <svg viewBox="0 0 120 80" className="w-28 h-20 my-1">
                        <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="8" strokeLinecap="round" />
                        <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * 1.57} 157`} />
                        <text x="60" y="60" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">{pct.toFixed(0)}%</text>
                      </svg>
                      <p className="text-sm font-semibold">{trend.current} <span className="text-xs font-normal text-muted-foreground">{trend.unit}</span></p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{w.tag}</p>
                    </CardContent>
                  </Card>
                )
              }

              // Fallback: single-tag trend (legacy)
              if (w.tag) {
                const trend = generateTagTrend(w.tag)
                const isAlert = trend.high !== null && trend.current > trend.high
                return (
                  <Card key={w.id} className={cn("group relative overflow-hidden", span, isAlert && "border-red-200")}>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => openConfig(w)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Settings className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, -1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Minimize2 className="h-3 w-3" /></button>
                      <button onClick={() => resizeWidget(w.id, 1)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted"><Maximize2 className="h-3 w-3" /></button>
                      <button onClick={() => removeWidget(w.id)} className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                    </div>
                    <div className="px-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-xs font-medium">{w.title}</span>
                        {isAlert && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">초과</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{w.tag}</span>
                        <span className="font-semibold text-foreground">{trend.current} {trend.unit}</span>
                      </div>
                    </div>
                    <div className="px-2">
                      <TrendChart values={trend.values} high={trend.high} low={trend.low} color={COLORS[idx % COLORS.length]} height="h-24" />
                    </div>
                  </Card>
                )
              }

              return null
            })}
          </div>
        )}
      </div>

      {/* ===== Add Widget Dialog ===== */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> 위젯 추가</DialogTitle>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/30 shrink-0">
            <button onClick={() => setAddWidgetTab("oop")} className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer", addWidgetTab === "oop" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Component className="h-4 w-4" /> OOP 기존 컴포넌트
            </button>
            <button onClick={() => setAddWidgetTab("trend")} className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer", addWidgetTab === "trend" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <TrendingUp className="h-4 w-4" /> 자유 트렌드
            </button>
            <button onClick={() => setAddWidgetTab("table")} className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer", addWidgetTab === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Table className="h-4 w-4" /> 자유 테이블
            </button>
          </div>

          {/* Tab A: OOP Components */}
          {addWidgetTab === "oop" && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={oopSearch} onChange={e => setOopSearch(e.target.value)} placeholder="컴포넌트 검색..." className="pl-9" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setOopCategoryFilter("전체")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer", oopCategoryFilter === "전체" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>전체</button>
                  {OOP_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setOopCategoryFilter(cat)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap", oopCategoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {filteredOop.map(comp => (
                    <Card key={comp.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Component className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold">{comp.name}</p>
                              <Button size="sm" variant="outline" className="shrink-0 gap-1 cursor-pointer h-8" onClick={() => addOopWidget(comp)}>
                                <Plus className="h-3.5 w-3.5" /> 추가
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{comp.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="secondary" className="text-[11px]">{comp.category}</Badge>
                              <span className="text-[11px] text-muted-foreground font-mono">{comp.sourcePage}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab B: Free Trend */}
          {addWidgetTab === "trend" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">자유 트렌드 위젯</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-1">빈 트렌드 위젯을 대시보드에 추가합니다.</p>
              <p className="text-xs text-muted-foreground max-w-md mb-6">추가 후 설정 버튼을 눌러 공정/구역/설비를 선택하면 관련 태그가 자동으로 매핑되며, 개별 또는 겹쳐 보기 모드를 선택할 수 있습니다.</p>
              <Button className="gap-2 cursor-pointer" onClick={addFreeTrend}>
                <Plus className="h-4 w-4" /> 트렌드 위젯 추가
              </Button>
            </div>
          )}

          {/* Tab C: Free Table */}
          {addWidgetTab === "table" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                <Table className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">자유 테이블 위젯</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-1">빈 테이블 위젯을 대시보드에 추가합니다.</p>
              <p className="text-xs text-muted-foreground max-w-md mb-6">추가 후 설정에서 사전 정의된 데이터 그룹을 선택하거나, 공정/구역/설비 기반으로 태그를 매핑하여 실시간 데이터 테이블을 구성합니다.</p>
              <Button className="gap-2 cursor-pointer" onClick={addFreeTable}>
                <Plus className="h-4 w-4" /> 테이블 위젯 추가
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Widget Configuration Dialog ===== */}
      <Dialog open={configWidgetId !== null} onOpenChange={(open) => { if (!open) setConfigWidgetId(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              위젯 설정
              {configWidget && <Badge variant="secondary" className="ml-2">{configWidget.type === "trend" ? "트렌드" : "테이블"}</Badge>}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-auto space-y-5 pb-2">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">위젯 제목</Label>
              <Input value={cfgTitle} onChange={e => setCfgTitle(e.target.value)} placeholder="위젯 제목을 입력하세요" />
            </div>

            {/* Quick table group (table only) */}
            {configWidget?.type === "table" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">사전 정의 데이터 그룹 (빠른 선택)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TABLE_GROUPS.map(g => (
                    <button key={g.id} onClick={() => handleSelectTableGroup(g.id)}
                      className={cn("text-left p-3 rounded-lg border transition-all cursor-pointer",
                        cfgTableGroupId === g.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50")}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-4">{g.process}</Badge>
                        <span className="text-xs font-medium">{g.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{g.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{g.tags.length}개 태그</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">또는 수동으로 구성</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </div>
            )}

            {/* Process -> Zone -> Equipment selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">공정/구역/설비 선택</Label>

              {/* Process */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">1. 공정 선택</p>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_HIERARCHY.map(p => (
                    <button key={p.id} onClick={() => { setCfgProcess(p.id); setCfgZone(""); setCfgEquipment(""); setCfgEquipmentList([]); if (!cfgTableGroupId) setCfgTags([]) }}
                      className={cn("px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                        cfgProcess === p.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone */}
              {cfgProcessNode && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">2. 구역 선택</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cfgProcessNode.zones.map(z => (
                      <button key={z.id} onClick={() => { setCfgZone(z.id); setCfgEquipment(""); setCfgEquipmentList([]); if (!cfgTableGroupId) setCfgTags([]) }}
                        className={cn("px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                          cfgZone === z.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                        {z.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment (multi-select) */}
              {cfgZoneNode && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">3. 설비 선택 <span className="text-primary font-medium">(다중 선택 가능)</span></p>
                  <div className="grid grid-cols-1 gap-2">
                    {cfgZoneNode.equipment.map(eq => {
                      const isSelected = cfgEquipmentList.includes(eq.id)
                      return (
                        <button key={eq.id} onClick={() => handleSelectEquipment(eq.id)}
                          className={cn("text-left p-3 rounded-lg border transition-all cursor-pointer",
                            isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-muted/50")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded border border-border shrink-0" />
                              )}
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
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Tags confirmation */}
            {cfgTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">매핑된 태그 ({cfgTags.length}개)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {cfgTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 font-mono text-xs cursor-pointer" onClick={() => setCfgTags(prev => prev.filter(t => t !== tag))}>
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">태그를 클릭하면 제거됩니다. 설비 재선택으로 추가할 수 있습니다.</p>
              </div>
            )}

            {/* Display mode (trend only) */}
            {configWidget?.type === "trend" && cfgTags.length >= 2 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">표시 모드</Label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCfgDisplayMode("individual")}
                    className={cn("flex-1 p-3 rounded-lg border transition-all cursor-pointer text-center",
                      cfgDisplayMode === "individual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                    <BarChart3 className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-sm font-medium">개별 보기</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">태그별 개별 차트</p>
                  </button>
                  <button onClick={() => setCfgDisplayMode("overlay")}
                    className={cn("flex-1 p-3 rounded-lg border transition-all cursor-pointer text-center",
                      cfgDisplayMode === "overlay" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                    <Layers className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-sm font-medium">겹쳐 보기</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">하나의 차트에 겹쳐서</p>
                  </button>
                </div>
              </div>
            )}

            {/* Size */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">위젯 크기</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(size => (
                  <button key={size} onClick={() => setCfgColSpan(size)}
                    className={cn("flex-1 py-2 rounded-lg border text-center text-sm font-medium transition-colors cursor-pointer",
                      cfgColSpan === size ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                    {size}/4
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setConfigWidgetId(null)} className="cursor-pointer">취소</Button>
            <Button onClick={saveConfig} disabled={cfgTags.length === 0 || !cfgTitle.trim()} className="gap-1.5 cursor-pointer">
              <Check className="h-4 w-4" /> 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
