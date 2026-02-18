// Shared types and data for Workbench

export interface LinkedTicket {
  id: string
  title: string
  status: string
  ticketType: string
}

export interface WorkNote {
  id: string
  date: string
  author: string
  content: string
  type: "manual" | "ticket-update" | "status-change"
}

export interface WorkItem {
  id: string
  title: string
  unit: string            // 관련 Unit 또는 "Cross-Unit"
  category: string
  priority: "critical" | "high" | "medium" | "low"
  status: "in-progress" | "planning" | "under-review" | "approved" | "completed" | "closed"
  owner: string
  description: string
  expectedBenefit?: string
  estimatedCost?: string
  duration?: string
  progress: number        // 0~100
  startDate?: string
  targetDate?: string
  linkedTickets: LinkedTicket[]
  notes: WorkNote[]
}

export const INITIAL_WORK_ITEMS: WorkItem[] = [
  {
    id: "WL-001", title: "Bio Diesel 도입 검토", unit: "Cross-Unit", category: "신규 사업",
    priority: "high", status: "in-progress", owner: "Process Eng.", progress: 35,
    description: "Bio Diesel 원료 도입에 따른 공정 영향 분석 및 운전 조건 최적화 검토. 기존 설비 호환성, 촉매 영향, 제품 품질 영향 등 종합 검토.",
    expectedBenefit: "탄소 중립 기여", estimatedCost: "₩2.5B",
    startDate: "2025-01", targetDate: "2025-09",
    linkedTickets: [
      { id: "1", title: "HCR 촉매 교체 검토", status: "In Progress", ticketType: "Improvement" },
      { id: "2", title: "E-101 세정 계획", status: "Open", ticketType: "Change" },
    ],
    notes: [
      { id: "n1", date: "2025-02-10", author: "김철수", content: "Bio Diesel 원료 샘플 테스트 결과 수령. CFPP 분석 진행 중.", type: "manual" },
      { id: "n2", date: "2025-01-20", author: "시스템", content: "관련 티켓 #1 상태 변경: Open → In Progress", type: "ticket-update" },
    ],
  },
  {
    id: "WL-002", title: "FCC 신규 촉매 검토", unit: "VGOFCC", category: "촉매 최적화",
    priority: "critical", status: "in-progress", owner: "Process Eng.", progress: 60,
    description: "VGOFCC 촉매 세대 교체 검토. Gasoline 수율 향상 및 LCO 최소화를 위한 신규 촉매 선정 및 Pilot Test.",
    expectedBenefit: "₩8.5B/yr", estimatedCost: "₩15B",
    startDate: "2024-10", targetDate: "2025-06",
    linkedTickets: [
      { id: "5", title: "P-201A/B 진동 이상 분석", status: "In Progress", ticketType: "Trouble" },
      { id: "model-1", title: "HCR RTO 모델 성능 저하 - 재구성 요청", status: "Open", ticketType: "ModelImprovement" },
      { id: "test-1", title: "HCR Quench 분배 비율 변경 테스트", status: "In Progress", ticketType: "ProcessTest" },
    ],
    notes: [
      { id: "n3", date: "2025-02-05", author: "김철수", content: "Vendor A/B 촉매 Pilot Test 결과 비교 완료. Vendor A 우세.", type: "manual" },
      { id: "n4", date: "2025-01-15", author: "박영희", content: "촉매 물성 비교 자료 정리 완료.", type: "manual" },
    ],
  },
  {
    id: "WL-003", title: "Opportunity Crude 도입 검토", unit: "Cross-Unit", category: "원유 최적화",
    priority: "high", status: "under-review", owner: "Planning", progress: 20,
    description: "중동 외 지역 Opportunity Crude 도입 가능성 검토. Crude Assay 분석, Blending 시뮬레이션, 부식/오염 영향 평가.",
    expectedBenefit: "₩12B/yr", estimatedCost: "₩500M",
    startDate: "2025-02", targetDate: "2025-12",
    linkedTickets: [],
    notes: [
      { id: "n5", date: "2025-02-08", author: "이민수", content: "Crude Assay 3건 수령. LP 모델 입력 준비 중.", type: "manual" },
    ],
  },
  {
    id: "WL-004", title: "R-2001 Catalyst Replacement (2025 TA)", unit: "HCR", category: "TA 정비",
    priority: "critical", status: "approved", owner: "Maintenance", progress: 45,
    description: "HCR Reactor R-2001의 촉매 교체. WABT 상승 추세로 EOR 도달 예상. 2025 TA 기간 중 교체 예정.",
    expectedBenefit: "생산성 회복", estimatedCost: "₩15B", duration: "14일",
    startDate: "2025-03", targetDate: "2025-04",
    linkedTickets: [
      { id: "1", title: "HCR 촉매 교체 검토", status: "In Progress", ticketType: "Improvement" },
    ],
    notes: [
      { id: "n6", date: "2025-02-01", author: "김철수", content: "촉매 발주 완료. Vendor 납기 3월 예상.", type: "manual" },
    ],
  },
  {
    id: "WL-005", title: "CDU Energy Optimization (Pinch Analysis)", unit: "CDU", category: "에너지 최적화",
    priority: "medium", status: "in-progress", owner: "Process Eng.", progress: 30,
    description: "CDU 열교환 네트워크 Pinch Analysis 기반 에너지 최적화. 연료가스 절감 및 CO2 배출 저감 목표.",
    expectedBenefit: "₩3.2B/yr",
    startDate: "2025-02", targetDate: "2025-08",
    linkedTickets: [
      { id: "2", title: "E-101 세정 계획", status: "Open", ticketType: "Change" },
    ],
    notes: [
      { id: "n7", date: "2025-01-30", author: "김철수", content: "Pinch Analysis 완료. 최적 열교환 네트워크 도출.", type: "manual" },
    ],
  },
  {
    id: "WL-006", title: "DCS Migration Phase 2", unit: "Cross-Unit", category: "DCS/계측",
    priority: "medium", status: "planning", owner: "DX Team", progress: 10,
    description: "DCS 마이그레이션 2단계. HCR/CCR 영역. 기존 DCS → 신규 시스템 전환.",
    estimatedCost: "₩5B", duration: "21일",
    startDate: "2026-01", targetDate: "2026-03",
    linkedTickets: [],
    notes: [],
  },
  {
    id: "WL-007", title: "VDU Yield Improvement", unit: "VDU", category: "수율 개선",
    priority: "medium", status: "planning", owner: "Process Eng.", progress: 10,
    description: "VDU 수율 개선을 위한 운전 최적화. Tray 교체 및 운전 조건 변경을 통한 HVGO 수율 2% 향상 목표.",
    expectedBenefit: "₩5.1B/yr",
    startDate: "2025-03", targetDate: "2025-09",
    linkedTickets: [],
    notes: [],
  },
  {
    id: "WL-008", title: "CCR Naphtha Re-routing Optimization", unit: "CCR", category: "처리량 증대",
    priority: "high", status: "completed", owner: "Operations", progress: 100,
    description: "CCR Naphtha Re-routing 최적화를 통한 처리량 증대. Feed 경로 변경 및 운전 조건 최적화.",
    expectedBenefit: "₩2.8B/yr",
    startDate: "2025-01", targetDate: "2025-03",
    linkedTickets: [
      { id: "test-3", title: "CCR Reactor Inlet Temp 상향 테스트", status: "Open", ticketType: "ProcessTest" },
    ],
    notes: [
      { id: "n8", date: "2025-03-05", author: "이운전", content: "프로젝트 완료. Naphtha Re-routing 효과 검증 완료.", type: "status-change" },
    ],
  },
]
