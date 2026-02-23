"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield, Search, FileText, ChevronRight, ExternalLink, ArrowLeft,
  History, AlertTriangle, CheckCircle, Link2, BarChart3, Clock,
  GitBranch, Layout, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

type DocType = "sop" | "contingency" | "sdsu" | "decision-tree"
type VersionEntry = { ver: string; date: string; author: string; summary: string }

interface ProcedureDoc {
  id: string
  title: string
  type: DocType
  process: string
  status: "approved" | "draft" | "review"
  currentVersion: string
  lastUpdated: string
  owner: string
  description: string
  versions?: VersionEntry[]
  linkedDashboards?: { label: string; href: string }[]
  linkedTrendBundles?: { label: string; id: string }[]
  sections?: { title: string; content: string }[]
  steps?: { step: string; action: string; criteria: string }[]
  decisionNodes?: { condition: string; yes: string; no: string }[]
}

const typeLabels: Record<DocType, string> = { sop: "SOP", contingency: "Contingency Plan", sdsu: "SD/SU 절차서", "decision-tree": "Decision Tree" }
const typeColors: Record<DocType, string> = { sop: "bg-slate-100 text-slate-700", contingency: "bg-red-50 text-red-700", sdsu: "bg-indigo-50 text-indigo-700", "decision-tree": "bg-amber-50 text-amber-700" }
const typeIcons: Record<DocType, typeof Shield> = { sop: FileText, contingency: AlertTriangle, sdsu: GitBranch, "decision-tree": Layout }

const PROCEDURES: ProcedureDoc[] = [
  // SOP
  { id: "SOP-001", title: "CDU Emergency Shutdown Procedure", type: "sop", process: "CDU", status: "approved", currentVersion: "Rev.3", lastUpdated: "2024-06-15", owner: "Plant Manager",
    description: "CDU 비상 정지 절차. ESB 작동 후 각 계통별 차단 순서 및 확인 항목을 정의.",
    sections: [
      { title: "비상 정지 판단 기준", content: "다음 조건 중 하나 이상 해당 시 ESB 작동: (1) Fire/Gas 감지 시스템 작동, (2) 주요 유틸리티 전원 상실, (3) 대형 누출 발생, (4) Plant Manager 지시. 판단 소요 시간 목표: 3분 이내." },
      { title: "ESB 작동 절차", content: "1. Control Room ESB 버튼 작동. 2. Field PA 방송 실시. 3. 자동 차단 밸브 Closing 확인 (XV-1001~1005). 4. Flare Header 압력 모니터링. 5. Emergency Generator 자동 기동 확인." },
      { title: "계통별 차단 순서", content: "1단계: Feed Pump Trip -> 2단계: Heater ESD -> 3단계: Column Feed 차단 -> 4단계: Overhead/Bottom Product 차단 -> 5단계: Utility(Steam/CW) 최소 유지. 총 소요 시간 약 15분." },
      { title: "확인 항목 체크리스트", content: "모든 XV 밸브 Close 확인, Flare 정상 작동, Emergency Lighting 점등, 인원 대피 완료 확인, 환경부서 통보 (30분 이내)." },
      { title: "재기동 사전 조건", content: "ESB 원인 해제 확인, 안전팀 승인, 설비 점검 완료(Pressure Test 포함), 운전팀장 승인 후 재기동 절차 착수." },
    ] },
  { id: "SOP-002", title: "HCR Catalyst Loading/Unloading Manual", type: "sop", process: "HCR", status: "approved", currentVersion: "Rev.2", lastUpdated: "2023-11-20", owner: "TA Manager",
    description: "HCR 촉매 장입/인출 작업 표준 절차. Dense Loading 방식 기준. TA 시에만 적용.",
    sections: [
      { title: "사전 준비사항", content: "Reactor Isolation 확인, N2 Purge 완료(O2 < 0.5%), 내부 온도 50도 이하, 안전 장구 준비(SCBA, H2S 감지기). Loading 장비 점검: Catalyst Sock, Loading Ramp, 하중계." },
      { title: "Reactor Isolation", content: "Blind 설치 위치: Feed Inlet (BL-001), Effluent Outlet (BL-002), Quench Gas (BL-003/004). Double Block & Bleed 적용. Isolation Certificate 발급 필수." },
      { title: "Catalyst Unloading", content: "Vacuum Truck 이용 인출. Bed별 순서: Bed 3 -> Bed 2 -> Bed 1. 인출 중 H2S 농도 연속 모니터링. 구촉매 샘플 각 Bed 3점 채취." },
      { title: "Dense Loading 절차", content: "1. Catalyst Sock 설치 (Loading Ramp 상). 2. Sock을 통한 촉매 투하 (자유 낙하 높이 < 1m). 3. 10cm 단위 Level 확인 및 기록. 4. Loading Density 측정 (목표: 860-900 kg/m3). 5. Support Ball/Ceramic Ball Layer 확인." },
      { title: "촉매 활성화", content: "Sulfiding 절차: (1) H2 Circulation 시작, (2) DMDS 주입 시작, (3) 단계별 승온 (10도/hr), (4) H2S Breakthrough 확인. 총 소요 48시간." },
    ] },
  { id: "SOP-003", title: "FCC Startup Procedure", type: "sop", process: "FCC", status: "approved", currentVersion: "Rev.5", lastUpdated: "2024-08-10", owner: "Process Eng.",
    description: "FCC 가동 시 Regenerator Heatup부터 정상 운전까지의 절차.",
    sections: [
      { title: "Pre-startup Check", content: "Regenerator Refractory 건조 확인, Slide Valve 동작 테스트, Instrument Air 공급 확인, Emergency System 점검 완료." },
      { title: "Regenerator Heatup", content: "Torch Oil 이용 승온. 승온 속도 25도/hr 준수. 목표 온도 650도. 소요 약 26시간. Refractory 건조 구간(150-350도) 서행." },
      { title: "Catalyst Circulation", content: "Standpipe Aeration 시작. Slide Valve 소량 Open. Catalyst Circulation Rate 점진 증가. Regenerator-Reactor dP Balance 확인." },
      { title: "Feed Introduction", content: "Riser Steam 유지 상태에서 Feed Pump 기동. 초기 Feed Rate 50%. 10% 단위 증량(30분 간격). Riser Outlet Temp 목표 520도." },
      { title: "Normal Operation 전환", content: "Feed Rate 100% 도달. Cat/Oil Ratio 최적화. Product Recovery Section 정상화. Wet Gas Compressor 부하 안정 확인." },
    ] },
  { id: "SOP-004", title: "SRU Claus Unit Startup/Shutdown", type: "sop", process: "SRU", status: "approved", currentVersion: "Rev.4", lastUpdated: "2024-04-22", owner: "Process Eng.",
    description: "SRU 가동/정지 절차. Thermal Reactor 가열부터 Tail Gas 관리까지.",
    sections: [
      { title: "Pre-startup", content: "Refractory 건조 확인, Sulfur Pit Level 확인, Burner 점검 완료, Tail Gas Unit 준비." },
      { title: "Thermal Reactor Heatup", content: "Natural Gas + Air로 Heatup. 목표 1050도. 승온 50도/hr. 총 약 20시간." },
      { title: "Acid Gas Introduction", content: "ARU/SWS Gas 도입. Air/Acid Gas Ratio 조절 (H2S/SO2 = 2.0 목표). Tail Gas Analyzer 정상 확인." },
      { title: "Shutdown 절차", content: "Acid Gas 차단 -> 30분 Air Purge -> Natural Gas 차단 -> 자연 냉각. Sulfur Pit 잔류 황 회수." },
    ] },
  { id: "SOP-005", title: "VDU Vacuum System Operating Manual", type: "sop", process: "VDU", status: "approved", currentVersion: "Rev.3", lastUpdated: "2024-09-05", owner: "Process Eng.",
    description: "VDU 진공 계통 운전 매뉴얼. Ejector, Condenser, Vacuum Column 연계 운전.",
    sections: [
      { title: "진공 계통 개요", content: "3단 Steam Ejector + Surface Condenser 구성. 설계 진공도: 25 mmHgA. 1단 Ejector -> 1st Condenser -> 2단 -> 2nd Condenser -> 3단." },
      { title: "Ejector 운전", content: "Motive Steam 압력 유지(12 kg/cm2g 이상). Ejector 성능 주기 점검(흡입 압력 측정). 예비 Ejector 전환 절차." },
      { title: "Vacuum 이상 시 대응", content: "진공도 악화 시: 1. Ejector Steam 압력 확인, 2. Condenser 냉각수 유량 확인, 3. Leak Point 탐색, 4. Emergency Ejector 기동." },
      { title: "Leak 점검 절차", content: "He Leak Test 또는 Ultrasonic Detector 사용. 주요 점검부: Manhole, Instrument Connection, Valve Gland, Sight Glass." },
    ] },

  // Contingency Plans
  { id: "CP-001", title: "CDU Feed Pump Total Failure 대응", type: "contingency", process: "CDU", status: "approved", currentVersion: "v3.2", lastUpdated: "2025-02-10", owner: "Operations",
    description: "CDU Feed Pump 전수 정지 시 의사결정 및 조치 절차. Standby Pump, 감량운전, ESD 단계별 대응.",
    linkedDashboards: [{ label: "CDU Emergency Dashboard", href: "/operations/custom-dashboard" }, { label: "Feed System Overview", href: "/operations/custom-dashboard?view=feed" }],
    linkedTrendBundles: [{ label: "CDU Feed/Column 트렌드 묶음", id: "cdu-feed-trend" }],
    versions: [
      { ver: "v3.2", date: "2025-02-10", author: "이철수", summary: "감량운전 시 Column 온도 프로파일 업데이트" },
      { ver: "v3.1", date: "2025-01-05", author: "김지수", summary: "Standby Pump 가동 절차 보완" },
      { ver: "v3.0", date: "2024-11-20", author: "박영희", summary: "전면 개정 - Decision Tree 재구성" },
      { ver: "v2.1", date: "2024-06-15", author: "이철수", summary: "환경부서 통보 절차 추가" },
    ],
    steps: [
      { step: "1단계", action: "Standby Pump 즉시 기동", criteria: "Standby 상태 확인, 30초 이내 기동" },
      { step: "2단계", action: "Standby 불가 시 Feed 감량 80%", criteria: "Column dP, Overhead Temp 모니터링" },
      { step: "3단계", action: "감량 유지 불가 시 60% 운전", criteria: "Heater Duty 조정, Product Routing 변경" },
      { step: "4단계", action: "60% 미만 시 ESD 절차 진입", criteria: "SOP-001 참조" },
    ] },
  { id: "CP-002", title: "Steam Header Pressure Loss 대응", type: "contingency", process: "Utility", status: "approved", currentVersion: "v2.4", lastUpdated: "2025-01-28", owner: "Operations",
    description: "40kg Steam Header 압력 급락 시 단계별 대응. Boiler 추가 기동, 비필수 차단, 전체 감량.",
    linkedTrendBundles: [{ label: "Steam Balance 트렌드 묶음", id: "steam-monitoring" }, { label: "Utility Overview", id: "utility-trend" }],
    versions: [
      { ver: "v2.4", date: "2025-01-28", author: "최민호", summary: "비필수 소비처 목록 업데이트" },
      { ver: "v2.3", date: "2024-10-10", author: "김지수", summary: "감량 운전 우선순위 조정" },
      { ver: "v2.2", date: "2024-07-05", author: "박영희", summary: "Boiler #3 추가 반영" },
    ],
    steps: [
      { step: "경보 발생", action: "Steam Header 38kg 이하 경보 확인", criteria: "PI-U001 실시간 확인" },
      { step: "1단계", action: "Standby Boiler 추가 기동", criteria: "기동 소요 약 15분" },
      { step: "2단계", action: "비필수 Steam 소비처 차단", criteria: "목록 참조 (Tracing, 보조가열 등)" },
      { step: "3단계", action: "전 공정 10% 감량 운전", criteria: "공정별 감량 순서 참조" },
    ] },
  { id: "CP-003", title: "Power Failure 비상대응 계획", type: "contingency", process: "전체", status: "approved", currentVersion: "v4.1", lastUpdated: "2025-02-05", owner: "Plant Manager",
    description: "전원 상실 시 비상 대응. UPS, Emergency Generator, 수동 조작 절차.",
    linkedDashboards: [{ label: "Emergency Power Dashboard", href: "/operations/custom-dashboard?view=power" }],
    versions: [
      { ver: "v4.1", date: "2025-02-05", author: "Plant Manager", summary: "Emergency Generator 자동 절체 절차 보완" },
      { ver: "v4.0", date: "2024-09-01", author: "이철수", summary: "전면 개정" },
    ],
    steps: [
      { step: "즉시", action: "UPS 자동 전환 확인 (DCS, Safety System)", criteria: "UPS Battery 잔량 > 30분" },
      { step: "30초 이내", action: "Emergency Generator 자동 기동 확인", criteria: "Gen 출력 안정화 확인" },
      { step: "5분 이내", action: "Essential Load 확인 및 비필수 차단", criteria: "Essential Load List 참조" },
      { step: "복전 후", action: "단계별 복전 절차", criteria: "전기팀 승인 후 순차 투입" },
    ] },

  // SD/SU 절차서
  { id: "SDSU-001", title: "CDU Shutdown 절차서 (계획정지)", type: "sdsu", process: "CDU", status: "approved", currentVersion: "v2.3", lastUpdated: "2025-01-20", owner: "Operations",
    description: "CDU 계획 정지 절차. Feed 감량부터 Inert까지 단계별 절차 및 소요 시간.",
    linkedDashboards: [{ label: "CDU SD/SU Progress Board", href: "/operations/custom-dashboard?view=sdsu-cdu" }],
    versions: [
      { ver: "v2.3", date: "2025-01-20", author: "박영희", summary: "Desalter Drain 절차 보완" },
      { ver: "v2.2", date: "2024-09-10", author: "이철수", summary: "Heater 정지 후 Purge 시간 변경" },
    ],
    steps: [
      { step: "SD-1", action: "Feed 단계적 감량 (100% -> 50%, 2hr)", criteria: "Column 온도 프로파일 안정" },
      { step: "SD-2", action: "Feed 완전 차단", criteria: "Feed Flow Zero 확인" },
      { step: "SD-3", action: "Heater ESD 작동", criteria: "Tube Temp 확인, Purge 시작" },
      { step: "SD-4", action: "Column Depressuring", criteria: "Flare Header 연결 확인" },
      { step: "SD-5", action: "Steam/N2 Purge & Inert", criteria: "LEL < 1%, O2 < 0.5%" },
    ] },
  { id: "SDSU-002", title: "CDU Startup 절차서 (재가동)", type: "sdsu", process: "CDU", status: "approved", currentVersion: "v2.1", lastUpdated: "2025-01-20", owner: "Operations",
    description: "CDU 재가동 절차. Leak Test부터 정상 운전 전환까지.",
    linkedDashboards: [{ label: "CDU SD/SU Progress Board", href: "/operations/custom-dashboard?view=sdsu-cdu" }],
    versions: [
      { ver: "v2.1", date: "2025-01-20", author: "박영희", summary: "Pre-startup Checklist 업데이트" },
    ],
    steps: [
      { step: "SU-1", action: "Pressure Test / Leak Test", criteria: "Test 압력 유지 4hr 이상" },
      { step: "SU-2", action: "Heater Light-off 및 승온", criteria: "승온 25도/hr 준수" },
      { step: "SU-3", action: "Feed 도입 (50% -> 100%)", criteria: "Column 온도 프로파일 정상" },
      { step: "SU-4", action: "제품 Routing 전환", criteria: "Off-spec -> On-spec 전환" },
    ] },
  { id: "SDSU-003", title: "HCR Shutdown/Startup 절차서", type: "sdsu", process: "HCR", status: "approved", currentVersion: "v3.0", lastUpdated: "2024-12-15", owner: "Operations",
    description: "HCR SD/SU 통합 절차. 촉매 보호를 위한 특수 절차 포함.",
    linkedTrendBundles: [{ label: "HCR Reactor 트렌드 묶음", id: "hcr-reactor-trend" }],
    versions: [
      { ver: "v3.0", date: "2024-12-15", author: "김지수", summary: "촉매 보호 온도 기준 업데이트" },
      { ver: "v2.4", date: "2024-06-20", author: "김철수", summary: "H2 Quench 절차 보완" },
    ],
    steps: [
      { step: "SD-1", action: "Feed Cut & H2 유지", criteria: "Reactor Temp 강하 제어 (10도/hr)" },
      { step: "SD-2", action: "촉매 보호 온도 유지 (200도)", criteria: "H2 Circulation 유지" },
      { step: "SD-3", action: "H2 차단 및 N2 Purge", criteria: "H2 < 0.1vol%" },
      { step: "SU-1", action: "N2 -> H2 전환", criteria: "O2 Free 확인 후 H2 도입" },
      { step: "SU-2", action: "단계별 승온 및 Sulfiding", criteria: "DMDS 주입, 활성화" },
      { step: "SU-3", action: "Feed 도입", criteria: "Reactor Temp 안정 후 50% Feed" },
    ] },

  // Decision Trees
  { id: "DT-001", title: "이상징후 대응 Decision Tree (Fouling)", type: "decision-tree", process: "HCR", status: "approved", currentVersion: "v2.0", lastUpdated: "2025-01-15", owner: "Process Eng.",
    description: "열교환기 Fouling 이상 감지 시 단계별 의사결정. Online Cleaning, Bypass, TA 반영 판단.",
    linkedDashboards: [{ label: "Fouling Monitoring Dashboard", href: "/operations/custom-dashboard?view=fouling" }],
    linkedTrendBundles: [{ label: "Fouling 트렌드 묶음", id: "fouling-trend-bundle" }],
    versions: [
      { ver: "v2.0", date: "2025-01-15", author: "김지수", summary: "AI 모델 기반 Projection 연동 추가" },
      { ver: "v1.2", date: "2024-08-20", author: "박영희", summary: "Chemical Cleaning 옵션 추가" },
    ],
    decisionNodes: [
      { condition: "UA 저하율 > 5%/week?", yes: "긴급 대응 -> Chemical Cleaning 검토", no: "정기 모니터링 유지" },
      { condition: "Chemical Cleaning 가능?", yes: "Online Cleaning 시행 (12hr)", no: "Bypass 가능 여부 확인" },
      { condition: "Bypass 가능?", yes: "Bypass 전환 + TA Scope 반영", no: "감량 운전 + TA 조기 시행 검토" },
      { condition: "AI Projection: TA 전 Limit 도달?", yes: "TA 조기 시행 보고", no: "감량 운전으로 TA까지 유지" },
    ] },
  { id: "DT-002", title: "촉매 수명 관리 Decision Tree", type: "decision-tree", process: "HCR", status: "review", currentVersion: "v1.3-draft", lastUpdated: "2025-02-12", owner: "Process Eng.",
    description: "촉매 WABT 트렌드 기반 잔여 수명 판단 및 TA 시점 결정.",
    linkedTrendBundles: [{ label: "HCR WABT 트렌드", id: "hcr-wabt-trend" }],
    versions: [
      { ver: "v1.3-draft", date: "2025-02-12", author: "김지수", summary: "AI 예측 결과 반영 기준 추가 (검토중)" },
      { ver: "v1.2", date: "2024-12-01", author: "김지수", summary: "Severity 상향 운전 옵션 추가" },
    ],
    decisionNodes: [
      { condition: "WABT 잔여 마진 > 20도?", yes: "정상 모니터링 (월 1회)", no: "주간 모니터링 전환" },
      { condition: "WABT 잔여 마진 > 10도?", yes: "Feed Severity 하향 검토", no: "TA 시점 결정 회의 소집" },
      { condition: "AI 예측 EOR < 3개월?", yes: "TA 준비 착수 (자재, 인력)", no: "운전 조건 최적화로 연장" },
    ] },
  { id: "DT-003", title: "Compressor 진동 이상 Decision Tree", type: "decision-tree", process: "전체", status: "approved", currentVersion: "v1.5", lastUpdated: "2024-11-20", owner: "Rotating Eng.",
    description: "회전기계 진동 이상 감지 시 단계별 의사결정. Alert/Alarm Level별 대응.",
    linkedDashboards: [{ label: "회전기계 Health Dashboard", href: "/operations/custom-dashboard?view=rotating" }],
    versions: [
      { ver: "v1.5", date: "2024-11-20", author: "정수민", summary: "Bearing 온도 연동 판단 추가" },
    ],
    decisionNodes: [
      { condition: "진동 Alert Level 초과? (7.1 mm/s)", yes: "운전 조건 확인 + Bearing Temp 확인", no: "정기 모니터링" },
      { condition: "Bearing Temp 동반 상승?", yes: "Bearing 손상 의심 -> 즉시 점검 계획", no: "Unbalance/Alignment 점검" },
      { condition: "진동 Alarm Level 초과? (11.2 mm/s)", yes: "운전 정지 및 점검 (Standby 전환)", no: "주간 추세 감시 강화" },
    ] },
]

export default function ProceduresPage() {
  const [activeTab, setActiveTab] = useState<"all" | DocType>("all")
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("all")
  const [selectedDoc, setSelectedDoc] = useState<ProcedureDoc | null>(null)

  const filtered = PROCEDURES.filter(d => {
    if (activeTab !== "all" && d.type !== activeTab) return false
    if (processFilter !== "all" && d.process !== processFilter) return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Detail view
  if (selectedDoc) {
    const Icon = typeIcons[selectedDoc.type]
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <Button variant="ghost" size="sm" className="gap-1.5 mb-2 -ml-2" onClick={() => setSelectedDoc(null)}>
                <ArrowLeft className="h-4 w-4" />뒤로
              </Button>
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", typeColors[selectedDoc.type])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{selectedDoc.id}</span>
                    <Badge className={cn("text-[10px] border-0", typeColors[selectedDoc.type])}>{typeLabels[selectedDoc.type]}</Badge>
                    <Badge variant="outline" className="text-[10px]">{selectedDoc.process}</Badge>
                    {selectedDoc.status === "review" && <Badge variant="destructive" className="text-[10px]">검토중</Badge>}
                  </div>
                  <h1 className="text-lg font-semibold mt-1">{selectedDoc.title}</h1>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-6">
            <div className="flex gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-6 max-w-3xl">
                {/* Meta */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-xs text-muted-foreground">버전</span><p className="font-medium mt-0.5">{selectedDoc.currentVersion}</p></div>
                      <div><span className="text-xs text-muted-foreground">최종 수정</span><p className="font-medium mt-0.5">{selectedDoc.lastUpdated}</p></div>
                      <div><span className="text-xs text-muted-foreground">소유자</span><p className="font-medium mt-0.5">{selectedDoc.owner}</p></div>
                      <div><span className="text-xs text-muted-foreground">상태</span><p className="font-medium mt-0.5 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />{selectedDoc.status === "approved" ? "승인" : selectedDoc.status === "review" ? "검토중" : "초안"}</p></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2">개요</h3>
                    <p className="text-sm leading-relaxed">{selectedDoc.description}</p>
                  </CardContent>
                </Card>

                {/* SOP Sections */}
                {selectedDoc.sections && selectedDoc.sections.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">상세 내용</h3>
                    {selectedDoc.sections.map((s, i) => (
                      <Card key={i}>
                        <CardContent className="pt-4 pb-4">
                          <h4 className="text-sm font-semibold mb-2">{i + 1}. {s.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Steps (Contingency/SD-SU) */}
                {selectedDoc.steps && selectedDoc.steps.length > 0 && (
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-sm font-semibold mb-3">단계별 절차</h3>
                      <div className="space-y-3">
                        {selectedDoc.steps.map((s, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{s.action}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">기준: {s.criteria}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Decision Nodes */}
                {selectedDoc.decisionNodes && selectedDoc.decisionNodes.length > 0 && (
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-sm font-semibold mb-3">의사결정 트리</h3>
                      <div className="space-y-3">
                        {selectedDoc.decisionNodes.map((n, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-6 w-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">Q{i + 1}</div>
                              <span className="text-sm font-medium">{n.condition}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 ml-8">
                              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs">
                                <span className="font-semibold text-emerald-700">YES:</span> <span className="text-emerald-800">{n.yes}</span>
                              </div>
                              <div className="p-2 rounded bg-red-50 border border-red-200 text-xs">
                                <span className="font-semibold text-red-700">NO:</span> <span className="text-red-800">{n.no}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Version History */}
                {selectedDoc.versions && selectedDoc.versions.length > 0 && (
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-3">버전 이력</h3>
                      <div className="relative pl-4 border-l-2 border-muted space-y-3">
                        {selectedDoc.versions.map((v, i) => (
                          <div key={i} className="relative">
                            <div className={cn("absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2",
                              i === 0 ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"
                            )} />
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant={i === 0 ? "default" : "outline"} className="text-[10px] h-4">{v.ver}</Badge>
                              <span className="text-muted-foreground">{v.date}</span>
                              <span className="text-muted-foreground">by {v.author}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 ml-1">{v.summary}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SOP notice */}
                {selectedDoc.type === "sop" && (
                  <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                    SOP 문서는 공식 승인 절차를 통해서만 개정됩니다. 변경 요청은 데이터/설정 관리자에게 문의하세요.
                  </div>
                )}
                {(selectedDoc.type === "contingency" || selectedDoc.type === "sdsu" || selectedDoc.type === "decision-tree") && (
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
                    Live Document는 Notice를 통해 주기적으로 업데이트되며, 버전 이력에서 변경 내역을 확인할 수 있습니다.
                  </div>
                )}
              </div>

              {/* Right sidebar - Linked resources */}
              {(selectedDoc.linkedDashboards || selectedDoc.linkedTrendBundles) && (
                <div className="w-64 shrink-0 space-y-4">
                  {selectedDoc.linkedDashboards && selectedDoc.linkedDashboards.length > 0 && (
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" />연동 대시보드</h4>
                        <div className="space-y-2">
                          {selectedDoc.linkedDashboards.map((d, i) => (
                            <a key={i} href={d.href} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 hover:bg-blue-100 transition-colors">
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{d.label}</span>
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedDoc.linkedTrendBundles && selectedDoc.linkedTrendBundles.length > 0 && (
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />연동 트렌드 묶음</h4>
                        <div className="space-y-2">
                          {selectedDoc.linkedTrendBundles.map((t, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                              <Link2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{t.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  // List view
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">절차서/표준 (업무절차)</h1>
            <p className="text-sm text-muted-foreground mt-1">SOP, Contingency Plan, SD/SU 절차서, Decision Tree를 통합 관리합니다</p>
          </div>
        </header>

        <main className="p-6 space-y-4">
          {/* Category summary */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { id: "all" as const, label: "전체", count: PROCEDURES.length },
              { id: "sop" as const, label: "SOP", count: PROCEDURES.filter(d => d.type === "sop").length },
              { id: "contingency" as const, label: "Contingency Plan", count: PROCEDURES.filter(d => d.type === "contingency").length },
              { id: "sdsu" as const, label: "SD/SU 절차서", count: PROCEDURES.filter(d => d.type === "sdsu").length },
              { id: "decision-tree" as const, label: "Decision Tree", count: PROCEDURES.filter(d => d.type === "decision-tree").length },
            ].map(cat => (
              <Card key={cat.id} className={cn("cursor-pointer transition-colors", activeTab === cat.id && "ring-1 ring-primary")} onClick={() => setActiveTab(cat.id)}>
                <CardContent className="pt-3 pb-3 text-center">
                  <div className="text-xs text-muted-foreground">{cat.label}</div>
                  <p className="text-xl font-bold mt-0.5">{cat.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="문서 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 공정</SelectItem>
                {["CDU", "VDU", "HCR", "FCC", "SRU", "Utility", "전체"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            {filtered.map(d => {
              const Icon = typeIcons[d.type]
              const hasLinks = (d.linkedDashboards && d.linkedDashboards.length > 0) || (d.linkedTrendBundles && d.linkedTrendBundles.length > 0)
              return (
                <Card key={d.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedDoc(d)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", typeColors[d.type])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{d.id}</span>
                          <Badge className={cn("text-[10px] h-4 shrink-0 border-0", typeColors[d.type])}>{typeLabels[d.type]}</Badge>
                          <span className="text-sm font-medium truncate">{d.title}</span>
                          {d.status === "review" && <Badge variant="destructive" className="text-[10px] h-4">검토중</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{d.process}</span>
                          <span>{d.currentVersion}</span>
                          <span>Updated: {d.lastUpdated}</span>
                          {hasLinks && (
                            <span className="flex items-center gap-0.5 text-blue-500"><Link2 className="h-3 w-3" />연동</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
