"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  BookOpen, Search, FileText, Shield, Activity,
  ChevronRight, ChevronLeft, ExternalLink, Clock, RefreshCw, AlertTriangle,
  ArrowUpDown, CheckCircle2, Calendar, User, Info, Link2
} from "lucide-react"
import { cn } from "@/lib/utils"

const STATIC_GUIDES = [
  { id: "OG-001", title: "HCR Reactor Operation Guide", process: "HCR", category: "Operation Guide", version: "Rev.5", lastReviewed: "2025-01-10", owner: "Process Eng.", status: "approved",
    description: "HCR 반응기 운전의 핵심 파라미터를 정의합니다. W150N/W600N/G-III 모드별 운전 범위가 상이하므로 모드 전환 시 반드시 참조해야 합니다.",
    relatedDocs: ["CP-HCR-001 (비상 절차서)", "RG-001 (모드 전환 가이드)"],
    params: [
      { name: "Reactor Inlet Temp", tag: "TI-2101", min: 340, max: 400, unit: "deg.C", note: "W600N 모드 기준" },
      { name: "H2/Oil Ratio", tag: "FRC-2102", min: 800, max: 1200, unit: "Nm3/m3", note: "촉매 수명 연장 위해 1000 이상 유지" },
      { name: "Reactor dP", tag: "PDI-2103", min: 0, max: 3.5, unit: "kg/cm2", note: "3.0 이상 시 Alert" },
      { name: "WABT", tag: "TI-2104", min: 360, max: 410, unit: "deg.C", note: "EOR 기준 410" },
      { name: "Quench Gas Flow", tag: "FI-2105", min: 5000, max: 15000, unit: "Nm3/h", note: "Bed간 온도차 조절용" },
      { name: "Recycle Gas Purity", tag: "AI-2106", min: 75, max: 95, unit: "%", note: "75% 미만 시 반응 효율 저하" },
      { name: "HP Separator Temp", tag: "TI-2107", min: 40, max: 55, unit: "deg.C", note: "NH4Cl 결정 방지" },
    ]},
  { id: "OG-002", title: "CDU Atmospheric Column Guide", process: "CDU", category: "Operation Guide", version: "Rev.8", lastReviewed: "2025-01-05", owner: "Process Eng.", status: "approved",
    description: "CDU 상압증류탑의 주요 운전 변수 가이드. 원유 종류(HS/LS/Arabian 등)에 따라 운전 범위가 달라지므로 원유 Grade 변경 시 반드시 확인.",
    relatedDocs: ["RG-003 (원유 Grade 전환 가이드)", "IOW-002 (Overhead Corrosion IOW)"],
    params: [
      { name: "Column Top Temp", tag: "TI-1001", min: 105, max: 125, unit: "deg.C", note: "HS원유 기준" },
      { name: "Column Bottom Temp", tag: "TI-1002", min: 340, max: 360, unit: "deg.C", note: "" },
      { name: "Reflux Ratio", tag: "FRC-1003", min: 1.5, max: 3.0, unit: "-", note: "분리효율 확보" },
      { name: "Feed Flow", tag: "FI-1004", min: 200, max: 350, unit: "m3/h", note: "최대 처리량" },
      { name: "Overflash", tag: "FI-1005", min: 2, max: 5, unit: "%", note: "분리 효율 유지" },
      { name: "Stripping Steam", tag: "FI-1006", min: 1.5, max: 3.0, unit: "ton/h", note: "" },
    ]},
  { id: "OG-003", title: "FCC Riser/Regenerator Guide", process: "FCC", category: "Operation Guide", version: "Rev.6", lastReviewed: "2024-12-20", owner: "Process Eng.", status: "approved",
    description: "FCC Riser 반응기와 Regenerator의 핵심 운전 파라미터. 전환율과 제품 수율 최적화의 근간이 되는 가이드.",
    relatedDocs: ["IOW-003 (Regenerator Erosion IOW)", "RG-005 (촉매 사용량 주간 점검)"],
    params: [
      { name: "Riser Outlet Temp", tag: "TI-3001", min: 510, max: 540, unit: "deg.C", note: "전환율 제어 핵심" },
      { name: "Cat/Oil Ratio", tag: "CALC-3002", min: 5, max: 8, unit: "-", note: "" },
      { name: "Regenerator Temp", tag: "TI-3003", min: 680, max: 720, unit: "deg.C", note: "촉매 소손 방지" },
      { name: "Regenerator dP", tag: "PDI-3004", min: 0.3, max: 0.8, unit: "kg/cm2", note: "Catalyst inventory 지표" },
      { name: "Flue Gas O2", tag: "AI-3005", min: 0.5, max: 2.0, unit: "%", note: "완전연소 확인" },
    ]},
  { id: "OG-004", title: "VDU Vacuum Column Guide", process: "VDU", category: "Operation Guide", version: "Rev.4", lastReviewed: "2025-01-08", owner: "Process Eng.", status: "approved",
    description: "VDU 감압증류탑 운전 가이드. 진공도 유지와 Flash Zone 온도 관리가 핵심.",
    relatedDocs: [],
    params: [
      { name: "Top Vacuum", tag: "PI-4001", min: 15, max: 30, unit: "mmHgA", note: "진공도 유지 필수" },
      { name: "Flash Zone Temp", tag: "TI-4002", min: 380, max: 410, unit: "deg.C", note: "" },
      { name: "Slop Wax Flow", tag: "FI-4003", min: 0, max: 15, unit: "m3/h", note: "과다시 열효율 저하" },
    ]},
  { id: "OG-005", title: "SRU Claus Reactor Guide", process: "SRU", category: "Operation Guide", version: "Rev.3", lastReviewed: "2024-11-15", owner: "Process Eng.", status: "approved",
    description: "SRU Claus 공정 반응기 운전 가이드. H2S/SO2 비율이 황 회수율의 핵심.",
    relatedDocs: [],
    params: [
      { name: "Reaction Furnace Temp", tag: "TI-5001", min: 1000, max: 1250, unit: "deg.C", note: "" },
      { name: "H2S/SO2 Ratio", tag: "AI-5002", min: 1.8, max: 2.2, unit: "-", note: "최적 2.0" },
      { name: "Tail Gas H2S", tag: "AI-5003", min: 0, max: 150, unit: "ppm", note: "환경 규제치" },
    ]},
  { id: "IOW-001", title: "HCR High Temp H2 Attack IOW", process: "HCR", category: "IOW", version: "Rev.2", lastReviewed: "2025-01-12", owner: "Inspection", status: "approved",
    description: "고온 수소 환경에서의 Nelson Curve 기반 Integrity Operating Window. 반응기 벽면 온도와 수소 분압의 조합이 Material Limit을 초과하지 않도록 관리.",
    relatedDocs: ["OG-001 (HCR Reactor Guide)"],
    params: [
      { name: "Reactor Wall Temp", tag: "TI-2201", min: 0, max: 454, unit: "deg.C", note: "Nelson Curve 기준" },
      { name: "H2 Partial Pressure", tag: "PI-2202", min: 0, max: 180, unit: "kg/cm2", note: "Material Limit" },
      { name: "Skin Temp Deviation", tag: "TI-2203", min: -10, max: 10, unit: "deg.C", note: "Hot Spot 감시" },
    ]},
  { id: "IOW-002", title: "CDU Overhead Corrosion IOW", process: "CDU", category: "IOW", version: "Rev.3", lastReviewed: "2025-01-05", owner: "Inspection", status: "approved",
    description: "CDU Overhead 계통의 부식 관리를 위한 IOW. pH, Chloride, Iron 분석을 통해 부식 상태를 모니터링.",
    relatedDocs: ["OG-002 (CDU Column Guide)", "RG-007 (Corrosion Coupon 점검)"],
    params: [
      { name: "Overhead pH", tag: "AI-1101", min: 5.5, max: 7.0, unit: "-", note: "산성 부식 방지" },
      { name: "Chloride Content", tag: "AI-1102", min: 0, max: 20, unit: "ppm", note: "" },
      { name: "Iron Content", tag: "AI-1103", min: 0, max: 1.0, unit: "ppm", note: "부식 지표" },
      { name: "Neutralizer Injection", tag: "FI-1104", min: 5, max: 20, unit: "L/h", note: "pH 조절" },
    ]},
  { id: "IOW-003", title: "FCC Regenerator Erosion IOW", process: "FCC", category: "IOW", version: "Rev.2", lastReviewed: "2024-12-18", owner: "Inspection", status: "approved",
    description: "FCC Regenerator 내부 Erosion 관련 IOW. Cyclone dP와 촉매 손실로 erosion 상태를 간접 모니터링.",
    relatedDocs: ["OG-003 (FCC Riser/Regenerator Guide)"],
    params: [
      { name: "Cyclone dP", tag: "PDI-3101", min: 50, max: 200, unit: "mmH2O", note: "촉매 손실 지표" },
      { name: "Stack Opacity", tag: "AI-3102", min: 0, max: 20, unit: "%", note: "환경 규제" },
      { name: "Catalyst Loss Rate", tag: "CALC-3103", min: 0, max: 2, unit: "ton/d", note: "비정상 손실 감시" },
    ]},
]

const REPEATABLE_GUIDES = [
  { id: "RG-001", title: "W600N 모드 전환 가이드", process: "HCR", triggerType: "mode-change" as const, frequency: "수시", lastIssued: "2025-02-01", nextDue: "-", status: "active", assignee: "김지수",
    description: "W600N 모드 전환 시 Reactor Inlet Temp, H2/Oil Ratio 등 주요 변수 조정 절차. 전환 전 촉매 상태 확인 필수.",
    background: "HCR 공정은 제품 모드에 따라 반응기 온도 프로파일이 크게 달라집니다. W600N은 고점도 기유 생산 모드로, WABT를 W150N 대비 약 10-15도 낮게 운전하며 H2/Oil Ratio를 상향해야 합니다.",
    steps: ["1. 현재 촉매 WABT 여유 확인 (EOR - 현재 WABT > 15deg.C)", "2. Feed Sulfur 분석 완료 확인 (Lab 결과 기준)", "3. Quench 밸브 Position 및 정상작동 확인", "4. Mode 전환 일정 운영팀 전체 공지", "5. Reactor Inlet Temp 단계적 조정 (2deg.C/hr)", "6. H2/Oil Ratio 목표값 도달 확인", "7. 변경 후 2hr 안정화 모니터링 실시", "8. 안정화 후 품질 샘플링 및 Lab 의뢰"],
    checklist: ["촉매 WABT 여유 확인 (EOR-현재 > 15deg)", "Feed Sulfur 분석 완료", "Quench 밸브 정상 확인", "Mode 전환 운영팀 공지", "변경 후 2hr 안정화 모니터링"],
    relatedDocs: ["OG-001 (HCR Reactor Guide)", "건전성 > Catalyst Aging 트렌드"],
    relatedLinks: [{ label: "HCR 건전성 대시보드", href: "/operations/health/catalyst-aging" }, { label: "HCR 커스텀 트렌드", href: "/dashboard/custom" }] },
  { id: "RG-002", title: "주간 Heat Exchanger Fouling 점검", process: "전체", triggerType: "periodic" as const, frequency: "주 1회", lastIssued: "2025-02-15", nextDue: "2025-02-22", status: "active", assignee: "이철수",
    description: "주요 열교환기의 U값 트렌드 확인 및 Cleaning 필요 여부 판단.",
    background: "열교환기 Fouling은 에너지 효율 저하의 주요 원인입니다. 주간 단위로 U값 트렌드를 확인하고 Cleaning 시점을 사전에 판단하여 비계획 정지를 예방합니다.",
    steps: ["1. 건전성 대시보드에서 Fouling 카테고리 전체 확인", "2. 신호등 Yellow/Red 항목 리스트업", "3. 해당 HEX의 U값 트렌드 상세 확인", "4. Shell/Tube side dP 트렌드 확인", "5. Fouling Rate (월간) 계산", "6. Action Window 확인 및 Cleaning Schedule 판단", "7. 결과를 운영 로그에 기록"],
    checklist: ["U값 트렌드 확인 (건전성 대시보드 참조)", "dP 트렌드 이상 유무", "Fouling Rate 계산 (월간)", "Cleaning Schedule 수립 필요 여부", "결과 운영 로그 기록"],
    relatedDocs: ["건전성 > Fouling 모니터링"],
    relatedLinks: [{ label: "건전성 Fouling 현황", href: "/operations/health/fouling" }] },
  { id: "RG-003", title: "원유 Grade 전환 운전 가이드", process: "CDU", triggerType: "mode-change" as const, frequency: "수시", lastIssued: "2025-02-10", nextDue: "-", status: "active", assignee: "박영희",
    description: "원유 Grade 변경 시 Desalter, Preheat Train, Column 온도 프로파일 조정 절차.",
    background: "원유 Grade에 따라 밀도, 황분, TAN, 증류 커브가 크게 달라지며, 이에 따라 Desalter 조건부터 Column 프로파일까지 전반적인 운전 조건 변경이 필요합니다.",
    steps: ["1. 신규 원유 Assay 입수 및 검토", "2. Crude Blend Ratio 확인", "3. Desalter 조건 조정 (온도, 화학제 주입량)", "4. Preheat Train 열수지 재계산", "5. Column 온도 프로파일 사전 변경", "6. 제품 품질 1hr 주기 확인 (Lab 연계)", "7. Overhead 부식 모니터링 강화"],
    checklist: ["신규 원유 Assay 확인", "Desalter 조건 조정", "Preheat Train 열수지 재계산", "Column 온도 프로파일 변경", "제품 품질 1hr 주기 확인"],
    relatedDocs: ["OG-002 (CDU Column Guide)", "IOW-002 (Overhead Corrosion IOW)"],
    relatedLinks: [{ label: "CDU 운전 현황", href: "/operations/process" }] },
  { id: "RG-004", title: "촉매 활성도 월간 평가", process: "HCR", triggerType: "periodic" as const, frequency: "월 1회", lastIssued: "2025-02-01", nextDue: "2025-03-01", status: "active", assignee: "김지수",
    description: "WABT 트렌드 기반 촉매 Deactivation Rate 계산 및 잔여 수명 예측.",
    background: "HCR 촉매의 활성도는 시간이 지남에 따라 점진적으로 감소합니다. 월간 평가를 통해 Deactivation Rate를 추적하고, EOR(End of Run) 시점을 정확히 예측하여 TA 계획에 반영합니다.",
    steps: ["1. 월간 평균 WABT 산출", "2. 전월 대비 WABT 변화량 확인", "3. Deactivation Rate 계산 (deg.C/month)", "4. EOR 예측일 업데이트", "5. AI 모델 Projection 결과와 비교", "6. 건전성 페이지 데이터 업데이트", "7. 월간 리포트에 결과 포함"],
    checklist: ["WABT 월간 평균 산출", "Deactivation Rate 계산", "EOR 예측일 업데이트", "AI 모델 결과와 비교", "건전성 페이지 업데이트"],
    relatedDocs: ["건전성 > Catalyst Aging", "최적화 > 촉매 수명/사용량"],
    relatedLinks: [{ label: "촉매 수명 분석", href: "/optimization/insight/catalyst" }, { label: "AI/ML 모델 관리", href: "/optimization/ai-ml" }] },
  { id: "RG-005", title: "FCC 촉매 사용량 주간 점검", process: "FCC", triggerType: "periodic" as const, frequency: "주 1회", lastIssued: "2025-02-14", nextDue: "2025-02-21", status: "active", assignee: "최민호",
    description: "Fresh/E-Cat 투입량 대비 손실량 확인 및 최적 투입량 AI 모델 대비 분석.",
    background: "FCC 촉매는 지속적으로 보충이 필요한 소모품이며, 적정 투입량 관리가 수율과 비용에 직접 영향을 미칩니다.",
    steps: ["1. 주간 Fresh Cat 투입량 집계", "2. E-Cat 물성 분석 결과 확인 (Activity, Metal Loading)", "3. 촉매 손실량 계산 (투입 - 재고 변동)", "4. AI 최적 투입량 대비 편차 분석", "5. 비용 영향 금액 산출", "6. 필요 시 투입량 조정 권고"],
    checklist: ["Fresh Cat 투입량 기록", "E-Cat 물성 분석 (Activity, Metal)", "촉매 손실량 계산", "AI 최적 대비 편차 확인", "비용 영향 분석"],
    relatedDocs: ["최적화 > Fluid 반응기 촉매 사용량"],
    relatedLinks: [{ label: "촉매 사용량 분석", href: "/optimization/insight/catalyst" }] },
  { id: "RG-006", title: "일일 IOW 점검 (전체 공정)", process: "전체", triggerType: "periodic" as const, frequency: "일 1회", lastIssued: "2025-02-18", nextDue: "2025-02-19", status: "active", assignee: "당직 근무조",
    description: "전 공정 IOW 항목 일일 점검. Critical/Standard Window 이탈 여부 확인.",
    background: "IOW(Integrity Operating Window)는 설비 건전성 유지를 위한 필수 운전 범위입니다. 일일 점검을 통해 이탈 항목을 조기에 발견하고 조치합니다.",
    steps: ["1. 건전성 대시보드에서 IOW 카테고리 확인", "2. Critical IOW 이탈 여부 최우선 확인", "3. Standard IOW 이탈 항목 리스트업", "4. 이탈 항목별 원인 분석", "5. 필요 조치 기록 및 실행", "6. 운영 로그에 점검 결과 기록"],
    checklist: ["Critical IOW 이탈 여부 확인", "Standard IOW 이탈 항목 리스트", "이탈 항목 원인 분석 및 조치 기록", "건전성 대시보드 신호등 확인"],
    relatedDocs: ["IOW-001~003"],
    relatedLinks: [{ label: "건전성 현황", href: "/operations/health/overview" }] },
  { id: "RG-007", title: "분기 Corrosion Coupon 점검", process: "CDU", triggerType: "periodic" as const, frequency: "분기 1회", lastIssued: "2025-01-05", nextDue: "2025-04-05", status: "upcoming", assignee: "Inspection팀",
    description: "CDU Overhead 계통 Corrosion Coupon 회수 및 부식속도 측정.",
    background: "Corrosion Coupon은 실제 부식 환경에 노출시켜 부식 속도를 직접 측정하는 방법입니다. 분기별 회수하여 중량 감소를 측정하고 부식 속도(mpy)를 계산합니다.",
    steps: ["1. Coupon 회수 위치 확인 (3개소)", "2. 안전작업 허가 취득", "3. Coupon 회수 및 세척", "4. 중량 감소 측정 (Lab)", "5. 부식속도 계산 (mpy)", "6. IOW 항목에 결과 반영", "7. Inhibitor 주입량 조정 검토"],
    checklist: ["Coupon 회수 (3개소)", "중량 감소 측정", "부식속도 계산 (mpy)", "IOW 항목 반영", "Inhibitor 주입량 조정 검토"],
    relatedDocs: ["IOW-002 (CDU Overhead Corrosion IOW)"],
    relatedLinks: [] },
  { id: "RG-008", title: "TA 전 Scope Finalization 가이드", process: "전체", triggerType: "event" as const, frequency: "TA 3개월 전", lastIssued: "2024-11-01", nextDue: "2025-08-01", status: "upcoming", assignee: "TA팀",
    description: "TA Scope 최종 확정 시 건전성 모니터링 결과, 과제 진행 현황, Worklist 최종 검토.",
    background: "TA(Turnaround) Scope 확정은 가장 비용 영향이 큰 의사결정 중 하나입니다. 건전성 모니터링, 과제 관리, Worklist를 종합적으로 검토하여 최적의 Scope를 확정합니다.",
    steps: ["1. 건전성 Red/Yellow 항목 전수 검토", "2. 과제 Worklist 최종 확인", "3. 자재 발주 현황 점검", "4. Scope 변경 사항 이력 확인", "5. TA 일정 영향 분석", "6. 최종 Scope Freeze 의사결정 회의"],
    checklist: ["건전성 Red/Yellow 항목 전수 검토", "과제 Worklist 최종 확인", "자재 발주 현황 점검", "Scope 변경 사항 이력 확인", "TA 일정 영향 분석"],
    relatedDocs: ["과제관리 > TA Worklist"],
    relatedLinks: [{ label: "TA Worklist", href: "/roadmap" }, { label: "건전성 현황", href: "/operations/health/overview" }] },
]

type StaticGuide = typeof STATIC_GUIDES[0]
type RepeatableGuide = typeof REPEATABLE_GUIDES[0]

export default function OperatingGuidesPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "repeatable" ? "repeatable" : "static"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedStatic, setSelectedStatic] = useState<StaticGuide | null>(null)
  const [selectedRepeatable, setSelectedRepeatable] = useState<RepeatableGuide | null>(null)

  const showDetail = selectedStatic || selectedRepeatable

  const filteredStatic = STATIC_GUIDES.filter(g => {
    if (processFilter !== "all" && g.process !== processFilter) return false
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()) && !g.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredRepeatable = REPEATABLE_GUIDES.filter(g => {
    if (processFilter !== "all" && g.process !== processFilter && g.process !== "전체") return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // --- Detail View for Static Guide ---
  if (selectedStatic) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedStatic(null)} className="gap-1.5 -ml-2 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> 목록으로 돌아가기
          </Button>

          <div className="flex items-start gap-4">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
              selectedStatic.category === "IOW" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            )}>
              {selectedStatic.category === "IOW" ? <Shield className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{selectedStatic.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <Badge variant="outline">{selectedStatic.category}</Badge>
                <Badge variant="secondary">{selectedStatic.process}</Badge>
                <span className="text-xs text-muted-foreground">{selectedStatic.version}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> 최종 검토: {selectedStatic.lastReviewed}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Owner: {selectedStatic.owner}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" /> 개요</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{selectedStatic.description}</p></CardContent>
          </Card>

          {/* Parameter Table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> 운전 파라미터 ({selectedStatic.params.length}개)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">항목</TableHead>
                    <TableHead className="w-[110px]">Tag</TableHead>
                    <TableHead className="w-[70px] text-right">Min</TableHead>
                    <TableHead className="w-[70px] text-right">Max</TableHead>
                    <TableHead className="w-[70px]">단위</TableHead>
                    <TableHead>비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStatic.params.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.tag}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{p.min}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{p.max}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.unit}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Related Documents */}
          {selectedStatic.relatedDocs.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4" /> 관련 문서</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedStatic.relatedDocs.map((doc, i) => (
                    <Badge key={i} variant="outline" className="text-xs py-1 px-2.5 cursor-pointer hover:bg-muted/50">
                      <FileText className="h-3 w-3 mr-1.5" />{doc}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    )
  }

  // --- Detail View for Repeatable Guide ---
  if (selectedRepeatable) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedRepeatable(null)} className="gap-1.5 -ml-2 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> 목록으로 돌아가기
          </Button>

          <div className="flex items-start gap-4">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
              selectedRepeatable.triggerType === "periodic" ? "bg-emerald-100 text-emerald-700" :
              selectedRepeatable.triggerType === "mode-change" ? "bg-indigo-100 text-indigo-700" :
              "bg-amber-100 text-amber-700"
            )}>
              {selectedRepeatable.triggerType === "periodic" ? <RefreshCw className="h-5 w-5" /> :
               selectedRepeatable.triggerType === "mode-change" ? <ArrowUpDown className="h-5 w-5" /> :
               <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{selectedRepeatable.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <Badge variant="secondary">{selectedRepeatable.process}</Badge>
                <Badge variant={selectedRepeatable.status === "upcoming" ? "secondary" : "outline"}>
                  {selectedRepeatable.status === "upcoming" ? "예정" : "활성"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedRepeatable.frequency}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {selectedRepeatable.assignee}</span>
                <span className="text-xs text-muted-foreground">최근: {selectedRepeatable.lastIssued}</span>
                {selectedRepeatable.nextDue !== "-" && <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Next: {selectedRepeatable.nextDue}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Background */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" /> 배경 및 목적</CardTitle></CardHeader>
                <CardContent><p className="text-sm leading-relaxed">{selectedRepeatable.background}</p></CardContent>
              </Card>

              {/* Steps */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> 수행 절차</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedRepeatable.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-sm">{step.replace(/^\d+\.\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 체크리스트</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {selectedRepeatable.checklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm p-2 rounded hover:bg-muted/40">
                        <span className="h-4 w-4 rounded border-2 border-muted-foreground/30 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Related docs & links */}
            <div className="space-y-4">
              {selectedRepeatable.relatedDocs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> 관련 문서</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {selectedRepeatable.relatedDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/40 cursor-pointer hover:bg-muted/60">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {selectedRepeatable.relatedLinks.length > 0 && (
                <Card className="border-blue-200/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-blue-700"><ExternalLink className="h-4 w-4" /> 연동 페이지</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {selectedRepeatable.relatedLinks.map((link, i) => (
                      <Button key={i} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50" asChild>
                        <a href={link.href}><ExternalLink className="h-3 w-3" />{link.label}</a>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">가이드 정보</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{selectedRepeatable.id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">유형</span><span>{selectedRepeatable.triggerType === "periodic" ? "주기적" : selectedRepeatable.triggerType === "mode-change" ? "모드변경" : "이벤트"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">주기</span><span>{selectedRepeatable.frequency}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">담당</span><span>{selectedRepeatable.assignee}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">최근 수행</span><span>{selectedRepeatable.lastIssued}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // --- List View ---
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">운영 가이드</h1>
          <p className="text-sm text-muted-foreground mt-1">Operation Guide, IOW, 반복성 가이드를 통합 관리합니다.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="가이드 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={processFilter} onValueChange={setProcessFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="공정" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 공정</SelectItem>
              {["CDU","VDU","HCR","FCC","SRU"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeTab === "static" && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="카테고리" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="Operation Guide">Operation Guide</SelectItem>
                <SelectItem value="IOW">IOW</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="static">Static Guide (마스터) <Badge variant="secondary" className="ml-2 text-[10px] h-4">{filteredStatic.length}</Badge></TabsTrigger>
            <TabsTrigger value="repeatable">반복성 가이드 <Badge variant="secondary" className="ml-2 text-[10px] h-4">{filteredRepeatable.length}</Badge></TabsTrigger>
          </TabsList>

          <TabsContent value="static" className="mt-4 space-y-2">
            {filteredStatic.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            {filteredStatic.map(g => (
              <Card key={g.id} className="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelectedStatic(g)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      g.category === "IOW" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {g.category === "IOW" ? <Shield className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{g.title}</span>
                        <Badge variant="outline" className="text-[10px] h-4 shrink-0">{g.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{g.process}</span>
                        <span>{g.version}</span>
                        <span>Last: {g.lastReviewed}</span>
                        <span>{g.params.length}개 항목</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="repeatable" className="mt-4 space-y-2">
            {filteredRepeatable.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            {filteredRepeatable.map(g => (
              <Card key={g.id} className={cn("cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all",
                g.status === "upcoming" && "border-amber-200 bg-amber-50/30"
              )} onClick={() => setSelectedRepeatable(g)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      g.triggerType === "periodic" ? "bg-emerald-100 text-emerald-700" :
                      g.triggerType === "mode-change" ? "bg-indigo-100 text-indigo-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {g.triggerType === "periodic" ? <RefreshCw className="h-4 w-4" /> :
                       g.triggerType === "mode-change" ? <ArrowUpDown className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{g.title}</span>
                        <Badge variant={g.status === "upcoming" ? "secondary" : "outline"} className="text-[10px] h-4 shrink-0">
                          {g.status === "upcoming" ? "예정" : "활성"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{g.process}</span>
                        <span>{g.frequency}</span>
                        <span>담당: {g.assignee}</span>
                        {g.nextDue !== "-" && <span className="text-amber-600">Next: {g.nextDue}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
