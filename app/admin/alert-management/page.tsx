"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Bell,
  Plus,
  Search,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Edit,
  Trash2,
  BarChart3,
  User,
  Activity,
  TrendingUp,
  ChevronRight,
} from "lucide-react"

// ========== 전체 Alert 마스터 데이터 ==========
const ALERT_MASTER_DATA = [
  { id: "ALT-M001", tagId: "TI-2001", name: "HCR Reactor Inlet Temp High", unit: "HCR", type: "Process", grade: "상", limit: 400, uom: "\u00b0C", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
  { id: "ALT-M002", tagId: "PI-3001", name: "Low Pressure Alert", unit: "HCR", type: "Process", grade: "중", limit: 140, uom: "kg/cm2", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
  { id: "ALT-M003", tagId: "FI-1001", name: "Feed Flow Low Alert", unit: "CDU", type: "Process", grade: "하", limit: 300, uom: "m3/h", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2023-07-01" },
  { id: "ALT-M004", tagId: "TI-2931", name: "HCR Exchanger Fouling Alert", unit: "HCR", type: "Health", grade: "상", limit: 470, uom: "W/m2K", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2024-01-10" },
  { id: "ALT-M005", tagId: "TI-3005", name: "VDU Column Bottom Temp High", unit: "VDU", type: "Process", grade: "중", limit: 360, uom: "\u00b0C", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-08-20" },
  { id: "ALT-M006", tagId: "PI-1501", name: "VDU Column Pressure Low", unit: "VDU", type: "Process", grade: "중", limit: 0.5, uom: "kg/cm2", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2023-08-20" },
  { id: "ALT-M007", tagId: "FI-3002", name: "H2 Makeup Flow High", unit: "HCR", type: "Process", grade: "하", limit: 95000, uom: "Nm3/h", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-09-01" },
  { id: "ALT-M008", tagId: "AI-3002", name: "Product Sulfur High", unit: "HCR", type: "Quality", grade: "상", limit: 10, uom: "ppm", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
  { id: "ALT-M009", tagId: "LI-1001", name: "Column Level High", unit: "CDU", type: "Process", grade: "중", limit: 70, uom: "%", direction: "High", enabled: false, createdBy: "시스템", createdAt: "2023-07-01" },
  { id: "ALT-M010", tagId: "TI-4001", name: "Reformer Outlet Temp High", unit: "NHT", type: "Process", grade: "상", limit: 520, uom: "\u00b0C", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2024-03-15" },
  { id: "ALT-M011", tagId: "VI-2001", name: "Compressor Vibration High", unit: "UTIL", type: "Mechanical", grade: "상", limit: 7.1, uom: "mm/s", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2024-05-10" },
  { id: "ALT-M012", tagId: "FI-5001", name: "Flare Flow Abnormal", unit: "UTIL", type: "Safety", grade: "상", limit: 50, uom: "ton/h", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
]

// ========== 개인화 Alert 데이터 ==========
const PERSONAL_ALERT_DATA = [
  { id: "PA-001", tagId: "TI-2001", name: "내 관심: HCR Reactor Temp", unit: "HCR", threshold: 395, uom: "\u00b0C", direction: "High", notification: "앱+이메일", enabled: true, createdAt: "2025-01-15", owner: "김지수" },
  { id: "PA-002", tagId: "FI-1001", name: "CDU Feed Flow 감시", unit: "CDU", threshold: 310, uom: "m3/h", direction: "Low", notification: "앱", enabled: true, createdAt: "2025-01-20", owner: "김지수" },
  { id: "PA-003", tagId: "AI-3002", name: "HCR Product Sulfur 사전경고", unit: "HCR", threshold: 8, uom: "ppm", direction: "High", notification: "앱+이메일", enabled: true, createdAt: "2025-02-01", owner: "김지수" },
  { id: "PA-004", tagId: "TI-4001", name: "NHT Outlet Temp 모니터링", unit: "NHT", threshold: 510, uom: "\u00b0C", direction: "High", notification: "앱", enabled: false, createdAt: "2025-01-10", owner: "김지수" },
]

// ========== Alert 현황 데이터 ==========
const ALERT_STATUS_DATA = [
  { id: "AS-001", alertId: "ALT-M001", tagId: "TI-2001", name: "HCR Reactor Inlet Temp High", unit: "HCR", grade: "상", state: "new", value: 412, limit: 400, uom: "\u00b0C", occurrences: 8, firstOccurrence: "2025-02-01 10:30", lastOccurrence: "2025-02-02 14:32", assignee: "김지수" },
  { id: "AS-002", alertId: "ALT-M002", tagId: "PI-3001", name: "Low Pressure Alert", unit: "HCR", grade: "중", state: "standing", value: 138.5, limit: 140, uom: "kg/cm2", occurrences: 3, firstOccurrence: "2025-02-01 13:15", lastOccurrence: "2025-02-02 13:15", assignee: "박현우" },
  { id: "AS-003", alertId: "ALT-M003", tagId: "FI-1001", name: "Feed Flow Low Alert", unit: "CDU", grade: "하", state: "shelved", value: 295, limit: 300, uom: "m3/h", occurrences: 1, firstOccurrence: "2025-02-01 22:45", lastOccurrence: "2025-02-01 22:45", assignee: "김지수" },
  { id: "AS-004", alertId: "ALT-M004", tagId: "TI-2931", name: "HCR Exchanger Fouling Alert", unit: "HCR", grade: "상", state: "new", value: 480, limit: 470, uom: "W/m2K", occurrences: 5, firstOccurrence: "2025-02-01 18:00", lastOccurrence: "2025-02-02 10:15", assignee: "김지수" },
  { id: "AS-005", alertId: "ALT-M008", tagId: "AI-3002", name: "Product Sulfur High", unit: "HCR", grade: "상", state: "standing", value: 9.2, limit: 10, uom: "ppm", occurrences: 2, firstOccurrence: "2025-02-01 08:00", lastOccurrence: "2025-02-02 08:00", assignee: "이승호" },
  { id: "AS-006", alertId: "ALT-M011", tagId: "VI-2001", name: "Compressor Vibration High", unit: "UTIL", grade: "상", state: "resolved", value: 5.2, limit: 7.1, uom: "mm/s", occurrences: 4, firstOccurrence: "2025-01-28 06:00", lastOccurrence: "2025-01-30 18:00", assignee: "박현우" },
]

const PERSONAL_STATUS_DATA = [
  { id: "PS-001", alertId: "PA-001", tagId: "TI-2001", name: "내 관심: HCR Reactor Temp", unit: "HCR", threshold: 395, value: 412, uom: "\u00b0C", state: "active", triggeredAt: "2025-02-02 10:15", owner: "김지수" },
  { id: "PS-002", alertId: "PA-003", tagId: "AI-3002", name: "HCR Product Sulfur 사전경고", unit: "HCR", threshold: 8, value: 9.2, uom: "ppm", state: "active", triggeredAt: "2025-02-02 08:30", owner: "김지수" },
]

function getGradeColor(grade: string) {
  switch (grade) {
    case "상": return "bg-red-100 text-red-700 border-red-200"
    case "중": return "bg-amber-100 text-amber-700 border-amber-200"
    case "하": return "bg-blue-100 text-blue-700 border-blue-200"
    default: return "bg-muted text-muted-foreground"
  }
}

function getStateInfo(state: string) {
  switch (state) {
    case "new": return { label: "New", color: "bg-red-100 text-red-700 border-red-200" }
    case "standing": return { label: "Standing", color: "bg-amber-100 text-amber-700 border-amber-200" }
    case "shelved": return { label: "Shelved", color: "bg-muted text-muted-foreground border-border" }
    case "resolved": return { label: "Resolved", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
    case "active": return { label: "Active", color: "bg-red-100 text-red-700 border-red-200" }
    default: return { label: state, color: "bg-muted text-muted-foreground" }
  }
}

export default function AlertManagementPage() {
  const [mainTab, setMainTab] = useState("alert-list")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterGrade, setFilterGrade] = useState("all")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [showPersonalRegisterDialog, setShowPersonalRegisterDialog] = useState(false)
  const [statusTab, setStatusTab] = useState("all")

  const filteredMasterAlerts = ALERT_MASTER_DATA.filter(a => {
    const matchSearch = searchQuery === "" ||
      a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchUnit = filterUnit === "all" || a.unit === filterUnit
    const matchGrade = filterGrade === "all" || a.grade === filterGrade
    return matchSearch && matchUnit && matchGrade
  })

  const filteredPersonalAlerts = PERSONAL_ALERT_DATA.filter(a => {
    const matchSearch = searchQuery === "" ||
      a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSearch
  })

  const units = [...new Set(ALERT_MASTER_DATA.map(a => a.unit))]

  // Summary counts
  const totalAlerts = ALERT_MASTER_DATA.length
  const enabledAlerts = ALERT_MASTER_DATA.filter(a => a.enabled).length
  const newAlertCount = ALERT_STATUS_DATA.filter(a => a.state === "new").length
  const standingAlertCount = ALERT_STATUS_DATA.filter(a => a.state === "standing").length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Alert 관리</h1>
              <p className="text-sm text-muted-foreground">Alert 전체 리스트 관리, 개인화 Alert 설정, 현황 모니터링</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                내보내기
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 Alert</p>
                    <p className="text-2xl font-bold">{totalAlerts}</p>
                  </div>
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">활성 {enabledAlerts} / 비활성 {totalAlerts - enabledAlerts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New Alert</p>
                    <p className="text-2xl font-bold text-red-600">{newAlertCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">즉시 확인 필요</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Standing Alert</p>
                    <p className="text-2xl font-bold text-amber-600">{standingAlertCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">지속 관찰 중</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">개인화 Alert</p>
                    <p className="text-2xl font-bold text-primary">{PERSONAL_ALERT_DATA.filter(a => a.enabled).length}</p>
                  </div>
                  <User className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">내가 설정한 Alert</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="alert-list" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Alert 전체 리스트
              </TabsTrigger>
              <TabsTrigger value="personal-list" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                개인화 Alert
              </TabsTrigger>
              <TabsTrigger value="alert-status" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Alert 현황
              </TabsTrigger>
            </TabsList>

            {/* ===== Tab 1: Alert 전체 리스트 ===== */}
            <TabsContent value="alert-list" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tag ID 또는 Alert 명칭 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 Unit</SelectItem>
                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="등급" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 등급</SelectItem>
                    <SelectItem value="상">상</SelectItem>
                    <SelectItem value="중">중</SelectItem>
                    <SelectItem value="하">하</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowRegisterDialog(true)} className="gap-1.5 ml-auto">
                  <Plus className="h-4 w-4" />
                  Alert 등록
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">타입</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">등급</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Limit</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">방향</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">생성자</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMasterAlerts.map(alert => (
                          <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{alert.id}</td>
                            <td className="px-4 py-3 font-mono font-medium">{alert.tagId}</td>
                            <td className="px-4 py-3">{alert.name}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{alert.unit}</Badge></td>
                            <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{alert.type}</Badge></td>
                            <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", getGradeColor(alert.grade))}>{alert.grade}</Badge></td>
                            <td className="px-4 py-3 text-right font-mono">{alert.limit} {alert.uom}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className={cn("text-xs", alert.direction === "High" ? "border-red-200 text-red-600" : "border-blue-200 text-blue-600")}>
                                {alert.direction === "High" ? "\u25B2 High" : "\u25BC Low"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {alert.enabled ? (
                                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">활성</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">비활성</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-muted-foreground">{alert.createdBy}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                    전체 {filteredMasterAlerts.length}건 표시 (총 {ALERT_MASTER_DATA.length}건)
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Tab 2: 개인화 Alert ===== */}
            <TabsContent value="personal-list" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tag ID 또는 Alert 명칭 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setShowPersonalRegisterDialog(true)} className="gap-1.5 ml-auto">
                  <Plus className="h-4 w-4" />
                  개인화 Alert 등록
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Threshold</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">방향</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">알림 방식</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">생성일</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPersonalAlerts.map(alert => (
                          <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{alert.id}</td>
                            <td className="px-4 py-3 font-mono font-medium">{alert.tagId}</td>
                            <td className="px-4 py-3">{alert.name}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{alert.unit}</Badge></td>
                            <td className="px-4 py-3 text-right font-mono">{alert.threshold} {alert.uom}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className={cn("text-xs", alert.direction === "High" ? "border-red-200 text-red-600" : "border-blue-200 text-blue-600")}>
                                {alert.direction === "High" ? "\u25B2 High" : "\u25BC Low"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center text-xs">{alert.notification}</td>
                            <td className="px-4 py-3 text-center">
                              {alert.enabled ? (
                                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">활성</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">비활성</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-muted-foreground">{alert.createdAt}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                    전체 {filteredPersonalAlerts.length}건 표시
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Tab 3: Alert 현황 ===== */}
            <TabsContent value="alert-status" className="space-y-4">
              <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList>
                  <TabsTrigger value="all">전체 Alert 현황</TabsTrigger>
                  <TabsTrigger value="personal">개인화 Alert 현황</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {/* Status summary */}
                  <div className="grid grid-cols-4 gap-3">
                    {["new", "standing", "shelved", "resolved"].map(state => {
                      const info = getStateInfo(state)
                      const count = ALERT_STATUS_DATA.filter(a => a.state === state).length
                      return (
                        <Card key={state} className={cn("cursor-pointer hover:shadow-sm transition-shadow", state === "new" && count > 0 && "border-red-200")}>
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center justify-between">
                              <Badge className={cn("text-xs", info.color)}>{info.label}</Badge>
                              <span className="text-xl font-bold">{count}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                              <th className="text-center px-4 py-3 font-medium text-muted-foreground">등급</th>
                              <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                              <th className="text-right px-4 py-3 font-medium text-muted-foreground">현재값</th>
                              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Limit</th>
                              <th className="text-center px-4 py-3 font-medium text-muted-foreground">발생횟수</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">최초 발생</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">최근 발생</th>
                              <th className="text-center px-4 py-3 font-medium text-muted-foreground">담당자</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ALERT_STATUS_DATA.map(a => {
                              const stateInfo = getStateInfo(a.state)
                              return (
                                <tr key={a.id} className={cn("border-b hover:bg-muted/30 transition-colors", a.state === "new" && "bg-red-50/30")}>
                                  <td className="px-4 py-3 font-mono font-medium">{a.tagId}</td>
                                  <td className="px-4 py-3">{a.name}</td>
                                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.unit}</Badge></td>
                                  <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", getGradeColor(a.grade))}>{a.grade}</Badge></td>
                                  <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", stateInfo.color)}>{stateInfo.label}</Badge></td>
                                  <td className={cn("px-4 py-3 text-right font-mono", a.state === "new" && "text-red-600 font-semibold")}>{a.value} {a.uom}</td>
                                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{a.limit} {a.uom}</td>
                                  <td className="px-4 py-3 text-center">
                                    {a.occurrences > 1 ? (
                                      <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                        {a.occurrences}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">{a.occurrences}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.firstOccurrence}</td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.lastOccurrence}</td>
                                  <td className="px-4 py-3 text-center text-xs">{a.assignee}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                              <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                              <th className="text-right px-4 py-3 font-medium text-muted-foreground">현재값</th>
                              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Threshold</th>
                              <th className="text-left px-4 py-3 font-medium text-muted-foreground">발생 시각</th>
                            </tr>
                          </thead>
                          <tbody>
                            {PERSONAL_STATUS_DATA.map(a => {
                              const stateInfo = getStateInfo(a.state)
                              return (
                                <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 font-mono font-medium">{a.tagId}</td>
                                  <td className="px-4 py-3">{a.name}</td>
                                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.unit}</Badge></td>
                                  <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", stateInfo.color)}>{stateInfo.label}</Badge></td>
                                  <td className="px-4 py-3 text-right font-mono text-red-600 font-semibold">{a.value} {a.uom}</td>
                                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{a.threshold} {a.uom}</td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.triggeredAt}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {PERSONAL_STATUS_DATA.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">현재 발생 중인 개인화 Alert이 없습니다.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* ===== Alert 등록 Dialog ===== */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert 등록
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tag ID</Label>
                <Input placeholder="예: TI-2001" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alert 명칭</Label>
              <Input placeholder="Alert 명칭 입력" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>타입</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="타입" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Process">Process</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Quality">Quality</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>등급</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="등급" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="상">상</SelectItem>
                    <SelectItem value="중">중</SelectItem>
                    <SelectItem value="하">하</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>방향</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="방향" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limit 값</Label>
                <Input type="number" placeholder="예: 400" />
              </div>
              <div className="space-y-2">
                <Label>단위</Label>
                <Input placeholder="예: \u00b0C, kg/cm2, m3/h" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea placeholder="Alert 배경 및 설명..." className="resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>취소</Button>
            <Button onClick={() => setShowRegisterDialog(false)}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 개인화 Alert 등록 Dialog ===== */}
      <Dialog open={showPersonalRegisterDialog} onOpenChange={setShowPersonalRegisterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              개인화 Alert 등록
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tag ID</Label>
                <Input placeholder="예: TI-2001" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alert 명칭</Label>
              <Input placeholder="예: 내 관심 HCR Reactor Temp" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input type="number" placeholder="예: 395" />
              </div>
              <div className="space-y-2">
                <Label>단위</Label>
                <Input placeholder="예: \u00b0C" />
              </div>
              <div className="space-y-2">
                <Label>방향</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="방향" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>알림 방식</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="알림 방식 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">앱</SelectItem>
                  <SelectItem value="app-email">앱+이메일</SelectItem>
                  <SelectItem value="email">이메일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPersonalRegisterDialog(false)}>취소</Button>
            <Button onClick={() => setShowPersonalRegisterDialog(false)}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
