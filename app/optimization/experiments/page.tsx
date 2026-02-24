"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AVAILABLE_TAGS, DCS_GRAPHICS } from "@/lib/process-data"
import { saveTicket } from "@/lib/storage"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Plus, Search, ChevronRight, ChevronLeft, Upload, X, Trash2,
  Send, Link2, CheckCircle, Clock, AlertTriangle, Play,
  ArrowUpRight, FileSpreadsheet, Monitor,
  LayoutGrid, Database, Cpu, Beaker, Eye, TrendingUp,
  BarChart3, ExternalLink, FlaskConical, ArrowLeft, Grip, FileUp,
  Check, CircleDot, Tag, Layers
} from "lucide-react"

// --- Types ---
type ModelStatus = "draft" | "data-ready" | "modeling" | "endpoint-registered" | "config-requested" | "configured" | "testing" | "production" | "dropped"

interface ModelEntry {
  id: string
  name: string
  purpose: string
  unit: string
  equipment: string
  description: string
  status: ModelStatus
  currentStep: number
  createdDate: string
  creator: string
  endpointUrl: string
  dataSource: "tag-grid" | "dcs-select" | "csv" | ""
  selectedTags: string[]
  trainingPeriod: { from: string; to: string }
  csvFiles: string[]
  accuracy: { rmse: number; mae: number; r2: number; mape: number } | null
  dropReason: string
}

// --- Tag metadata for DCS visual ---
interface DcsTagNode {
  id: string
  label: string
  type: "temperature" | "pressure" | "flow" | "level" | "control"
  x: number  // percentage 0-100
  y: number  // percentage 0-100
}

const DCS_TAG_NODES: Record<string, Record<string, DcsTagNode[]>> = {
  HCR: {
    "G-3001": [
      { id: "TI-3001", label: "Reactor Inlet Temp", type: "temperature", x: 25, y: 20 },
      { id: "TI-3002", label: "Reactor Outlet Temp", type: "temperature", x: 25, y: 70 },
      { id: "PI-3001", label: "Reactor Pressure", type: "pressure", x: 40, y: 15 },
      { id: "FI-3001", label: "Feed Flow", type: "flow", x: 10, y: 40 },
      { id: "LI-3001", label: "Separator Level", type: "level", x: 65, y: 55 },
      { id: "TIC-3001", label: "Temp Controller", type: "control", x: 25, y: 45 },
      { id: "PIC-3001", label: "Pressure Controller", type: "control", x: 50, y: 25 },
      { id: "FIC-2001", label: "H2 Makeup Flow", type: "flow", x: 15, y: 15 },
    ],
    "G-3002": [
      { id: "TI-3001", label: "Bed #1 Inlet", type: "temperature", x: 30, y: 15 },
      { id: "TI-3002", label: "Bed #1 Outlet", type: "temperature", x: 30, y: 40 },
      { id: "PI-3001", label: "Reactor dP", type: "pressure", x: 45, y: 28 },
      { id: "FI-3001", label: "Feed Flow", type: "flow", x: 10, y: 30 },
      { id: "TIC-3001", label: "Quench Control", type: "control", x: 55, y: 35 },
      { id: "FIC-2001", label: "Quench Flow", type: "flow", x: 60, y: 50 },
      { id: "LI-3001", label: "HP Sep Level", type: "level", x: 75, y: 60 },
      { id: "PIC-3001", label: "HP Sep Pressure", type: "control", x: 80, y: 40 },
    ],
    "G-3003": [
      { id: "TI-3001", label: "Frac Top Temp", type: "temperature", x: 35, y: 10 },
      { id: "TI-3002", label: "Frac Bottom Temp", type: "temperature", x: 35, y: 80 },
      { id: "PI-3001", label: "Frac Pressure", type: "pressure", x: 50, y: 15 },
      { id: "FI-3001", label: "Naphtha Flow", type: "flow", x: 70, y: 20 },
      { id: "LI-3001", label: "Bottom Level", type: "level", x: 35, y: 65 },
      { id: "TIC-3001", label: "Reflux Temp", type: "control", x: 60, y: 30 },
    ],
    "G-3004": [
      { id: "PI-3001", label: "H2 Header Press", type: "pressure", x: 20, y: 25 },
      { id: "FI-3001", label: "H2 Makeup", type: "flow", x: 40, y: 35 },
      { id: "FIC-2001", label: "Recycle Gas", type: "flow", x: 60, y: 45 },
      { id: "TI-3001", label: "Compressor Outlet", type: "temperature", x: 75, y: 30 },
    ],
  },
  CDU: {
    "G-1001": [
      { id: "TI-1001", label: "Column Top Temp", type: "temperature", x: 35, y: 10 },
      { id: "TI-1002", label: "Column Bottom Temp", type: "temperature", x: 35, y: 80 },
      { id: "PI-1001", label: "Column Pressure", type: "pressure", x: 50, y: 15 },
      { id: "FI-1001", label: "Crude Feed", type: "flow", x: 10, y: 50 },
      { id: "LI-1001", label: "Bottom Level", type: "level", x: 35, y: 65 },
      { id: "TIC-1001", label: "Top Temp Ctrl", type: "control", x: 55, y: 25 },
      { id: "PIC-1001", label: "Pressure Ctrl", type: "control", x: 60, y: 10 },
      { id: "FIC-1001", label: "Reflux Flow", type: "flow", x: 70, y: 20 },
    ],
    "G-1002": [
      { id: "TI-1001", label: "Overhead Temp", type: "temperature", x: 30, y: 10 },
      { id: "TI-1002", label: "Flash Zone", type: "temperature", x: 30, y: 60 },
      { id: "PI-1001", label: "Tower dP", type: "pressure", x: 45, y: 35 },
      { id: "FI-1001", label: "Feed", type: "flow", x: 10, y: 50 },
      { id: "LI-1001", label: "Bottom Level", type: "level", x: 30, y: 80 },
    ],
    "G-1003": [
      { id: "TI-1001", label: "Preheat Out", type: "temperature", x: 50, y: 30 },
      { id: "TI-1002", label: "Desalter Temp", type: "temperature", x: 25, y: 45 },
      { id: "FI-1001", label: "Crude Flow", type: "flow", x: 10, y: 40 },
    ],
    "G-1004": [
      { id: "TI-1001", label: "Furnace Outlet", type: "temperature", x: 60, y: 30 },
      { id: "TI-1002", label: "Coil Outlet", type: "temperature", x: 60, y: 60 },
      { id: "FI-1001", label: "Fuel Gas", type: "flow", x: 20, y: 50 },
      { id: "TIC-1001", label: "COT Control", type: "control", x: 75, y: 45 },
    ],
  },
  VDU: {
    "G-2001": [
      { id: "TI-2001", label: "Column Top", type: "temperature", x: 35, y: 10 },
      { id: "TI-2002", label: "Column Bottom", type: "temperature", x: 35, y: 80 },
      { id: "PI-2001", label: "Top Pressure", type: "pressure", x: 50, y: 15 },
      { id: "FI-2001", label: "Feed Flow", type: "flow", x: 10, y: 50 },
      { id: "LI-2001", label: "Bottom Level", type: "level", x: 35, y: 65 },
      { id: "TIC-2001", label: "Heater Control", type: "control", x: 15, y: 35 },
      { id: "PIC-2001", label: "Vacuum Control", type: "control", x: 65, y: 10 },
      { id: "FIC-2001", label: "LVGO Draw", type: "flow", x: 70, y: 35 },
    ],
    "G-2002": [
      { id: "TI-2001", label: "LVGO Draw Temp", type: "temperature", x: 40, y: 30 },
      { id: "TI-2002", label: "HVGO Draw Temp", type: "temperature", x: 40, y: 55 },
      { id: "PI-2001", label: "Column Vac", type: "pressure", x: 50, y: 10 },
      { id: "LI-2001", label: "Bottom Level", type: "level", x: 40, y: 80 },
    ],
    "G-2003": [
      { id: "PI-2001", label: "Ejector Suction", type: "pressure", x: 30, y: 30 },
      { id: "TI-2001", label: "Condenser Out", type: "temperature", x: 60, y: 40 },
      { id: "FI-2001", label: "Steam Flow", type: "flow", x: 15, y: 50 },
    ],
    "G-2004": [
      { id: "TI-2001", label: "HVGO Temp", type: "temperature", x: 40, y: 30 },
      { id: "FI-2001", label: "HVGO Flow", type: "flow", x: 60, y: 40 },
      { id: "TIC-2001", label: "HVGO Rundown", type: "control", x: 50, y: 60 },
    ],
  },
  CCR: {
    "G-4001": [
      { id: "TI-4001", label: "Reactor Inlet", type: "temperature", x: 25, y: 20 },
      { id: "TI-4002", label: "Reactor Outlet", type: "temperature", x: 25, y: 65 },
      { id: "PI-4001", label: "Reactor Pressure", type: "pressure", x: 40, y: 15 },
      { id: "FI-4001", label: "Feed Flow", type: "flow", x: 10, y: 40 },
      { id: "LI-4001", label: "Separator Level", type: "level", x: 65, y: 50 },
      { id: "TIC-4001", label: "Heater Control", type: "control", x: 45, y: 40 },
      { id: "PIC-4001", label: "Pressure Ctrl", type: "control", x: 55, y: 20 },
      { id: "FIC-2001", label: "Recycle Gas", type: "flow", x: 70, y: 30 },
    ],
  },
  DHT: {
    "G-5001": [
      { id: "TI-5001", label: "Reactor Temp", type: "temperature", x: 30, y: 25 },
      { id: "TI-5002", label: "Stripper Temp", type: "temperature", x: 60, y: 30 },
      { id: "PI-5001", label: "Reactor Press", type: "pressure", x: 40, y: 15 },
      { id: "FI-5001", label: "Feed Flow", type: "flow", x: 10, y: 40 },
      { id: "LI-5001", label: "Sep Level", type: "level", x: 55, y: 55 },
      { id: "TIC-5001", label: "Temp Ctrl", type: "control", x: 35, y: 45 },
      { id: "PIC-5001", label: "Press Ctrl", type: "control", x: 45, y: 20 },
      { id: "FIC-2001", label: "H2 Flow", type: "flow", x: 20, y: 15 },
    ],
  },
  NHT: {
    "G-6001": [
      { id: "TI-6001", label: "Reactor Inlet", type: "temperature", x: 30, y: 20 },
      { id: "TI-6002", label: "Stripper Bottom", type: "temperature", x: 65, y: 60 },
      { id: "PI-6001", label: "Reactor Press", type: "pressure", x: 40, y: 15 },
      { id: "FI-6001", label: "Feed", type: "flow", x: 10, y: 35 },
      { id: "LI-6001", label: "Sep Level", type: "level", x: 55, y: 45 },
      { id: "TIC-6001", label: "Temp Ctrl", type: "control", x: 35, y: 40 },
    ],
  },
  Utilities: {
    "G-9001": [
      { id: "TI-9001", label: "Steam Temp", type: "temperature", x: 30, y: 25 },
      { id: "PI-9001", label: "Steam Header", type: "pressure", x: 50, y: 20 },
      { id: "FI-9001", label: "BFW Flow", type: "flow", x: 20, y: 50 },
      { id: "LI-9001", label: "Drum Level", type: "level", x: 65, y: 45 },
      { id: "TIC-9001", label: "SH Temp Ctrl", type: "control", x: 45, y: 40 },
      { id: "PIC-9001", label: "Header Ctrl", type: "control", x: 60, y: 25 },
    ],
  },
}

const TAG_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  temperature: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", icon: "TI" },
  pressure: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", icon: "PI" },
  flow: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", icon: "FI" },
  level: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: "LI" },
  control: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", icon: "C" },
}

// --- Constants ---
const STATUS_CONFIG: Record<ModelStatus, { label: string; color: string; icon: React.ElementType; step: number }> = {
  draft:               { label: "초안",          color: "bg-gray-100 text-gray-700",   icon: Clock,         step: 1 },
  "data-ready":        { label: "데이터 준비",   color: "bg-blue-100 text-blue-700",    icon: Database,      step: 2 },
  modeling:            { label: "외부 모델링 중", color: "bg-purple-100 text-purple-700", icon: Cpu,           step: 3 },
  "endpoint-registered": { label: "End Point 등록", color: "bg-indigo-100 text-indigo-700", icon: Link2,       step: 4 },
  "config-requested":  { label: "구성 요청 완료", color: "bg-orange-100 text-orange-700", icon: Send,          step: 5 },
  configured:          { label: "구성 완료",     color: "bg-teal-100 text-teal-700",    icon: CheckCircle,   step: 6 },
  testing:             { label: "운영 테스트",   color: "bg-cyan-100 text-cyan-700",    icon: Beaker,        step: 6 },
  production:          { label: "Production",    color: "bg-green-100 text-green-700",  icon: Play,          step: 7 },
  dropped:             { label: "Drop",          color: "bg-red-100 text-red-700",      icon: AlertTriangle, step: 0 },
}

const PIPELINE_STEPS = [
  { step: 1, label: "기본 정보" },
  { step: 2, label: "데이터 준비" },
  { step: 3, label: "외부 모델링" },
  { step: 4, label: "End Point 등록" },
  { step: 5, label: "구성 요청" },
  { step: 6, label: "운영 테스트" },
  { step: 7, label: "Production" },
]

const PURPOSE_OPTIONS = ["공정 최적화", "이상 감지", "품질 예측", "에너지 절감", "촉매 성능 예측", "수율 예측", "기타"]
const UNITS = ["CDU", "VDU", "HCR", "CCR", "DHT", "NHT", "Utilities"]

// --- Mock data ---
const INITIAL_MODELS: ModelEntry[] = [
  {
    id: "MDL-001", name: "HCR Reactor Outlet Temp 예측 모델", purpose: "공정 최적화",
    unit: "HCR", equipment: "R-3001", description: "HCR Reactor Outlet Temperature를 Feed 조건과 운전 변수 기반으로 예측",
    status: "testing", currentStep: 6, createdDate: "2025-12-15", creator: "김지수",
    endpointUrl: "https://runtime.sagemaker.ap-northeast-2.amazonaws.com/endpoints/hcr-reactor-temp-v2",
    dataSource: "dcs-select", selectedTags: ["TI-3001", "TI-3002", "PI-3001", "FI-3001", "FIC-2001"],
    trainingPeriod: { from: "2024-01-01", to: "2025-06-30" }, csvFiles: [],
    accuracy: { rmse: 2.34, mae: 1.87, r2: 0.94, mape: 1.2 }, dropReason: "",
  },
  {
    id: "MDL-002", name: "CCR Catalyst Deactivation Rate 예측", purpose: "촉매 성능 예측",
    unit: "CCR", equipment: "Reactor Train", description: "CCR 촉매 비활성화율 예측을 통한 촉매 교체 주기 최적화",
    status: "configured", currentStep: 6, createdDate: "2025-11-20", creator: "박영호",
    endpointUrl: "https://runtime.sagemaker.ap-northeast-2.amazonaws.com/endpoints/ccr-catalyst-v1",
    dataSource: "tag-grid", selectedTags: ["TI-4001", "TI-4002", "PI-4001", "FI-4001"],
    trainingPeriod: { from: "2024-03-01", to: "2025-09-30" }, csvFiles: [],
    accuracy: { rmse: 0.05, mae: 0.03, r2: 0.91, mape: 3.8 }, dropReason: "",
  },
  {
    id: "MDL-003", name: "VDU HVGO Yield 예측", purpose: "수율 예측",
    unit: "VDU", equipment: "Vacuum Column", description: "VDU HVGO 수율을 Feed 특성 및 운전 조건 기반 예측",
    status: "modeling", currentStep: 3, createdDate: "2026-01-10", creator: "이수진",
    endpointUrl: "", dataSource: "csv", selectedTags: [],
    trainingPeriod: { from: "2024-06-01", to: "2025-12-31" }, csvFiles: ["vdu_feed_data_2024.csv", "vdu_product_data_2024.csv"],
    accuracy: null, dropReason: "",
  },
  {
    id: "MDL-004", name: "CDU Energy Consumption 예측", purpose: "에너지 절감",
    unit: "CDU", equipment: "Furnace F-1001", description: "CDU Furnace 에너지 소비 예측을 통한 에너지 절감 기회 발굴",
    status: "draft", currentStep: 1, createdDate: "2026-02-05", creator: "김지수",
    endpointUrl: "", dataSource: "", selectedTags: [],
    trainingPeriod: { from: "", to: "" }, csvFiles: [],
    accuracy: null, dropReason: "",
  },
  {
    id: "MDL-005", name: "DHT Desulfurization Efficiency 예측", purpose: "품질 예측",
    unit: "DHT", equipment: "R-5001", description: "DHT 탈황효율 예측 모델 - 정확도 부족으로 Drop",
    status: "dropped", currentStep: 0, createdDate: "2025-08-01", creator: "이수진",
    endpointUrl: "https://runtime.sagemaker.ap-northeast-2.amazonaws.com/endpoints/dht-desulf-v1",
    dataSource: "tag-grid", selectedTags: ["TI-5001", "PI-5001", "FI-5001"],
    trainingPeriod: { from: "2024-01-01", to: "2025-03-31" }, csvFiles: [],
    accuracy: { rmse: 5.12, mae: 4.01, r2: 0.72, mape: 8.5 }, dropReason: "MAPE 8.5%로 목표 정확도(3% 이하) 미달. Feed 품질 변동성이 커 모델 재설계 필요",
  },
]

// --- Helper ---
function generateValidationData(model: ModelEntry) {
  const seed = model.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
  const base = model.unit === "HCR" ? 420 : model.unit === "CCR" ? 0.85 : model.unit === "VDU" ? 67 : 350
  const scale = model.unit === "CCR" ? 0.15 : model.unit === "VDU" ? 8 : 30
  return Array.from({ length: 30 }, (_, i) => {
    const actual = base + (rand(seed + i * 7) - 0.5) * scale
    const noise = (rand(seed + i * 13) - 0.5) * scale * (model.accuracy ? (1 - model.accuracy.r2) * 3 : 0.5)
    return { day: `D-${30 - i}`, actual: +actual.toFixed(2), predicted: +(actual + noise).toFixed(2), deviation: +noise.toFixed(2) }
  })
}

// ===================================================
// MAIN COMPONENT
// ===================================================
export default function ModelLabPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workspace, setWorkspace] = useState<"build" | "validate">(
    searchParams.get("tab") === "validate" ? "validate" : "build"
  )
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "validate") setWorkspace("validate")
  }, [searchParams])

  const [models, setModels] = useState<ModelEntry[]>(INITIAL_MODELS)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [showConfigRequest, setShowConfigRequest] = useState(false)
  const [showDropDialog, setShowDropDialog] = useState(false)
  const [dropReason, setDropReason] = useState("")
  const [validationModelId, setValidationModelId] = useState<string>("")
  const [validationPeriod, setValidationPeriod] = useState("30d")
  const [showPromotionDialog, setShowPromotionDialog] = useState(false)
  const [promotionNote, setPromotionNote] = useState("")
  const [validationSearch, setValidationSearch] = useState("")
  const [validationStatusFilter, setValidationStatusFilter] = useState<string>("all")

  // New model form
  const [newModel, setNewModel] = useState({ name: "", purpose: "", unit: "HCR", equipment: "", description: "" })

  // Data selection state
  const [dataTab, setDataTab] = useState<"tag-grid" | "dcs-select" | "csv">("tag-grid")
  const [tagGridRows, setTagGridRows] = useState<{ tag: string; from: string; to: string }[]>([{ tag: "", from: "", to: "" }])
  const [globalPeriod, setGlobalPeriod] = useState({ from: "2024-01-01", to: "2025-12-31" })
  const [useGlobalPeriod, setUseGlobalPeriod] = useState(true)
  const [dcsUnit, setDcsUnit] = useState("HCR")
  const [dcsGraphic, setDcsGraphic] = useState("")
  const [dcsSelectedTags, setDcsSelectedTags] = useState<string[]>([])
  const [dcsPeriod, setDcsPeriod] = useState({ from: "2024-01-01", to: "2025-12-31" })
  const [csvFiles, setCsvFiles] = useState<{ name: string; size: string; rows: number }[]>([])
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [endpointInput, setEndpointInput] = useState("")

  // Derived
  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId) || null, [models, selectedModelId])
  const validationModel = useMemo(() => models.find(m => m.id === validationModelId) || null, [models, validationModelId])
  const buildModels = useMemo(() => models.filter(m => m.status !== "dropped" || statusFilter === "dropped"), [models, statusFilter])
  const validateModels = useMemo(() => models.filter(m => ["configured", "testing", "production", "dropped"].includes(m.status)), [models])
  const filteredBuildModels = useMemo(() => {
    return buildModels.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.unit.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [buildModels, search, statusFilter])
  const allTags = useMemo(() => Object.values(AVAILABLE_TAGS).flat(), [])
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: models.length }
    models.forEach(m => { c[m.status] = (c[m.status] || 0) + 1 })
    return c
  }, [models])

  // --- Handlers ---
  const handleCreateModel = useCallback(() => {
    const id = `MDL-${String(models.length + 1).padStart(3, "0")}`
    const entry: ModelEntry = {
      id, ...newModel, status: "draft", currentStep: 1,
      createdDate: new Date().toISOString().split("T")[0], creator: "김철수",
      endpointUrl: "", dataSource: "", selectedTags: [],
      trainingPeriod: { from: "", to: "" }, csvFiles: [], accuracy: null, dropReason: "",
    }
    setModels(prev => [entry, ...prev])
    setShowCreateDialog(false)
    setNewModel({ name: "", purpose: "", unit: "HCR", equipment: "", description: "" })
    setSelectedModelId(id)
  }, [newModel, models.length])

  const advanceStep = useCallback((modelId: string, nextStatus: ModelStatus, updates?: Partial<ModelEntry>) => {
    setModels(prev => prev.map(m => m.id === modelId ? { ...m, status: nextStatus, currentStep: STATUS_CONFIG[nextStatus].step, ...updates } : m))
  }, [])

  const handleDrop = useCallback(() => {
    if (!validationModel || !dropReason.trim()) return
    advanceStep(validationModel.id, "dropped", { dropReason: dropReason.trim() })
    setShowDropDialog(false)
    setDropReason("")
  }, [validationModel, dropReason, advanceStep])

  const handlePromotion = useCallback(() => {
    if (!validationModel) return
    // 1. Advance model to production
    advanceStep(validationModel.id, "production")
    // 2. Create a model improvement ticket
    const ticketId = `TKT-${Date.now()}`
    const newTicket: Ticket = {
      id: ticketId,
      title: `[모델 승격] ${validationModel.name} Production 등록`,
      description: `모델 "${validationModel.name}" (${validationModel.id})이 운영 검증을 통과하여 Production으로 승격되었습니다.\n\n공정: ${validationModel.unit}\n설비: ${validationModel.equipment}\n목적: ${validationModel.purpose}\nR²: ${validationModel.accuracy?.r2 ?? "N/A"}\nMAPE: ${validationModel.accuracy?.mape ?? "N/A"}%\n\nEndpoint: ${validationModel.endpointUrl}\n\n${promotionNote ? `승격 메모: ${promotionNote}` : ""}`,
      ticketType: "ModelImprovement",
      priority: "P3",
      impact: "Operations",
      owner: validationModel.creator,
      requester: "김지수",
      status: "Open",
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      unit: validationModel.unit,
      equipment: validationModel.equipment,
      tags: validationModel.selectedTags,
      context: {
        unit: validationModel.unit,
        equipment: validationModel.equipment,
        tags: validationModel.selectedTags,
        notes: `모델 ID: ${validationModel.id}, Endpoint: ${validationModel.endpointUrl}`,
      },
      modelRequest: {
        category: "model-rebuild",
        targetModel: validationModel.name,
        receivingTeam: "DX추진팀",
      },
      workPackages: [
        {
          id: `wp-${Date.now()}`,
          ticketId,
          wpType: "Execution",
          title: "Production 환경 배포 및 모니터링 설정",
          description: `${validationModel.name} 모델의 Production 환경 배포, 실시간 모니터링 대시보드 연동, 알림 설정`,
          ownerTeam: "DX추진팀",
          status: "Not Started",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          logs: [],
          attachments: [],
        },
        {
          id: `wp-${Date.now() + 1}`,
          ticketId,
          wpType: "Validation",
          title: "Production 모델 정확도 1주차 검증",
          description: `Production 배포 후 1주간 예측 정확도 모니터링 및 이상 시 Roll-back 준비`,
          ownerTeam: "공정기술팀",
          status: "Not Started",
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          logs: [],
          attachments: [],
        },
      ],
      messages: [{
        id: `msg-${Date.now()}`,
        author: "System",
        content: `모델 실험실에서 "${validationModel.name}" 모델이 Production으로 승격되어 자동 생성된 티켓입니다.`,
        timestamp: new Date().toISOString(),
        type: "system",
      }],
      accessLevel: "Team",
    }
    saveTicket(newTicket)
    setShowPromotionDialog(false)
    setPromotionNote("")
    // Navigate to the tickets/actions tracking page
    router.push(`/actions/tickets`)
  }, [validationModel, promotionNote, advanceStep, router])

  // Filtered validation models for table
  const filteredValidateModels = useMemo(() => {
    return validateModels.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(validationSearch.toLowerCase()) || m.unit.toLowerCase().includes(validationSearch.toLowerCase()) || m.id.toLowerCase().includes(validationSearch.toLowerCase())
      const matchStatus = validationStatusFilter === "all" || m.status === validationStatusFilter
      return matchSearch && matchStatus
    })
  }, [validateModels, validationSearch, validationStatusFilter])

  const openDetail = (model: ModelEntry) => {
    setSelectedModelId(model.id)
    // Reset data selection state for draft models
    if (model.status === "draft") {
      setDataTab("tag-grid")
      setTagGridRows([{ tag: "", from: "", to: "" }])
      setDcsUnit(model.unit)
      setDcsGraphic("")
      setDcsSelectedTags([])
      setCsvFiles([])
    }
    if (model.status === "modeling") {
      setEndpointInput("")
    }
  }

  const handleCsvFileSelect = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles = Array.from(fileList).map(f => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      rows: Math.floor(Math.random() * 8000) + 500,
    }))
    setCsvFiles(prev => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop2 = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleCsvFileSelect(e.dataTransfer.files) }

  // Tag grid helpers
  const addTagRow = () => setTagGridRows(prev => [...prev, { tag: "", from: "", to: "" }])
  const removeTagRow = (i: number) => { if (tagGridRows.length > 1) setTagGridRows(prev => prev.filter((_, j) => j !== i)) }
  const updateTagRow = (i: number, field: keyof typeof tagGridRows[0], value: string) => {
    setTagGridRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r))
  }

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                모델 실험실
              </h1>
              <p className="text-sm text-muted-foreground mt-1">AI 모델 구축부터 운영 검증까지의 전체 파이프라인을 관리합니다</p>
            </div>
          </div>
          <div className="px-6">
            <div className="flex gap-1">
              {([
                { id: "build" as const, label: "모델 구축", icon: Cpu, count: buildModels.length },
                { id: "validate" as const, label: "운영 검증", icon: Eye, count: validateModels.length },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setWorkspace(tab.id); setSelectedModelId(null); setValidationModelId("") }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                    workspace === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <Badge variant="secondary" className="text-xs ml-1">{tab.count}</Badge>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ========== WORKSPACE 1: 모델 구축 ========== */}
        {workspace === "build" && !selectedModelId && (
          <main className="p-6 space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="모델명 또는 공정으로 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "draft", "data-ready", "modeling", "endpoint-registered", "config-requested", "configured", "testing", "production", "dropped"] as const).map(s => (
                  <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm"
                    onClick={() => setStatusFilter(s)} className={cn("text-xs", statusFilter !== s && "bg-transparent")}>
                    {s === "all" ? "전체" : STATUS_CONFIG[s].label}
                    {statusCounts[s] ? ` (${s === "all" ? statusCounts.all : statusCounts[s]})` : ""}
                  </Button>
                ))}
              </div>
              <Button className="gap-2 ml-auto shrink-0" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" /> 새 모델
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {PIPELINE_STEPS.map(ps => {
                const count = models.filter(m => m.currentStep === ps.step && m.status !== "dropped").length
                return (
                  <Card key={ps.step} className="relative overflow-hidden">
                    <CardContent className="py-3 px-4">
                      <div className="text-lg font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground truncate">{ps.label}</p>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20">
                      <div className="h-full bg-primary transition-all" style={{ width: `${(ps.step / 7) * 100}%` }} />
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Model List */}
            <div className="space-y-3">
              {filteredBuildModels.length === 0 && (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    <FlaskConical className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">해당 조건의 모델이 없습니다</p>
                    <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5 bg-transparent">
                      <Plus className="h-3.5 w-3.5" /> 새 모델 만들기
                    </Button>
                  </CardContent>
                </Card>
              )}
              {filteredBuildModels.map(model => {
                const cfg = STATUS_CONFIG[model.status]
                const Icon = cfg.icon
                return (
                  <Card key={model.id}
                    className={cn("hover:border-primary/30 transition-colors cursor-pointer", model.status === "dropped" && "opacity-60")}
                    onClick={() => openDetail(model)}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
                            model.status === "dropped" ? "bg-red-100 text-red-600" :
                            model.status === "production" ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                          )}>
                            {model.status === "dropped" ? "X" : model.status === "production" ? "P" : model.currentStep}
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">{cfg.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{model.name}</h3>
                            <Badge variant="outline" className={cn("text-xs shrink-0", cfg.color)}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                            <Badge variant="secondary" className="text-xs shrink-0">{model.unit}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{model.purpose}</span><span>{model.equipment}</span><span>{model.creator}</span><span>{model.createdDate}</span>
                            {model.accuracy && (
                              <span className={cn("font-medium", model.accuracy.r2 >= 0.9 ? "text-green-600" : model.accuracy.r2 >= 0.8 ? "text-orange-600" : "text-red-600")}>
                                R2: {model.accuracy.r2}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-0.5 shrink-0">
                          {PIPELINE_STEPS.map(ps => (
                            <div key={ps.step} className={cn("w-6 h-1.5 rounded-full transition-colors",
                              model.status === "dropped" ? "bg-red-200" :
                              ps.step < model.currentStep ? "bg-primary" :
                              ps.step === model.currentStep ? "bg-primary/60" : "bg-muted"
                            )} title={ps.label} />
                          ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </main>
        )}

        {/* ========== MODEL DETAIL (inline, replaces list) ========== */}
        {workspace === "build" && selectedModel && (
          <main className="p-6 space-y-6 max-w-5xl">
            {/* Back + header */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelectedModelId(null)}>
                <ArrowLeft className="h-4 w-4" /> 목록으로
              </Button>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{selectedModel.name}</h2>
                  <Badge variant="outline" className={cn("text-xs", STATUS_CONFIG[selectedModel.status].color)}>
                    {React.createElement(STATUS_CONFIG[selectedModel.status].icon, { className: "h-3 w-3 mr-1" })}
                    {STATUS_CONFIG[selectedModel.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{selectedModel.unit} / {selectedModel.equipment} / {selectedModel.purpose}</p>
                <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground shrink-0">
                <div>{selectedModel.creator} / {selectedModel.createdDate}</div>
                <div className="font-mono mt-0.5">{selectedModel.id}</div>
              </div>
            </div>

            {/* Pipeline progress */}
            <div className="flex items-center gap-1.5 p-3 bg-muted/30 rounded-lg border">
              {PIPELINE_STEPS.map((ps, i) => {
                const isDone = selectedModel.status !== "dropped" && ps.step < selectedModel.currentStep
                const isCurrent = selectedModel.status !== "dropped" && ps.step === selectedModel.currentStep
                return (
                  <React.Fragment key={ps.step}>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isDone ? "bg-primary/10 text-primary" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <span className="w-4 text-center">{ps.step}</span>}
                      {ps.label}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Step Cards */}
            <div className="space-y-4">
              {/* === Step 1: 기본 정보 === */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CircleDot className="h-4 w-4 text-primary" />Step 1. 기본 정보</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-muted-foreground">모델명:</span> <span className="font-medium">{selectedModel.name}</span></div>
                    <div><span className="text-muted-foreground">예측 목적:</span> <span className="font-medium">{selectedModel.purpose}</span></div>
                    <div><span className="text-muted-foreground">관련 공정:</span> <span className="font-medium">{selectedModel.unit}</span></div>
                    <div><span className="text-muted-foreground">대상 설비:</span> <span className="font-medium">{selectedModel.equipment || "-"}</span></div>
                    <div><span className="text-muted-foreground">생성자:</span> <span className="font-medium">{selectedModel.creator}</span></div>
                    <div><span className="text-muted-foreground">생성일:</span> <span className="font-medium">{selectedModel.createdDate}</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* === Step 2: 데이터 선정 === */}
              <Card className={cn(selectedModel.currentStep < 1 && "opacity-50")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2"><Database className="h-4 w-4 text-blue-600" />Step 2. 데이터 선정</div>
                    {selectedModel.status === "draft" && <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">작업 필요</Badge>}
                    {selectedModel.dataSource && <Badge variant="secondary" className="text-xs">완료</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedModel.dataSource ? (
                    /* Already has data - show summary */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {selectedModel.dataSource === "tag-grid" ? "태그 그리드" : selectedModel.dataSource === "dcs-select" ? "DCS 화면 선택" : "CSV 업로드"}
                        </Badge>
                        {selectedModel.trainingPeriod.from && (
                          <span className="text-xs text-muted-foreground">학습 기간: {selectedModel.trainingPeriod.from} ~ {selectedModel.trainingPeriod.to}</span>
                        )}
                      </div>
                      {selectedModel.selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedModel.selectedTags.map(t => <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>)}
                        </div>
                      )}
                      {selectedModel.csvFiles.length > 0 && (
                        <div className="space-y-1">
                          {selectedModel.csvFiles.map(f => <div key={f} className="flex items-center gap-2 text-xs"><FileSpreadsheet className="h-3 w-3 text-green-600" />{f}</div>)}
                        </div>
                      )}
                    </div>
                  ) : selectedModel.status === "draft" ? (
                    /* Data selection UI */
                    <Tabs value={dataTab} onValueChange={v => setDataTab(v as typeof dataTab)} className="mt-1">
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="tag-grid" className="gap-1.5 text-xs"><LayoutGrid className="h-3.5 w-3.5" />태그 그리드</TabsTrigger>
                        <TabsTrigger value="dcs-select" className="gap-1.5 text-xs"><Monitor className="h-3.5 w-3.5" />DCS 화면 선택</TabsTrigger>
                        <TabsTrigger value="csv" className="gap-1.5 text-xs"><FileUp className="h-3.5 w-3.5" />CSV 업로드</TabsTrigger>
                      </TabsList>

                      {/* ---- OPTION 1: Tag Grid ---- */}
                      <TabsContent value="tag-grid" className="space-y-4 mt-4">
                        <p className="text-xs text-muted-foreground">태그명과 기간을 직접 입력하여 학습 데이터를 구성합니다. 태그별 개별 기간 설정이 가능합니다.</p>

                        {/* Global period toggle */}
                        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={useGlobalPeriod} onCheckedChange={v => setUseGlobalPeriod(!!v)} id="global-period" />
                            <label htmlFor="global-period" className="text-xs font-medium cursor-pointer">전체 기간 일괄 적용</label>
                          </div>
                          {useGlobalPeriod && (
                            <div className="flex items-center gap-2 ml-auto">
                              <Input type="date" className="h-7 text-xs w-36" value={globalPeriod.from} onChange={e => setGlobalPeriod(p => ({ ...p, from: e.target.value }))} />
                              <span className="text-xs text-muted-foreground">~</span>
                              <Input type="date" className="h-7 text-xs w-36" value={globalPeriod.to} onChange={e => setGlobalPeriod(p => ({ ...p, to: e.target.value }))} />
                            </div>
                          )}
                        </div>

                        {/* Grid table */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className={cn("grid gap-0 text-xs font-medium px-3 py-2.5 border-b bg-muted/50",
                            useGlobalPeriod ? "grid-cols-[32px_1fr_40px]" : "grid-cols-[32px_1fr_150px_150px_40px]"
                          )}>
                            <span className="text-center">#</span>
                            <span>태그명</span>
                            {!useGlobalPeriod && <><span>시작일</span><span>종료일</span></>}
                            <span />
                          </div>
                          {tagGridRows.map((row, i) => (
                            <div key={i} className={cn("grid gap-2 px-3 py-1.5 border-b last:border-0 items-center",
                              useGlobalPeriod ? "grid-cols-[32px_1fr_40px]" : "grid-cols-[32px_1fr_150px_150px_40px]"
                            )}>
                              <span className="text-xs text-muted-foreground text-center">{i + 1}</span>
                              <div className="relative">
                                <Input
                                  placeholder="태그 입력 (예: TI-3001)"
                                  value={row.tag} className="h-8 text-xs font-mono"
                                  onChange={e => updateTagRow(i, "tag", e.target.value)}
                                  list="tag-suggestions"
                                />
                                {row.tag && allTags.includes(row.tag) && (
                                  <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-green-500" />
                                )}
                              </div>
                              {!useGlobalPeriod && (
                                <>
                                  <Input type="date" value={row.from} className="h-8 text-xs" onChange={e => updateTagRow(i, "from", e.target.value)} />
                                  <Input type="date" value={row.to} className="h-8 text-xs" onChange={e => updateTagRow(i, "to", e.target.value)} />
                                </>
                              )}
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeTagRow(i)} disabled={tagGridRows.length <= 1}>
                                <X className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <datalist id="tag-suggestions">{allTags.map(t => <option key={t} value={t} />)}</datalist>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1 text-xs bg-transparent" onClick={addTagRow}>
                            <Plus className="h-3 w-3" />행 추가
                          </Button>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{tagGridRows.filter(r => r.tag.trim()).length}개 태그 입력됨</span>
                            <Button size="sm" className="text-xs gap-1.5" disabled={tagGridRows.filter(r => r.tag.trim()).length === 0}
                              onClick={() => {
                                const tags = tagGridRows.filter(r => r.tag.trim()).map(r => r.tag.trim())
                                const from = useGlobalPeriod ? globalPeriod.from : tagGridRows.find(r => r.from)?.from || ""
                                const to = useGlobalPeriod ? globalPeriod.to : tagGridRows.find(r => r.to)?.to || ""
                                advanceStep(selectedModel.id, "data-ready", { dataSource: "tag-grid", selectedTags: tags, trainingPeriod: { from, to } })
                              }}>
                              <CheckCircle className="h-3.5 w-3.5" />데이터 확정
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      {/* ---- OPTION 2: DCS Screen Select ---- */}
                      <TabsContent value="dcs-select" className="space-y-4 mt-4">
                        <p className="text-xs text-muted-foreground">DCS 화면에서 태그를 직관적으로 선택하고, 태그 덱에서 학습 기간을 설정합니다.</p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">공정 선택</Label>
                            <Select value={dcsUnit} onValueChange={v => { setDcsUnit(v); setDcsGraphic(""); setDcsSelectedTags([]) }}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">DCS 화면</Label>
                            <Select value={dcsGraphic} onValueChange={setDcsGraphic}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="화면 선택" /></SelectTrigger>
                              <SelectContent>
                                {(DCS_GRAPHICS[dcsUnit] || []).map(g => (
                                  <SelectItem key={g.number} value={g.number}>{g.number} - {g.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {dcsGraphic && (
                          <>
                            {/* Visual DCS Schematic */}
                            <div className="border rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                                <span className="text-xs font-medium">{dcsGraphic} - {DCS_GRAPHICS[dcsUnit]?.find(g => g.number === dcsGraphic)?.name}</span>
                                <span className="text-[10px] text-muted-foreground">클릭하여 태그 선택/해제</span>
                              </div>
                              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" style={{ height: 320 }}>
                                {/* Schematic background elements */}
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  {/* Pipes */}
                                  <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
                                  <line x1="30" y1="10" x2="30" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
                                  <line x1="60" y1="15" x2="60" y2="85" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
                                  {/* Equipment outlines */}
                                  <rect x="22" y="15" width="16" height="70" rx="2" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
                                  <circle cx="60" cy="50" r="12" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.3" />
                                  <rect x="75" y="30" width="15" height="30" rx="1" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.3" />
                                </svg>

                                {/* Tag nodes */}
                                {(DCS_TAG_NODES[dcsUnit]?.[dcsGraphic] || []).map(node => {
                                  const isSelected = dcsSelectedTags.includes(node.id)
                                  const typeColor = TAG_TYPE_COLORS[node.type]
                                  return (
                                    <button
                                      key={`${node.id}-${node.x}-${node.y}`}
                                      className={cn(
                                        "absolute flex flex-col items-center gap-0.5 transition-all cursor-pointer group",
                                        "transform -translate-x-1/2 -translate-y-1/2"
                                      )}
                                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                      onClick={() => {
                                        setDcsSelectedTags(prev =>
                                          prev.includes(node.id) ? prev.filter(t => t !== node.id) : [...prev, node.id]
                                        )
                                      }}
                                    >
                                      <div className={cn(
                                        "px-2 py-1 rounded border text-[10px] font-mono font-medium transition-all shadow-sm",
                                        isSelected
                                          ? `${typeColor.bg} ${typeColor.border} ${typeColor.text} ring-2 ring-offset-1 ring-primary scale-110`
                                          : "bg-card border-border text-foreground hover:border-primary/50 hover:shadow-md"
                                      )}>
                                        <div className="flex items-center gap-1">
                                          {isSelected && <Check className="h-2.5 w-2.5" />}
                                          {node.id}
                                        </div>
                                      </div>
                                      <span className={cn(
                                        "text-[9px] whitespace-nowrap px-1 rounded transition-opacity",
                                        isSelected ? `${typeColor.text} font-medium opacity-100` : "text-muted-foreground opacity-0 group-hover:opacity-100"
                                      )}>
                                        {node.label}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                              {/* Legend */}
                              <div className="px-3 py-2 bg-muted/30 border-t flex items-center gap-4">
                                {Object.entries(TAG_TYPE_COLORS).map(([type, colors]) => (
                                  <div key={type} className="flex items-center gap-1.5">
                                    <div className={cn("w-3 h-3 rounded border", colors.bg, colors.border)} />
                                    <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tag Deck */}
                            <div className={cn(
                              "p-4 rounded-lg border transition-colors",
                              dcsSelectedTags.length > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                            )}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-primary" />
                                  <Label className="text-sm font-medium">태그 덱</Label>
                                  <Badge variant="secondary" className="text-xs">{dcsSelectedTags.length}개 선택</Badge>
                                </div>
                                {dcsSelectedTags.length > 0 && (
                                  <Button variant="ghost" size="sm" className="text-xs h-6 text-muted-foreground" onClick={() => setDcsSelectedTags([])}>
                                    전체 해제
                                  </Button>
                                )}
                              </div>
                              {dcsSelectedTags.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">위 DCS 화면에서 태그를 클릭하여 선택하세요</p>
                              ) : (
                                <>
                                  <div className="flex flex-wrap gap-1.5 mb-4">
                                    {dcsSelectedTags.map(t => {
                                      const node = DCS_TAG_NODES[dcsUnit]?.[dcsGraphic]?.find(n => n.id === t)
                                      const typeColor = node ? TAG_TYPE_COLORS[node.type] : TAG_TYPE_COLORS.temperature
                                      return (
                                        <Badge key={t} variant="outline" className={cn("text-xs font-mono gap-1.5 py-1", typeColor.bg, typeColor.border, typeColor.text)}>
                                          {t}
                                          {node && <span className="font-sans text-[9px] opacity-70">({node.label})</span>}
                                          <button onClick={() => setDcsSelectedTags(prev => prev.filter(x => x !== t))} className="ml-0.5 hover:bg-background/50 rounded-full p-0.5">
                                            <X className="h-2.5 w-2.5" />
                                          </button>
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                  <Separator className="mb-3" />
                                  <div className="flex items-center gap-3">
                                    <Label className="text-xs shrink-0">학습 기간</Label>
                                    <Input type="date" className="h-8 text-xs flex-1" value={dcsPeriod.from} onChange={e => setDcsPeriod(p => ({ ...p, from: e.target.value }))} />
                                    <span className="text-xs text-muted-foreground">~</span>
                                    <Input type="date" className="h-8 text-xs flex-1" value={dcsPeriod.to} onChange={e => setDcsPeriod(p => ({ ...p, to: e.target.value }))} />
                                  </div>
                                </>
                              )}
                            </div>

                            {dcsSelectedTags.length > 0 && (
                              <Button size="sm" className="text-xs gap-1.5" onClick={() => {
                                advanceStep(selectedModel.id, "data-ready", { dataSource: "dcs-select", selectedTags: dcsSelectedTags, trainingPeriod: dcsPeriod })
                              }}>
                                <CheckCircle className="h-3.5 w-3.5" />데이터 확정 ({dcsSelectedTags.length}개 태그)
                              </Button>
                            )}
                          </>
                        )}
                      </TabsContent>

                      {/* ---- OPTION 3: CSV Upload ---- */}
                      <TabsContent value="csv" className="space-y-4 mt-4">
                        <p className="text-xs text-muted-foreground">CSV 파일을 직접 업로드하여 학습 데이터로 사용합니다. 여러 파일을 동시에 업로드할 수 있습니다.</p>

                        {/* Drop zone */}
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop2}
                          onClick={() => csvInputRef.current?.click()}
                          className={cn(
                            "border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer",
                            isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                          )}
                        >
                          <Upload className={cn("h-10 w-10 mx-auto mb-3 transition-colors", isDragging ? "text-primary" : "text-muted-foreground/40")} />
                          <p className="text-sm font-medium">{isDragging ? "여기에 놓으세요" : "CSV 파일을 드래그하거나 클릭하여 업로드"}</p>
                          <p className="text-xs text-muted-foreground mt-1">CSV, XLS, XLSX 형식 지원 (최대 100MB)</p>
                        </div>
                        <input ref={csvInputRef} type="file" accept=".csv,.xls,.xlsx" multiple onChange={e => handleCsvFileSelect(e.target.files)} className="hidden" />

                        {/* File list */}
                        {csvFiles.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">업로드된 파일 ({csvFiles.length}개)</Label>
                            {csvFiles.map((f, i) => (
                              <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-green-50 border border-green-200 flex items-center justify-center">
                                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-mono font-medium">{f.name}</span>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-muted-foreground">{f.size}</span>
                                      <Badge variant="secondary" className="text-[10px] py-0 h-4">{f.rows.toLocaleString()} rows</Badge>
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCsvFiles(prev => prev.filter((_, j) => j !== i))}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-3 pt-2">
                              <div className="text-xs text-muted-foreground">총 {csvFiles.reduce((a, f) => a + f.rows, 0).toLocaleString()} rows</div>
                              <Button size="sm" className="text-xs gap-1.5 ml-auto" onClick={() => {
                                advanceStep(selectedModel.id, "data-ready", { dataSource: "csv", csvFiles: csvFiles.map(f => f.name), trainingPeriod: { from: "", to: "" } })
                              }}>
                                <CheckCircle className="h-3.5 w-3.5" />데이터 확정
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터가 아직 설정되지 않았습니다</p>
                  )}
                </CardContent>
              </Card>

              {/* === Step 3: AWS CANVAS 전송 === */}
              <Card className={cn(selectedModel.currentStep < 2 && "opacity-50")}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-purple-600" />Step 3. AWS CANVAS 전송</CardTitle></CardHeader>
                <CardContent>
                  {selectedModel.status === "data-ready" ? (
                    <div className="flex items-center gap-3">
                      <Button size="sm" className="gap-1.5" onClick={() => advanceStep(selectedModel.id, "modeling")}>
                        <Send className="h-3.5 w-3.5" />AWS CANVAS로 전송
                      </Button>
                      <p className="text-xs text-muted-foreground">준비된 데이터를 AWS CANVAS로 전송하여 모델링을 시작합니다</p>
                    </div>
                  ) : selectedModel.currentStep >= 3 ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">전송 완료</span>
                      <span className="text-muted-foreground text-xs ml-2">AWS CANVAS에서 모델링 진행 중</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터 준비가 완료되면 전송할 수 있습니다</p>
                  )}
                </CardContent>
              </Card>

              {/* === Step 4: End Point 등록 === */}
              <Card className={cn(selectedModel.currentStep < 3 && "opacity-50")}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-indigo-600" />Step 4. End Point 등록</CardTitle></CardHeader>
                <CardContent>
                  {selectedModel.endpointUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border font-mono text-xs break-all">
                        <Link2 className="h-4 w-4 shrink-0 text-primary" />
                        {selectedModel.endpointUrl}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">등록 완료</span>
                      </div>
                    </div>
                  ) : selectedModel.status === "modeling" ? (
                    <div className="space-y-3">
                      <Label className="text-xs">AWS CANVAS End Point URL</Label>
                      <div className="flex gap-2">
                        <Input placeholder="https://runtime.sagemaker...." className="text-xs font-mono flex-1"
                          value={endpointInput} onChange={e => setEndpointInput(e.target.value)} />
                        <Button size="sm" variant="outline" className="text-xs shrink-0 bg-transparent gap-1">
                          <ExternalLink className="h-3 w-3" />연결 테스트
                        </Button>
                        <Button size="sm" className="text-xs shrink-0 gap-1" disabled={!endpointInput.trim()}
                          onClick={() => advanceStep(selectedModel.id, "endpoint-registered", { endpointUrl: endpointInput.trim() })}>
                          <CheckCircle className="h-3 w-3" />등록
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">AWS CANVAS에서 모델링 완료 후 End Point URL을 붙여넣기 하세요</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">외부 모델링이 완료되면 End Point를 등록할 수 있습니다</p>
                  )}
                </CardContent>
              </Card>

              {/* === Step 5: 모델 구성 요청 === */}
              <Card className={cn(selectedModel.currentStep < 4 && "opacity-50")}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-orange-600" />Step 5. 모델 구성 요청</CardTitle></CardHeader>
                <CardContent>
                  {selectedModel.status === "endpoint-registered" ? (
                    <div className="flex items-center gap-3">
                      <Button size="sm" className="gap-1.5" onClick={() => setShowConfigRequest(true)}>
                        <Send className="h-3.5 w-3.5" />모델 구성 요청
                      </Button>
                      <p className="text-xs text-muted-foreground">DX추진팀에 End Point와 모델 정보를 전송합니다</p>
                    </div>
                  ) : selectedModel.currentStep >= 5 ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">구성 요청 전송 완료</span>
                      <span className="text-xs text-muted-foreground ml-2">DX팀에서 구성 진행 중</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">End Point 등록 후 구성 요청을 진행할 수 있습니다</p>
                  )}
                </CardContent>
              </Card>

              {/* === Step 6/7: 운영 테스트 / Production === */}
              {selectedModel.currentStep >= 6 && (
                <Card className="border-l-4 border-l-teal-500">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      {(selectedModel.status === "configured" || selectedModel.status === "testing") ? (
                        <>
                          <Beaker className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="text-sm font-medium">운영 검증 대기</p>
                            <p className="text-xs text-muted-foreground">운영 검증 탭에서 예측 정확도를 확인하고 Production 승격 여부를 결정하세요</p>
                          </div>
                          <Button size="sm" variant="outline" className="ml-auto gap-1.5 bg-transparent" onClick={() => {
                            setWorkspace("validate")
                            setValidationModelId(selectedModel.id)
                            setSelectedModelId(null)
                          }}>
                            <Eye className="h-3.5 w-3.5" />검증하기
                          </Button>
                        </>
                      ) : selectedModel.status === "production" ? (
                        <>
                          <Play className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-700">Production 등록 완료</p>
                            <p className="text-xs text-muted-foreground">모델 기반 최적화의 정규 모델로 운영 중입니다</p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Drop info */}
              {selectedModel.status === "dropped" && (
                <Card className="border-l-4 border-l-red-400">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Drop 처리됨</p>
                        <p className="text-xs text-muted-foreground mt-0.5">사유: {selectedModel.dropReason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        )}

        {/* ========== WORKSPACE 2: 운영 검증 - MODEL TABLE ========== */}
        {workspace === "validate" && !validationModelId && (
          <main className="p-6 space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="모델명, ID, 공정으로 검색..." value={validationSearch} onChange={e => setValidationSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-1.5">
                {[
                  { id: "all", label: "전체" },
                  { id: "configured", label: "구성 완료" },
                  { id: "testing", label: "운영 테스트" },
                  { id: "production", label: "Production" },
                  { id: "dropped", label: "Drop" },
                ].map(f => (
                  <Button key={f.id} variant={validationStatusFilter === f.id ? "default" : "outline"} size="sm"
                    onClick={() => setValidationStatusFilter(f.id)} className={cn("text-xs", validationStatusFilter !== f.id && "bg-transparent")}>
                    {f.label}
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {f.id === "all" ? validateModels.length : validateModels.filter(m => m.status === f.id).length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "구성 완료", count: validateModels.filter(m => m.status === "configured").length, color: "text-teal-600", bg: "bg-teal-50" },
                { label: "운영 테스트", count: validateModels.filter(m => m.status === "testing").length, color: "text-cyan-600", bg: "bg-cyan-50" },
                { label: "Production", count: validateModels.filter(m => m.status === "production").length, color: "text-green-600", bg: "bg-green-50" },
                { label: "Drop", count: validateModels.filter(m => m.status === "dropped").length, color: "text-red-600", bg: "bg-red-50" },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold", s.bg, s.color)}>{s.count}</div>
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Model table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">모델명</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">공정</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">설비</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">목적</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">R{'\u00B2'}</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">MAPE</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">담당자</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">생성일</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredValidateModels.length === 0 && (
                      <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">해당 조건의 모델이 없습니다</td></tr>
                    )}
                    {filteredValidateModels.map(model => {
                      const cfg = STATUS_CONFIG[model.status]
                      const Icon = cfg.icon
                      return (
                        <tr key={model.id}
                          className={cn("border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer", model.status === "dropped" && "opacity-60")}
                          onClick={() => setValidationModelId(model.id)}>
                          <td className="px-4 py-3 font-mono text-xs">{model.id}</td>
                          <td className="px-4 py-3 font-medium max-w-[220px] truncate">{model.name}</td>
                          <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{model.unit}</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{model.equipment}</td>
                          <td className="px-4 py-3 text-xs">{model.purpose}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-xs gap-1", cfg.color)}>
                              <Icon className="h-3 w-3" />{cfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {model.accuracy ? (
                              <span className={cn("font-semibold text-xs", model.accuracy.r2 >= 0.9 ? "text-green-600" : model.accuracy.r2 >= 0.8 ? "text-orange-600" : "text-red-600")}>
                                {model.accuracy.r2}
                              </span>
                            ) : <span className="text-muted-foreground text-xs">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {model.accuracy ? (
                              <span className={cn("font-semibold text-xs", model.accuracy.mape < 3 ? "text-green-600" : model.accuracy.mape < 5 ? "text-orange-600" : "text-red-600")}>
                                {model.accuracy.mape}%
                              </span>
                            ) : <span className="text-muted-foreground text-xs">-</span>}
                          </td>
                          <td className="px-4 py-3 text-xs">{model.creator}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{model.createdDate}</td>
                          <td className="px-4 py-3 text-center">
                            <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </main>
        )}

        {/* ========== WORKSPACE 2: 운영 검증 - DETAIL VIEW ========== */}
        {workspace === "validate" && validationModelId && (() => {
          if (!validationModel) return null
              const data = generateValidationData(validationModel)
              const sliceLen = validationPeriod === "7d" ? 7 : 30
              const sliced = data.slice(0, sliceLen)
              const acc = validationModel.accuracy
              const W = 700, H = 220, pad = { t: 20, b: 30, l: 50, r: 20 }
              const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
              const allVals = sliced.flatMap(d => [d.actual, d.predicted])
              const maxV = Math.max(...allVals) * 1.02, minV = Math.min(...allVals) * 0.98
              const range = maxV - minV || 1
              const toX = (i: number) => pad.l + (i / (sliced.length - 1)) * cw
              const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
              const makePath = (vals: number[]) => vals.reduce((acc, v, i) => {
                const x = toX(i), y = toY(v)
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
              }, "")
              const actualPath = makePath(sliced.map(d => d.actual))
              const predPath = makePath(sliced.map(d => d.predicted))

              return (
          <main className="p-6 space-y-6">
            {/* Back + header */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setValidationModelId("")}>
                <ArrowLeft className="h-4 w-4" /> 모델 목록
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold truncate">{validationModel.name}</h2>
                  <Badge variant="outline" className={cn("shrink-0", STATUS_CONFIG[validationModel.status].color)}>
                    {STATUS_CONFIG[validationModel.status].label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{validationModel.unit}</Badge>
                  <span className="text-xs text-muted-foreground">{validationModel.equipment}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{validationModel.purpose} | {validationModel.creator} | {validationModel.createdDate}</p>
              </div>
              {/* Period selector */}
              <div className="flex gap-1.5">
                {[{ id: "7d", label: "7일" }, { id: "30d", label: "30일" }, { id: "90d", label: "90일" }].map(p => (
                  <Button key={p.id} variant={validationPeriod === p.id ? "default" : "outline"} size="sm"
                    onClick={() => setValidationPeriod(p.id)} className={validationPeriod !== p.id ? "bg-transparent" : ""}>
                    {p.label}
                  </Button>
                ))}
              </div>
              {/* Action buttons */}
              {validationModel.status !== "dropped" && validationModel.status !== "production" && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-transparent"
                    onClick={() => setShowDropDialog(true)}>
                    <X className="h-3.5 w-3.5" />Drop
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => setShowPromotionDialog(true)}>
                    <ArrowUpRight className="h-3.5 w-3.5" />Production 승격
                  </Button>
                </div>
              )}
            </div>

            {/* Drop info */}
            {validationModel.status === "dropped" && (
              <Card className="border-l-4 border-l-red-400">
                <CardContent className="py-3 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Drop 처리됨</p>
                    <p className="text-xs text-muted-foreground mt-0.5">사유: {validationModel.dropReason}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Production info */}
            {validationModel.status === "production" && (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="py-3 flex items-center gap-3">
                  <Play className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700">Production 등록 완료</p>
                    <p className="text-xs text-muted-foreground">모델 기반 최적화의 정규 모델로 운영 중입니다</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {/* Model info card */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground block text-xs">모델 ID</span><span className="font-mono">{validationModel.id}</span></div>
                    <div><span className="text-muted-foreground block text-xs">Endpoint</span><span className="font-mono text-xs truncate block max-w-[200px]">{validationModel.endpointUrl || "-"}</span></div>
                    <div><span className="text-muted-foreground block text-xs">학습 기간</span><span>{validationModel.trainingPeriod.from || "-"} ~ {validationModel.trainingPeriod.to || "-"}</span></div>
                    <div><span className="text-muted-foreground block text-xs">태그 수</span><span>{validationModel.selectedTags.length}개</span></div>
                  </div>
                </CardContent>
              </Card>

                  {acc && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "RMSE", value: acc.rmse, unit: "", good: acc.rmse < 3, desc: "Root Mean Square Error" },
                        { label: "MAE", value: acc.mae, unit: "", good: acc.mae < 2, desc: "Mean Absolute Error" },
                        { label: "R\u00B2", value: acc.r2, unit: "", good: acc.r2 >= 0.9, desc: "Coefficient of Determination" },
                        { label: "MAPE", value: acc.mape, unit: "%", good: acc.mape < 3, desc: "Mean Absolute % Error" },
                      ].map(kpi => (
                        <Card key={kpi.label}>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{kpi.label}</span>
                              {kpi.good ? <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">양호</Badge>
                                : <Badge className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-100">주의</Badge>}
                            </div>
                            <div className="text-2xl font-bold mt-1">{kpi.value}{kpi.unit}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">{kpi.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />예측값 vs 실측값 비교</div>
                        <div className="flex items-center gap-4 text-xs font-normal text-muted-foreground">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />실측값</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />예측값</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
                        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                          const y = pad.t + frac * ch; const val = maxV - frac * range
                          return (<g key={frac}><line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="currentColor" strokeOpacity={0.06} /><text x={pad.l - 6} y={y + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{val.toFixed(1)}</text></g>)
                        })}
                        {sliced.filter((_, i) => i % Math.max(1, Math.floor(sliced.length / 6)) === 0).map(d => {
                          const idx = sliced.indexOf(d)
                          return <text key={d.day} x={toX(idx)} y={H - 5} fontSize="8" fill="currentColor" fillOpacity={0.4} textAnchor="middle">{d.day}</text>
                        })}
                        <path d={`${actualPath} ${makePath(sliced.map(d => d.predicted).reverse()).replace("M", "L")} Z`} fill="currentColor" opacity="0.03" />
                        <path d={actualPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                        <path d={predPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round" />
                        {sliced.map((d, i) => (<g key={i}><circle cx={toX(i)} cy={toY(d.actual)} r={2} fill="#10b981" /><circle cx={toX(i)} cy={toY(d.predicted)} r={2} fill="#3b82f6" /></g>))}
                      </svg>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />예측 편차 분포</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-1 h-32 justify-center">
                        {(() => {
                          const devs = sliced.map(d => d.deviation)
                          const absMax = Math.max(...devs.map(Math.abs), 1)
                          const bins = 10; const binW = (absMax * 2) / bins
                          const binCounts = Array(bins).fill(0)
                          devs.forEach(d => { const idx = Math.min(bins - 1, Math.max(0, Math.floor((d + absMax) / binW))); binCounts[idx]++ })
                          const maxCount = Math.max(...binCounts, 1)
                          return binCounts.map((c, i) => {
                            const center = -absMax + (i + 0.5) * binW; const isCenter = Math.abs(center) < binW
                            return (
                              <div key={i} className="flex flex-col items-center gap-1" style={{ width: `${100 / bins}%` }}>
                                <div className={cn("w-full rounded-t transition-all", isCenter ? "bg-green-400" : Math.abs(center) > absMax * 0.6 ? "bg-red-300" : "bg-blue-300")}
                                  style={{ height: `${(c / maxCount) * 100}%`, minHeight: c > 0 ? 4 : 0 }} />
                                <span className="text-[8px] text-muted-foreground">{center.toFixed(1)}</span>
                              </div>
                            )
                          })
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">편차 = 예측값 - 실측값 (0에 가까울수록 정확)</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>
          )
        })()}

        {/* ========== DIALOGS ========== */}

        {/* 새 모델 생성 */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />새 모델 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="flex items-center gap-1"><span className="text-destructive">*</span>모델명</Label>
                  <Input placeholder="예: HCR Reactor Outlet Temp 예측 모델" value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><span className="text-destructive">*</span>예측 목적</Label>
                  <Select value={newModel.purpose} onValueChange={v => setNewModel({ ...newModel, purpose: v })}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>{PURPOSE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><span className="text-destructive">*</span>관련 공정</Label>
                  <Select value={newModel.unit} onValueChange={v => setNewModel({ ...newModel, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>대상 설비</Label>
                  <Input placeholder="예: R-3001, Furnace F-1001" value={newModel.equipment} onChange={e => setNewModel({ ...newModel, equipment: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea placeholder="모델에 대한 설명을 입력하세요..." value={newModel.description} onChange={e => setNewModel({ ...newModel, description: e.target.value })} rows={2} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>취소</Button>
              <Button onClick={handleCreateModel} disabled={!newModel.name.trim() || !newModel.purpose}>생성 후 데이터 선정으로</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 모델 구성 요청 */}
        <Dialog open={showConfigRequest} onOpenChange={setShowConfigRequest}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />모델 구성 요청</DialogTitle>
            </DialogHeader>
            {selectedModel && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">모델명</span><span className="font-medium">{selectedModel.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">관련 공정</span><span className="font-medium">{selectedModel.unit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">End Point</span><span className="font-mono text-xs truncate max-w-[250px]">{selectedModel.endpointUrl}</span></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">수신팀</Label>
                  <Input value="DX추진팀" readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">요청 내용</Label>
                  <Textarea placeholder="모델 구성에 필요한 추가 요청사항을 입력하세요..." rows={3} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigRequest(false)}>취소</Button>
              <Button onClick={() => {
                if (selectedModel) advanceStep(selectedModel.id, "config-requested")
                setShowConfigRequest(false)
              }} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />요청 전송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Production 승격 확인 */}
        <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-green-600" />Production 승격</DialogTitle>
            </DialogHeader>
            {validationModel && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <p className="text-sm text-green-800 font-medium">Production 승격 시 다음이 수행됩니다:</p>
                  <ul className="text-sm text-green-700 space-y-1 ml-4 list-disc">
                    <li>모델 상태가 Production으로 변경됩니다</li>
                    <li>{"\"모델 개선\""}  유형의 티켓이 자동 발행됩니다</li>
                    <li>발행된 티켓은 조치/활동에서 트래킹됩니다</li>
                  </ul>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">모델명</span><span className="font-medium">{validationModel.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">공정/설비</span><span className="font-medium">{validationModel.unit} / {validationModel.equipment}</span></div>
                  {validationModel.accuracy && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">R{'\u00B2'}</span><span className={cn("font-medium", validationModel.accuracy.r2 >= 0.9 ? "text-green-600" : "text-orange-600")}>{validationModel.accuracy.r2}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">MAPE</span><span className={cn("font-medium", validationModel.accuracy.mape < 3 ? "text-green-600" : "text-orange-600")}>{validationModel.accuracy.mape}%</span></div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">승격 메모 (선택)</Label>
                  <Textarea placeholder="Production 승격 관련 메모를 입력하세요..." value={promotionNote} onChange={e => setPromotionNote(e.target.value)} rows={2} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowPromotionDialog(false); setPromotionNote("") }}>취소</Button>
              <Button onClick={handlePromotion} className="gap-1.5 bg-green-600 hover:bg-green-700">
                <ArrowUpRight className="h-3.5 w-3.5" />승격 및 티켓 발행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drop 사유 */}
        <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />모델 Drop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">Drop된 모델은 더 이상 운영되지 않지만, 이력은 보존됩니다.</p>
              </div>
              {validationModel && (
                <p className="text-sm"><span className="text-muted-foreground">대상 모델: </span><span className="font-medium">{validationModel.name}</span></p>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><span className="text-destructive">*</span>Drop 사유</Label>
                <Textarea placeholder="예: MAPE 8.5%로 목표 정확도 미달, Feed 조건 변동이 커 모델 재설계 필요" value={dropReason} onChange={e => setDropReason(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDropDialog(false); setDropReason("") }}>취소</Button>
              <Button variant="destructive" onClick={handleDrop} disabled={!dropReason.trim()} className="gap-1.5">
                <X className="h-3.5 w-3.5" />Drop 처리
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
