"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search, FileText, AlertTriangle, CheckCircle, ChevronRight,
  ArrowLeft, Tag, Layers, Users, MessageSquare, Clock, User,
  ExternalLink, Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ========= Closed Events / Alerts ========= */
const CLOSED_EVENTS = [
  { id: "EVT-2024-0089", title: "VDU H-1001 Heater Trip", process: "VDU", severity: "high" as const, date: "2025-01-31", closedDate: "2025-02-02", operator: "최지훈",
    rootCause: "Flame Scanner 오작동으로 인한 Heater Trip. 수동 Reset 후 정상 복구.",
    resolution: "Flame Scanner 교체 및 Logic 보완 조치",
    tags: ["Heater Trip", "Flame Scanner", "VDU"],
    timeline: [
      { time: "09:30", action: "H-1001 Heater Trip 발생. Flame Scanner #2 오작동 감지." },
      { time: "09:35", action: "비상 감량 시작 (80% -> 60%). 운전팀 현장 출동." },
      { time: "09:50", action: "Flame Scanner #2 상태 확인 - Lens Fouling 발견." },
      { time: "10:15", action: "Flame Scanner Lens 세정 후 수동 Reset 시도." },
      { time: "10:45", action: "Heater 재점화 성공. 정상 운전 복구 시작." },
      { time: "12:00", action: "Feed 100% 복구 완료." },
    ],
    impactAnalysis: "비계획 감량 4시간. 생산 손실 약 1,200만원. 제품 Off-spec 발생 없음.",
    preventiveMeasures: ["Flame Scanner Lens 주기 점검 추가 (월 1회)", "Flame Scanner Logic에 Time Delay 추가 (3초)", "예비 Flame Scanner 확보 (2set)"],
    relatedReport: "RPT-T01" },
  { id: "EVT-2024-0085", title: "HCR Reactor 온도 이상 상승", process: "HCR", severity: "high" as const, date: "2025-01-20", closedDate: "2025-01-25", operator: "김철수",
    rootCause: "Feed Sulfur 함량 급등에 따른 발열 반응 증가",
    resolution: "Feed 블렌딩 비율 조정 및 WABT 모니터링 강화",
    tags: ["WABT", "촉매", "온도"],
    timeline: [
      { time: "Day 1 06:00", action: "TI-2101 온도 Alert 발생 (380도 -> 388도, 8시간 상승)." },
      { time: "Day 1 08:00", action: "Feed 분석 결과: Sulfur 0.85% -> 1.05% 급등 확인." },
      { time: "Day 1 10:00", action: "Feed Blend 비율 긴급 조정 (Arab Medium 60% -> 45%)." },
      { time: "Day 2 14:00", action: "Reactor 온도 안정화 확인 (382도)." },
      { time: "Day 5", action: "모니터링 종료. 이벤트 종결." },
    ],
    impactAnalysis: "촉매 Aging 가속 약 2주분 추정. 정상 운전 복구 5일 소요.",
    preventiveMeasures: ["Feed Sulfur 실시간 분석기 설치 검토", "WABT Alert 기준 강화 (385도 -> 383도)", "AI 모델 Feed Quality 변수 반영"],
    relatedReport: "RPT-T03" },
  { id: "EVT-2024-0081", title: "CDU E-101 UA값 급격 저하", process: "CDU", severity: "medium" as const, date: "2025-01-15", closedDate: "2025-01-18", operator: "박민수",
    rootCause: "Shell Side Fouling 가속화 (Crude Blend 변경 영향)",
    resolution: "Chemical Cleaning 실시, 세정 주기 단축 결정",
    tags: ["Fouling", "열교환기", "세정"],
    timeline: [
      { time: "Day 1", action: "UA 모니터링에서 급격 저하 감지 (485 -> 380, 2주간)." },
      { time: "Day 2", action: "Crude Blend 변경(Arab Heavy 도입) 시점과 상관관계 확인." },
      { time: "Day 3", action: "Chemical Cleaning 실시 (12시간). UA 485 회복." },
    ],
    impactAnalysis: "Heater Duty 12% 증가. 연료 추가 비용 약 800만원/월.",
    preventiveMeasures: ["세정 주기 4개월 -> 3개월 단축", "Crude Blend 변경 시 Fouling Rate 사전 예측"],
    relatedReport: "RPT-T02" },
  { id: "EVT-2024-0078", title: "FCC Regenerator 온도 편차", process: "FCC", severity: "medium" as const, date: "2025-01-10", closedDate: "2025-01-13", operator: "이연구원",
    rootCause: "Air Distributor 부분 막힘으로 인한 불균일 연소",
    resolution: "Air Grid 점검 및 TA Scope 반영",
    tags: ["FCC", "Regenerator", "온도편차"],
    timeline: [
      { time: "Day 1", action: "다점 온도 편차 35도 확인 (정상 15도 이내)." },
      { time: "Day 2", action: "Air Flow 분석: 특정 Zone 유량 부족 확인." },
      { time: "Day 3", action: "Air Flow 재분배 수행. 편차 20도로 감소." },
    ],
    impactAnalysis: "촉매 국부 과열에 의한 수명 단축 우려. TA Scope 반영.",
    preventiveMeasures: ["Air Grid TA 교체 Scope 확정", "Thermocouple 추가 설치 (2점)"] },
  { id: "EVT-2024-0075", title: "CCR Net Gas Compressor 진동 상승", process: "CCR", severity: "low" as const, date: "2025-01-05", closedDate: "2025-01-07", operator: "정수민",
    rootCause: "Bearing 마모에 의한 진동 Level 상승",
    resolution: "Bearing 교체 (예비품 사용), PM 주기 변경",
    tags: ["회전기계", "진동", "Bearing"],
    timeline: [
      { time: "Day 1 14:00", action: "진동 Alert 발생 (5.2 -> 7.5 mm/s)." },
      { time: "Day 1 16:00", action: "Bearing Temp 동반 상승 확인. Standby 전환 결정." },
      { time: "Day 2", action: "Bearing 분해 검사. Inner Race 마모 확인." },
      { time: "Day 2 22:00", action: "Bearing 교체 완료. 시운전 정상." },
    ],
    impactAnalysis: "Standby 전환으로 생산 영향 없음. 정비 비용 약 500만원.",
    preventiveMeasures: ["PM 주기 12개월 -> 9개월 변경", "Vibration 연속 모니터링 시스템 도입 검토"],
    relatedReport: "RPT-T09" },
  { id: "EVT-2024-0070", title: "SRU Tail Gas Analyzer 이상", process: "SRU", severity: "medium" as const, date: "2024-12-28", closedDate: "2024-12-30", operator: "한엔지니어",
    rootCause: "Analyzer Sample Line 결빙",
    resolution: "Heat Tracing 보강 및 동절기 관리 절차 수정",
    tags: ["Analyzer", "동절기", "SRU"],
    timeline: [
      { time: "Day 1 03:00", action: "외기 -12도. Analyzer Reading 비정상 (Frozen)." },
      { time: "Day 1 09:00", action: "Heat Tracing 접촉 불량 2개소 확인." },
      { time: "Day 2", action: "Heat Tracing 교체 및 보온재 보수 완료." },
    ],
    impactAnalysis: "환경 모니터링 공백 약 30시간. 수동 분석으로 대체.",
    preventiveMeasures: ["Heat Tracing 전수 점검 (동절기 전)", "Analyzer Shelter 설치 검토"],
    relatedReport: "RPT-T06" },
  { id: "EVT-2024-0065", title: "HCR HP Separator Level 이상", process: "HCR", severity: "high" as const, date: "2024-12-15", closedDate: "2024-12-20", operator: "김철수",
    rootCause: "Level Transmitter Drift로 실제 Level 과대 표시",
    resolution: "LT 교정 및 백업 LT 설치 완료",
    tags: ["Level", "계기", "HCR"],
    timeline: [
      { time: "Day 1", action: "운전원 수동 보정 중 Level 불일치 보고." },
      { time: "Day 2", action: "Sensing Line 내 Process Fluid 고화 확인." },
      { time: "Day 5", action: "Sensing Line 교체 + 백업 LT 설치 완료." },
    ],
    impactAnalysis: "안전 계기 신뢰성 이슈. 백업 LT 미설치 상태에서 5일간 수동 운전.",
    preventiveMeasures: ["Critical Level에 LT 이중화 필수 (TA Scope)", "교정 주기 6개월 -> 3개월"],
    relatedReport: "RPT-T07" },
  { id: "EVT-2024-0060", title: "CDU Crude Feed Pump 성능 저하", process: "CDU", severity: "low" as const, date: "2024-12-10", closedDate: "2024-12-12", operator: "박민수",
    rootCause: "Impeller 마모에 의한 Head 감소",
    resolution: "예비 펌프 전환 후 임펠러 교체",
    tags: ["펌프", "회전기계", "CDU"],
    timeline: [
      { time: "Day 1", action: "Pump Discharge Pressure 저하 감지. Performance Curve 대비 -15%." },
      { time: "Day 1 14:00", action: "Standby Pump 전환." },
      { time: "Day 2", action: "Impeller 분해검사 - Sand에 의한 침식 마모 확인." },
    ],
    impactAnalysis: "Standby 전환으로 영향 없음.",
    preventiveMeasures: ["Crude 내 Sand Filter 설치 검토", "Impeller 재질 업그레이드 (TA 시)"] },
  { id: "EVT-2024-0055", title: "VDU HVGO Stripper Level 변동", process: "VDU", severity: "medium" as const, date: "2024-12-01", closedDate: "2024-12-04", operator: "최지훈",
    rootCause: "Control Valve 포지셔너 불량",
    resolution: "CV 포지셔너 교체 및 튜닝",
    tags: ["Control Valve", "Level", "VDU"],
    timeline: [
      { time: "Day 1", action: "HVGO Stripper Level 변동폭 증가 (정상 +/-2% -> +/-8%)." },
      { time: "Day 2", action: "CV Stroke Test: 포지셔너 응답 불량 확인." },
      { time: "Day 3-4", action: "Online CV 교체 및 튜닝 완료." },
    ],
    impactAnalysis: "HVGO 품질 변동 소폭 발생. Blending으로 보정.",
    preventiveMeasures: ["CV PM 주기 설정 (연 1회)", "진동 환경 CV 포지셔너 내구성 강화"] },
  { id: "EVT-2024-0050", title: "FCC Slide Valve 동작 지연", process: "FCC", severity: "high" as const, date: "2024-11-20", closedDate: "2024-11-28", operator: "이연구원",
    rootCause: "Slide Valve Actuator 유압 누설",
    resolution: "Actuator O-ring 교체 및 유압 시스템 정비",
    tags: ["FCC", "Slide Valve", "유압"],
    timeline: [
      { time: "Day 1", action: "Slide Valve 응답 시간 지연 (2초 -> 8초)." },
      { time: "Day 3", action: "유압 배관 누설점 확인. O-ring 열화." },
      { time: "Day 8", action: "Kalrez O-ring 교체 후 정상 복구." },
    ],
    impactAnalysis: "Cat Circulation 불안정 8일간. 제품 수율 -0.5%.",
    preventiveMeasures: ["O-ring 소재 Viton -> Kalrez 변경", "유압 시스템 PM 연 1회"],
    relatedReport: "RPT-T08" },
]

/* ========= Operation Logs ========= */
const OP_LOGS = [
  { id: "LOG-0204-D", date: "2025-02-04", shift: "주간" as const, process: "HCR", operator: "김철수",
    summary: "정상 운전 유지. Feed Sulfur 0.85% 안정. WABT 380 deg.C 유지.",
    details: "전반적으로 안정 운전. Feed Sulfur 전일 대비 변동 없음(0.85%). WABT 380도 유지. Quench Gas Flow 정상. 촉매 활성도 양호. 특이사항 없음. 다음 교대 시 주의사항: TI-2001 트렌드 지속 감시.",
    highlights: ["촉매 활성도 양호", "Feed 변동 없음"], weather: "맑음 -2도",
    keyParams: [{ name: "WABT", value: "380", unit: "deg.C" }, { name: "Feed Sulfur", value: "0.85", unit: "%" }, { name: "H2/Oil", value: "1050", unit: "Nm3/m3" }] },
  { id: "LOG-0204-N", date: "2025-02-04", shift: "야간" as const, process: "CDU", operator: "박민수",
    summary: "Crude Blend 비율 변경 (Arab Medium 60% -> 55%). E-101 UA 모니터링 중.",
    details: "22:00 Crude Blend 비율 조정 시작. Arab Medium 60% -> 55%, Arab Light 25% -> 30%. 상압탑 온도 프로파일 안정. E-101 UA 현재 465 (전일 470, 소폭 하락 추세). Desalter 효율 정상.",
    highlights: ["Blend 변경", "UA 추이 관찰"], weather: "맑음 -5도",
    keyParams: [{ name: "E-101 UA", value: "465", unit: "W/m2K" }, { name: "Column Top", value: "112", unit: "deg.C" }] },
  { id: "LOG-0203-D", date: "2025-02-03", shift: "주간" as const, process: "HCR", operator: "이영희",
    summary: "TI-2001 온도 1.5도 상승 추세. Feed Sulfur 소폭 증가(0.85->0.92%). 모니터링 강화.",
    details: "06:00 교대 인수 시 TI-2001 트렌드 확인. 전일 대비 1.5도 상승. Feed 분석 결과 Sulfur 0.92% (전일 0.85%). 운전팀장 보고 완료. 1시간 주기 모니터링으로 전환. WABT AI 모델 확인: 현재 트렌드 유지 시 385도 도달 예상 2주 후.",
    highlights: ["온도 상승 추세", "Feed 황 증가"], weather: "흐림 0도",
    keyParams: [{ name: "TI-2001", value: "381.5", unit: "deg.C" }, { name: "Feed Sulfur", value: "0.92", unit: "%" }] },
  { id: "LOG-0203-N", date: "2025-02-03", shift: "야간" as const, process: "VDU", operator: "최지훈",
    summary: "정상 운전. HVGO Stripper Level 안정. Heater TMT 정상 범위.",
    details: "전 계통 정상 운전. HVGO Stripper Level +/-1.5% 이내. Heater TMT 최고점 485도 (Limit 530도, 여유 충분). Vacuum 25 mmHgA 유지. Ejector 정상.",
    highlights: ["안정 운전"], weather: "흐림 -3도",
    keyParams: [{ name: "TMT Max", value: "485", unit: "deg.C" }, { name: "Vacuum", value: "25", unit: "mmHgA" }] },
  { id: "LOG-0202-D", date: "2025-02-02", shift: "주간" as const, process: "CDU", operator: "박민수",
    summary: "정상 운전. Crude Blend 변경 완료(Arab Heavy 도입). 운전 안정.",
    details: "08:00 Crude Tank 전환 완료. Arab Heavy 10% 도입. Desalter 효율 정상(97%). 상압탑 온도 프로파일 변동 소폭 발생 후 1시간 내 안정화. 제품 품질 On-spec 확인.",
    highlights: ["Crude 변경 완료"], weather: "눈 -1도",
    keyParams: [{ name: "Desalter Eff.", value: "97", unit: "%" }] },
  { id: "LOG-0202-N", date: "2025-02-02", shift: "야간" as const, process: "FCC", operator: "이연구원",
    summary: "Cat/Oil Ratio 소폭 조정. Regenerator 온도 안정. Fresh Catalyst 보충 2톤.",
    details: "Cat/Oil Ratio 6.0 -> 6.2 조정. Gasoline 수율 +0.3% 확인. Regenerator 온도 698도 안정. Fresh Cat 2톤 보충 완료 (재고 8톤). E-Cat Activity 측정 결과 정상.",
    highlights: ["C/O 조정", "촉매 보충"], weather: "눈 -4도",
    keyParams: [{ name: "C/O Ratio", value: "6.2", unit: "-" }, { name: "Regen Temp", value: "698", unit: "deg.C" }] },
  { id: "LOG-0201-D", date: "2025-02-01", shift: "주간" as const, process: "VDU", operator: "최지훈",
    summary: "H-1001 Trip 발생 (09:30). Feed 감량 80% -> 60% 운전. 10:45 복구 완료.",
    details: "09:30 H-1001 Heater Trip 발생. Flame Scanner #2 오작동. 즉시 감량 운전 진입. 09:50 현장 확인 출동. Lens Fouling 발견. 10:15 Lens 세정 후 Reset 시도. 10:45 Heater 재점화 성공. 12:00 Feed 100% 복구. EVT-2024-0089 등록.",
    highlights: ["Heater Trip", "감량 운전", "복구"], weather: "흐림 1도",
    keyParams: [{ name: "감량 시간", value: "2.5", unit: "hr" }] },
  { id: "LOG-0201-N", date: "2025-02-01", shift: "야간" as const, process: "CCR", operator: "정수민",
    summary: "촉매 재생 완료. Regenerator 안정. Chloride Balance 정상.",
    details: "촉매 재생 사이클 정상 완료. Coke Burn 온도 510도 (최적). Chloride 주입량 정상. 재생 후 Activity 99.2% 확인.",
    highlights: ["촉매 재생 완료"], weather: "맑음 -3도",
    keyParams: [{ name: "Regen Temp", value: "510", unit: "deg.C" }, { name: "Activity", value: "99.2", unit: "%" }] },
  { id: "LOG-0131-D", date: "2025-01-31", shift: "주간" as const, process: "HCR", operator: "김철수",
    summary: "Feed Sulfur 함량 증가 추세 관찰 (0.80->0.85%). WABT 모니터링 강화.",
    details: "Feed 분석: Sulfur 0.80% -> 0.85% 상승 추세(3일간). WABT 380도 유지 중이나 트렌드 주시 필요. AI 모델 확인: 현재 추세 지속 시 Alert 기준(383도) 도달 약 3주 후.",
    highlights: ["Feed 황 증가", "모니터링 강화"], weather: "맑음 -2도",
    keyParams: [{ name: "Feed Sulfur", value: "0.85", unit: "%" }, { name: "WABT", value: "380", unit: "deg.C" }] },
  { id: "LOG-0131-N", date: "2025-01-31", shift: "야간" as const, process: "SRU", operator: "한엔지니어",
    summary: "정상 운전. SO2 Emission 정상 범위. Tail Gas 분석 정상.",
    details: "Tail Gas H2S 85ppm (Limit 150ppm). SO2 Emission 정상. H2S/SO2 Ratio 2.0 유지. Heat Tracing 보수 후 결빙 재발 없음.",
    highlights: ["환경 수치 정상"], weather: "맑음 -6도",
    keyParams: [{ name: "Tail Gas H2S", value: "85", unit: "ppm" }, { name: "H2S/SO2", value: "2.0", unit: "-" }] },
]

/* ========= Meetings / TOB ========= */
const MEETINGS = [
  { id: "MTG-0204", date: "2025-02-04", type: "Daily TOB" as const, title: "2/4 생산 TOB 회의", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "이영희", "박팀장", "기술파트장", "생산파트장", "안전담당", "환경담당"],
    summary: "전 공정 정상 운전. HCR Feed Sulfur 모니터링 지속. CDU Blend 비율 안정화 확인.",
    agenda: ["1. 전일 운전 현황 보고", "2. HCR Feed Sulfur 트렌드 검토", "3. CDU Crude Blend 변경 결과", "4. 금일 작업 계획"],
    decisions: ["HCR: Feed Sulfur 0.95% 초과 시 Blend 조정 즉시 시행", "CDU: 신규 Crude 도입 2월 중순 계획 - 사전 Assay 분석 요청"],
    actionItems: [{ assignee: "김철수", item: "HCR Feed Sulfur 모니터링 주기 유지 (1hr)" }, { assignee: "박민수", item: "신규 Crude Assay 요청 (Lab)" }],
    duration: "30분" },
  { id: "MTG-0203", date: "2025-02-03", type: "Daily TOB" as const, title: "2/3 생산 TOB 회의", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "박팀장", "기술파트장", "생산파트장", "안전담당"],
    summary: "VDU Heater Trip 복구 상황 공유. HCR TI-2001 온도 추세 논의.",
    agenda: ["1. VDU Heater Trip 복구 브리핑", "2. HCR 온도 트렌드 분석", "3. FCC 촉매 보충 계획", "4. 안전 사항"],
    decisions: ["VDU: Flame Scanner PM 주기 단축 (분기 -> 월)", "HCR: WABT 383도 초과 시 Alert 설정 완료 확인"],
    actionItems: [{ assignee: "최지훈", item: "Flame Scanner PM 절차서 업데이트" }, { assignee: "김철수", item: "WABT AI 모델 결과 주간 리뷰 보고 시 포함" }],
    duration: "45분" },
  { id: "MTG-0131", date: "2025-01-31", type: "Weekly Review" as const, title: "1월 5주차 주간 운전 리뷰", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "이영희", "박팀장", "기술파트장", "생산파트장", "안전담당", "환경담당", "정비파트장", "Lab팀장", "기획담당"],
    summary: "월간 KPI 중간 점검. FCC 수율 목표 대비 -1.2% 분석. CCR Catalyst 재생 결과 공유.",
    agenda: ["1. 주간 운전 실적 요약", "2. KPI 점검 (EII, OA, 수율)", "3. FCC 수율 Gap 분석", "4. CCR 촉매 재생 결과", "5. 안전/환경 사항", "6. 차주 계획"],
    decisions: ["FCC: C/O Ratio 최적화 스터디 착수 (이연구원)", "CCR: 재생 주기 2주 연장 시험 (정수민)", "차주 CDU Crude Blend 변경 확정"],
    actionItems: [{ assignee: "이연구원", item: "FCC C/O 최적화 스터디 계획서 제출 (2/7까지)" }, { assignee: "정수민", item: "CCR 재생 주기 연장 모니터링 계획" }],
    duration: "1시간" },
  { id: "MTG-0128", date: "2025-01-28", type: "Daily TOB" as const, title: "1/28 생산 TOB 회의", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "박팀장", "생산파트장", "안전담당"],
    summary: "전 공정 정상. SRU Analyzer 이상 후속 조치 완료 확인.",
    agenda: ["1. 운전 현황", "2. SRU Analyzer 복구 확인", "3. 동절기 관리 현황"],
    decisions: ["SRU: Heat Tracing 동절기 관리 강화 - 주간 점검 추가"],
    actionItems: [{ assignee: "한엔지니어", item: "Heat Tracing 점검 체크리스트 배포" }],
    duration: "25분" },
  { id: "MTG-0124", date: "2025-01-24", type: "Weekly Review" as const, title: "1월 4주차 주간 운전 리뷰", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "이영희", "박팀장", "기술파트장", "생산파트장", "안전담당", "정비파트장", "Lab팀장"],
    summary: "HCR HP Sep Level 이상 종결 브리핑. CDU 펌프 교체 결과.",
    agenda: ["1. HCR Level 이상 종결 보고", "2. CDU Pump 교체 결과", "3. 주간 KPI", "4. 차주 계획"],
    decisions: ["HCR: Level Transmitter 이중화 TA Scope 반영 확정", "CDU: 예비 펌프 정비 계획 수립 (2월 중)"],
    actionItems: [{ assignee: "김철수", item: "LT 이중화 설계 검토 요청 (계장팀)" }, { assignee: "박민수", item: "예비 펌프 정비 일정 수립" }],
    duration: "50분" },
  { id: "MTG-0120-SP", date: "2025-01-20", type: "Special" as const, title: "HCR 온도 이상 긴급 회의", process: "HCR", attendees: ["김철수", "이영희", "박팀장", "기술파트장", "생산파트장", "Lab팀장", "김지수(AI)", "공장장"],
    summary: "HCR Reactor 온도 이상 상승 원인 분석 및 대응 방안 논의.",
    agenda: ["1. 상황 브리핑", "2. Feed 분석 결과", "3. AI 모델 예측 결과", "4. 대응 방안 논의", "5. 향후 모니터링 계획"],
    decisions: ["Feed Blend 즉시 조정 (Arab Medium 60% -> 45%)", "WABT 모니터링 주기 1시간 -> 30분 전환", "AI 모델 Feed Quality 변수 추가 검토 착수"],
    actionItems: [{ assignee: "김철수", item: "Feed Blend 조정 즉시 시행" }, { assignee: "김지수", item: "AI 모델 Feed Quality 반영 검토 (1주 내)" }, { assignee: "Lab팀장", item: "Feed Sulfur 분석 주기 강화 (4hr -> 2hr)" }],
    duration: "1시간 30분" },
  { id: "MTG-0117", date: "2025-01-17", type: "Weekly Review" as const, title: "1월 3주차 주간 운전 리뷰", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "박팀장", "기술파트장", "생산파트장", "안전담당", "정비파트장", "Lab팀장"],
    summary: "CDU E-101 세정 결과 공유. FCC Regenerator 온도 편차 조사 진행 현황.",
    agenda: ["1. CDU 세정 결과 보고", "2. FCC 온도 편차 조사 현황", "3. 주간 KPI", "4. 차주 계획"],
    decisions: ["CDU: 세정 주기 4개월 -> 3개월 단축 확정", "FCC: Air Grid TA 점검 Scope 확정"],
    actionItems: [{ assignee: "박민수", item: "세정 주기 변경 반복성 가이드 업데이트" }, { assignee: "이연구원", item: "Air Grid 교체 사양 검토" }],
    duration: "55분" },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU"]

type DetailType = { kind: "event"; data: typeof CLOSED_EVENTS[0] } | { kind: "log"; data: typeof OP_LOGS[0] } | { kind: "meeting"; data: typeof MEETINGS[0] }

export default function CasesPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "events"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [detail, setDetail] = useState<DetailType | null>(null)

  const filteredEvents = CLOSED_EVENTS.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processFilter !== "전체" && e.process !== processFilter) return false
    return true
  })
  const filteredLogs = OP_LOGS.filter(l => {
    if (search && !l.summary.toLowerCase().includes(search.toLowerCase())) return false
    if (processFilter !== "전체" && l.process !== processFilter) return false
    return true
  })
  const filteredMeetings = MEETINGS.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.summary.toLowerCase().includes(search.toLowerCase())) return false
    if (processFilter !== "전체" && m.process !== processFilter && m.process !== "전체") return false
    return true
  })

  // Detail view
  if (detail) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <Button variant="ghost" size="sm" className="gap-1.5 mb-2 -ml-2" onClick={() => setDetail(null)}>
                <ArrowLeft className="h-4 w-4" />뒤로
              </Button>

              {detail.kind === "event" && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{detail.data.id}</span>
                    <Badge className={cn("text-[10px]",
                      detail.data.severity === "high" && "bg-red-100 text-red-700 border-red-200",
                      detail.data.severity === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                      detail.data.severity === "low" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                    )} variant="outline">{detail.data.severity === "high" ? "상" : detail.data.severity === "medium" ? "중" : "하"}</Badge>
                    <Badge variant="outline" className="text-[10px]">{detail.data.process}</Badge>
                    <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">종결</Badge>
                  </div>
                  <h1 className="text-lg font-semibold mt-1">{detail.data.title}</h1>
                </div>
              )}
              {detail.kind === "log" && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{detail.data.id}</span>
                    <Badge variant="outline" className="text-[10px]">{detail.data.shift}</Badge>
                    <Badge variant="outline" className="text-[10px]">{detail.data.process}</Badge>
                  </div>
                  <h1 className="text-lg font-semibold mt-1">{detail.data.date} {detail.data.shift} 운영 로그</h1>
                </div>
              )}
              {detail.kind === "meeting" && (
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]",
                      detail.data.type === "Daily TOB" && "bg-blue-50 text-blue-700 border-blue-200",
                      detail.data.type === "Weekly Review" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                      detail.data.type === "Special" && "bg-red-50 text-red-700 border-red-200",
                    )} variant="outline">{detail.data.type}</Badge>
                  </div>
                  <h1 className="text-lg font-semibold mt-1">{detail.data.title}</h1>
                </div>
              )}
            </div>
          </header>

          <main className="p-6 max-w-4xl mx-auto space-y-4">
            {/* Event Detail */}
            {detail.kind === "event" && (() => { const e = detail.data; return (
              <>
                <Card><CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-xs text-muted-foreground">발생일</span><p className="font-medium mt-0.5">{e.date}</p></div>
                    <div><span className="text-xs text-muted-foreground">종결일</span><p className="font-medium mt-0.5">{e.closedDate}</p></div>
                    <div><span className="text-xs text-muted-foreground">담당자</span><p className="font-medium mt-0.5">{e.operator}</p></div>
                    {e.relatedReport && <div><span className="text-xs text-muted-foreground">관련 레포트</span><p className="font-medium text-blue-600 mt-0.5">{e.relatedReport}</p></div>}
                  </div>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2">근본 원인</h3>
                  <p className="text-sm leading-relaxed">{e.rootCause}</p>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2">조치 내역</h3>
                  <p className="text-sm leading-relaxed p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">{e.resolution}</p>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-3">타임라인</h3>
                  <div className="relative pl-4 border-l-2 border-muted space-y-3">
                    {e.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className={cn("absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2",
                          i === e.timeline.length - 1 ? "bg-emerald-500 border-emerald-500" : "bg-background border-muted-foreground/30"
                        )} />
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{t.time}</span>
                          <span className="text-sm">{t.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2">영향 분석</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{e.impactAnalysis}</p>
                </CardContent></Card>

                <Card className="border-amber-200 bg-amber-50/30"><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" />재발 방지 대책</h3>
                  <div className="space-y-1.5">
                    {e.preventiveMeasures.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="h-5 w-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </CardContent></Card>

                <div className="flex items-center gap-2 flex-wrap">{e.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
              </>
            )})()}

            {/* Log Detail */}
            {detail.kind === "log" && (() => { const l = detail.data; return (
              <>
                <Card><CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-xs text-muted-foreground">날짜</span><p className="font-medium mt-0.5">{l.date}</p></div>
                    <div><span className="text-xs text-muted-foreground">교대</span><p className="font-medium mt-0.5">{l.shift}</p></div>
                    <div><span className="text-xs text-muted-foreground">운전원</span><p className="font-medium mt-0.5">{l.operator}</p></div>
                    <div><span className="text-xs text-muted-foreground">날씨</span><p className="font-medium mt-0.5">{l.weather}</p></div>
                  </div>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2">운전 상세</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{l.details}</p>
                </CardContent></Card>

                {l.keyParams && l.keyParams.length > 0 && (
                  <Card><CardContent className="pt-4 pb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3">주요 파라미터</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {l.keyParams.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/40 text-center">
                          <div className="text-xs text-muted-foreground">{p.name}</div>
                          <div className="text-lg font-bold mt-0.5">{p.value}<span className="text-xs text-muted-foreground ml-1">{p.unit}</span></div>
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                )}

                <div className="flex items-center gap-2 flex-wrap">{l.highlights.map(h => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}</div>
              </>
            )})()}

            {/* Meeting Detail */}
            {detail.kind === "meeting" && (() => { const m = detail.data; return (
              <>
                <Card><CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-xs text-muted-foreground">일시</span><p className="font-medium mt-0.5">{m.date}</p></div>
                    <div><span className="text-xs text-muted-foreground">소요 시간</span><p className="font-medium mt-0.5">{m.duration}</p></div>
                    <div><span className="text-xs text-muted-foreground">참석자</span><p className="font-medium mt-0.5">{m.attendees.length}명</p></div>
                    <div><span className="text-xs text-muted-foreground">유형</span><p className="font-medium mt-0.5">{m.type}</p></div>
                  </div>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2">회의 요약</h3>
                  <p className="text-sm leading-relaxed">{m.summary}</p>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">안건</h3>
                  <div className="space-y-1.5">{m.agenda.map((a, i) => (
                    <div key={i} className="text-sm p-2 rounded bg-muted/40">{a}</div>
                  ))}</div>
                </CardContent></Card>

                <Card className="border-blue-200 bg-blue-50/30"><CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2 text-blue-800">주요 결정사항</h3>
                  <div className="space-y-1.5">{m.decisions.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-blue-900">{d}</span>
                    </div>
                  ))}</div>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">Action Items</h3>
                  <div className="space-y-2">{m.actionItems.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/40">
                      <Badge variant="outline" className="text-[10px] shrink-0">{a.assignee}</Badge>
                      <span>{a.item}</span>
                    </div>
                  ))}</div>
                </CardContent></Card>

                <Card><CardContent className="pt-4 pb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">참석자 ({m.attendees.length}명)</h3>
                  <div className="flex flex-wrap gap-1.5">{m.attendees.map(a => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}</div>
                </CardContent></Card>
              </>
            )})()}
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
            <h1 className="text-lg font-semibold">운영사례 / 케이스</h1>
            <p className="text-sm text-muted-foreground mt-1">종결 이벤트, 운영 로그, 생산 TOB, 회의록 등 자산화된 업무 내역을 조회합니다</p>
          </div>
        </header>

        <main className="p-6 space-y-4">
          <Card><CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={processFilter} onValueChange={setProcessFilter}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="events" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />종결 이벤트/Alert <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredEvents.length}</Badge></TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5"><Layers className="h-3.5 w-3.5" />운영 로그 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredLogs.length}</Badge></TabsTrigger>
              <TabsTrigger value="meetings" className="gap-1.5"><Users className="h-3.5 w-3.5" />회의록/TOB <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredMeetings.length}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-4 space-y-2">
              {filteredEvents.map(evt => (
                <Card key={evt.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setDetail({ kind: "event", data: evt })}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{evt.id}</span>
                          <span className="text-sm font-medium truncate">{evt.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{evt.rootCause}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{evt.process}</Badge>
                      <Badge className={cn("text-[10px] shrink-0",
                        evt.severity === "high" && "bg-red-100 text-red-700 border-red-200",
                        evt.severity === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                        evt.severity === "low" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                      )} variant="outline">{evt.severity === "high" ? "상" : evt.severity === "medium" ? "중" : "하"}</Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">{evt.closedDate}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="logs" className="mt-4 space-y-2">
              {filteredLogs.map(log => (
                <Card key={log.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setDetail({ kind: "log", data: log })}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{log.id}</span>
                          <Badge variant="outline" className="text-[10px]">{log.shift}</Badge>
                          <Badge variant="outline" className="text-[10px]">{log.process}</Badge>
                          <span className="text-xs text-muted-foreground">{log.operator}</span>
                        </div>
                        <p className="text-sm mt-0.5 truncate">{log.summary}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{log.date}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="meetings" className="mt-4 space-y-2">
              {filteredMeetings.map(mtg => (
                <Card key={mtg.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setDetail({ kind: "meeting", data: mtg })}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px]",
                            mtg.type === "Daily TOB" && "bg-blue-50 text-blue-700 border-blue-200",
                            mtg.type === "Weekly Review" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                            mtg.type === "Special" && "bg-red-50 text-red-700 border-red-200",
                          )} variant="outline">{mtg.type}</Badge>
                          <span className="text-sm font-medium truncate">{mtg.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{mtg.summary}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{mtg.attendees.length}명</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{mtg.duration}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">{mtg.date}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
