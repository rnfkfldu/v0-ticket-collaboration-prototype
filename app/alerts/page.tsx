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
import { UNIT_OWNERS, AVAILABLE_TAGS } from "@/lib/process-data"
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
  X,
  ShieldCheck,
  BookOpen,
  History,
  RotateCcw,
  LayoutGrid,
  Maximize2,
  FileImage,
  ChevronUp,
  Wrench
} from "lucide-react"
import { cn } from "@/lib/utils"
import { HEALTH_CATEGORIES, PROCESSES, getEquipmentData, type HealthCategory } from "@/lib/health-data"

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
  // 장기건전성 모니터링 상세
  healthMonitoring?: {
    equipId: string
    equipName: string
    process: string
    category: string           // Fouling, Coking, etc.
    healthIndexName: string
    healthIndexUnit: string
    currentValue: number
    limitValue: number
    actionLimit: number
    trend: number[]            // 24주 트렌드
    projectionWeeks: number    // Limit 도달 예상 주수
    projectionTrend: number[]  // 외삽 데이터
    prevTaTrend?: number[]     // 이전 TA 주기 비교
    driftPct: number           // Drift 변화율
    actionMarginWeeks: number
    needsImmediateAction: boolean
    aiModelId?: string
    relatedTrends: { tagId: string; name: string; value: number; unit: string; status: "normal" | "warning" | "critical" }[]
    suggestedActions: string[]
  }
  // 문서 리뷰 요청 상세 (월간 리포트, Contingency Plan 등)
  documentReview?: {
    docType: "monthly-report" | "contingency-plan" | "living-document"
    docTitle: string
    docVersion: string
    latestVersion: string
    period?: string
    frequency: string  // "월 1회", "연 2회" 등
    deadline: string
    sections: { title: string; content: string; hasChange?: boolean }[]
    reviewHistory: { date: string; reviewer: string; version: string; comment: string }[]
    isReviewed?: boolean
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
      { timestamp: "2025-01-28 14:45", value: 402, action: "이벤트 발행 (TKT-2025-0128)" },
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
      { timestamp: "2025-01-20 16:30", value: 2.3, action: "이벤트 발행" }
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
    alarmBackground: "CDU Feed 정상 운전 범위. 저유량 시 제품 ��질 영향 가능.",
    shelvedReason: "2월 계획 감량 운전 중 (2025-02-01 ~ 2025-02-07)",
    shelvedUntil: "2025-02-07",
    data: {
      tagId: "FI-1001",
      value: 780,
      limit: 800,
      trend: [850, 830, 810, 795, 785, 782, 780]
    }
  },
  // 장기건전성 모니터링 Alert
  {
    id: "ALT-004",
    type: "alert",
    subType: "health-monitoring",
    title: "TI-2931 열교환기 Fouling 관련 즉시 조치 필요",
    description: "F-E102A Feed/Effluent HEX #2A의 U값이 급격히 하락하여 Limit 접근 중. 즉시 Cleaning 등 조치가 필요합니다.",
    timestamp: "2025-02-02 10:15",
    status: "unread",
    severity: "critical",
    unit: "HCR",
    alertGrade: "high",
    alertState: "new",
    triggerCondition: "U값 Drift > +50% & Projection < 4주",
    triggerSetpoint: { high: 750, low: 350 },
    alarmHistory: [
      { timestamp: "2025-02-02 10:15", value: 480, action: "Auto Alert - Drift 급등 감지" },
      { timestamp: "2025-01-20 08:00", value: 510, action: "Yellow Alert 발생" },
      { timestamp: "2025-01-05 09:30", value: 545, action: "모니터링 시작" },
    ],
    alarmBackground: "HCR Feed/Effluent 열교환기 Fouling 장기 모니터링 항목. W600N 모드 전환 후 Fouling Rate 가속화 확인. Action Window 내 Online Cleaning 또는 운전 조건 변경이 필요한 상황.",
    data: {
      tagId: "TI-2931",
      value: 480,
      limit: 350,
      trend: [580, 575, 568, 560, 555, 548, 540, 535, 530, 525, 520, 515, 512, 508, 505, 502, 500, 498, 495, 492, 490, 487, 483, 480]
    },
    healthMonitoring: {
      equipId: "F-E102A",
      equipName: "Feed/Effluent HEX #2A",
      process: "HCR",
      category: "Fouling",
      healthIndexName: "U값 (총괄열전달계수)",
      healthIndexUnit: "W/m2K",
      currentValue: 480,
      limitValue: 350,
      actionLimit: 410,
      trend: [580, 575, 568, 560, 555, 548, 540, 535, 530, 525, 520, 515, 512, 508, 505, 502, 500, 498, 495, 492, 490, 487, 483, 480],
      projectionWeeks: 3,
      projectionTrend: [480, 465, 450, 435, 420, 405, 390, 375, 360, 345],
      prevTaTrend: [610, 605, 598, 592, 585, 580, 575, 570, 565, 560, 555, 550, 548, 545, 542, 540, 538, 535, 530, 528, 525, 520, 518, 515],
      driftPct: 145,
      actionMarginWeeks: 4,
      needsImmediateAction: true,
      aiModelId: "AI-MDL-F01",
      relatedTrends: [
        { tagId: "FI-2001", name: "Feed Flow", value: 285, unit: "m3/h", status: "normal" },
        { tagId: "TI-2010", name: "Shell Inlet Temp", value: 195, unit: "deg.C", status: "warning" },
        { tagId: "TI-2011", name: "Shell Outlet Temp", value: 158, unit: "deg.C", status: "normal" },
        { tagId: "PDI-2001", name: "Shell dP", value: 1.35, unit: "kg/cm2", status: "critical" },
        { tagId: "TI-2020", name: "Tube Inlet Temp", value: 290, unit: "deg.C", status: "normal" },
        { tagId: "TI-2021", name: "Tube Outlet Temp", value: 248, unit: "deg.C", status: "warning" },
      ],
      suggestedActions: [
        "Online Cleaning 실시 (Chemical Injection)",
        "운전 조건 변경 - Feed Rate 감량 검토",
        "Bypass 운전으로 전환 후 Cleaning 진행",
        "TA Scope 반영 검토 (Mechanical Cleaning)",
      ],
    },
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
          { tagId: "PI-3001", description: "CCR Regenerator Pressure", severity: "low", deviation: "-0.2 bar vs 동일 조건", detail: "정상 편차 범위 내이나 모니���링 지속 필요." },
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
        { name: "처리량 준��율", status: "normal", value: "98.5% (목표 95%)" },
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
    title: "이벤트 업데이트: HCR 촉매 교체 검토",
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
      aiSummary: "금일 전체 공정은 안정적인 Full Rate 운전을 유지하고 있습니다. 다만, 02/01부터 진행된 Arabian Light → Arabian Medium 원유 전환으로 인해 HCR Unit의 WABT가 1.5°C 상승하였으며, 이는 피드 황함량 증가(+0.3%p)에 대한 정상적인 대응입니다. VDU Heater Outlet 온도는 안정적이며, CDU Overhead 시스템 부식 지표도 정상 범위입니다.\n\n현장 특이사항으로 P-201B Seal Oil Leak이 발견되었으나 경미한 수준으로, 정비팀에서 모니터�� ���입니다. 환경 배출 지표(SO2, NOx, 폐수 COD)는 모두 허용 범위 내에 있습니다.\n\n종합 판정: 정상 운전 유지, P-201B 상태 지속 관찰 권장",
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
        { name: "변경 ���용", status: "warning", value: "TIC-2001 PID: P=2.5→3.0, I=120→90s, D=0→5s" },
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
  // 월간 리포트 리뷰 요청
  {
    id: "NTC-010",
    type: "notice",
    subType: "monthly-report-review",
    title: "월간 Operation Report 리뷰 요청 (2025년 1월)",
    description: "2025년 1월 월간 운전 실적 보고서가 발행되었습니다. 담당 책임자 리뷰 후 Knowledge Asset에 최종 반영됩니다.",
    timestamp: "2025-02-03 09:00",
    status: "unread",
    severity: "info",
    unit: "전체",
    documentReview: {
      docType: "monthly-report",
      docTitle: "2025년 1월 월간 Operation Report",
      docVersion: "v1.0 (Draft)",
      latestVersion: "v1.0",
      period: "2025-01-01 ~ 2025-01-31",
      frequency: "월 1회",
      deadline: "2025-02-07",
      sections: [
        { title: "1. 생산 실적 요약", content: "CDU 월평균 처리량 52,100 bbl/d (계획 대비 100.2%). VDU 월평균 28,300 bbl/d (99.6%). HCR Feed 120.3 m3/h, Conversion 88.2%.", hasChange: false },
        { title: "2. 에너지 효율 (EII)", content: "EII: 98.2 (목표 97 이하 - 미달). CDU Heater Efficiency 91.3%. 한파로 인한 증기 소모량 증가가 주요 원인.", hasChange: true },
        { title: "3. 안전/환경", content: "무사고 연속 432일. SO2 배출 월평균 12.3 ppm (허용 35 ppm). 폐수 COD 85 mg/L (허용 120 mg/L).", hasChange: false },
        { title: "4. 주요 이슈 및 대응", content: "HCR WABT 상승 추세 지속 (月末 395C). E-101 Fouling 진행 UA값 88%. P-201B Seal Oil Leak 발견 (경미).", hasChange: true },
        { title: "5. 다음 달 계획", content: "Arabian Medium 전��� 운전 예정. HCR 촉매 활성 모니터링 강화. E-101 ���정 시기 검토.", hasChange: false }
      ],
      reviewHistory: [
        { date: "2025-01-06", reviewer: "김철수", version: "2024년 12월 Report v1.0", comment: "CDU 처리량 소폭 증가 확인, 에너지 효율 개선 필요" },
        { date: "2024-12-05", reviewer: "김철수", version: "2024년 11월 Report v1.0", comment: "동절기 운전 대비 점검 완료" }
      ]
    }
  },
  // Contingency Plan 리뷰 요청 (Living Document)
  {
    id: "NTC-011",
    type: "notice",
    subType: "contingency-plan-review",
    title: "Contingency Plan 리뷰 요청: HCR 비상운전 절차서",
    description: "HCR 비상운전 절차서의 반기 정기 리뷰가 필요합니다. 최신 운전 조건 반영 여부를 확인하고 승인해주세요.",
    timestamp: "2025-02-01 10:00",
    status: "unread",
    severity: "warning",
    unit: "HCR",
    documentReview: {
      docType: "contingency-plan",
      docTitle: "HCR 비상운전 절차서 (Emergency Operation Procedure)",
      docVersion: "v3.2",
      latestVersion: "v3.2",
      frequency: "연 2회 (반기)",
      deadline: "2025-02-15",
      sections: [
        { title: "1. 적용 범위", content: "HCR Unit (Reactor Section, Fractionation Section, H2 System) 비상 상황 발생 시 대응 절차.", hasChange: false },
        { title: "2. 비상 시나리오별 대응", content: "Scenario A: Reactor Runaway - WABT 급상승 시 Quench Gas 주입 및 Feed Cut 절차. Scenario B: H2 Compressor Trip - 단계별 Reactor Depressuring 절차.", hasChange: true },
        { title: "3. 운전 조건 변경 반영", content: "2024년 하반기 촉매 교체 후 Max WABT 한계 변경: 405C -> 410C. Quench Gas 주입 기준 WABT 변경: 395C -> 400C.", hasChange: true },
        { title: "4. 비상 연락 체계", content: "1차: 당직 Operation Supervisor → 2차: Process Engineer → 3차: Plant Manager. 외부: 소방서, 환경부 신고 기준 유지.", hasChange: false },
        { title: "5. 훈련 이력", content: "최근 훈련: 2024-11-15 (Reactor Runaway Drill). 참여 인원: 생산팀 A/B조, 공정기술팀. 결과: 양호 (대응시간 12분, 목표 15분 이내).", hasChange: false }
      ],
      reviewHistory: [
        { date: "2024-08-10", reviewer: "박영희", version: "v3.1", comment: "촉매 교체 전 기준으로 리뷰 완료. 교체 후 WABT 한계 재검토 필요" },
        { date: "2024-02-05", reviewer: "김철수", version: "v3.0", comment: "H2 Compressor Trip 시나리오 추가. 연락 체계 업데이트" },
        { date: "2023-08-12", reviewer: "김철수", version: "v2.5", comment: "정기 리뷰 - 특이사항 없음" }
      ]
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
  const [shelvedCategory, setShelvedCategory] = useState<string>("")
  const [shelvedReason, setShelvedReason] = useState("")
  const [shelvedUntil, setShelvedUntil] = useState("")
  const shelvedCategories = [
    { id: "known-issue", label: "공지된 이슈", desc: "이미 알려진 문제로 별도 조치 불필요" },
    { id: "no-action", label: "액션 없음", desc: "현재 조치가 필요하지 않은 상태" },
    { id: "project", label: "프로젝트", desc: "프로젝트/정비 등 계획된 작업 관련" },
    { id: "temporary", label: "일시 문제", desc: "일시적 상황으로 자연 해소 예상" },
  ]
  
  // 장기건전성 조치 입력 다이얼로그 상태
  const [showHealthActionDialog, setShowHealthActionDialog] = useState(false)
  const [healthActionType, setHealthActionType] = useState("online-cleaning")
  const [healthActionDesc, setHealthActionDesc] = useState("")
  const [healthActionUrgency, setHealthActionUrgency] = useState("urgent")

  // 이상징후 카테고리 상세 팝업 상태
  const [showAnomalyCategoryDialog, setShowAnomalyCategoryDialog] = useState(false)
  const [selectedAnomalyCategory, setSelectedAnomalyCategory] = useState<{id: string; name: string; description: string; top3: {tagId: string; description: string; severity: "high"|"medium"|"low"; deviation: string; detail: string}[]} | null>(null)
  
  // 관련 트렌드 전체보기 다이얼로그
  const [showFullTrendDialog, setShowFullTrendDialog] = useState(false)

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
  
  // DCS 화면 및 장치 정보 상태
  const [activeDcsScreen, setActiveDcsScreen] = useState(0)
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false)
  const [showPidDialog, setShowPidDialog] = useState(false)
  const [showDatasheetDialog, setShowDatasheetDialog] = useState(false)
  const [showAllVariables, setShowAllVariables] = useState(false)

  // Tag -> Equipment hierarchy
  const TAG_EQ: Record<string, { process: string; zone: string; equipment: string; eqId: string; eqType: string; installed: string; lastTA: string }> = {
    "TI-2001": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "TI-2002": { process: "HCR", zone: "2nd Stage Section", equipment: "C-202 Reactor", eqId: "R-2002", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "TI-2003": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "PI-2001": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "FI-2001": { process: "HCR", zone: "Feed Section", equipment: "P-201 Feed Pump", eqId: "P-2001", eqType: "Centrifugal Pump", installed: "2015", lastTA: "2024-06" },
    "AI-2001": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "FI-2010": { process: "HCR", zone: "Quench Section", equipment: "Quench System", eqId: "Q-2001", eqType: "Quench Gas System", installed: "2015", lastTA: "2024-06" },
    "TI-1001": { process: "CDU", zone: "Atmospheric Section", equipment: "C-101 Column", eqId: "C-1001", eqType: "Distillation Column", installed: "2010", lastTA: "2024-06" },
    "TI-1002": { process: "CDU", zone: "Vacuum Section", equipment: "C-102 Column", eqId: "C-1002", eqType: "Vacuum Column", installed: "2010", lastTA: "2024-06" },
    "PI-1001": { process: "CDU", zone: "Atmospheric Section", equipment: "C-101 Column", eqId: "C-1001", eqType: "Distillation Column", installed: "2010", lastTA: "2024-06" },
    "PI-3001": { process: "VDU", zone: "Vacuum Section", equipment: "C-301 Column", eqId: "C-3001", eqType: "Vacuum Distillation Column", installed: "2012", lastTA: "2024-06" },
    "TI-3001": { process: "VDU", zone: "Feed Section", equipment: "H-301 Furnace", eqId: "H-3001", eqType: "Fired Heater", installed: "2012", lastTA: "2024-06" },
    "TI-4001": { process: "FCC", zone: "Regenerator Section", equipment: "Regenerator", eqId: "R-4001", eqType: "FCC Regenerator", installed: "2013", lastTA: "2024-06" },
    "TI-4002": { process: "FCC", zone: "Reactor Section", equipment: "FCC Reactor", eqId: "R-4002", eqType: "Riser Reactor", installed: "2013", lastTA: "2024-06" },
    "LI-1001": { process: "CDU", zone: "Atmospheric Section", equipment: "D-101 Drum", eqId: "D-1001", eqType: "Reflux Drum", installed: "2010", lastTA: "2024-06" },
  }
  const getTagEq = (tagId?: string) => {
    if (!tagId) return null
    return TAG_EQ[tagId] || { process: selectedAlert?.unit || "HCR", zone: "General Section", equipment: "Unknown", eqId: "-", eqType: "-", installed: "-", lastTA: "-" }
  }

  // 문서 리뷰 상태
  const [docReviewComment, setDocReviewComment] = useState("")
  const [docReviewConfirmed, setDocReviewConfirmed] = useState(false)
  const [expandedReviewSections, setExpandedReviewSections] = useState<string[]>([])

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
      case "communication": return "이벤트 업데이트"
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
    if (!shelvedCategory || !shelvedUntil) {
      alert("Shelved 처리 사유와 재검토 시점을 선택해주세요.")
      return
    }
    const categoryLabel = shelvedCategories.find(c => c.id === shelvedCategory)?.label || shelvedCategory
    const fullReason = shelvedReason.trim() ? `[${categoryLabel}] ${shelvedReason.trim()}` : `[${categoryLabel}]`
    setAlerts(alerts.map(a => a.id === alertId ? { 
      ...a, 
      status: "resolved", 
      alertState: "shelved" as AlertState,
      shelvedReason: fullReason,
      shelvedUntil: shelvedUntil
    } : a))
    setShowShelvedDialog(false)
    setShelvedCategory("")
    setShelvedReason("")
    setShelvedUntil("")
    alert(`알람이 Shelved 처리되었습니다.\n사유: ${categoryLabel}\n재개 시점: ${shelvedUntil}`)
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
    
    // 생성된 이벤트으로 이동
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
        desc += `\n- 판정: 이벤트화 (즉시 조치 필요)`
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

  // 알림 선택 시 리뷰 상태 초기화
  const handleSelectAlert = (alert: AlertItem) => {
    setSelectedAlert(alert)
    setDocReviewComment("")
    setDocReviewConfirmed(false)
    setExpandedReviewSections([])
    setActiveDcsScreen(0)
    setShowEquipmentDialog(false)
    setShowPidDialog(false)
    setShowDatasheetDialog(false)
    setShowAllVariables(false)
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
  const noticeSortOrder: Record<string, number> = { "daily-monitoring": 0, "monthly-report-review": 1, "contingency-plan-review": 2, "anomaly": 3, "dcs-modification": 4 }
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

  // --- 모니터링 그룹: 태그별 연관 태그 그룹 ---
  const MONITORING_GROUPS: Record<string, { name: string; tags: { id: string; desc: string; unit: string; type: string }[] }> = {
    "HCR-Reactor": {
      name: "HCR Reactor Section",
      tags: [
        { id: "TI-3001", desc: "Reactor Inlet Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3002", desc: "Reactor Outlet Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3003", desc: "Reactor Bed #1 Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3004", desc: "Reactor Bed #2 Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-3001", desc: "Reactor Inlet Pressure", unit: "kg/cm2", type: "Pressure" },
        { id: "PDI-3001", desc: "Reactor dP", unit: "kg/cm2", type: "Pressure" },
        { id: "FI-3001", desc: "Feed Flow", unit: "m3/h", type: "Flow" },
        { id: "FI-3002", desc: "H2 Makeup Flow", unit: "Nm3/h", type: "Flow" },
        { id: "FI-3003", desc: "Quench Flow", unit: "Nm3/h", type: "Flow" },
        { id: "AI-3001", desc: "H2 Purity", unit: "%", type: "Analysis" },
      ],
    },
    "HCR-Fractionation": {
      name: "HCR Fractionation Section",
      tags: [
        { id: "TI-3010", desc: "Fractionator Top Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3011", desc: "Fractionator Bottom Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-3010", desc: "Fractionator Pressure", unit: "kg/cm2", type: "Pressure" },
        { id: "LI-3010", desc: "Fractionator Level", unit: "%", type: "Level" },
        { id: "FI-3010", desc: "Naphtha Product Flow", unit: "m3/h", type: "Flow" },
        { id: "FI-3011", desc: "Diesel Product Flow", unit: "m3/h", type: "Flow" },
      ],
    },
    "VDU-Column": {
      name: "VDU Vacuum Column Section",
      tags: [
        { id: "TI-2001", desc: "Column Top Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-2002", desc: "Column Bottom Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-2003", desc: "LVGO Draw Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-2004", desc: "HVGO Draw Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-2001", desc: "Column Top Pressure", unit: "mmHg", type: "Pressure" },
        { id: "LI-2001", desc: "Column Bottom Level", unit: "%", type: "Level" },
        { id: "FI-2001", desc: "Feed Flow", unit: "m3/h", type: "Flow" },
        { id: "FI-2002", desc: "LVGO Product Flow", unit: "m3/h", type: "Flow" },
      ],
    },
    "CDU-Column": {
      name: "CDU Atmospheric Column Section",
      tags: [
        { id: "TI-1001", desc: "Column Top Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-1002", desc: "Column Bottom Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-1001", desc: "Column Pressure", unit: "kg/cm2", type: "Pressure" },
        { id: "FI-1001", desc: "Crude Feed Flow", unit: "m3/h", type: "Flow" },
        { id: "LI-1001", desc: "Column Bottom Level", unit: "%", type: "Level" },
        { id: "TIC-1001", desc: "Top Temp Controller", unit: "deg.C", type: "Temperature" },
      ],
    },
  }

  // 태그 ID로 해당 모니터링 그룹 찾기
  function getMonitoringGroup(tagId: string) {
    for (const [key, group] of Object.entries(MONITORING_GROUPS)) {
      if (group.tags.some(t => t.id === tagId)) return { key, ...group }
    }
    // 태그 prefix로 유닛 추론 후 가장 적합한 그룹 반환
    const prefix = tagId?.split("-")[0]
    const unitNum = tagId?.match(/-(\d)/)?.[1]
    if (unitNum === "3") return { key: "HCR-Reactor", ...MONITORING_GROUPS["HCR-Reactor"] }
    if (unitNum === "2") return { key: "VDU-Column", ...MONITORING_GROUPS["VDU-Column"] }
    if (unitNum === "1") return { key: "CDU-Column", ...MONITORING_GROUPS["CDU-Column"] }
    return { key: "HCR-Reactor", ...MONITORING_GROUPS["HCR-Reactor"] }
  }

  // 모의 트렌드 데���터 생성 (태그별)
  function generateMockTrend(tagId: string, tagType: string): { values: number[]; limit: number | null; lowLimit: number | null; unit: string } {
    const seed = tagId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
    if (tagType === "Temperature") {
      const base = 300 + (seed % 150)
      const limit = base + 20 + (seed % 15)
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 30 - 10)).toFixed(1))
      return { values, limit, lowLimit: null, unit: "deg.C" }
    }
    if (tagType === "Pressure") {
      const base = 5 + (seed % 30)
      const limit = base + 5
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 6 - 2)).toFixed(2))
      return { values, limit, lowLimit: base - 3, unit: "kg/cm2" }
    }
    if (tagType === "Flow") {
      const base = 100 + (seed % 500)
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 80 - 30)).toFixed(1))
      return { values, limit: base + 60, lowLimit: base - 40, unit: "m3/h" }
    }
    if (tagType === "Level") {
      const base = 50
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 30 - 15)).toFixed(1))
      return { values, limit: 80, lowLimit: 20, unit: "%" }
    }
    // Analysis
    const base = 80 + (seed % 15)
    const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 10 - 5)).toFixed(1))
    return { values, limit: null, lowLimit: 70, unit: "%" }
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
                          onClick={() => handleSelectAlert(item)}
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
                        onClick={() => handleSelectAlert(item)}
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
                        onClick={() => handleSelectAlert(item)}
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
                <div className="space-y-6">
                  <p className="text-muted-foreground">{selectedAlert.description}</p>

                  {/* Alert 타입: 알람 정보 + Operation 컨텍스트 */}
                  {selectedAlert.type === "alert" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                            {/* Process hierarchy breadcrumb */}
                            {(() => {
                              const eq = getTagEq(selectedAlert.data?.tagId)
                              return eq ? (
                                <div className="flex items-center gap-1 text-xs flex-wrap bg-muted/30 rounded-md px-2.5 py-1.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary font-semibold">{eq.process}</Badge>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-muted-foreground">{eq.zone}</span>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <button className="font-medium text-primary hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => setShowEquipmentDialog(true)}>
                                    {eq.equipment}<ExternalLink className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ) : null
                            })()}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Tag ID</span>
                                <p className="font-medium text-sm font-mono">{selectedAlert.data?.tagId || "-"}</p>
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
                            {/* Action buttons */}
                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                              <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowEquipmentDialog(true)}>
                                <Wrench className="h-3.5 w-3.5 mr-1.5" />
                                장치 정보 및 정비이력 보기
                              </Button>
                              <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowPidDialog(true)}>
                                <FileImage className="h-3.5 w-3.5 mr-1.5" />
                                관련 P&ID 도면 보기
                              </Button>
                              <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowDatasheetDialog(true)}>
                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                관련 데이터시트 보기
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Operation 컨텍스트 - 알람 발생 당시 공정 상태 */}
                      <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Operation Context (알람 발생 시점)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">운전 모드</span>
                              <p className="font-medium text-sm mt-0.5">Normal Operation</p>
                              <Badge variant="secondary" className="text-xs mt-1">Arabian Medium 전환 중</Badge>
                            </div>
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">처리량 (Feed Rate)</span>
                              <p className="font-medium text-sm mt-0.5">120.5 m3/h</p>
                              <span className="text-xs text-green-600">Guide: 100~130 m3/h</span>
                            </div>
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Operation Guide</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <p className="font-medium text-sm text-red-600">1건 위반</p>
                              </div>
                              <span className="text-xs text-muted-foreground">TI-2001 High</span>
                            </div>
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">원유 종류</span>
                              <p className="font-medium text-sm mt-0.5">Arabian Medium</p>
                              <span className="text-xs text-amber-600">S: 2.59% (Heavy)</span>
                            </div>
                          </div>
                          {/* 주요 변수 상태 - 3개 기본, 확장 시 15개 */}
                          {(() => {
                            const allVars = [
                              { tag: "TI-2001", name: "Reactor Inlet Temp", value: "412\u00b0C", guide: "< 400\u00b0C", status: "critical" as const },
                              { tag: "PI-2001", name: "Reactor Pressure", value: "35.2 bar", guide: "33~37", status: "normal" as const },
                              { tag: "TI-2003", name: "Reactor WABT", value: "396.5\u00b0C", guide: "< 410\u00b0C", status: "warning" as const },
                              { tag: "FI-2001", name: "Feed Flow Rate", value: "120.5 m\u00b3/h", guide: "100~130", status: "normal" as const },
                              { tag: "AI-2001", name: "H2/Oil Ratio", value: "1,050 Nm\u00b3/m\u00b3", guide: "> 950", status: "normal" as const },
                              { tag: "FI-2010", name: "Quench Gas Flow", value: "15,200 Nm\u00b3/h", guide: "12K~18K", status: "normal" as const },
                              { tag: "TI-2005", name: "1st Bed \u0394T", value: "28.5\u00b0C", guide: "< 35\u00b0C", status: "normal" as const },
                              { tag: "TI-2006", name: "2nd Bed \u0394T", value: "32.1\u00b0C", guide: "< 35\u00b0C", status: "warning" as const },
                              { tag: "TI-2007", name: "Separator Temp", value: "52.3\u00b0C", guide: "45~60\u00b0C", status: "normal" as const },
                              { tag: "PI-2003", name: "Separator Pressure", value: "33.8 bar", guide: "32~36", status: "normal" as const },
                              { tag: "FI-2015", name: "H2 Makeup Flow", value: "8,500 Nm\u00b3/h", guide: "7K~10K", status: "normal" as const },
                              { tag: "LI-2001", name: "Separator Level", value: "48%", guide: "40~60%", status: "normal" as const },
                              { tag: "TI-2010", name: "Product Stripper Top", value: "165\u00b0C", guide: "155~175\u00b0C", status: "normal" as const },
                              { tag: "PI-2005", name: "Stripper Pressure", value: "3.2 bar", guide: "2.8~3.5", status: "normal" as const },
                              { tag: "FI-2020", name: "Wash Water Flow", value: "2.8 m\u00b3/h", guide: "2~4", status: "normal" as const },
                            ]
                            const displayVars = showAllVariables ? allVars : allVars.slice(0, 3)
                            return (
                              <div className="border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex items-center gap-2">
                                  <Gauge className="h-3.5 w-3.5" />
                                  알람 발생 시점 주요 변수 상태
                                  <Badge variant="secondary" className="text-[10px] ml-auto">{showAllVariables ? allVars.length : 3} / {allVars.length}</Badge>
                                </div>
                                <div className="divide-y">
                                  {displayVars.map((v, i) => (
                                    <div key={i} className="flex items-center px-3 py-1.5 text-xs hover:bg-muted/20">
                                      <span className="font-mono w-20 text-muted-foreground">{v.tag}</span>
                                      <span className="flex-1">{v.name}</span>
                                      <span className={cn("font-medium w-28 text-right", v.status === "critical" ? "text-red-600" : v.status === "warning" ? "text-amber-600" : "text-foreground")}>{v.value}</span>
                                      <span className="text-muted-foreground w-24 text-right">{v.guide}</span>
                                      <span className="w-6 flex justify-end">
                                        {v.status === "critical" ? <AlertCircle className="h-3.5 w-3.5 text-red-500" /> : v.status === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => setShowAllVariables(p => !p)}
                                  className="w-full px-3 py-2 text-xs text-primary hover:bg-muted/30 flex items-center justify-center gap-1.5 border-t cursor-pointer font-medium transition-colors"
                                >
                                  {showAllVariables ? (
                                    <><ChevronUp className="h-3.5 w-3.5" />주요 변수 3개만 보기</>
                                  ) : (
                                    <><ChevronDown className="h-3.5 w-3.5" />전체 운전변수 {allVars.length}개 보기</>
                                  )}
                                </button>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Alert 타입: 관련 트렌드 (SVG 라인 차트) */}
                  {selectedAlert.type === "alert" && selectedAlert.data?.trend && (() => {
                    const trend = selectedAlert.data.trend
                    const limit = selectedAlert.data.limit || 0
                    const lowLimit = selectedAlert.triggerSetpoint?.low
                    const allVals = [...trend, limit, ...(lowLimit ? [lowLimit] : [])]
                    const maxV = Math.max(...allVals) * 1.08
                    const minV = Math.min(...allVals) * 0.92
                    const range = maxV - minV || 1
                    const W = 600
                    const H = 180
                    const pad = { t: 16, b: 28, l: 48, r: 16 }
                    const cw = W - pad.l - pad.r
                    const ch = H - pad.t - pad.b
                    const toX = (i: number) => pad.l + (i / (trend.length - 1)) * cw
                    const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
                    const linePoints = trend.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")
                    // smooth path
                    const pathD = trend.reduce((acc, v, i) => {
                      const x = toX(i)
                      const y = toY(v)
                      if (i === 0) return `M ${x} ${y}`
                      const px = toX(i - 1)
                      const py = toY(trend[i - 1])
                      const cpx = (px + x) / 2
                      return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
                    }, "")
                    // fill area
                    const areaD = `${pathD} L ${toX(trend.length - 1)} ${pad.t + ch} L ${toX(0)} ${pad.t + ch} Z`
                    // find first violation index
                    const firstViolIdx = trend.findIndex((v, i) => {
                      const overHigh = limit && v > limit
                      const underLow = lowLimit && v < lowLimit
                      return (overHigh || underLow) && (i === 0 || ((!limit || trend[i-1] <= limit) && (!lowLimit || trend[i-1] >= lowLimit)))
                    })
                    const timeLabels = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:15", "14:32"]

                    return (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              관련 트렌드 - {selectedAlert.data.tagId}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-normal text-muted-foreground">
                              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> Actual</span>
                              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block rounded border-t border-dashed" /> Guide Max</span>
                              {lowLimit && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded border-t border-dashed" /> Guide Min</span>}
                            </div>
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-1.5 text-xs"
                            onClick={() => setShowFullTrendDialog(true)}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            관련 트렌드 전체보기
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52" preserveAspectRatio="xMidYMid meet">
                            {/* Grid lines */}
                            {[0.25, 0.5, 0.75].map(frac => {
                              const y = pad.t + frac * ch
                              const val = maxV - frac * range
                              return (
                                <g key={frac}>
                                  <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="currentColor" strokeOpacity={0.07} />
                                  <text x={pad.l - 6} y={y + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{val.toFixed(0)}</text>
                                </g>
                              )
                            })}
                            {/* Y-axis labels */}
                            <text x={pad.l - 6} y={toY(maxV) + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{maxV.toFixed(0)}</text>
                            <text x={pad.l - 6} y={toY(minV) + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{minV.toFixed(0)}</text>
                            {/* Guide High line */}
                            {limit > 0 && (
                              <g>
                                <line x1={pad.l} y1={toY(limit)} x2={W - pad.r} y2={toY(limit)} stroke="#f87171" strokeWidth="1.5" strokeDasharray="6 3" />
                                <text x={W - pad.r + 4} y={toY(limit) + 3} fontSize="9" fill="#ef4444">Max {limit}</text>
                              </g>
                            )}
                            {/* Guide Low line */}
                            {lowLimit && (
                              <g>
                                <line x1={pad.l} y1={toY(lowLimit)} x2={W - pad.r} y2={toY(lowLimit)} stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="6 3" />
                                <text x={W - pad.r + 4} y={toY(lowLimit) + 3} fontSize="9" fill="#3b82f6">Min {lowLimit}</text>
                              </g>
                            )}
                            {/* Area fill */}
                            <path d={areaD} fill="url(#trendGrad)" opacity="0.3" />
                            <defs>
                              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {/* Trend line */}
                            <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Over-limit segments in red */}
                            {trend.map((v, i) => {
                              if (i === 0) return null
                              const overNow = (limit && v > limit) || (lowLimit && v < lowLimit)
                              const overPrev = (limit && trend[i-1] > limit) || (lowLimit && trend[i-1] < lowLimit)
                              if (!overNow && !overPrev) return null
                              const px = toX(i - 1), py = toY(trend[i-1])
                              const x = toX(i), y = toY(v)
                              const cpx = (px + x) / 2
                              return <path key={i} d={`M ${px} ${py} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                            })}
                            {/* Data points */}
                            {trend.map((v, i) => {
                              const isOver = (limit && v > limit) || (lowLimit && v < lowLimit)
                              return (
                                <g key={i}>
                                  <circle cx={toX(i)} cy={toY(v)} r={isOver ? 4.5 : 3} fill={isOver ? "#ef4444" : "#0d9488"} stroke="white" strokeWidth="1.5" />
                                  <text x={toX(i)} y={toY(v) - 8} fontSize="8" fill={isOver ? "#ef4444" : "currentColor"} fillOpacity={isOver ? 1 : 0.5} textAnchor="middle" fontWeight={isOver ? "bold" : "normal"}>{v}</text>
                                </g>
                              )
                            })}
                            {/* Violation hairline */}
                            {firstViolIdx >= 0 && (
                              <g>
                                <line x1={toX(firstViolIdx)} y1={pad.t - 4} x2={toX(firstViolIdx)} y2={pad.t + ch + 4} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
                                <rect x={toX(firstViolIdx) - 22} y={pad.t - 14} width="44" height="14" rx="3" fill="#dc2626" />
                                <text x={toX(firstViolIdx)} y={pad.t - 4} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">위반 시점</text>
                              </g>
                            )}
                            {/* Time labels */}
                            {trend.map((_, i) => (
                              <text key={i} x={toX(i)} y={H - 4} fontSize="8" fill="currentColor" fillOpacity={0.4} textAnchor="middle">{timeLabels[i] || `T-${trend.length - 1 - i}`}</text>
                            ))}
                          </svg>
                          <div className="flex justify-between mt-3 p-3 bg-muted/30 rounded-lg">
                            <div>
                              <span className="text-xs text-muted-foreground">현재값 (Actual)</span>
                              <p className="text-base font-bold">{selectedAlert.data.value}</p>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-muted-foreground">편차</span>
                              <p className={cn("text-base font-bold", selectedAlert.data.value > limit ? "text-red-500" : lowLimit && selectedAlert.data.value < lowLimit ? "text-blue-500" : "text-green-500")}>
                                {limit ? `${selectedAlert.data.value > limit ? "+" : ""}${(selectedAlert.data.value - limit).toFixed(1)}` : "-"}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground">Guide</span>
                              <p className="text-base font-bold text-muted-foreground">{limit || "-"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* 장기건전성 모니터링 - Projection Trend with Action Window */}
                  {selectedAlert.subType === "health-monitoring" && selectedAlert.healthMonitoring && (() => {
                    const hm = selectedAlert.healthMonitoring
                    const data = hm.trend
                    const proj = hm.projectionTrend
                    const prev = hm.prevTaTrend
                    const allV = [...data, ...proj, ...(prev || []), hm.limitValue, hm.actionLimit]
                    const maxV = Math.max(...allV) * 1.03
                    const minV = Math.min(...allV) * 0.97
                    const rng = maxV - minV || 1
                    const W = 700, H = 220, pd = { t: 16, b: 28, l: 52, r: 16 }
                    const cw = W - pd.l - pd.r, ch = H - pd.t - pd.b
                    const totalLen = data.length + proj.length
                    const tX = (i: number) => pd.l + (i / (totalLen - 1)) * cw
                    const tY = (v: number) => pd.t + (1 - (v - minV) / rng) * ch
                    const actualD = data.map((v, i) => `${i === 0 ? "M" : "L"} ${tX(i).toFixed(1)} ${tY(v).toFixed(1)}`).join(" ")
                    const projD = proj.map((v, i) => `${i === 0 ? "M" : "L"} ${tX(data.length - 1 + i).toFixed(1)} ${tY(v).toFixed(1)}`).join(" ")
                    const prevD = prev ? prev.map((v, i) => `${i === 0 ? "M" : "L"} ${tX(i).toFixed(1)} ${tY(v).toFixed(1)}`).join(" ") : ""
                    const actionStartIdx = Math.max(0, hm.projectionWeeks - hm.actionMarginWeeks)
                    const actionX1 = tX(data.length - 1 + actionStartIdx)
                    const actionX2 = tX(data.length - 1 + Math.min(hm.projectionWeeks, proj.length - 1))

                    return (
                      <Card className="ring-2 ring-red-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            장기건전성 Projection Trend - {hm.equipId}
                            {hm.aiModelId && <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-600">AI Model: {hm.aiModelId}</Badge>}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block rounded" /> Actual</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded border-t border-dashed" /> Projection</span>
                            {prev && <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-slate-400 inline-block rounded border-t border-dashed" /> Prev TA</span>}
                            <span className="flex items-center gap-1"><span className="w-4 h-1.5 bg-amber-200 inline-block rounded" /> Action Window</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
                            {/* Grid */}
                            {[0.25, 0.5, 0.75].map(f => {
                              const y = pd.t + f * ch
                              const val = maxV - f * rng
                              return <g key={f}><line x1={pd.l} y1={y} x2={W - pd.r} y2={y} stroke="currentColor" strokeOpacity={0.06} /><text x={pd.l - 5} y={y + 3} fontSize="8" fill="currentColor" fillOpacity={0.35} textAnchor="end">{val.toFixed(0)}</text></g>
                            })}
                            {/* Now divider */}
                            <line x1={tX(data.length - 1)} y1={pd.t} x2={tX(data.length - 1)} y2={pd.t + ch} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="5 3" />
                            <text x={tX(data.length - 1)} y={pd.t + ch + 14} fontSize="8" fill="currentColor" fillOpacity={0.5} textAnchor="middle">현재 (W24)</text>
                            {/* Action window fill */}
                            <rect x={actionX1} y={pd.t} width={Math.max(0, actionX2 - actionX1)} height={ch} fill="#fbbf24" opacity="0.12" rx="3" />
                            <text x={(actionX1 + actionX2) / 2} y={pd.t + 14} fontSize="9" fill="#b45309" textAnchor="middle" fontWeight="bold">Action Window</text>
                            {/* Limit line */}
                            <line x1={pd.l} y1={tY(hm.limitValue)} x2={W - pd.r} y2={tY(hm.limitValue)} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="6 3" />
                            <text x={W - pd.r + 3} y={tY(hm.limitValue) + 3} fontSize="8" fill="#ef4444">Limit {hm.limitValue}</text>
                            {/* Action limit */}
                            <line x1={pd.l} y1={tY(hm.actionLimit)} x2={W - pd.r} y2={tY(hm.actionLimit)} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 2" />
                            <text x={W - pd.r + 3} y={tY(hm.actionLimit) + 3} fontSize="7" fill="#f59e0b">Action {hm.actionLimit}</text>
                            {/* Prev TA */}
                            {prevD && <path d={prevD} fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5" />}
                            {/* Actual area + line */}
                            <path d={`${actualD} L ${tX(data.length - 1)} ${pd.t + ch} L ${tX(0)} ${pd.t + ch} Z`} fill="#ef4444" opacity="0.06" />
                            <path d={actualD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                            {/* Projection line */}
                            <path d={projD} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4" />
                            {/* Data points */}
                            {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((_v, _i) => {
                              const idx = _i === Math.floor(data.length / 3) ? data.length - 1 : _i * 3
                              const v = data[idx]
                              return <circle key={idx} cx={tX(idx)} cy={tY(v)} r={idx === data.length - 1 ? 4 : 2} fill="#ef4444" />
                            })}
                            {/* Week labels */}
                            {[0, 6, 12, 18, data.length - 1].map(i => <text key={i} x={tX(i)} y={H - 6} fontSize="7" fill="currentColor" fillOpacity={0.4} textAnchor="middle">W{i + 1}</text>)}
                            {proj.length > 1 && [Math.floor(proj.length / 2), proj.length - 1].map(i => <text key={`p${i}`} x={tX(data.length - 1 + i)} y={H - 6} fontSize="7" fill="#6366f1" fillOpacity={0.6} textAnchor="middle">+{i}w</text>)}
                          </svg>

                          {/* Summary metrics */}
                          <div className="grid grid-cols-4 gap-3 mt-3 p-3 bg-muted/30 rounded-lg">
                            <div>
                              <span className="text-[11px] text-muted-foreground">현재값</span>
                              <p className="text-lg font-bold text-red-600">{hm.currentValue} <span className="text-xs font-normal">{hm.healthIndexUnit}</span></p>
                            </div>
                            <div>
                              <span className="text-[11px] text-muted-foreground">Drift 변화율</span>
                              <p className="text-lg font-bold text-red-600">+{hm.driftPct}%</p>
                            </div>
                            <div>
                              <span className="text-[11px] text-muted-foreground">Limit 도달</span>
                              <p className="text-lg font-bold text-red-600">{hm.projectionWeeks}주</p>
                            </div>
                            <div>
                              <span className="text-[11px] text-muted-foreground">Action Window</span>
                              <p className="text-lg font-bold text-amber-600">{hm.needsImmediateAction ? "즉시" : `${hm.actionMarginWeeks}주 전`}</p>
                            </div>
                          </div>

                          {/* Related variables */}
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold mb-2">관련 변수 현황</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {hm.relatedTrends.map(rt => (
                                <div key={rt.tagId} className={cn("flex items-center justify-between p-2 rounded border text-xs",
                                  rt.status === "critical" && "bg-red-50 border-red-200",
                                  rt.status === "warning" && "bg-amber-50 border-amber-200",
                                  rt.status === "normal" && "bg-background"
                                )}>
                                  <div>
                                    <span className="font-mono font-medium">{rt.tagId}</span>
                                    <span className="text-muted-foreground ml-1.5">{rt.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold">{rt.value} {rt.unit}</span>
                                    <span className={cn("w-2 h-2 rounded-full",
                                      rt.status === "critical" && "bg-red-500",
                                      rt.status === "warning" && "bg-amber-400",
                                      rt.status === "normal" && "bg-emerald-500"
                                    )} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Suggested actions */}
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold mb-2">권장 조치 사항</h4>
                            <div className="space-y-1.5">
                              {hm.suggestedActions.map((action, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
                                  <Badge variant="outline" className="text-[10px] h-4 shrink-0 mt-0.5">{i + 1}</Badge>
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* Alert 타입: DCS 화면 스냅샷 (다중 그래픽 전환) */}
                  {selectedAlert.type === "alert" && (() => {
                    const dcsScreens = [
                      { id: "reactor-overview", label: "Reactor Overview", section: "Reactor Section" },
                      { id: "feed-section", label: "Feed Section", section: "Feed Preheat Train" },
                      { id: "fractionation", label: "Fractionation", section: "Product Separation" },
                    ]
                    return (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              DCS 화면 스냅샷 (알람 발생 시점)
                            </div>
                          </CardTitle>
                          <div className="flex gap-1 mt-2">
                            {dcsScreens.map((scr, idx) => (
                              <button
                                key={scr.id}
                                className={cn(
                                  "px-3 py-1.5 text-xs rounded-t border border-b-0 font-medium",
                                  idx === activeDcsScreen
                                    ? "bg-slate-900 text-white border-slate-700"
                                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                )}
                                onClick={() => setActiveDcsScreen(idx)}
                              >
                                {scr.label}
                                {idx === 0 && <span className="ml-1.5 w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-pulse" />}
                              </button>
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="relative aspect-[16/8] bg-slate-900 rounded-b-lg rounded-tr-lg overflow-hidden">
                            <div className="absolute inset-0 p-4">
                              <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-2 text-slate-400 text-xs">
                                  <span>{selectedAlert.unit} - {dcsScreens[activeDcsScreen]?.section}</span>
                                  <span>{selectedAlert.timestamp}</span>
                                </div>
                                {activeDcsScreen === 0 ? (
                                  <>
                                    <div className="flex-1 grid grid-cols-4 gap-3">
                                      <div className="bg-slate-800 rounded p-2 flex flex-col">
                                        <span className="text-slate-500 text-xs mb-1">Feed</span>
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-14 h-10 border border-slate-600 rounded flex items-center justify-center"><span className="text-slate-400 text-xs">P-2001</span></div>
                                        </div>
                                        <div className="text-xs text-green-400 mt-1">120.5 m3/h</div>
                                      </div>
                                      <div className="bg-slate-800 rounded p-2 flex flex-col border-2 border-red-500">
                                        <span className="text-slate-500 text-xs mb-1">Reactor</span>
                                        <div className="flex-1 flex items-center justify-center relative">
                                          <div className="w-20 h-14 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center bg-red-900/30">
                                            <span className="text-red-400 text-xs font-bold">R-2001</span>
                                            <span className="text-red-300 text-xs">{selectedAlert.data?.tagId}</span>
                                          </div>
                                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse" />
                                        </div>
                                        <div className="text-xs text-red-400 mt-1 font-bold">{selectedAlert.data?.value} (HIGH)</div>
                                      </div>
                                      <div className="bg-slate-800 rounded p-2 flex flex-col">
                                        <span className="text-slate-500 text-xs mb-1">Separator</span>
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-14 h-10 border border-slate-600 rounded flex items-center justify-center"><span className="text-slate-400 text-xs">V-2001</span></div>
                                        </div>
                                        <div className="text-xs text-green-400 mt-1">35.2 bar</div>
                                      </div>
                                      <div className="bg-slate-800 rounded p-2 flex flex-col">
                                        <span className="text-slate-500 text-xs mb-1">H2 System</span>
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-14 h-10 border border-slate-600 rounded flex items-center justify-center"><span className="text-slate-400 text-xs">C-2001</span></div>
                                        </div>
                                        <div className="text-xs text-green-400 mt-1">1,050 Nm3</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-6 gap-1.5">
                                      {[
                                        { tag: "FI-2001", val: "120.5", ok: true }, { tag: selectedAlert.data?.tagId || "TI-2001", val: String(selectedAlert.data?.value), ok: false },
                                        { tag: "PI-2001", val: "35.2", ok: true }, { tag: "TI-2003", val: "396.5", ok: true },
                                        { tag: "AI-2001", val: "1050", ok: true }, { tag: "FI-2010", val: "15200", ok: true },
                                      ].map((t, i) => (
                                        <div key={i} className={cn("p-1 rounded text-center", t.ok ? "bg-slate-800" : "bg-red-900/50 border border-red-500")}>
                                          <span className="text-slate-500 text-[10px] block">{t.tag}</span>
                                          <span className={cn("text-xs", t.ok ? "text-green-400" : "text-red-400 font-bold")}>{t.val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : activeDcsScreen === 1 ? (
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="grid grid-cols-3 gap-6">
                                      {[
                                        { name: "E-2001\nFeed/Effluent", temp: "285/310°C", color: "green" },
                                        { name: "E-2002\nFeed Heater", temp: "310/395°C", color: "green" },
                                        { name: "F-2001\nCharge Heater", temp: "395/412°C", color: "red" },
                                      ].map((eq, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                          <div className={cn("w-20 h-16 border-2 rounded-lg flex flex-col items-center justify-center",
                                            eq.color === "red" ? "border-red-500 bg-red-900/20" : "border-slate-600 bg-slate-800"
                                          )}>
                                            <span className={cn("text-xs", eq.color === "red" ? "text-red-400" : "text-slate-400")}>{eq.name.split("\n")[0]}</span>
                                            <span className="text-slate-500 text-[10px]">{eq.name.split("\n")[1]}</span>
                                          </div>
                                          <span className={cn("text-xs", eq.color === "red" ? "text-red-400 font-bold" : "text-green-400")}>{eq.temp}</span>
                                          {i < 2 && <div className="absolute" />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="grid grid-cols-3 gap-6">
                                      {[
                                        { name: "V-2001\nHP Sep", press: "35.2 bar", level: "65%" },
                                        { name: "V-2002\nLP Sep", press: "8.5 bar", level: "55%" },
                                        { name: "T-2001\nStripper", press: "3.2 bar", level: "48%" },
                                      ].map((eq, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                          <div className="w-20 h-16 border border-slate-600 bg-slate-800 rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-slate-400 text-xs">{eq.name.split("\n")[0]}</span>
                                            <span className="text-slate-500 text-[10px]">{eq.name.split("\n")[1]}</span>
                                          </div>
                                          <div className="text-center">
                                            <span className="text-green-400 text-xs block">{eq.press}</span>
                                            <span className="text-slate-400 text-[10px]">Level: {eq.level}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">캡처 시간: {selectedAlert.timestamp}</span>
                              <span className="text-xs text-muted-foreground">({activeDcsScreen + 1}/{dcsScreens.length} 화면)</span>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs bg-transparent">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              DCS 화면 열기
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

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
                                관련 이벤트 TKT-2024-0892 보기
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
                                관련 이벤트 TKT-2024-0654 보기
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
                                관련 이벤트 TKT-2024-0421 보기
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
                                  
                                  {/* 연결 이벤트 */}
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

                  {/* Notice: 장기모니터링 상세 - 건전성 현황 대시보드 인라인 */}
                  {selectedAlert.subType === "long-term" && (() => {
                    const cats = Object.values(HEALTH_CATEGORIES)
                    const catData = cats.map(cat => {
                      const equip = getEquipmentData(cat.id)
                      const red = equip.filter(e => e.trafficLight === "red")
                      const yellow = equip.filter(e => e.trafficLight === "yellow")
                      const green = equip.filter(e => e.trafficLight === "green")
                      return { ...cat, red, yellow, green, total: equip.length }
                    })
                    const totals = catData.reduce((a, c) => ({
                      red: a.red + c.red.length, yellow: a.yellow + c.yellow.length,
                      green: a.green + c.green.length, total: a.total + c.total,
                    }), { red: 0, yellow: 0, green: 0, total: 0 })

                    return (
                      <Card className="border-blue-200/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              장기 건전성 현황
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                              onClick={() => router.push("/operations/health/overview")}
                            >
                              <ExternalLink className="h-3 w-3" />
                              전체 화면
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Summary bar */}
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">전체 <span className="font-semibold text-foreground">{totals.total}</span></span>
                            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /><span className="font-semibold text-red-600">{totals.red}</span></div>
                            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="font-semibold text-amber-600">{totals.yellow}</span></div>
                            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="font-semibold text-emerald-600">{totals.green}</span></div>
                            {totals.total > 0 && (
                              <div className="flex h-2 flex-1 rounded-full overflow-hidden bg-muted ml-auto">
                                <div className="bg-red-500" style={{ width: `${(totals.red / totals.total) * 100}%` }} />
                                <div className="bg-amber-400" style={{ width: `${(totals.yellow / totals.total) * 100}%` }} />
                                <div className="bg-emerald-500" style={{ width: `${(totals.green / totals.total) * 100}%` }} />
                              </div>
                            )}
                          </div>

                          {/* Category mini-cards */}
                          <div className="grid grid-cols-1 gap-2">
                            {catData.map(cat => (
                              <div
                                key={cat.id}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                                  cat.red.length > 0 ? "border-red-200 bg-red-50/30" : "border-border"
                                )}
                                onClick={() => router.push(`/operations/health/${cat.id}`)}
                              >
                                <div className="shrink-0">
                                  <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold">{cat.label}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{cat.healthIndexName}</span>
                                  </div>
                                  {cat.red.length > 0 && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                      <span className="text-[10px] text-red-600 truncate">
                                        {cat.red.slice(0, 2).map(e => e.id).join(", ")}
                                        {cat.red.length > 2 && ` 외 ${cat.red.length - 2}건`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    <span className="text-[11px] font-semibold text-red-600">{cat.red.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                                    <span className="text-[11px] font-semibold text-amber-600">{cat.yellow.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-[11px] font-semibold text-emerald-600">{cat.green.length}</span>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* 기존 Notice 타입 (이상징후/DCS/Daily Monitoring/장기모니터링 제외): 아이템 리스트 */}
                  {selectedAlert.data?.items && !["anomaly", "daily-monitoring", "dcs-modification", "monthly-report-review", "contingency-plan-review", "long-term"].includes(selectedAlert.subType) && (
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

                  {/* 문서 리뷰 요청 상세 (월간 리포트, Contingency Plan) */}
                  {["monthly-report-review", "contingency-plan-review"].includes(selectedAlert.subType) && selectedAlert.documentReview && (() => {
                    const doc = selectedAlert.documentReview
                    const isContingency = doc.docType === "contingency-plan"
                    return (
                      <>
                        {/* 문서 정보 헤더 */}
                        <Card className={isContingency ? "border-amber-300/50 bg-amber-50/30" : "border-primary/30 bg-primary/5"}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isContingency ? <ShieldCheck className="h-5 w-5 text-amber-600" /> : <BookOpen className="h-5 w-5 text-primary" />}
                                  <h3 className="font-semibold text-sm">{doc.docTitle}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">현재 버전:</span>
                                    <Badge variant="outline" className="text-xs h-5">{doc.docVersion}</Badge>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">최신 버전:</span>
                                    <Badge variant={doc.docVersion === doc.latestVersion ? "secondary" : "destructive"} className="text-xs h-5">{doc.latestVersion}</Badge>
                                  </div>
                                  {doc.period && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground">대상 기간:</span>
                                      <span>{doc.period}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">리뷰 주기:</span>
                                    <span>{doc.frequency}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 col-span-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">리뷰 마감:</span>
                                    <span className="font-medium text-destructive">{doc.deadline}</span>
                                  </div>
                                </div>
                              </div>
                              {doc.docVersion !== doc.latestVersion && (
                                <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
                                  <RotateCcw className="h-3 w-3" />
                                  버전 불일치
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 문서 섹션별 내용 */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              문서 내용
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1">
                            {doc.sections.map((section, i) => {
                              const isExpanded = expandedReviewSections.includes(section.title)
                              return (
                                <div key={i} className={cn("border rounded-lg overflow-hidden", section.hasChange && "border-amber-300")}>
                                  <button
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50"
                                    onClick={() => setExpandedReviewSections(prev => 
                                      isExpanded ? prev.filter(t => t !== section.title) : [...prev, section.title]
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                      <span className="text-sm font-medium">{section.title}</span>
                                      {section.hasChange && (
                                        <Badge variant="outline" className="text-xs h-5 border-amber-400 text-amber-700 bg-amber-50">���경사항</Badge>
                                      )}
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20 pt-2.5">
                                      {section.content}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </CardContent>
                        </Card>

                        {/* 리뷰 이력 */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <History className="h-4 w-4" />
                              리뷰 이력
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {doc.reviewHistory.map((hist, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                  <div className="flex flex-col items-center">
                                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", i === 0 ? "bg-primary" : "bg-muted-foreground/30")} />
                                    {i < doc.reviewHistory.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                                  </div>
                                  <div className="pb-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{hist.date}</span>
                                      <span className="font-medium text-foreground">{hist.reviewer}</span>
                                      <Badge variant="outline" className="text-xs h-4">{hist.version}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{hist.comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 리뷰 액션 */}
                        <Card className="border-primary/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Pencil className="h-4 w-4 text-primary" />
                              리뷰 의견 및 승인
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {isContingency
                                ? "문서 내용을 검토하고 최신 운전 조건이 반영되었는지 확인 후 승인해주세요."
                                : "리포트를 검토하고 의견을 작성해주세요. 승인 시 Knowledge Asset에 최종 저장됩니다."}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {docReviewConfirmed ? (
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-1">
                                <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  리뷰가 완료되었습니다
                                </p>
                                <p className="text-xs text-green-700">
                                  {isContingency
                                    ? `${doc.docTitle} ${doc.latestVersion} 버전이 최신으로 확인되었습니다. 다음 리뷰 예정: 6개월 후`
                                    : `리뷰 내용과 함께 Knowledge Asset에 저��되었습니다. (${doc.docTitle})`}
                                </p>
                              </div>
                            ) : (
                              <>
                                {isContingency && (
                                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="text-xs text-amber-800">
                                      <p className="font-medium">Living Document 최신 버전 확인 필수</p>
                                      <p className="mt-0.5">이 문서는 Living Document로 관리됩니다. 변경사항이 표시된 섹션을 반드시 확인하고, 현재 운전 조건과 일치하는지 검증해주세요.</p>
                                    </div>
                                  </div>
                                )}
                                <Textarea
                                  value={docReviewComment}
                                  onChange={(e) => setDocReviewComment(e.target.value)}
                                  placeholder={isContingency
                                    ? "리뷰 의견을 작성하세요... (예: 운전 조건 변경 반영 확인, 추가 수정 필요사항 등)"
                                    : "리포트에 대한 리뷰 의견을 작성하세요... (예: EII 미달 원인 분석 보완 필요 등)"}
                                  className="min-h-20"
                                />
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    리뷰 마감: <span className="font-medium text-destructive">{doc.deadline}</span>
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={!docReviewComment.trim()}
                                      onClick={() => {
                                        alert("수정 요청이 전달되었습니다. 문서 담당자에게 통보됩니다.")
                                      }}
                                    >
                                      수정 요청
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={!docReviewComment.trim()}
                                      onClick={() => {
                                        setDocReviewConfirmed(true)
                                        setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1.5" />
                                      {isContingency ? "최신 확인 및 승인" : "리뷰 완료 및 승인"}
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    )
                  })()}

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
                              <span className="text-sm font-medium">이벤트화</span>
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
                              {engineerOpinion === "ticket" ? "이벤트 생성하기" : "의견 저장"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 이벤트 업데이트 상세 */}
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
                            이벤트 상세 페이지로 이동
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

                      {/* 관련 트���드 (Alert 컴포넌트 차용) */}
                      {selectedAlert.data?.trend && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                관련 트렌드 - {selectedAlert.data.tagId}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => setShowFullTrendDialog(true)}
                              >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                전체보기
                              </Button>
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
                                  <span className="text-green-600 ml-2">Feed 변경(Medium → Light)에 따른 일시적 증가, 이벤트 발행하여 추적</span>
                                </div>
                                <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                  관련 이벤트 TKT-2024-1205 보기
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

              {/* ���션 버튼 영역 */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex justify-end gap-2">
                  {/* Alert 타입: New Alert인 경우 - 인지 버튼 (Bold 강조) (health-monitoring 제외) */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "new" && selectedAlert.subType !== "health-monitoring" && (
                    <Button 
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      className="font-bold"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      인지 (Standing Alert로 전환)
                    </Button>
                  )}

                  {/* 장기건전성 Health Alert - 조치 입력 + 인지 */}
                  {selectedAlert.subType === "health-monitoring" && selectedAlert.alertState === "new" && (
                    <>
                      <Button 
                        onClick={() => handleAcknowledge(selectedAlert.id)}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        인지 (Standing Alert)
                      </Button>
                      <Button 
                        onClick={() => setShowHealthActionDialog(true)}
                        className="font-bold bg-red-600 hover:bg-red-700"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        조치 입력
                      </Button>
                    </>
                  )}
                  {selectedAlert.subType === "health-monitoring" && selectedAlert.alertState === "standing" && (
                    <>
                      <Button 
                        onClick={() => setShowHealthActionDialog(true)}
                        className="font-bold"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        조치 입력
                      </Button>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        이벤트 발행
                      </Button>
                    </>
                  )}

                  {/* Alert 타입: Standing Alert인 경우 - 이벤트 발행 / Shelved 처리 */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "standing" && selectedAlert.subType !== "health-monitoring" && (
                    <>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        이벤트 발행
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
                      이벤트 확인하기
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
                        이벤트 형성
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
                        이벤트화
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

        {/* 장치 정보 및 이력 팝업 */}
        <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                장치 정보 및 정비이력
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Unit / 위치</span>
                  <p className="font-medium text-sm mt-0.5">{selectedAlert?.unit || "-"} / Reactor Section</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">관련 장치</span>
                  <p className="font-medium text-sm mt-0.5">R-2001 (HCR Reactor)</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">장치 유형</span>
                  <p className="font-medium text-sm mt-0.5">Fixed Bed Reactor</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">설치 / 최종 T/A</span>
                  <p className="font-medium text-sm mt-0.5">2015 / 2024-06</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  정비 / 검사 이력
                </h4>
                <div className="space-y-2">
                  {[
                    { type: "정비", desc: "Thermocouple 교체", date: "2024-11-15", color: "blue" },
                    { type: "검사", desc: "정기 Calibration", date: "2024-12-20", color: "green" },
                    { type: "점검", desc: "T/A 중 내부 검사 - Catalyst 교체", date: "2024-06-15", color: "amber" },
                    { type: "정비", desc: "Quench Line Valve 교체", date: "2024-06-10", color: "blue" },
                    { type: "검사", desc: "두�� 측정 (UT)", date: "2024-01-20", color: "green" },
                  ].map((item, i) => (
                    <div key={i} className={cn("flex items-center justify-between p-2 rounded border",
                      item.color === "blue" ? "bg-blue-50 border-blue-100" : item.color === "green" ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                    )}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs px-1.5 py-0",
                          item.color === "blue" ? "bg-blue-100 text-blue-700 border-blue-200" : item.color === "green" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                        )}>{item.type}</Badge>
                        <span className="text-xs">{item.desc}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">관련 Contingency Plan</h4>
                <Button variant="outline" size="sm" className="text-xs w-full justify-start">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                  HCR 비상운전 절차서 (v3.2) - 최종 리뷰: 2025-02-01
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* P&ID 도면 다이얼로그 */}
        <Dialog open={showPidDialog} onOpenChange={setShowPidDialog}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-blue-600" />
                관련 P&ID 도면
                {selectedAlert?.data?.tagId && <Badge variant="secondary" className="font-mono text-xs">{selectedAlert.data.tagId}</Badge>}
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const eq = getTagEq(selectedAlert?.data?.tagId)
              return (
                <div className="space-y-4">
                  {eq && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Badge variant="outline" className="text-[10px]">{eq.process}</Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{eq.zone}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{eq.equipment}</span>
                    </div>
                  )}
                  <Card className="overflow-hidden border-2">
                    <div className="bg-[#f8f9fa] relative" style={{ minHeight: 420 }}>
                      <svg width="100%" height="420" viewBox="0 0 800 420" className="w-full">
                        <defs>
                          <pattern id="pid-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="800" height="420" fill="url(#pid-grid)" />
                        {/* Title block */}
                        <rect x="560" y="370" width="230" height="45" fill="white" stroke="#374151" strokeWidth="1" />
                        <text x="570" y="388" fontSize="9" fill="#6b7280" fontFamily="monospace">{'DWG: PID-'}{eq?.process || 'HCR'}{'-'}{eq?.zone?.split(' ')[0] || '001'}{'-001'}</text>
                        <text x="570" y="403" fontSize="8" fill="#9ca3af" fontFamily="monospace">REV.5 | 2024-06-15 | APPROVED</text>
                        {/* Equipment - Reactor */}
                        <rect x="300" y="60" width="100" height="200" rx="8" fill="none" stroke="#1e40af" strokeWidth="2" />
                        <text x="350" y="170" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">{eq?.eqId || 'R-2001'}</text>
                        <text x="350" y="185" textAnchor="middle" fontSize="9" fill="#6b7280">{eq?.equipment || 'Reactor'}</text>
                        {[100, 140, 180, 220].map(y => <line key={y} x1="310" y1={y} x2="390" y2={y} stroke="#93c5fd" strokeWidth="0.5" />)}
                        {/* Feed line */}
                        <line x1="100" y1="120" x2="300" y2="120" stroke="#374151" strokeWidth="2" />
                        <polygon points="295,116 305,120 295,124" fill="#374151" />
                        {/* Product line */}
                        <line x1="400" y1="200" x2="550" y2="200" stroke="#374151" strokeWidth="2" />
                        <polygon points="545,196 555,200 545,204" fill="#374151" />
                        {/* Quench line */}
                        <line x1="350" y1="20" x2="350" y2="60" stroke="#374151" strokeWidth="1.5" strokeDasharray="6 3" />
                        <polygon points="346,55 354,55 350,65" fill="#374151" />
                        {/* Heat exchanger */}
                        <rect x="570" y="160" width="80" height="40" rx="4" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
                        <line x1="580" y1="180" x2="640" y2="180" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="3 2" />
                        <text x="610" y="215" textAnchor="middle" fontSize="9" fill="#6b7280">E-2001</text>
                        {/* Pump */}
                        <circle cx="150" cy="320" r="20" fill="none" stroke="#ea580c" strokeWidth="1.5" />
                        <line x1="140" y1="310" x2="160" y2="330" stroke="#ea580c" strokeWidth="1" />
                        <text x="150" y="355" textAnchor="middle" fontSize="9" fill="#6b7280">P-2001</text>
                        <line x1="150" y1="300" x2="150" y2="120" stroke="#374151" strokeWidth="1.5" />
                        {/* Separator */}
                        <rect x="550" y="280" width="70" height="50" rx="20" fill="none" stroke="#059669" strokeWidth="1.5" />
                        <text x="585" y="310" textAnchor="middle" fontSize="9" fill="#6b7280">D-2001</text>
                        <line x1="585" y1="200" x2="585" y2="280" stroke="#374151" strokeWidth="1.5" />
                        {/* Highlighted alarm tag */}
                        {selectedAlert?.data?.tagId && (
                          <g>
                            <circle cx="250" cy="110" r="18" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                            <text x="250" y="114" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#dc2626" fontFamily="monospace">{selectedAlert.data.tagId}</text>
                            <line x1="268" y1="110" x2="295" y2="120" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
                          </g>
                        )}
                        {/* Other tag points */}
                        {[
                          { x: 330, y: 85, label: "PI-2001" },
                          { x: 370, y: 145, label: "TI-2003" },
                          { x: 130, y: 120, label: "FI-2001" },
                          { x: 320, y: 35, label: "FI-2010" },
                          { x: 465, y: 195, label: "AI-2001" },
                        ].filter(t => t.label !== selectedAlert?.data?.tagId).map(t => (
                          <g key={t.label}>
                            <circle cx={t.x} cy={t.y} r="14" fill="white" stroke="#6b7280" strokeWidth="1" />
                            <text x={t.x} y={t.y + 3} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="monospace">{t.label}</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </Card>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">도면번호</span>
                      <p className="font-mono font-medium mt-0.5">{'PID-'}{eq?.process || 'HCR'}{'-'}{eq?.zone?.split(' ')[0] || '001'}{'-001'}</p>
                    </div>
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">최종 개정</span>
                      <p className="font-medium mt-0.5">Rev.5 (2024-06-15)</p>
                    </div>
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">태그 위치</span>
                      <p className="font-mono font-medium mt-0.5 text-red-600">{selectedAlert?.data?.tagId || '-'} (표시됨)</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* 데이터시트 다이얼로그 */}
        <Dialog open={showDatasheetDialog} onOpenChange={setShowDatasheetDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                장치 데이터시트
                {selectedAlert?.data?.tagId && <Badge variant="secondary" className="font-mono text-xs">{selectedAlert.data.tagId}</Badge>}
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const eq = getTagEq(selectedAlert?.data?.tagId)
              return (
                <div className="space-y-4">
                  <Card className="border-l-4 border-l-teal-500">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{eq?.equipment || 'Equipment'}</p>
                          <p className="text-xs text-muted-foreground">{eq?.eqId || '-'} | {eq?.eqType || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div>
                    <h4 className="text-sm font-medium mb-2">General Specifications</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y">
                          {[
                            ["Equipment ID", eq?.eqId || "-"],
                            ["Equipment Name", eq?.equipment || "-"],
                            ["Type", eq?.eqType || "-"],
                            ["Service", `${eq?.process || '-'} / ${eq?.zone || '-'}`],
                            ["Design Pressure", "42.0 kg/cm\u00b2g"],
                            ["Design Temperature", "450\u00b0C"],
                            ["Operating Pressure", "35.0 kg/cm\u00b2g"],
                            ["Operating Temperature", "380~400\u00b0C"],
                            ["Material (Shell)", "2.25Cr-1Mo Steel (SA-387 Gr.22)"],
                            ["Material (Internals)", "SS 321"],
                            ["Corrosion Allowance", "3.0 mm"],
                            ["Weight (Empty)", "285 ton"],
                            ["Installed Year", eq?.installed || "-"],
                            ["Last T/A", eq?.lastTA || "-"],
                          ].map(([label, value], i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="px-3 py-2 bg-muted/30 font-medium w-40">{label}</td>
                              <td className="px-3 py-2">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Instrument Data ({selectedAlert?.data?.tagId || '-'})</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y">
                          {[
                            ["Tag Number", selectedAlert?.data?.tagId || "-"],
                            ["Service Description", selectedAlert?.title || "-"],
                            ["Instrument Type", "Thermocouple (Type K)"],
                            ["Range", "0 ~ 600\u00b0C"],
                            ["Accuracy", "\u00b10.5\u00b0C"],
                            ["Process Connection", '1/2" NPT'],
                            ["Insertion Length", "300 mm"],
                            ["DCS Input Type", "4-20 mA"],
                            ["Alarm Setting (HH)", selectedAlert?.triggerSetpoint?.high || "-"],
                            ["Alarm Setting (LL)", selectedAlert?.triggerSetpoint?.low || "-"],
                            ["Last Calibration", "2024-12-20"],
                            ["Calibration Cycle", "6 months"],
                          ].map(([label, value], i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="px-3 py-2 bg-muted/30 font-medium w-44">{label}</td>
                              <td className="px-3 py-2 font-mono">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                    <span>Document: DS-{eq?.eqId || 'XXX'}-001 Rev.3</span>
                    <span>Last Updated: 2024-06-15</span>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* 이벤트 생성 다이얼로그 - 새 이벤트과 동일한 양식 */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                이벤트 생성
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-title">이벤트 제목 *</Label>
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
                  placeholder="이벤트에 대한 상세 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>이벤트 유형</Label>
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
                이벤트 생성
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
                      <span className="text-xs">DCS 반영 완료 - IT��영팀</span>
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
                공정 특이사항을 Standing Issue로 등록합니다. 등록 시 기술팀장에게 자동 공유���니다.
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

              {/* 관련 이벤트 링크 */}
              <div className="space-y-2">
                <Label>관련 이벤트 연결 (선택)</Label>
                <Select value={dailyReportLinkedTicketId} onValueChange={setDailyReportLinkedTicketId}>
                  <SelectTrigger>
                    <SelectValue placeholder="연결할 이벤트 선택..." />
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

              {selectedAlert && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <span className="text-xs text-muted-foreground">대상 알람</span>
                  <p className="text-sm font-medium">{selectedAlert.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedAlert.data?.tagId}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Shelved 처리 사유 *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {shelvedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={cn(
                        "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                        shelvedCategory === cat.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                      onClick={() => setShelvedCategory(cat.id)}
                    >
                      <span className={cn("text-sm font-medium", shelvedCategory === cat.id ? "text-primary" : "text-foreground")}>{cat.label}</span>
                      <span className="text-xs text-muted-foreground mt-0.5 leading-snug">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shelved-reason">상세 사유 (선택)</Label>
                <Textarea
                  id="shelved-reason"
                  value={shelvedReason}
                  onChange={(e) => setShelvedReason(e.target.value)}
                  placeholder="추가 메모가 있으면 입력하세요..."
                  className="min-h-16"
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowShelvedDialog(false); setShelvedCategory(""); setShelvedReason(""); setShelvedUntil(""); }}>취소</Button>
              <Button 
                onClick={() => selectedAlert && handleShelveAlert(selectedAlert.id)}
                disabled={!shelvedCategory || !shelvedUntil}
              >
                <Clock className="h-4 w-4 mr-2" />
                Shelved 처리
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== 장기건전성 조치 입력 -> 티켓화 Dialog ===== */}
        <Dialog open={showHealthActionDialog} onOpenChange={setShowHealthActionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-red-500" />
                조치 입력 (티켓 생성)
              </DialogTitle>
            </DialogHeader>
            {selectedAlert?.healthMonitoring && (
              <div className="space-y-4 py-2">
                {/* 대상 장치 정보 */}
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-semibold">{selectedAlert.healthMonitoring.equipId} - {selectedAlert.healthMonitoring.equipName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>현재 {selectedAlert.healthMonitoring.currentValue} {selectedAlert.healthMonitoring.healthIndexUnit}</span>
                    <span>Drift +{selectedAlert.healthMonitoring.driftPct}%</span>
                    <span>잔여 {selectedAlert.healthMonitoring.projectionWeeks}주</span>
                  </div>
                </div>

                {/* 조치 유형 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">조치 유형</Label>
                  <Select value={healthActionType} onValueChange={setHealthActionType}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online-cleaning">Online Cleaning</SelectItem>
                      <SelectItem value="ta-scope">TA Scope 반영</SelectItem>
                      <SelectItem value="operating-change">운전 조건 변경</SelectItem>
                      <SelectItem value="chemical-treatment">Chemical 처리</SelectItem>
                      <SelectItem value="temp-profile">온도 프로파일 변경</SelectItem>
                      <SelectItem value="catalyst-management">촉매 관리 (보충/교체)</SelectItem>
                      <SelectItem value="inspection">점검/검사</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 긴급도 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">긴급도</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "urgent", label: "긴급 (즉시)", className: "border-red-300 bg-red-50 text-red-700" },
                      { id: "high", label: "높음 (1주 내)", className: "border-amber-300 bg-amber-50 text-amber-700" },
                      { id: "normal", label: "보통 (TA 반영)", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={cn(
                          "p-2 rounded-lg border text-xs font-medium transition-colors",
                          healthActionUrgency === opt.id ? opt.className + " ring-1 ring-current" : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => setHealthActionUrgency(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 조치 내용 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">조치 내용</Label>
                  <Textarea
                    rows={4}
                    value={healthActionDesc}
                    onChange={e => setHealthActionDesc(e.target.value)}
                    placeholder="어떤 조치를 어떻게 수행할 것인지 기술하세요..."
                  />
                </div>

                {/* 디폴트 정보 */}
                <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">자동 입력 정보 (티켓에 포함)</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <span className="text-muted-foreground">공정: <span className="text-foreground font-medium">{selectedAlert.unit || "N/A"}</span></span>
                    <span className="text-muted-foreground">장치: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.equipId}</span></span>
                    <span className="text-muted-foreground">Health Index: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.healthIndexName}</span></span>
                    <span className="text-muted-foreground">Projection: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.projectionWeeks}주</span></span>
                    {selectedAlert.healthMonitoring.aiModelId && (
                      <span className="text-muted-foreground">AI Model: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.aiModelId}</span></span>
                    )}
                    <span className="text-muted-foreground">발생일: <span className="text-foreground font-medium">{selectedAlert.timestamp}</span></span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-700">조치 입력 시 이벤트 티켓이 자동 생성되며, 관련 엔지니어에게 알림이 발송됩니���.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowHealthActionDialog(false); setHealthActionDesc(""); }}>취소</Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setShowHealthActionDialog(false)
                  setHealthActionDesc("")
                  if (selectedAlert) handleCreateTicket(selectedAlert)
                }}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                조치 입력 및 티켓 생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== 관련 트렌드 전체보기 Dialog ===== */}
        <Dialog open={showFullTrendDialog} onOpenChange={setShowFullTrendDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                관련 트렌드 전체보기
                {selectedAlert?.data?.tagId && (
                  <Badge variant="outline" className="ml-2 font-mono text-xs">{selectedAlert.data.tagId}</Badge>
                )}
              </DialogTitle>
              {selectedAlert?.data?.tagId && (() => {
                const group = getMonitoringGroup(selectedAlert.data.tagId!)
                return (
                  <p className="text-sm text-muted-foreground mt-1">
                    모니터링 그룹: <span className="font-medium text-foreground">{group.name}</span>
                    <span className="ml-2">({group.tags.length}개 태그)</span>
                  </p>
                )
              })()}
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {selectedAlert?.data?.tagId && (() => {
                const group = getMonitoringGroup(selectedAlert.data.tagId!)
                const sourceTagId = selectedAlert.data.tagId

                return (
                  <div className="space-y-6 pb-4">
                    {/* 그룹별 태그 타입 범례 */}
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(group.tags.map(t => t.type))).map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                          <span className="ml-1 text-muted-foreground">({group.tags.filter(t => t.type === type).length})</span>
                        </Badge>
                      ))}
                    </div>

                    {/* 태그별 개별 트렌드 카드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {group.tags.map(tag => {
                        const isSourceTag = tag.id === sourceTagId
                        const trendData = isSourceTag && selectedAlert.data?.trend
                          ? { values: selectedAlert.data.trend, limit: selectedAlert.data.limit || null, lowLimit: selectedAlert.triggerSetpoint?.low || null, unit: tag.unit }
                          : generateMockTrend(tag.id, tag.type)
                        const { values, limit, lowLimit: lo } = trendData
                        const allVals = [...values, ...(limit ? [limit] : []), ...(lo ? [lo] : [])]
                        const maxV = Math.max(...allVals) * 1.05
                        const minV = Math.min(...allVals) * 0.95
                        const range = maxV - minV || 1
                        const W = 400, H = 120
                        const pad = { t: 12, b: 20, l: 40, r: 12 }
                        const cw = W - pad.l - pad.r
                        const ch = H - pad.t - pad.b
                        const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
                        const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
                        const pathD = values.reduce((acc, v, i) => {
                          const x = toX(i), y = toY(v)
                          if (i === 0) return `M ${x} ${y}`
                          const px = toX(i - 1), py = toY(values[i - 1])
                          const cpx = (px + x) / 2
                          return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
                        }, "")
                        const lastVal = values[values.length - 1]
                        const isViolation = (limit && lastVal > limit) || (lo && lastVal < lo)
                        const trendColor = isSourceTag ? "#0d9488" : "#6366f1"

                        return (
                          <Card key={tag.id} className={cn(
                            "overflow-hidden transition-shadow",
                            isSourceTag && "ring-2 ring-primary shadow-md",
                            isViolation && !isSourceTag && "border-red-200"
                          )}>
                            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={cn(
                                  "font-mono text-sm font-semibold shrink-0",
                                  isSourceTag ? "text-primary" : isViolation ? "text-red-600" : "text-foreground"
                                )}>
                                  {tag.id}
                                </span>
                                {isSourceTag && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30" variant="outline">Alert Source</Badge>}
                                {isViolation && !isSourceTag && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Violation</Badge>}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">[{trendData.unit}]</span>
                            </div>
                            <p className="px-4 text-xs text-muted-foreground -mt-0.5 mb-1">{tag.desc}</p>
                            <div className="px-2 pb-1">
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="xMidYMid meet">
                                {/* Grid */}
                                {[0.33, 0.66].map(frac => {
                                  const y = pad.t + frac * ch
                                  const val = maxV - frac * range
                                  return <g key={frac}><line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="currentColor" strokeOpacity={0.06} /><text x={pad.l - 4} y={y + 3} fontSize="7" fill="currentColor" fillOpacity={0.35} textAnchor="end">{val.toFixed(0)}</text></g>
                                })}
                                {/* Limit lines */}
                                {limit && <line x1={pad.l} y1={toY(limit)} x2={W - pad.r} y2={toY(limit)} stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" />}
                                {lo && <line x1={pad.l} y1={toY(lo)} x2={W - pad.r} y2={toY(lo)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />}
                                {/* Area */}
                                <path d={`${pathD} L ${toX(values.length-1)} ${pad.t+ch} L ${toX(0)} ${pad.t+ch} Z`} fill={trendColor} opacity="0.08" />
                                {/* Line */}
                                <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" />
                                {/* Over-limit red */}
                                {values.map((v, i) => {
                                  if (i === 0) return null
                                  const overNow = (limit && v > limit) || (lo && v < lo)
                                  const overPrev = (limit && values[i-1] > limit) || (lo && values[i-1] < lo)
                                  if (!overNow && !overPrev) return null
                                  const px = toX(i-1), py = toY(values[i-1]), x = toX(i), y = toY(v), cpx = (px+x)/2
                                  return <path key={i} d={`M ${px} ${py} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`} fill="none" stroke="#ef4444" strokeWidth="2" />
                                })}
                                {/* Points */}
                                {values.map((v, i) => {
                                  const isOver = (limit && v > limit) || (lo && v < lo)
                                  return <circle key={i} cx={toX(i)} cy={toY(v)} r={isOver ? 3 : 2} fill={isOver ? "#ef4444" : trendColor} stroke="white" strokeWidth="1" />
                                })}
                              </svg>
                            </div>
                            <div className="px-4 pb-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-muted-foreground">현재 </span>
                                <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>
                                  {lastVal} {trendData.unit}
                                </span>
                              </div>
                              {limit && (
                                <div>
                                  <span className="text-muted-foreground">Max </span>
                                  <span className="text-red-500 font-medium">{limit}</span>
                                </div>
                              )}
                              {lo && (
                                <div>
                                  <span className="text-muted-foreground">Min </span>
                                  <span className="text-blue-500 font-medium">{lo}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">편차 </span>
                                <span className={cn("font-medium", isViolation ? "text-red-600" : "text-green-600")}>
                                  {limit ? `${lastVal > limit ? "+" : ""}${(lastVal - limit).toFixed(1)}` : lo ? `${lastVal < lo ? "" : "+"}${(lastVal - lo).toFixed(1)}` : "-"}
                                </span>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
