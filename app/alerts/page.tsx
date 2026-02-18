"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { saveTicket, addWorkPackageToTicket, getTickets } from "@/lib/storage"
import { UNIT_OWNERS } from "@/lib/process-data"
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Eye,
  FileText,
  Clock,
  Activity,
  Gauge,
  MessageSquare,
  ExternalLink,
  Calculator,
  Zap,
  AlertCircle,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Monitor,
  ClipboardList,
  Pencil,
  Plus,
  Link,
  Save,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

// Alert 타입 정의
type AlertType = "alert" | "notice" | "event"
type AlertStatus = "unread" | "acknowledged" | "resolved"
type AlertGrade = "high" | "medium" | "low"
type AlertState = "new" | "standing" | "shelved"

interface AlertItem {
  id: string
  type: AlertType
  subType: string
  title: string
  description: string
  timestamp: string
  status: AlertStatus
  severity?: "critical" | "warning" | "info"
  unit?: string
  linkedTicketId?: string
  // Alert 전용 필드
  alertGrade?: AlertGrade
  alertState?: AlertState
  triggerCondition?: string
  triggerSetpoint?: { high?: number; low?: number }
  alarmHistory?: { timestamp: string; value: number; action: string }[]
  alarmBackground?: string
  shelvedReason?: string
  shelvedUntil?: string
  data?: {
    tagId?: string
    value?: number
    limit?: number
    trend?: number[]
    items?: { name: string; status: string; value?: string }[]
  }
  // 이상징후 카테고리별 데이터
  anomalyCategories?: {
    id: string
    name: string
    description: string
    top3: { tagId: string; description: string; severity: "high" | "medium" | "low"; deviation: string; detail: string }[]
  }[]
  // Daily Monitoring AI 상세
  dailyMonitoringDetail?: {
    aiSummary: string
    keyVariables: { name: string; value: string; change: string; status: "normal" | "warning" | "critical" }[]
    diagrams: string[]
  }
  // DCS 수정 요청 상세
  dcsModificationDetail?: {
    esrId: string
    esrTitle: string
    changeItems: { item: string; before: string; after: string }[]
    requestor: string
    appliedDate: string
  }
}

// Standing Issue 타입 정의
interface StandingIssue {
  id: string
  title: string
  description: string
  category: "long-term" | "special" | "monitoring" | "daily-report"
  status: "active" | "resolved" | "watching"
  unit?: string
  linkedTicketId?: string
  linkedTicketTitle?: string
  registeredBy: string   // 등록자 ID -- 팀장 My Action 필터링용
  createdDate: string
  lastUpdated: string
  updates: { date: string; content: string; author: string }[]
}

// Standing Issue 초기 데이터
const INITIAL_STANDING_ISSUES: StandingIssue[] = [
  {
    id: "SI-001",
    title: "HCR Catalyst WABT 상승 추세",
    description: "촉매 활성 저하로 인한 WABT 상승 진행 중. 6개월간 +7C 상승. EOR까지 약 8개월 잔여 예상.",
    category: "long-term",
    status: "watching",
    unit: "HCR",
    linkedTicketId: "1",
    linkedTicketTitle: "HCR 촉매 교체 검토",
    registeredBy: "u-engineer-1",
    createdDate: "2024-08-15",
    lastUpdated: "2025-02-01",
    updates: [
      { date: "2025-02-01", content: "WABT 396.5C 도달. Feed 전환(Arabian Medium) 영향으로 +1.5C 추가 상승.", author: "김철수" },
      { date: "2025-01-15", content: "WABT 395C. 월간 상승률 1.2C/월로 안정적.", author: "김철수" },
    ]
  },
  {
    id: "SI-002",
    title: "P-201B Seal Oil Leak 모니터링",
    description: "P-201B 펌프에서 Seal Oil Leak 발견. 경미한 수준으로 정비팀에서 모니터링 중.",
    category: "special",
    status: "active",
    unit: "CDU",
    registeredBy: "u-engineer-2",
    createdDate: "2025-02-01",
    lastUpdated: "2025-02-02",
    updates: [
      { date: "2025-02-02", content: "Leak 양 변화 없음. 정비팀 일일 점검 지속 중.", author: "박정비" },
      { date: "2025-02-01", content: "최초 발견. Seal Oil Leak 경미 수준, 현장 모니터링 시작.", author: "이현장" },
    ]
  },
  {
    id: "SI-003",
    title: "E-101 Fouling 진행 관찰",
    description: "E-101 열교환기 UA값 3개월간 12% 감소. 세정 시기 검토 중.",
    category: "long-term",
    status: "watching",
    unit: "CDU",
    linkedTicketId: "2",
    linkedTicketTitle: "E-101 세정 계획",
    registeredBy: "u-engineer-1",
    createdDate: "2024-11-20",
    lastUpdated: "2025-01-30",
    updates: [
      { date: "2025-01-30", content: "UA값 88% 수준 유지. 다음 TA 시 세정 계획 확정.", author: "김철수" },
    ]
  },
  {
    id: "SI-004",
    title: "Arabian Medium 전환 운전 영향 관찰",
    description: "02/01부터 Arabian Light에서 Arabian Medium으로 원유 전환. S함량 +0.3%p 증가에 따른 공정 영향 모니터링.",
    category: "monitoring",
    status: "active",
    unit: "CDU",
    createdDate: "2025-02-01",
    lastUpdated: "2025-02-02",
    updates: [
      { date: "2025-02-02", content: "CDU Overhead pH 5.8로 소폭 하락(-0.2). 아민 주입량 조정 검토.", author: "김철수" },
      { date: "2025-02-01", content: "원유 전환 시작. HCR WABT +1.5C 상승 대응 완료.", author: "김철수" },
    ]
  },
]

// 샘플 알람 데이터
const SAMPLE_ALERTS: AlertItem[] = [
  // Alert 타입
  {
    id: "ALT-001",
    type: "alert",
    subType: "operation-guide",
    title: "TI-2001 High Temperature Alert",
    description: "Reactor Inlet Temperature가 Operation Guide Max를 초과했습니다.",
    timestamp: "2025-02-02 14:32",
    status: "unread",
    severity: "critical",
    unit: "HCR",
    alertGrade: "high",
    alertState: "new",
    triggerCondition: "TI-2001 > 400°C",
    triggerSetpoint: { high: 400, low: 350 },
    alarmHistory: [
      { timestamp: "2025-01-15 09:20", value: 405, action: "인지 후 조치" },
      { timestamp: "2025-01-28 14:45", value: 402, action: "티켓 발행 (TKT-2025-0128)" },
      { timestamp: "2024-12-20 11:30", value: 408, action: "Shelved (계획정비)" }
    ],
    alarmBackground: "HCR Reactor 안전운전을 위해 설정. 온도 초과 시 촉매 비활성화 및 코킹 가능성 증가. Safety Study(2023) 결과 반영.",
    data: {
      tagId: "TI-2001",
      value: 412,
      limit: 400,
      trend: [385, 390, 395, 398, 402, 408, 412]
    }
  },
  {
    id: "ALT-002",
    type: "alert",
    subType: "operation-guide",
    title: "PI-3001 Low Pressure Alert",
    description: "Regenerator Pressure가 Operation Guide Min 이하로 떨어졌습니다.",
    timestamp: "2025-02-02 13:15",
    status: "acknowledged",
    severity: "warning",
    unit: "CCR",
    alertGrade: "medium",
    alertState: "standing",
    triggerCondition: "PI-3001 < 2.5 bar",
    triggerSetpoint: { high: 3.5, low: 2.5 },
    alarmHistory: [
      { timestamp: "2025-02-01 08:10", value: 2.4, action: "인지" },
      { timestamp: "2025-01-20 16:30", value: 2.3, action: "티켓 발행" }
    ],
    alarmBackground: "CCR Regenerator 정상 운전 압력 범위. 저압 시 촉매 재생 효율 저하 우려.",
    data: {
      tagId: "PI-3001",
      value: 2.1,
      limit: 2.5,
      trend: [2.8, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1]
    }
  },
  {
    id: "ALT-003",
    type: "alert",
    subType: "operation-guide",
    title: "FI-1001 Feed Flow Low Alert",
    description: "CDU Feed Flow가 Operation Guide Min 이하로 떨어졌습니다.",
    timestamp: "2025-02-01 22:45",
    status: "resolved",
    severity: "info",
    unit: "CDU",
    alertGrade: "low",
    alertState: "shelved",
    triggerCondition: "FI-1001 < 800 m3/hr",
    triggerSetpoint: { high: 1200, low: 800 },
    alarmHistory: [
      { timestamp: "2025-02-01 22:45", value: 780, action: "Shelved (계획 감량)" }
    ],
    alarmBackground: "CDU Feed 정상 운전 범위. 저유량 시 제품 품질 영향 가능.",
    shelvedReason: "2월 계획 감량 운전 중 (2025-02-01 ~ 2025-02-07)",
    shelvedUntil: "2025-02-07",
    data: {
      tagId: "FI-1001",
      value: 780,
      limit: 800,
      trend: [850, 830, 810, 795, 785, 782, 780]
    }
  },
  // Notice 타입
  {
    id: "NTC-001",
    type: "notice",
    subType: "anomaly",
    title: "이상징후 모니터링 리포트 (주간)",
    description: "2025년 5주차 이상징후 분석 결과입니다. 4개 카테고리에서 총 12건 중 주의 항목 5건이 감지되었습니다.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "warning",
    data: {
      items: [
        { name: "FV-2001 Control Valve Opening", status: "warning", value: "92% (정상: 60-80%)" },
        { name: "E-101 Fouling Factor", status: "warning", value: "0.0008 (주의기준: 0.0007)" },
        { name: "P-201 Vibration", status: "normal", value: "2.1mm/s (정상)" }
      ]
    },
    anomalyCategories: [
      {
        id: "cat-1",
        name: "유사운전조건 기준 Deviation 정도",
        description: "유사한 피드조건/운전모드에서 예전대비 현재의 운전점이 얼마나 달라졌는지 보여주고, 많이 달라진 항목은 이상치로 관리",
        top3: [
          { tagId: "TI-2001", description: "HCR Reactor Inlet Temp", severity: "high", deviation: "+8.2C vs 동일 피드조건 평균", detail: "Arabian Medium 처리 시 과거 6회 평균 대비 온도가 유의미하게 높음. WABT 상승 추세와 연계 가능." },
          { tagId: "FI-1001", description: "CDU Feed Flow Rate", severity: "medium", deviation: "-3.5% vs 동일 모드 평균", detail: "Full Rate 운전 모드에서 Feed Flow가 과거 대비 소폭 낮음. 계기 Drift 가능성 검토 필요." },
          { tagId: "PI-3001", description: "CCR Regenerator Pressure", severity: "low", deviation: "-0.2 bar vs 동일 조건", detail: "정상 편차 범위 내이나 모니터링 지속 필요." },
        ]
      },
      {
        id: "cat-2",
        name: "갑작스런 Peak / Oscillation 감지",
        description: "계기 이상 탐지 목적 - 급격한 스파이크 또는 진동 패턴을 감지하여 계기 이상 여부 판단",
        top3: [
          { tagId: "FV-2001", description: "HCR Feed Control Valve", severity: "high", deviation: "Opening 92% (정상: 60-80%)", detail: "Control Valve Opening이 지속적으로 높은 상태. Sticking 또는 Positioner 이상 의심. Oscillation 패턴도 감지됨." },
          { tagId: "TI-4501", description: "VDU Column Bottom Temp", severity: "medium", deviation: "30분 주기 ±2C 진동", detail: "온도 제어루프에서 주기적 진동 패턴 감지. PID Tuning 검토 권장." },
          { tagId: "LI-2001", description: "HCR Separator Level", severity: "low", deviation: "간헐적 Spike (4회/일)", detail: "Level Transmitter 노이즈 가능성. 다음 정기 Calibration 시 확인 필요." },
        ]
      },
      {
        id: "cat-3",
        name: "장기적인 Drift 감지",
        description: "Fouling, Aging 등 시간에 따른 변동 이상 탐지 목적 - 서서히 진행되는 성능 저하 모니터링",
        top3: [
          { tagId: "E-101-UA", description: "E-101 Heat Exchanger UA Value", severity: "high", deviation: "-12% over 3 months", detail: "E-101 열교환기 UA 값이 3개월간 12% 감소. Fouling 진행 중으로 판단됨. 세정 시기 검토 필요." },
          { tagId: "WABT", description: "HCR Catalyst WABT", severity: "medium", deviation: "+7C over 6 months", detail: "촉매 활성 저하로 인한 WABT 상승 진행 중. EOR까지 약 8개월 잔여 예상." },
          { tagId: "K-301-EFF", description: "K-301 Compressor Efficiency", severity: "low", deviation: "-1.5% over 2 months", detail: "압축기 효율 소폭 감소. 계절적 요인 또는 Fouling 초기 단계 가능성." },
        ]
      },
      {
        id: "cat-4",
        name: "DR Reconciled Data 대비 실측지 Drift",
        description: "Data Reconciliation 결과와 실측지 간의 차이가 커지는 항목 모니터링",
        top3: [
          { tagId: "FI-1501", description: "VDU Side Draw Flow", severity: "high", deviation: "실측 대비 DR +8.3%", detail: "Flow Meter 정확도 저하 의심. 마지막 Calibration 이후 6개월 경과. 교정 또는 교체 검토." },
          { tagId: "TI-2501", description: "HCR Product Temp", severity: "medium", deviation: "실측 대비 DR -3.1C", detail: "Thermocouple 위치에 의한 측정 오차 가능성. 설치 위치 점검 권장." },
          { tagId: "FI-3001", description: "CCR H2 Makeup Flow", severity: "low", deviation: "실측 대비 DR +2.1%", detail: "정상 편차 범위 내. 지속 모니터링." },
        ]
      },
    ]
  },
  {
    id: "NTC-002",
    type: "notice",
    subType: "long-term",
    title: "장기 모니터링 리포트 (주간)",
    description: "촉매 성능 및 열교환기 효율에 대한 장기 트렌드 분석 결과입니다.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "Catalyst Activity (WABT)", status: "warning", value: "395°C → 402°C (6개월간 +7°C)" },
        { name: "E-101 UA Value", status: "normal", value: "안정적 (변동률 < 2%)" },
        { name: "Compressor Efficiency", status: "normal", value: "82% (목표 80% 이상)" }
      ]
    }
  },
  {
    id: "NTC-003",
    type: "notice",
    subType: "efficiency",
    title: "효율성 모니터링 리포트 (주간)",
    description: "KPI 달성률 및 운영 효율성 지표 검토가 필요합니다.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "처리량 준수율", status: "normal", value: "98.5% (목표 95%)" },
        { name: "온스펙 비율", status: "normal", value: "99.2% (목표 98%)" },
        { name: "AI 모델 정확도", status: "warning", value: "87% (목표 90%)" },
        { name: "에너지 효율", status: "normal", value: "목표 대비 +2.1%" }
      ]
    }
  },
  {
    id: "NTC-004",
    type: "notice",
    subType: "communication",
    title: "티켓 업데이트: HCR 촉매 교체 검토",
    description: "Process Engineering팀 박영희님이 의견을 추가했습니다.",
    timestamp: "2025-02-02 11:30",
    status: "unread",
    severity: "info",
    unit: "HCR",
    linkedTicketId: "1"
  },
  {
    id: "NTC-005",
    type: "notice",
    subType: "custom-alarm",
    title: "커스텀 알람: FI-1001 Feed Flow",
    description: "개인 설정한 모니터링 조건이 트리거되었습니다. (설정값: > 450 m3/hr)",
    timestamp: "2025-02-02 10:45",
    status: "unread",
    severity: "warning",
    unit: "CDU",
    data: {
      tagId: "FI-1001",
      value: 462,
      limit: 450,
      trend: [420, 435, 442, 448, 455, 460, 462]
    }
  },
  {
    id: "NTC-006",
    type: "notice",
    subType: "external-data",
    title: "외부 데이터 업데이트: UOP 촉매 분석 리포트",
    description: "UOP로부터 HCR 촉매 성능 테스트 결과가 도착했습니다. 검토 및 특이사항 기록이 필요합니다.",
    timestamp: "2025-02-01 16:00",
    status: "unread",
    severity: "info",
    unit: "HCR"
  },
  {
    id: "NTC-007",
    type: "notice",
    subType: "auto-calc",
    title: "자동 계산 완료: 월간 Operation Cost",
    description: "2025년 1월 운영비용 자동 계산이 완료되었습니다. 데이터 정합성 검토가 필요합니다.",
    timestamp: "2025-02-01 08:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "총 에너지 비용", status: "normal", value: "₩2.4B (예산 대비 -3%)" },
        { name: "촉매/케미컬 비용", status: "warning", value: "₩850M (예산 대비 +8%)" },
        { name: "처리량", status: "normal", value: "1,250,000 bbl (계획 대비 101%)" }
      ]
    }
  },
  // Daily Monitoring AI 요약 (GenAI)
  {
    id: "NTC-008",
    type: "notice",
    subType: "daily-monitoring",
    title: "Daily Monitoring AI 요약 (2025-02-02)",
    description: "GenAI가 금일 운전 현황을 요약했습니다. 전반적 운전 모드 및 주요 변동사항을 확인하세요.",
    timestamp: "2025-02-02 07:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "운영 모드", status: "normal", value: "정상 Full Rate 운전 (CDU 100%, HCR 95%)" },
        { name: "Feed 변경사항", status: "warning", value: "02/01부터 Arabian Light → Arabian Medium 전환 (S함량 +0.3%p)" },
        { name: "주요 변수 변경", status: "normal", value: "HCR WABT +1.5C (Feed 변경 대응), VDU Heater Outlet 안정" },
        { name: "TOB 현장 특이사항", status: "warning", value: "P-201B Seal Oil Leak 발견 (경미), 정비팀 모니터링 중" },
        { name: "환경 지표", status: "normal", value: "SO2/NOx 배출 정상 범위, 폐수 COD 안정" }
      ]
    },
    dailyMonitoringDetail: {
      aiSummary: "금일 전체 공정은 안정적인 Full Rate 운전을 유지하고 있습니다. 다만, 02/01부터 진행된 Arabian Light → Arabian Medium 원유 전환으로 인해 HCR Unit의 WABT가 1.5°C 상승하였으며, 이는 피드 황함량 증가(+0.3%p)에 대한 정상적인 대응입니다. VDU Heater Outlet 온도는 안정적이며, CDU Overhead 시스템 부식 지표도 정상 범위입니다.\n\n현장 특이사항으로 P-201B Seal Oil Leak이 발견되었으나 경미한 수준으로, 정비팀에서 모니터링 중입니다. 환경 배출 지표(SO2, NOx, 폐수 COD)는 모두 허용 범위 내에 있습니다.\n\n종합 판정: 정상 운전 유지, P-201B 상태 지속 관찰 권장",
      keyVariables: [
        { name: "CDU Feed Rate", value: "1,180 m3/hr", change: "+0.5%", status: "normal" },
        { name: "HCR WABT", value: "396.5°C", change: "+1.5°C", status: "warning" },
        { name: "VDU Heater Outlet", value: "372°C", change: "±0°C", status: "normal" },
        { name: "CCR RON", value: "99.1", change: "-0.1", status: "normal" },
        { name: "CDU Overhead pH", value: "5.8", change: "-0.2", status: "normal" },
        { name: "SO2 Emission", value: "42 ppm", change: "+3 ppm", status: "normal" },
      ],
      diagrams: ["CDU Process Flow", "HCR Reactor Profile", "VDU Column Profile"]
    }
  },
  // DCS 모듈 수정 요청
  {
    id: "NTC-009",
    type: "notice",
    subType: "dcs-modification",
    title: "DCS 모듈 수정 요청: HCR Reactor Control Logic 변경",
    description: "HCR Reactor Temperature Control Loop의 PID Tuning Parameter가 변경되었습니다.",
    timestamp: "2025-02-02 08:30",
    status: "unread",
    severity: "warning",
    unit: "HCR",
    data: {
      items: [
        { name: "변경 DCS 화면", status: "warning", value: "HCR-001: Reactor Temperature Control" },
        { name: "변경 내용", status: "warning", value: "TIC-2001 PID: P=2.5→3.0, I=120→90s, D=0→5s" },
        { name: "연결 ESR", status: "normal", value: "ESR-2025-0042: HCR APC 고도화 프로젝트" },
        { name: "변경 요청자", status: "normal", value: "DX팀 이민수 (ESR 담당)" },
        { name: "적용 일시", status: "normal", value: "2025-02-02 06:00 (야간 작업)" }
      ]
    },
    dcsModificationDetail: {
      esrId: "ESR-2025-0042",
      esrTitle: "HCR APC 고도화 프로젝트 - Phase 2",
      changeItems: [
        { item: "TIC-2001 P Gain", before: "2.5", after: "3.0" },
        { item: "TIC-2001 I Time", before: "120s", after: "90s" },
        { item: "TIC-2001 D Time", before: "0s", after: "5s" }
      ],
      requestor: "DX팀 이민수",
      appliedDate: "2025-02-02 06:00"
    }
  },
  // Event 타입
  {
    id: "EVT-001",
    type: "event",
    subType: "licensor-review",
    title: "라이센서 분기 리뷰 예정",
    description: "UOP와 2025년 1분기 Performance Review가 2주 후 예정되어 있습니다.",
    timestamp: "2025-02-15 10:00",
    status: "unread",
    severity: "info",
    unit: "HCR"
  },
  {
    id: "EVT-002",
    type: "event",
    subType: "mode-switch",
    title: "Mode Switch 예정: HCR Diesel → Gasoline",
    description: "2025-02-05 Mode Switch 예정. 가이드 발행이 필요합니다.",
    timestamp: "2025-02-05 06:00",
    status: "unread",
    severity: "warning",
    unit: "HCR"
  },
  {
    id: "EVT-003",
    type: "event",
    subType: "scheduled",
    title: "하절기 운전 모드 전환 D-30",
    description: "하절기 운전 가이드라인 검토 및 준비가 필요합니다.",
    timestamp: "2025-03-01 00:00",
    status: "unread",
    severity: "info"
  }
]

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<AlertItem[]>(SAMPLE_ALERTS)
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(SAMPLE_ALERTS[0])
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketTitle, setTicketTitle] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [ticketType, setTicketType] = useState<"Improvement" | "Trouble" | "Change" | "Analysis">("Trouble")
  const [ticketPriority, setTicketPriority] = useState<"P1" | "P2" | "P3" | "P4">("P2")
  const [ticketImpact, setTicketImpact] = useState<"Safety" | "Quality" | "Throughput" | "Cost" | "Energy">("Throughput")
  const [ticketDueDate, setTicketDueDate] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [engineerOpinion, setEngineerOpinion] = useState<"normal" | "caution" | "ticket" | null>(null)
  const [engineerLog, setEngineerLog] = useState("")
  
  // Shelved Alert 다이얼로그 상태
  const [showShelvedDialog, setShowShelvedDialog] = useState(false)
  const [shelvedReason, setShelvedReason] = useState("")
  const [shelvedUntil, setShelvedUntil] = useState("")
  
  // 이상징후 카테고리 상세 팝업 상태
  const [showAnomalyCategoryDialog, setShowAnomalyCategoryDialog] = useState(false)
  const [selectedAnomalyCategory, setSelectedAnomalyCategory] = useState<{id: string; name: string; description: string; top3: {tagId: string; description: string; severity: "high"|"medium"|"low"; deviation: string; detail: string}[]} | null>(null)
  
  // DCS ESR 상세 팝업 상태
  const [showEsrDialog, setShowEsrDialog] = useState(false)
  
  // DCS CSR 요청 팝업 상태
  const [showCsrDialog, setShowCsrDialog] = useState(false)
  const [csrDescription, setCsrDescription] = useState("")
  
  // Daily Monitoring 판정 상태
  const [dailyMonitoringAction, setDailyMonitoringAction] = useState<"normal" | "caution" | "ticket" | null>(null)
  
  // Standing Issue 상태
  const [standingIssues, setStandingIssues] = useState<StandingIssue[]>(INITIAL_STANDING_ISSUES)
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null)
  const [issueUpdateContent, setIssueUpdateContent] = useState("")
  
  // Standing Issue 추가 등록 다이얼로그 상태
  const [showDailyReportDialog, setShowDailyReportDialog] = useState(false)
  const [dailyReportText, setDailyReportText] = useState("")
  const [dailyReportLinkedTicketId, setDailyReportLinkedTicketId] = useState("")
  const [dailyReportTitle, setDailyReportTitle] = useState("")
  const [dailyReportCategory, setDailyReportCategory] = useState<"long-term" | "special" | "monitoring" | "daily-report">("daily-report")
  const [dailyReportUnit, setDailyReportUnit] = useState("")

  // 섹션 확장 상태
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    alert: true,
    notice: true,
    event: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getTypeIcon = (type: AlertType, subType: string) => {
    if (type === "alert") return <AlertTriangle className="h-4 w-4" />
    if (type === "event") return <Calendar className="h-4 w-4" />
    
    switch (subType) {
      case "anomaly": return <Activity className="h-4 w-4" />
      case "long-term": return <TrendingUp className="h-4 w-4" />
      case "efficiency": return <Gauge className="h-4 w-4" />
      case "communication": return <MessageSquare className="h-4 w-4" />
      case "custom-alarm": return <Bell className="h-4 w-4" />
      case "external-data": return <ExternalLink className="h-4 w-4" />
      case "auto-calc": return <Calculator className="h-4 w-4" />
      case "daily-monitoring": return <Eye className="h-4 w-4" />
      case "dcs-modification": return <Monitor className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-500"
      case "warning": return "bg-amber-500"
      default: return "bg-blue-500"
    }
  }

  const getSubTypeLabel = (subType: string) => {
    switch (subType) {
      case "operation-guide": return "Operation Guide"
      case "anomaly": return "이상징후"
      case "long-term": return "장기 모니터링"
      case "efficiency": return "효율성"
      case "communication": return "티켓 업데이트"
      case "custom-alarm": return "커스텀 알람"
      case "external-data": return "외부 데이터"
      case "auto-calc": return "자동 계산"
      case "daily-monitoring": return "Daily Monitoring"
      case "dcs-modification": return "DCS 수정 요청"
      case "licensor-review": return "라이센서 리뷰"
      case "mode-switch": return "Mode Switch"
      case "scheduled": return "예정 이벤트"
      default: return subType
    }
  }

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "acknowledged", alertState: "standing" as AlertState } : a))
  }

  const handleShelveAlert = (alertId: string) => {
    if (!shelvedReason || !shelvedUntil) {
      alert("Shelved 처리 이유와 재개 시점을 입력해주세요.")
      return
    }
    setAlerts(alerts.map(a => a.id === alertId ? { 
      ...a, 
      status: "resolved", 
      alertState: "shelved" as AlertState,
      shelvedReason: shelvedReason,
      shelvedUntil: shelvedUntil
    } : a))
    setShowShelvedDialog(false)
    setShelvedReason("")
    setShelvedUntil("")
    alert(`알람이 Shelved 처리되었습니다.\n재개 시점: ${shelvedUntil}`)
  }

  const getAlertGradeLabel = (grade?: AlertGrade) => {
    switch (grade) {
      case "high": return { label: "상", color: "bg-red-500 text-white" }
      case "medium": return { label: "중", color: "bg-amber-500 text-white" }
      case "low": return { label: "하", color: "bg-blue-500 text-white" }
      default: return { label: "-", color: "bg-gray-300" }
    }
  }

  const getAlertStateLabel = (state?: AlertState) => {
    switch (state) {
      case "new": return { label: "New Alert", color: "bg-red-100 text-red-700 border-red-300" }
      case "standing": return { label: "Standing Alert", color: "bg-amber-100 text-amber-700 border-amber-300" }
      case "shelved": return { label: "Shelved Alert", color: "bg-gray-100 text-gray-600 border-gray-300" }
      default: return { label: "-", color: "bg-gray-100" }
    }
  }

  const handleCreateTicket = (alert: AlertItem) => {
    setSelectedAlert(alert)
    setTicketTitle(alert.title)
    setTicketDescription(`${alert.description}\n\n[자동 생성된 참조 데이터]\n- 발생시각: ${alert.timestamp}\n- Unit: ${alert.unit || "N/A"}${alert.data?.tagId ? `\n- Tag: ${alert.data.tagId}\n- 측정값: ${alert.data.value}\n- 기준값: ${alert.data.limit}` : ""}`)
    setShowTicketDialog(true)
  }

  const handleSubmitTicket = () => {
    const unit = selectedAlert?.unit || "VDU"
    const newTicket = {
      id: Date.now().toString(),
      title: ticketTitle,
      description: ticketDescription,
      ticketType: ticketType,
      priority: ticketPriority,
      impact: ticketImpact,
      owner: UNIT_OWNERS[unit] || "미배정",
      status: "Open" as const,
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: ticketDueDate,
      bottleneck: "시작 전",
      accessLevel: "Team" as const,
      unit: unit,
      context: {
        unit: unit,
      },
      workPackages: [],
    }

    saveTicket(newTicket)

    // 기본 Work Package 추가
    const defaultWorkPackages = [
      {
        ticketId: newTicket.id,
        wpType: "Analysis" as const,
        title: "현상 분석",
        description: "문제 또는 개선사항에 대한 근본 원인 및 데이터 분석",
        ownerTeam: "Process Engineering",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Decision" as const,
        title: "의사결정",
        description: "분석 결과를 바탕으로 실행 방안 결정",
        ownerTeam: "Operations Coordination",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Execution" as const,
        title: "실행",
        description: "결정된 방안의 실제 실행 및 구현",
        ownerTeam: "Project / Facility",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Validation" as const,
        title: "검증",
        description: "실행 결과의 효과성 검증 및 모니터링",
        ownerTeam: "DX / Modeling",
        status: "Not Started" as const,
        dueDate: "",
      },
    ]

    defaultWorkPackages.forEach((wp) => {
      addWorkPackageToTicket(newTicket.id, wp)
    })

    if (selectedAlert) {
      setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
    }
    
    setShowTicketDialog(false)
    setTicketTitle("")
    setTicketDescription("")
    setTicketType("Trouble")
    setTicketPriority("P2")
    setTicketImpact("Throughput")
    setTicketDueDate("")
    
    // 생성된 티켓으로 이동
    router.push(`/tickets/${newTicket.id}`)
  }

  const handleReviewAction = (alertId: string, action: "normal" | "caution" | "immediate") => {
    if (action === "immediate") {
      const alertItem = alerts.find(a => a.id === alertId)
      if (alertItem) handleCreateTicket(alertItem)
    } else {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "resolved" } : a))
    }
    setReviewComment("")
  }

  const handleEngineerOpinionSubmit = (alertId: string) => {
    if (engineerOpinion === "ticket") {
      const alertItem = alerts.find(a => a.id === alertId)
      if (alertItem) {
        setTicketTitle(alertItem.title)
        
        // 상세 설명에 엔지니어 의견과 관련 데이터 포함
        let desc = alertItem.description
        desc += "\n\n### 엔지니어 검토 의견"
        desc += `\n- 판정: 티켓화 (즉시 조치 필요)`
        desc += `\n- 검토일시: ${new Date().toLocaleString("ko-KR")}`
        if (engineerLog) {
          desc += `\n- 검토 의견: ${engineerLog}`
        }
        
        desc += "\n\n### 자동 생성된 참조 데이터"
        desc += `\n- 발생시각: ${alertItem.timestamp}`
        desc += `\n- Unit: ${alertItem.unit || "N/A"}`
        
        if (alertItem.data?.items) {
          desc += "\n\n### 상세 항목"
          alertItem.data.items.forEach(item => {
            desc += `\n- ${item.name}: ${item.value} (${item.status === "warning" ? "주의" : "정상"})`
          })
        }
        
        setTicketDescription(desc)
        
        // 기본값 설정
        setTicketType("Trouble")
        setTicketPriority("P2")
        if (alertItem.subType === "anomaly") setTicketType("Analysis")
        if (alertItem.subType === "efficiency") setTicketType("Improvement")
        
        setShowTicketDialog(true)
      }
    } else {
      const statusLabel = engineerOpinion === "normal" ? "정상" : "주의"
      alert(`엔지니어 의견이 저장되었습니다.\n\n판정: ${statusLabel}\n로그: ${engineerLog || "없음"}`)
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "resolved" } : a))
    }
    setEngineerOpinion(null)
    setEngineerLog("")
  }

  // Standing Issue 업데이트 핸들러
  const handleUpdateStandingIssue = (issueId: string) => {
    if (!issueUpdateContent.trim()) return
    setStandingIssues(prev => prev.map(issue => 
      issue.id === issueId ? {
        ...issue,
        lastUpdated: new Date().toISOString().split("T")[0],
        updates: [
          { date: new Date().toISOString().split("T")[0], content: issueUpdateContent, author: "나 (현재 사용자)" },
          ...issue.updates
        ]
      } : issue
    ))
    setEditingIssueId(null)
    setIssueUpdateContent("")
  }

  // Standing Issue 추가 등록 핸들러
  const handleDailyReportSubmit = () => {
    if (!dailyReportTitle.trim() || !dailyReportText.trim()) return

    const newIssue: StandingIssue = {
      id: `SI-${String(standingIssues.length + 1).padStart(3, "0")}`,
      title: dailyReportTitle,
      description: dailyReportText,
      category: dailyReportCategory,
      status: "active",
      unit: dailyReportUnit || undefined,
      linkedTicketId: dailyReportLinkedTicketId || undefined,
      linkedTicketTitle: dailyReportLinkedTicketId ? getTickets().find(t => t.id === dailyReportLinkedTicketId)?.title : undefined,
      createdDate: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      updates: [
        { date: new Date().toISOString().split("T")[0], content: dailyReportText, author: "나 (현재 사용자)" }
      ]
    }

    setStandingIssues(prev => [newIssue, ...prev])
    setShowDailyReportDialog(false)
    setDailyReportTitle("")
    setDailyReportText("")
    setDailyReportLinkedTicketId("")
    setDailyReportCategory("daily-report")
    setDailyReportUnit("")
  }

  // Notice 정렬: daily-monitoring을 최상위, 그 다음 anomaly, 나머지는 시간순
  const noticeSortOrder: Record<string, number> = { "daily-monitoring": 0, "anomaly": 1, "dcs-modification": 2 }
  const sortedNotices = alerts.filter(a => a.type === "notice").sort((a, b) => {
    const orderA = noticeSortOrder[a.subType] ?? 99
    const orderB = noticeSortOrder[b.subType] ?? 99
    return orderA - orderB
  })
  const alertsByType = {
    alert: alerts.filter(a => a.type === "alert"),
    notice: sortedNotices,
    event: alerts.filter(a => a.type === "event")
  }

  const unreadCounts = {
    alert: alertsByType.alert.filter(a => a.status === "unread").length,
    notice: alertsByType.notice.filter(a => a.status === "unread").length,
    event: alertsByType.event.filter(a => a.status === "unread").length
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background flex">
        {/* 좌측 알림 리스트 패널 */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">My Alert</h1>
              <Badge variant="destructive" className="ml-auto">
                {unreadCounts.alert + unreadCounts.notice + unreadCounts.event}
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {/* Alert 섹션 */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("alert")}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {expandedSections.alert ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">Alert</span>
                  {unreadCounts.alert > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">{unreadCounts.alert}</Badge>
                  )}
                </button>
                {expandedSections.alert && (
                  <div className="ml-2 space-y-1 mt-1">
                    {alertsByType.alert.map(item => {
                      const gradeInfo = getAlertGradeLabel(item.alertGrade)
                      const stateInfo = getAlertStateLabel(item.alertState)
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedAlert(item)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg transition-colors",
                            selectedAlert?.id === item.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                            item.alertState === "new" && "border-l-2 border-l-red-500"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs px-1.5 py-0", gradeInfo.color)}>{gradeInfo.label}</Badge>
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0", stateInfo.color)}>{stateInfo.label}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{item.unit}</span>
                          </div>
                          <p className={cn("text-sm truncate mt-1", item.alertState === "new" ? "font-bold" : "font-medium")}>{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notice 섹션 */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("notice")}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {expandedSections.notice ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Notice</span>
                  {unreadCounts.notice > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">{unreadCounts.notice}</Badge>
                  )}
                </button>
                {expandedSections.notice && (
                  <div className="ml-2 space-y-1 mt-1">
                    {alertsByType.notice.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedAlert(item)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg transition-colors",
                          selectedAlert?.id === item.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                          item.status === "unread" && "border-l-2 border-l-blue-500"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type, item.subType)}
                          <Badge variant="outline" className="text-xs">{getSubTypeLabel(item.subType)}</Badge>
                        </div>
                        <p className="text-sm font-medium truncate mt-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Event 섹션 */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("event")}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {expandedSections.event ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">Event</span>
                  {unreadCounts.event > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">{unreadCounts.event}</Badge>
                  )}
                </button>
                {expandedSections.event && (
                  <div className="ml-2 space-y-1 mt-1">
                    {alertsByType.event.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedAlert(item)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg transition-colors",
                          selectedAlert?.id === item.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                          item.status === "unread" && "border-l-2 border-l-amber-500"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type, item.subType)}
                          <Badge variant="outline" className="text-xs">{getSubTypeLabel(item.subType)}</Badge>
                        </div>
                        <p className="text-sm font-medium truncate mt-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* 우측 세부 화면 */}
        <div className="flex-1 flex flex-col">
          {selectedAlert ? (
            <>
              {/* 헤더 */}
              <div className="p-6 border-b border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-full text-white", getSeverityColor(selectedAlert.severity))}>
                    {getTypeIcon(selectedAlert.type, selectedAlert.subType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedAlert.type.toUpperCase()}</Badge>
                      <Badge variant="secondary">{getSubTypeLabel(selectedAlert.subType)}</Badge>
                      {selectedAlert.unit && <Badge>{selectedAlert.unit}</Badge>}
                      {selectedAlert.status === "unread" && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold">{selectedAlert.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedAlert.timestamp}</span>
                </div>
              </div>

              {/* 콘텐츠 */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl space-y-6">
                  <p className="text-muted-foreground">{selectedAlert.description}</p>

                  {/* Alert 타입: 알람 정보 + 장치 정보 (나란히 배치) */}
                  {selectedAlert.type === "alert" && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* 알람 정보 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            알람 정보
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Tag ID</span>
                                <p className="font-medium text-sm">{selectedAlert.data?.tagId || "-"}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">알람 등급</span>
                                <Badge className={cn("text-xs", getAlertGradeLabel(selectedAlert.alertGrade).color)}>
                                  {getAlertGradeLabel(selectedAlert.alertGrade).label}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Trigger 조건</span>
                              <p className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{selectedAlert.triggerCondition || "-"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Setpoint</span>
                              <div className="flex gap-2 flex-wrap">
                                {selectedAlert.triggerSetpoint?.high && (
                                  <Badge variant="outline" className="text-red-600 border-red-300 text-xs">High: {selectedAlert.triggerSetpoint.high}</Badge>
                                )}
                                {selectedAlert.triggerSetpoint?.low && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">Low: {selectedAlert.triggerSetpoint.low}</Badge>
                                )}
                              </div>
                            </div>
                            {selectedAlert.alarmBackground && (
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <span className="text-xs text-muted-foreground">설정 배경</span>
                                <p className="text-xs mt-1">{selectedAlert.alarmBackground}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 장치 정보 및 이력 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            장치 정보 및 이력
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <span className="text-xs text-muted-foreground">Unit / 위치</span>
                                <p className="font-medium text-sm">{selectedAlert.unit} / Reactor Section</p>
                              </div>
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <span className="text-xs text-muted-foreground">관련 장치</span>
                                <p className="font-medium text-sm">R-2001 (HCR Reactor)</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground">정비 / 검사 이력</span>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between p-1.5 bg-blue-50 rounded border border-blue-100">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-1.5 py-0">정비</Badge>
                                    <span className="text-xs">Thermocouple 교체</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">2024-11-15</span>
                                </div>
                                <div className="flex items-center justify-between p-1.5 bg-green-50 rounded border border-green-100">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs px-1.5 py-0">검사</Badge>
                                    <span className="text-xs">정기 Calibration</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">2024-12-20</span>
                                </div>
                                <div className="flex items-center justify-between p-1.5 bg-amber-50 rounded border border-amber-100">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-1.5 py-0">점검</Badge>
                                    <span className="text-xs">T/A 중 내부 검사</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">2024-06-15</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Alert 타입: DCS 화면 스냅샷 */}
                  {selectedAlert.type === "alert" && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          DCS 화면 스냅샷 (알람 발생 시점)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                          {/* DCS 화면 시뮬레이션 */}
                          <div className="absolute inset-0 p-4">
                            <div className="h-full flex flex-col">
                              {/* DCS 헤더 */}
                              <div className="flex items-center justify-between mb-2 text-slate-400 text-xs">
                                <span>{selectedAlert.unit} - Reactor Overview</span>
                                <span>{selectedAlert.timestamp}</span>
                              </div>
                              {/* DCS 그래픽 영역 */}
                              <div className="flex-1 grid grid-cols-3 gap-3">
                                {/* 프로세스 블록 1 */}
                                <div className="bg-slate-800 rounded p-2 flex flex-col">
                                  <span className="text-slate-500 text-xs mb-1">Feed Section</span>
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="w-16 h-12 border-2 border-slate-600 rounded flex items-center justify-center">
                                      <span className="text-slate-400 text-xs">P-2001</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-green-400 mt-1">120.5 m3/h</div>
                                </div>
                                {/* 프로세스 블록 2 - 알람 발생 위치 */}
                                <div className="bg-slate-800 rounded p-2 flex flex-col border-2 border-red-500">
                                  <span className="text-slate-500 text-xs mb-1">Reactor</span>
                                  <div className="flex-1 flex items-center justify-center relative">
                                    <div className="w-20 h-16 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center bg-red-900/30">
                                      <span className="text-red-400 text-xs font-bold">R-2001</span>
                                      <span className="text-red-300 text-xs">{selectedAlert.data?.tagId}</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                                  </div>
                                  <div className="text-xs text-red-400 mt-1 font-bold">{selectedAlert.data?.value}°C (HIGH)</div>
                                </div>
                                {/* 프로세스 블록 3 */}
                                <div className="bg-slate-800 rounded p-2 flex flex-col">
                                  <span className="text-slate-500 text-xs mb-1">Product</span>
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="w-16 h-12 border-2 border-slate-600 rounded flex items-center justify-center">
                                      <span className="text-slate-400 text-xs">V-2001</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-green-400 mt-1">35.2 bar</div>
                                </div>
                              </div>
                              {/* 하단 태그 값들 */}
                              <div className="mt-2 grid grid-cols-4 gap-2">
                                <div className="bg-slate-800 p-1.5 rounded text-center">
                                  <span className="text-slate-500 text-xs block">FI-2001</span>
                                  <span className="text-green-400 text-xs">120.5</span>
                                </div>
                                <div className="bg-red-900/50 p-1.5 rounded text-center border border-red-500">
                                  <span className="text-slate-500 text-xs block">{selectedAlert.data?.tagId}</span>
                                  <span className="text-red-400 text-xs font-bold">{selectedAlert.data?.value}</span>
                                </div>
                                <div className="bg-slate-800 p-1.5 rounded text-center">
                                  <span className="text-slate-500 text-xs block">PI-2001</span>
                                  <span className="text-green-400 text-xs">35.2</span>
                                </div>
                                <div className="bg-slate-800 p-1.5 rounded text-center">
                                  <span className="text-slate-500 text-xs block">LI-2001</span>
                                  <span className="text-amber-400 text-xs">65.3</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">캡처 시간: {selectedAlert.timestamp}</span>
                          <Button variant="outline" size="sm" className="text-xs bg-transparent">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            DCS 화면 열기
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alert 타입: 관련 트렌드 (Guide, Actual, 위반시점 헤어라인) */}
                  {selectedAlert.type === "alert" && selectedAlert.data?.trend && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          관련 트렌드 - {selectedAlert.data.tagId}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-end gap-2 relative bg-muted/30 rounded-lg p-4">
                          {selectedAlert.data.trend.map((value, i) => {
                            const max = Math.max(...selectedAlert.data!.trend!, selectedAlert.data!.limit || 0) * 1.05
                            const min = Math.min(...selectedAlert.data!.trend!, selectedAlert.data!.limit || Infinity) * 0.95
                            const range = max - min || 1
                            const height = ((value - min) / range) * 100
                            const isOverLimit = selectedAlert.data!.limit && value > selectedAlert.data!.limit
                            const isFirstViolation = isOverLimit && (i === 0 || !selectedAlert.data!.trend![i-1] || selectedAlert.data!.trend![i-1] <= selectedAlert.data!.limit!)
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                                <span className="text-xs text-muted-foreground mb-1">{value}</span>
                                <div 
                                  className={cn("w-full rounded-t transition-all", isOverLimit ? "bg-red-500" : "bg-primary")}
                                  style={{ height: `${Math.max(height, 5)}%` }}
                                />
                                {/* 가이드 위반 시점 헤어라인 */}
                                {isFirstViolation && (
                                  <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-red-600 z-10">
                                    <span className="absolute -top-5 -left-8 text-xs text-red-600 font-medium whitespace-nowrap">위반 시점</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {/* Guide 라인 (High) */}
                          {selectedAlert.data.limit && (
                            <div className="absolute left-4 right-4 flex items-center gap-2" style={{ 
                              bottom: `${Math.min(95, Math.max(5, ((selectedAlert.data.limit - Math.min(...selectedAlert.data.trend) * 0.95) / (Math.max(...selectedAlert.data.trend, selectedAlert.data.limit) * 1.05 - Math.min(...selectedAlert.data.trend) * 0.95)) * 100))}%` 
                            }}>
                              <div className="flex-1 border-t-2 border-dashed border-red-400" />
                              <span className="text-xs text-red-500 bg-background px-2 py-0.5 rounded">Guide Max: {selectedAlert.data.limit}</span>
                            </div>
                          )}
                          {/* Guide 라인 (Low) - triggerSetpoint.low 가 있을 경우 */}
                          {selectedAlert.triggerSetpoint?.low && (
                            <div className="absolute left-4 right-4 flex items-center gap-2" style={{ 
                              bottom: `${Math.min(95, Math.max(5, ((selectedAlert.triggerSetpoint.low - Math.min(...selectedAlert.data.trend) * 0.95) / (Math.max(...selectedAlert.data.trend, selectedAlert.data.limit || 0) * 1.05 - Math.min(...selectedAlert.data.trend) * 0.95)) * 100))}%` 
                            }}>
                              <div className="flex-1 border-t-2 border-dashed border-blue-400" />
                              <span className="text-xs text-blue-500 bg-background px-2 py-0.5 rounded">Guide Min: {selectedAlert.triggerSetpoint.low}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between mt-4 p-3 bg-muted/30 rounded-lg">
                          <div>
                            <span className="text-sm text-muted-foreground">현재값 (Actual)</span>
                            <p className="text-lg font-bold">{selectedAlert.data.value}</p>
                          </div>
                          <div className="text-center">
                            <span className="text-sm text-muted-foreground">편차</span>
                            <p className={cn("text-lg font-bold", selectedAlert.data.value > (selectedAlert.data.limit || 0) ? "text-red-500" : "text-green-500")}>
                              {selectedAlert.data.limit ? `${selectedAlert.data.value > selectedAlert.data.limit ? "+" : ""}${(selectedAlert.data.value - selectedAlert.data.limit).toFixed(1)}` : "-"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">Guide</span>
                            <p className="text-lg font-bold text-muted-foreground">{selectedAlert.data.limit}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alert 타입: 과거 알람 발생 이력 및 해결 방법 */}
                  {selectedAlert.type === "alert" && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          과거 알람 발생 이력 ({selectedAlert.data?.tagId})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">이 태그에서 발생했던 과거 알람과 해결 방법</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* 과거 알람 이력 1 */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">High Alarm</Badge>
                                <span className="text-sm font-medium">2024-10-15 14:32</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">해결됨</Badge>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">발생값:</span>
                                <span className="font-mono">398.5°C</span>
                                <span className="text-muted-foreground">지속시간:</span>
                                <span>23분</span>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                <span className="font-medium text-green-700">해결 방법:</span>
                                <span className="text-green-600 ml-2">Feed Flow 감소 조치 (120 → 105 m3/h), 15분 후 정상 복귀</span>
                              </div>
                              <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                관련 티켓 TKT-2024-0892 보기
                              </Button>
                            </div>
                          </div>

                          {/* 과거 알람 이력 2 */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">High-High Alarm</Badge>
                                <span className="text-sm font-medium">2024-08-22 09:15</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">해결됨</Badge>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">발생값:</span>
                                <span className="font-mono">412.3°C</span>
                                <span className="text-muted-foreground">지속시간:</span>
                                <span>8분</span>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                <span className="font-medium text-green-700">해결 방법:</span>
                                <span className="text-green-600 ml-2">긴급 감량 운전 실시, Quench 주입량 증가, 촉매 활성도 점검 후 정상화</span>
                              </div>
                              <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                관련 티켓 TKT-2024-0654 보기
                              </Button>
                            </div>
                          </div>

                          {/* 과거 알람 이력 3 */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">High Alarm</Badge>
                                <span className="text-sm font-medium">2024-06-10 16:48</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">해결됨</Badge>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">발생값:</span>
                                <span className="font-mono">396.1°C</span>
                                <span className="text-muted-foreground">지속시간:</span>
                                <span>45분</span>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                <span className="font-medium text-green-700">해결 방법:</span>
                                <span className="text-green-600 ml-2">Thermocouple 오작동으로 확인, 센서 교체 후 정상화 (계기 문제)</span>
                              </div>
                              <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                관련 티켓 TKT-2024-0421 보기
                              </Button>
                            </div>
                          </div>

                          <div className="text-center pt-2">
                            <Button variant="link" className="text-xs">
                              전체 이력 보기 (총 12건)
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alert 타입: Shelved 정보 (Shelved 상태인 경우) */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "shelved" && (
                    <Card className="border-gray-300 bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                          <Eye className="h-4 w-4" />
                          Shelved 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Shelved 사유</span>
                            <p className="text-sm">{selectedAlert.shelvedReason}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">재개 예정일</span>
                            <p className="text-sm font-medium">{selectedAlert.shelvedUntil}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 이상징후 Notice: 카테고리 기반 Top3 */}
                  {selectedAlert.subType === "anomaly" && selectedAlert.anomalyCategories && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          이상징후 카테고리별 Top 3
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedAlert.anomalyCategories.map((cat) => (
                            <button
                              key={cat.id}
                              className="w-full text-left border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => { setSelectedAnomalyCategory(cat); setShowAnomalyCategoryDialog(true) }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-sm">{cat.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {cat.top3.filter(t => t.severity === "high").length > 0 ? `High ${cat.top3.filter(t => t.severity === "high").length}건` : "정상"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
                              <div className="space-y-1.5">
                                {cat.top3.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 text-xs">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full shrink-0",
                                      item.severity === "high" ? "bg-red-500" : item.severity === "medium" ? "bg-amber-500" : "bg-green-500"
                                    )} />
                                    <span className="font-mono shrink-0 w-20">{item.tagId}</span>
                                    <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                                    <span className="font-medium shrink-0 text-right">{item.deviation.split(" ")[0]}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                상세 보기 <ArrowRight className="h-3 w-3" />
                              </p>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Daily Monitoring AI 요약 상세 */}
                  {selectedAlert.subType === "daily-monitoring" && selectedAlert.dailyMonitoringDetail && (
                    <>
                      {/* AI 요약 리포트 */}
                      <Card className="border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            GenAI Daily Monitoring Report
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed whitespace-pre-line">
                            {selectedAlert.dailyMonitoringDetail.aiSummary}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 주요 변수 현황 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Gauge className="h-4 w-4" />
                            주요 변수 현황
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedAlert.dailyMonitoringDetail.keyVariables.map((v, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <span className="text-sm font-medium">{v.name}</span>
                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-sm">{v.value}</span>
                                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded", v.status === "warning" ? "bg-amber-100 text-amber-700" : v.status === "critical" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                                    {v.change}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 운전 항목 요약 */}
                      {selectedAlert.data?.items && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              운전 현황 요약
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {selectedAlert.data.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                  <span className="text-sm font-medium">{item.name}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">{item.value}</span>
                                    <Badge variant={item.status === "warning" ? "destructive" : "secondary"}>
                                      {item.status === "warning" ? "주의" : "정상"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* 관련 다이어그램 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            관련 다이어그램
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            {selectedAlert.dailyMonitoringDetail.diagrams.map((name, i) => (
                              <div key={i} className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                <div className="text-center">
                                  <Monitor className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                                  <span className="text-xs text-slate-400">{name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Standing Issue 영역 */}
                      <Card className="border-amber-200/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-amber-600" />
                              Standing Issue
                              <Badge variant="secondary" className="ml-1 text-xs">{standingIssues.filter(i => i.status !== "resolved").length}</Badge>
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">중장기 및 특이사항 관리</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {standingIssues.filter(i => i.status !== "resolved").map((issue) => (
                              <div key={issue.id} className={cn(
                                "border rounded-lg overflow-hidden",
                                issue.category === "daily-report" && "border-primary/30 bg-primary/5"
                              )}>
                                {/* Issue 헤더 */}
                                <div className="flex items-center justify-between p-3 bg-muted/30">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Badge variant="outline" className={cn(
                                      "text-xs shrink-0",
                                      issue.category === "long-term" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      issue.category === "special" ? "bg-red-50 text-red-700 border-red-200" :
                                      issue.category === "monitoring" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                      "bg-primary/10 text-primary border-primary/30"
                                    )}>
                                      {issue.category === "long-term" ? "장기" : issue.category === "special" ? "특이" : issue.category === "monitoring" ? "관찰" : "일일보고"}
                                    </Badge>
                                    <Badge variant={issue.status === "active" ? "destructive" : "secondary"} className="text-xs shrink-0">
                                      {issue.status === "active" ? "활성" : "관찰중"}
                                    </Badge>
                                    {issue.unit && (
                                      <Badge variant="outline" className="text-xs shrink-0">{issue.unit}</Badge>
                                    )}
                                    <span className="text-sm font-medium truncate">{issue.title}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{issue.lastUpdated}</span>
                                </div>
                                
                                {/* Issue 내용 */}
                                <div className="p-3 space-y-2">
                                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                                  
                                  {/* 연결 티켓 */}
                                  {issue.linkedTicketId && (
                                    <button
                                      onClick={() => router.push(`/tickets/${issue.linkedTicketId}`)}
                                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                    >
                                      <Link className="h-3 w-3" />
                                      {issue.linkedTicketTitle || `Ticket #${issue.linkedTicketId}`}
                                    </button>
                                  )}
                                  
                                  {/* 최근 업데이트 */}
                                  {issue.updates.length > 0 && (
                                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                      <span className="font-medium text-muted-foreground">최근 업데이트:</span>
                                      <p className="mt-0.5">{issue.updates[0].content}</p>
                                      <span className="text-muted-foreground">{issue.updates[0].date} - {issue.updates[0].author}</span>
                                    </div>
                                  )}
                                  
                                  {/* 업데이트 입력 영역 */}
                                  {editingIssueId === issue.id ? (
                                    <div className="mt-2 space-y-2">
                                      <Textarea
                                        value={issueUpdateContent}
                                        onChange={(e) => setIssueUpdateContent(e.target.value)}
                                        placeholder="업데이트 내용을 입력하세요..."
                                        className="min-h-16 text-sm"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="bg-transparent text-xs"
                                          onClick={() => { setEditingIssueId(null); setIssueUpdateContent("") }}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          취소
                                        </Button>
                                        <Button 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => handleUpdateStandingIssue(issue.id)}
                                          disabled={!issueUpdateContent.trim()}
                                        >
                                          <Save className="h-3 w-3 mr-1" />
                                          저장
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end mt-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-xs h-7 px-2"
                                        onClick={() => setEditingIssueId(issue.id)}
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        업데이트
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {standingIssues.filter(i => i.status !== "resolved").length === 0 && (
                              <div className="text-center py-6 text-muted-foreground text-sm">
                                등록된 Standing Issue가 없습니다.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* DCS 수정 요청 상세 */}
                  {selectedAlert.subType === "dcs-modification" && selectedAlert.data?.items && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          변경 상세 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedAlert.data.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-3">
                                {item.name === "연결 ESR" ? (
                                  <button
                                    onClick={() => setShowEsrDialog(true)}
                                    className="text-sm text-primary underline hover:text-primary/80 cursor-pointer"
                                  >
                                    {item.value}
                                  </button>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{item.value}</span>
                                )}
                                <Badge variant={item.status === "warning" ? "destructive" : "secondary"}>
                                  {item.status === "warning" ? "변경" : "정보"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 기존 Notice 타입 (이상징후/DCS/Daily Monitoring 제외): 아이템 리스트 */}
                  {selectedAlert.data?.items && !["anomaly", "daily-monitoring", "dcs-modification"].includes(selectedAlert.subType) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">상세 항목</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedAlert.data.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">{item.value}</span>
                                <Badge variant={item.status === "warning" ? "destructive" : "secondary"}>
                                  {item.status === "warning" ? "주의" : "정상"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 이상징후/장기모니터링/효율성 - 엔지니어 의견 섹션 (daily-monitoring은 별도 처리) */}
                  {selectedAlert.type === "notice" && ["anomaly", "long-term", "efficiency"].includes(selectedAlert.subType) && (
                    <Card className="border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          엔지니어 의견
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">판정 선택</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEngineerOpinion("normal")}
                              className={cn(
                                "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                                engineerOpinion === "normal" 
                                  ? "border-green-500 bg-green-50 text-green-700" 
                                  : "border-border hover:border-green-300 hover:bg-green-50/50"
                              )}
                            >
                              <CheckCircle className={cn("h-5 w-5 mx-auto mb-1", engineerOpinion === "normal" ? "text-green-500" : "text-muted-foreground")} />
                              <span className="text-sm font-medium">정상</span>
                              <p className="text-xs text-muted-foreground mt-1">특이사항 없음</p>
                            </button>
                            <button
                              onClick={() => setEngineerOpinion("caution")}
                              className={cn(
                                "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                                engineerOpinion === "caution" 
                                  ? "border-amber-500 bg-amber-50 text-amber-700" 
                                  : "border-border hover:border-amber-300 hover:bg-amber-50/50"
                              )}
                            >
                              <AlertCircle className={cn("h-5 w-5 mx-auto mb-1", engineerOpinion === "caution" ? "text-amber-500" : "text-muted-foreground")} />
                              <span className="text-sm font-medium">주의</span>
                              <p className="text-xs text-muted-foreground mt-1">지속 관찰 필요</p>
                            </button>
                            <button
                              onClick={() => setEngineerOpinion("ticket")}
                              className={cn(
                                "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                                engineerOpinion === "ticket" 
                                  ? "border-red-500 bg-red-50 text-red-700" 
                                  : "border-border hover:border-red-300 hover:bg-red-50/50"
                              )}
                            >
                              <FileText className={cn("h-5 w-5 mx-auto mb-1", engineerOpinion === "ticket" ? "text-red-500" : "text-muted-foreground")} />
                              <span className="text-sm font-medium">티켓화</span>
                              <p className="text-xs text-muted-foreground mt-1">즉시 조치 필요</p>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">추가 로그 (선택사항)</label>
                          <Textarea
                            value={engineerLog}
                            onChange={(e) => setEngineerLog(e.target.value)}
                            placeholder="검토 의견, 특이사항, 후속 조치 계획 등을 기록하세요..."
                            className="min-h-24"
                          />
                        </div>

                        {engineerOpinion && (
                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handleEngineerOpinionSubmit(selectedAlert.id)}
                              className={cn(
                                engineerOpinion === "normal" && "bg-green-600 hover:bg-green-700",
                                engineerOpinion === "caution" && "bg-amber-600 hover:bg-amber-700",
                                engineerOpinion === "ticket" && "bg-red-600 hover:bg-red-700"
                              )}
                            >
                              {engineerOpinion === "ticket" ? "티켓 생성하기" : "의견 저장"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 티켓 업데이트 상세 */}
                  {selectedAlert.subType === "communication" && (
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          업데이트 내용
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">박영</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">박영희</p>
                              <p className="text-xs text-muted-foreground">Process Engineering팀 | {selectedAlert.timestamp}</p>
                            </div>
                          </div>
                          <div className="ml-10 mt-2 text-sm text-foreground">
                            <p>촉매 성능 분석 결과를 공유드립니다.</p>
                            <p className="mt-2">현재 WABT 기준 약 7도 상승이 확인되었으며, 6개월 내 촉매 교체가 필요할 것으로 판단됩니다. 상세 데이터는 첨부된 리포트를 참조해주세요.</p>
                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Catalyst_Analysis_Report.pdf
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {selectedAlert.linkedTicketId && (
                          <Button 
                            variant="outline" 
                            className="w-full bg-transparent"
                            onClick={() => router.push(`/tickets/${selectedAlert.linkedTicketId}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            티켓 상세 페이지로 이동
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 커스텀 알람: 기본 알람 정보 + 트렌드 + 과거 이력 (Alert 컴포넌트 차용) */}
                  {selectedAlert.subType === "custom-alarm" && (
                    <>
                      {/* 알람 기본 정보 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            알람 기본 정보
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Tag ID</span>
                                <p className="font-medium text-sm">{selectedAlert.data?.tagId || "-"}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">알람 유형</span>
                                <Badge variant="outline" className="text-xs">커스텀 (개인 설정)</Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Trigger 조건</span>
                              <p className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                                {selectedAlert.data?.tagId} {'>'} {selectedAlert.data?.limit}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-center">
                                <span className="text-xs text-muted-foreground">현재값</span>
                                <p className="text-lg font-bold text-red-600">{selectedAlert.data?.value}</p>
                              </div>
                              <div className="p-2 bg-muted/30 rounded-lg text-center">
                                <span className="text-xs text-muted-foreground">설정값</span>
                                <p className="text-lg font-bold">{selectedAlert.data?.limit}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 관련 트렌드 (Alert 컴포넌트 차용) */}
                      {selectedAlert.data?.trend && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              관련 트렌드 - {selectedAlert.data.tagId}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-48 flex items-end gap-2 relative bg-muted/30 rounded-lg p-4">
                              {selectedAlert.data.trend.map((value, i) => {
                                const max = Math.max(...selectedAlert.data!.trend!, selectedAlert.data!.limit || 0) * 1.05
                                const min = Math.min(...selectedAlert.data!.trend!, selectedAlert.data!.limit || Infinity) * 0.95
                                const range = max - min || 1
                                const height = ((value - min) / range) * 100
                                const isOverLimit = selectedAlert.data!.limit && value > selectedAlert.data!.limit
                                const isFirstViolation = isOverLimit && (i === 0 || !selectedAlert.data!.trend![i-1] || selectedAlert.data!.trend![i-1] <= selectedAlert.data!.limit!)
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                                    <span className="text-xs text-muted-foreground mb-1">{value}</span>
                                    <div 
                                      className={cn("w-full rounded-t transition-all", isOverLimit ? "bg-red-500" : "bg-primary")}
                                      style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                    {isFirstViolation && (
                                      <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-red-600 z-10">
                                        <span className="absolute -top-5 -left-8 text-xs text-red-600 font-medium whitespace-nowrap">위반 시점</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              {selectedAlert.data.limit && (
                                <div className="absolute left-4 right-4 flex items-center gap-2" style={{ 
                                  bottom: `${Math.min(95, Math.max(5, ((selectedAlert.data.limit - Math.min(...selectedAlert.data.trend) * 0.95) / (Math.max(...selectedAlert.data.trend, selectedAlert.data.limit) * 1.05 - Math.min(...selectedAlert.data.trend) * 0.95)) * 100))}%` 
                                }}>
                                  <div className="flex-1 border-t-2 border-dashed border-red-400" />
                                  <span className="text-xs text-red-500 bg-background px-2 py-0.5 rounded">설정값: {selectedAlert.data.limit}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between mt-4 p-3 bg-muted/30 rounded-lg">
                              <div>
                                <span className="text-sm text-muted-foreground">현재값</span>
                                <p className="text-lg font-bold">{selectedAlert.data.value}</p>
                              </div>
                              <div className="text-center">
                                <span className="text-sm text-muted-foreground">편차</span>
                                <p className={cn("text-lg font-bold", selectedAlert.data.value > (selectedAlert.data.limit || 0) ? "text-red-500" : "text-green-500")}>
                                  {selectedAlert.data.limit ? `${selectedAlert.data.value > selectedAlert.data.limit ? "+" : ""}${(selectedAlert.data.value - selectedAlert.data.limit).toFixed(1)}` : "-"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">설정값</span>
                                <p className="text-lg font-bold text-muted-foreground">{selectedAlert.data.limit}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* 과거 이력 (Alert 컴포넌트 차용) */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            과거 알람 발생 이력 ({selectedAlert.data?.tagId})
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">이 커스텀 알람 조건에서 과거 발생 이력</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">커스텀 알람</Badge>
                                  <span className="text-sm font-medium">2025-01-20 11:15</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">확인됨</Badge>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">발생값:</span>
                                  <span className="font-mono">455 m3/hr</span>
                                  <span className="text-muted-foreground">지속시간:</span>
                                  <span>2시간 30분</span>
                                </div>
                                <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                  <span className="font-medium text-green-700">조치:</span>
                                  <span className="text-green-600 ml-2">모니터링 후 자연 정상화, Feed 공급 조정 확인</span>
                                </div>
                              </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">커스텀 알람</Badge>
                                  <span className="text-sm font-medium">2024-12-15 08:40</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">해결됨</Badge>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">발생값:</span>
                                  <span className="font-mono">465 m3/hr</span>
                                  <span className="text-muted-foreground">지속시간:</span>
                                  <span>4시간</span>
                                </div>
                                <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                  <span className="font-medium text-green-700">조치:</span>
                                  <span className="text-green-600 ml-2">Feed 변경(Medium → Light)에 따른 일시적 증가, 티켓 발행하여 추적</span>
                                </div>
                                <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                  관련 티켓 TKT-2024-1205 보기
                                </Button>
                              </div>
                            </div>
                            <div className="text-center pt-2">
                              <Button variant="link" className="text-xs">전체 이력 보기 (총 5건)</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* 외부 데이터 업데이트 */}
                  {selectedAlert.subType === "external-data" && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-4">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800">외부 데이터 검토 후 특이사항을 기록해야 합니다.</p>
                        </div>
                        <Textarea 
                          placeholder="검토 결과 및 특이사항을 입력하세요..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="bg-white min-h-24"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* 자동 계산 */}
                  {selectedAlert.subType === "auto-calc" && (
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">데이터 정합성 검토 의견을 남겨주세요:</p>
                        <Textarea 
                          placeholder="정합성 검토 의견..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="min-h-24"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Event: Mode Switch */}
                  {selectedAlert.subType === "mode-switch" && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">Mode Switch 가이드 발행</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          예정된 Mode Switch에 대한 운전 가이드를 작성하고 관련 팀에 배포합니다.
                        </p>
                        <Button onClick={() => window.location.href = "/new-ticket"}>
                          <FileText className="h-4 w-4 mr-2" />
                          가이드 발행하기
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Event: 라이센서 리뷰 */}
                  {selectedAlert.subType === "licensor-review" && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="font-medium">라이센서 분기 리뷰 준비</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Performance 데이터 준비 및 질의사항을 정리하세요.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Performance 리포트
                          </Button>
                          <Button variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            질의사항 준비
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>

              {/* 액션 버튼 영역 */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex justify-end gap-2">
                  {/* Alert 타입: New Alert인 경우 - 인지 버튼 (Bold 강조) */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "new" && (
                    <Button 
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      className="font-bold"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      인지 (Standing Alert로 전환)
                    </Button>
                  )}

                  {/* Alert 타입: Standing Alert인 경우 - 티켓 발행 / Shelved 처리 */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "standing" && (
                    <>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        티켓 발행
                      </Button>
                      <Button variant="outline" onClick={() => setShowShelvedDialog(true)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Shelved Alert 처리
                      </Button>
                    </>
                  )}

                  {/* Alert 타입: Shelved Alert인 경우 */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "shelved" && (
                    <span className="text-sm text-muted-foreground">이 알람은 Shelved 상태입니다. ({selectedAlert.shelvedUntil}까지)</span>
                  )}

                  {/* Notice 타입 (이상징후/장기/효율성): 엔지니어 의견으로 대체됨 - 위 섹션에서 처리 */}
                  {selectedAlert.type === "notice" && ["anomaly", "long-term", "efficiency"].includes(selectedAlert.subType) && (
                    <span className="text-sm text-muted-foreground">위의 엔지니어 의견 섹션에서 판정을 선택하세요</span>
                  )}

                  {/* Notice: 커뮤니케이션 업데이트 */}
                  {selectedAlert.subType === "communication" && selectedAlert.linkedTicketId && (
                    <Button onClick={() => router.push(`/tickets/${selectedAlert.linkedTicketId}`)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      티켓 확인하기
                    </Button>
                  )}

                  {/* Notice: 커스텀 알람 */}
                  {selectedAlert.subType === "custom-alarm" && (
                    <>
                      <Button variant="outline" onClick={() => handleAcknowledge(selectedAlert.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        확인
                      </Button>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        티켓 형성
                      </Button>
                    </>
                  )}

                  {/* Notice: Daily Monitoring - 4가지 버튼 */}
                  {selectedAlert.subType === "daily-monitoring" && (
                    <>
                      <Button 
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          setDailyMonitoringAction("normal")
                          alert("특이사항 없음으로 처리되었습니다.")
                          setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        특이사항 없음
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent"
                        onClick={() => {
                          setDailyMonitoringAction("caution")
                          alert("주의 판정으로 저장되었습니다. 지속 관찰 대상으로 등록됩니다.")
                          setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "acknowledged" } : a))
                        }}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        주의
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/5 bg-transparent"
                        onClick={() => setShowDailyReportDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Standing Issue 추가 등록
                      </Button>
                      <Button 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleCreateTicket(selectedAlert)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        티켓화
                      </Button>
                    </>
                  )}

                  {/* Notice: DCS 수정 요청 - 반영완료/수정요청 */}
                  {selectedAlert.subType === "dcs-modification" && (
                    <>
                      <Button 
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          alert("DCS 수정 사항이 반영 완료로 처리되었습니다.")
                          setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        반영완료
                      </Button>
                      <Button 
                        onClick={() => setShowCsrDialog(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        수정요청
                      </Button>
                    </>
                  )}

                  {/* Notice: 외부 데이터 / 자동 계산 */}
                  {["external-data", "auto-calc"].includes(selectedAlert.subType) && (
                    <Button onClick={() => handleReviewAction(selectedAlert.id, "normal")} disabled={!reviewComment.trim()}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      검토 완료
                    </Button>
                  )}

                  {/* Event 타입 */}
                  {selectedAlert.type === "event" && !["mode-switch", "licensor-review"].includes(selectedAlert.subType) && (
                    <Button variant="outline" onClick={() => handleAcknowledge(selectedAlert.id)}>
                      확인
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>알림을 선택하여 상세 정보를 확인하세요.</p>
              </div>
            </div>
          )}
        </div>

        {/* 티켓 생성 다이얼로그 - 새 티켓과 동일한 양식 */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                티켓 생성
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-title">티켓 제목 *</Label>
                <Input 
                  id="ticket-title"
                  value={ticketTitle} 
                  onChange={(e) => setTicketTitle(e.target.value)} 
                  placeholder="문제 또는 개선사항에 대한 간략한 설명"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ticket-desc">상세 설명 *</Label>
                <Textarea 
                  id="ticket-desc"
                  value={ticketDescription} 
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="min-h-32"
                  placeholder="티켓에 대한 상세 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>티켓 유형</Label>
                  <Select value={ticketType} onValueChange={(v: typeof ticketType) => setTicketType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Improvement">개선</SelectItem>
                      <SelectItem value="Trouble">문제</SelectItem>
                      <SelectItem value="Change">변경</SelectItem>
                      <SelectItem value="Analysis">분석</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>우선순위</Label>
                  <Select value={ticketPriority} onValueChange={(v: typeof ticketPriority) => setTicketPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 - 긴급</SelectItem>
                      <SelectItem value="P2">P2 - 높음</SelectItem>
                      <SelectItem value="P3">P3 - 보통</SelectItem>
                      <SelectItem value="P4">P4 - 낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>영향 범위</Label>
                  <Select value={ticketImpact} onValueChange={(v: typeof ticketImpact) => setTicketImpact(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safety">안전</SelectItem>
                      <SelectItem value="Quality">품질</SelectItem>
                      <SelectItem value="Throughput">처리량</SelectItem>
                      <SelectItem value="Cost">비용</SelectItem>
                      <SelectItem value="Energy">에너지</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>희망 마감일</Label>
                  <Input
                    type="date"
                    value={ticketDueDate}
                    onChange={(e) => setTicketDueDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedAlert?.unit && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">공정 정보 (자동 입력)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <p className="text-sm font-medium">{selectedAlert.unit}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">담당자</Label>
                      <p className="text-sm font-medium">{UNIT_OWNERS[selectedAlert.unit] || "미배정"}</p>
                    </div>
                  </div>
                  {selectedAlert.data?.tagId && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">관련 Tag</Label>
                      <Badge variant="secondary">{selectedAlert.data.tagId}</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTicketDialog(false)}>취소</Button>
              <Button onClick={handleSubmitTicket} disabled={!ticketTitle.trim()}>
                <FileText className="h-4 w-4 mr-2" />
                티켓 생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 이상징후 카테고리 상세 팝업 */}
        <Dialog open={showAnomalyCategoryDialog} onOpenChange={setShowAnomalyCategoryDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedAnomalyCategory && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {selectedAnomalyCategory.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAnomalyCategory.description}</p>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedAnomalyCategory.top3.map((item, idx) => (
                    <Card key={idx} className={cn(
                      "border-l-4",
                      item.severity === "high" ? "border-l-red-500" : item.severity === "medium" ? "border-l-amber-500" : "border-l-green-500"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              "text-xs",
                              item.severity === "high" ? "bg-red-500 text-white" : item.severity === "medium" ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                            )}>
                              {item.severity === "high" ? "High" : item.severity === "medium" ? "Medium" : "Low"}
                            </Badge>
                            <span className="font-mono font-bold text-sm">{item.tagId}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        </div>
                        <p className="text-sm font-medium mb-1">{item.description}</p>
                        <div className="p-2 bg-muted/30 rounded mb-3">
                          <span className="text-xs text-muted-foreground">Deviation</span>
                          <p className="text-sm font-medium">{item.deviation}</p>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-xs font-medium text-blue-700">상세 분석</span>
                          <p className="text-sm text-blue-800 mt-1">{item.detail}</p>
                        </div>
                        {/* 미니 트렌드 시뮬레이션 */}
                        <div className="mt-3 h-16 flex items-end gap-1 bg-muted/20 rounded p-2">
                          {Array.from({ length: 12 }, (_, i) => {
                            const baseH = item.severity === "high" ? 60 : item.severity === "medium" ? 40 : 25
                            const h = baseH + Math.sin(i * 0.8) * 15 + Math.random() * 10
                            return (
                              <div
                                key={i}
                                className={cn("flex-1 rounded-t", i >= 9 ? (item.severity === "high" ? "bg-red-400" : item.severity === "medium" ? "bg-amber-400" : "bg-green-400") : "bg-muted-foreground/20")}
                                style={{ height: `${Math.max(h, 10)}%` }}
                              />
                            )
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">-12h</span>
                          <span className="text-xs text-muted-foreground">현재</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAnomalyCategoryDialog(false)} className="bg-transparent">닫기</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ESR 상세 팝업 (DCS 수정 요청용) */}
        <Dialog open={showEsrDialog} onOpenChange={setShowEsrDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ESR 상세 정보
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">ESR 번호</span>
                  <p className="font-medium text-sm">ESR-2025-0042</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">상태</span>
                  <Badge className="bg-blue-500 text-white">진행 중</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">ESR 제목</span>
                <p className="font-medium text-sm">HCR APC 고도화 프로젝트 - Phase 2</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">목적 및 배경</span>
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  HCR Unit의 Advanced Process Control(APC) 시스템 고도화를 통한 운전 안정성 향상 및 수율 최적화. Phase 2에서는 Reactor Temperature Control Loop의 PID 파라미터 최적화 및 Cascade Control 구현을 목표로 함.
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">변경 범위</span>
                <div className="space-y-2">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 bg-muted/50 p-2 text-xs font-medium">
                      <span>변경 항목</span>
                      <span>변경 전</span>
                      <span>변경 후</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-sm border-t">
                      <span>TIC-2001 P Gain</span>
                      <span className="text-muted-foreground">2.5</span>
                      <span className="font-medium">3.0</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-sm border-t">
                      <span>TIC-2001 I Time</span>
                      <span className="text-muted-foreground">120s</span>
                      <span className="font-medium">90s</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-sm border-t">
                      <span>TIC-2001 D Time</span>
                      <span className="text-muted-foreground">0s</span>
                      <span className="font-medium">5s</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">담당자</span>
                  <p className="text-sm">DX팀 이민수</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">적용일</span>
                  <p className="text-sm">2025-02-02 06:00</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">승인 이력</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">승인</Badge>
                      <span className="text-xs">공정팀 검토 완료 - 김철수 수석</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2025-01-28</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">승인</Badge>
                      <span className="text-xs">안전팀 검토 완료 - 박안전 팀장</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2025-01-30</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">적용</Badge>
                      <span className="text-xs">DCS 반영 완료 - IT운영팀</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2025-02-02</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEsrDialog(false)} className="bg-transparent">닫기</Button>
              <Button onClick={() => { setShowEsrDialog(false); router.push("/tickets/1") }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                ESR 상세 페이지 이동
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CSR 요청 팝업 (DCS 수정요청 - IT운영팀으로) */}
        <Dialog open={showCsrDialog} onOpenChange={setShowCsrDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                DCS 수정 요청 (CSR)
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">IT운영팀으로 DCS Configuration 수정을 요청합니다.</p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  이 요청은 IT운영팀에 CSR (Configuration Service Request)로 전달됩니다. 수정이 필요한 내용을 상세히 기재해 주세요.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">연결 ESR</span>
                <p className="text-sm font-medium">ESR-2025-0042: HCR APC 고도화 프로젝트</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csr-desc">수정 요청 내용 *</Label>
                <Textarea
                  id="csr-desc"
                  value={csrDescription}
                  onChange={(e) => setCsrDescription(e.target.value)}
                  placeholder="수정이 필요한 DCS 화면, 파라미터, 변경 내용 등을 상세히 기재하세요..."
                  className="min-h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>긴급도</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">긴급</SelectItem>
                      <SelectItem value="normal">일반</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>희망 적용일</Label>
                  <Input type="date" min={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              {selectedAlert && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <span className="text-xs text-muted-foreground">요청 대상</span>
                  <p className="text-sm font-medium">{selectedAlert.title}</p>
                  <span className="text-xs text-muted-foreground">수신: IT운영팀</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCsrDialog(false); setCsrDescription("") }} className="bg-transparent">취소</Button>
              <Button 
                onClick={() => {
                  alert("CSR이 IT운영팀으로 전달되었습니다.\n\nCSR 번호: CSR-2025-0215\n수신: IT운영팀\n상태: 접수 대기")
                  setShowCsrDialog(false)
                  setCsrDescription("")
                }}
                disabled={!csrDescription.trim()}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                CSR 전송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Standing Issue 추가 등록 다이얼로그 */}
        <Dialog open={showDailyReportDialog} onOpenChange={setShowDailyReportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Standing Issue 추가 등록
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                공정 특이사항을 Standing Issue로 등록합니다. 등록 시 기술팀장에게 자동 공유됩니다.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="daily-report-title">제목 *</Label>
                <Input
                  id="daily-report-title"
                  value={dailyReportTitle}
                  onChange={(e) => setDailyReportTitle(e.target.value)}
                  placeholder="Standing Issue 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-report-text">특이사항 내용 *</Label>
                <Textarea
                  id="daily-report-text"
                  value={dailyReportText}
                  onChange={(e) => setDailyReportText(e.target.value)}
                  placeholder="일일보고에 반영할 특이사항 내용을 상세히 기재하세요..."
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select value={dailyReportCategory} onValueChange={(v: typeof dailyReportCategory) => setDailyReportCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily-report">일일보고</SelectItem>
                      <SelectItem value="long-term">중장기</SelectItem>
                      <SelectItem value="special">특이사항</SelectItem>
                      <SelectItem value="monitoring">관찰</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>관련 Unit</Label>
                  <Select value={dailyReportUnit} onValueChange={setDailyReportUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDU">CDU</SelectItem>
                      <SelectItem value="VDU">VDU</SelectItem>
                      <SelectItem value="HCR">HCR</SelectItem>
                      <SelectItem value="CCR">CCR</SelectItem>
                      <SelectItem value="공통">공통</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 관련 티켓 링크 */}
              <div className="space-y-2">
                <Label>관련 티켓 연결 (선택)</Label>
                <Select value={dailyReportLinkedTicketId} onValueChange={setDailyReportLinkedTicketId}>
                  <SelectTrigger>
                    <SelectValue placeholder="연결할 티켓 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">연결하지 않음</SelectItem>
                    {getTickets().slice(0, 10).map(ticket => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground">#{ticket.id}</span>
                          <span className="truncate">{ticket.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dailyReportLinkedTicketId && dailyReportLinkedTicketId !== "none" && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                    <Link className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-primary">
                      #{dailyReportLinkedTicketId} - {getTickets().find(t => t.id === dailyReportLinkedTicketId)?.title}
                    </span>
                    <button 
                      onClick={() => setDailyReportLinkedTicketId("")}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  등록된 Standing Issue는 Daily Monitoring에서 지속 추적 관리되며, 기술팀장 계정의 My Action에 자동 공유됩니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => { 
                  setShowDailyReportDialog(false)
                  setDailyReportTitle("")
                  setDailyReportText("")
                  setDailyReportLinkedTicketId("")
                  setDailyReportCategory("daily-report")
                  setDailyReportUnit("")
                }}
                className="bg-transparent"
              >
                취소
              </Button>
              <Button 
                onClick={handleDailyReportSubmit}
                disabled={!dailyReportTitle.trim() || !dailyReportText.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Standing Issue 등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shelved Alert 처리 다이얼로그 */}
        <Dialog open={showShelvedDialog} onOpenChange={setShowShelvedDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Shelved Alert 처리
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Shelved 처리된 알람은 지정된 재개 시점까지 알람 목록에서 숨겨지며, 
                  해당 시점이 되면 자동으로 다시 활성화됩니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shelved-reason">Shelved 처리 사유 *</Label>
                <Textarea
                  id="shelved-reason"
                  value={shelvedReason}
                  onChange={(e) => setShelvedReason(e.target.value)}
                  placeholder="예: 계획 정비 기간 중 의도된 운전 조건, 임시 감량 운전 등"
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shelved-until">재검토 시점 *</Label>
                <Input
                  id="shelved-until"
                  type="date"
                  value={shelvedUntil}
                  onChange={(e) => setShelvedUntil(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  이 날짜가 되면 알람이 자동으로 재활성화됩니다.
                </p>
              </div>

              {selectedAlert && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <span className="text-xs text-muted-foreground">대상 알람</span>
                  <p className="text-sm font-medium">{selectedAlert.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedAlert.data?.tagId}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShelvedDialog(false)}>취소</Button>
              <Button 
                onClick={() => selectedAlert && handleShelveAlert(selectedAlert.id)}
                disabled={!shelvedReason.trim() || !shelvedUntil}
              >
                <Clock className="h-4 w-4 mr-2" />
                Shelved 처리
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
