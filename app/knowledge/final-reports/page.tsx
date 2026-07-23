"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search, FileBarChart, FileText, ChevronRight, Download, ArrowLeft,
  CheckCircle, Star, Calendar, User, Tag, ExternalLink, Eye,
  Wrench, AlertTriangle, Settings, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FinalReport {
  id: string
  title: string
  category: "improvement" | "troubleshooting" | "ta-result" | "oop-monthly"
  process: string
  date: string
  year: number
  author: string
  approver: string
  relatedTicketId?: string
  tags: string[]
  summary: string
  assetValue: "high" | "medium"
  sections: { title: string; content: string }[]
  relatedDocs?: string[]
  lessons?: string[]
}

const REPORTS: FinalReport[] = [
  // -- 개선과제 --
  { id: "RPT-I01", title: "HCR 수율 최적화 LP Vector 업데이트", category: "improvement", process: "HCR", date: "2024-12-10", year: 2024, author: "박엔지니어", approver: "박팀장", relatedTicketId: "TKT-2024-0120", tags: ["수율", "LP", "Vector"], summary: "HCR LP Vector 재산출. 경유/등유 비율 변경에 따른 마진 최적화 방안 도출. 연간 약 12억원 마진 개선 예상.", assetValue: "high",
    sections: [
      { title: "배경 및 목적", content: "기존 LP Vector는 2022년 기준으로 3년 경과. Feed Slate 변경 및 촉매 교체 반영 필요. Arabian Medium 비중 증가에 따른 수율 구조 변화 반영." },
      { title: "분석 방법", content: "Process Simulator(PRO/II) 기반 Case Study 수행. 경유/등유 비율 5개 시나리오, Temperature Swing 3개 조건 교차 분석. AI 모델 예측값과 교차 검증." },
      { title: "결과 요약", content: "최적 운전점: Reactor Inlet 378deg.C, H2/Oil 1050 Nm3/m3. 기존 대비 경유 수율 +1.8%, 등유 수율 -0.5%. Margin 순증 연간 12억원." },
      { title: "경제성 분석", content: "투입 비용: 분석 인건비 약 2,000만원. 연간 절감: 12억원. Payback 즉시. ROI >> 100%." },
    ],
    relatedDocs: ["OG-001 HCR Operation Guide", "AI-MDL-H01 수율 예측 모델"],
    lessons: ["LP Vector는 2년 주기 업데이트 권고", "Feed Slate 변경 시 즉시 재산출 필요"] },
  { id: "RPT-I02", title: "Opportunity Crude 도입 운전 영향 분석", category: "improvement", process: "CDU", date: "2024-08-10", year: 2024, author: "김철수", approver: "박팀장", relatedTicketId: "TKT-2024-0098", tags: ["Opportunity Crude", "Blending", "마진"], summary: "Basrah Heavy 30% Blending 시 Desalter 효율 5% 저하 확인. 최대 35%까지 허용 가능. 연간 원유 비용 약 80억원 절감 가능.", assetValue: "high",
    sections: [
      { title: "목적", content: "저가 기회 원유 도입 확대를 위한 운전 영향 평가. Basrah Heavy 비율 단계적 증가 시 품질/설비 영향 분석." },
      { title: "테스트 결과", content: "20%, 25%, 30%, 35% 4단계 테스트 수행. 30%까지 제품 품질 기준 충족. 35%에서 Naphtha Sulfur 기준 근접." },
      { title: "설비 영향", content: "Desalter 효율 30%시 5% 저하 (허용범위). Overhead Corrosion IOW 정상. Preheat Train Fouling Rate 10% 증가." },
    ],
    relatedDocs: ["IOW-002 CDU Overhead Corrosion IOW", "OG-002 CDU Operation Guide"],
    lessons: ["35% 초과 시 Naphtha HDS 부하 증가 예상", "Desalter Chemical 주입량 조정 필요"] },
  { id: "RPT-I03", title: "Bio Diesel 원료 혼합비 최적화 테스트", category: "improvement", process: "HCR", date: "2024-06-20", year: 2024, author: "박연구원", approver: "박팀장", relatedTicketId: "TKT-2024-0072", tags: ["Bio Diesel", "혼합비", "탄소중립"], summary: "Bio Feed 5/10/15% 혼합 시 제품 품질 및 촉매 영향 평가. 10%까지 무리 없이 운전 가능 확인.", assetValue: "high",
    sections: [
      { title: "배경", content: "탄소중립 로드맵에 따른 Bio Feed 혼합 운전 검증. 3개 비율 조건에서 품질/촉매 영향 정량 평가." },
      { title: "실험 결과", content: "10%: 제품 품질 기준 충족, WABT 영향 미미(+0.5도). 15%: Cloud Point 기준 근접, 동절기 리스크." },
    ],
    lessons: ["동절기 10% / 하절기 15%까지 허용 가능", "Bio Feed 사전 분석 필수 (Moisture, Metal)"] },
  { id: "RPT-I04", title: "FCC 신규 촉매 후보 3종 Pilot 평가", category: "improvement", process: "FCC", date: "2023-11-25", year: 2023, author: "이엔지니어", approver: "박팀장", relatedTicketId: "TKT-2023-0156", tags: ["FCC", "Pilot", "촉매선정"], summary: "Grace, BASF, Albemarle 3사 촉매 Pilot 비교. Grace 촉매 가솔린 수율 +1.2%, Bottoms 감소 -0.8%로 최적.", assetValue: "high",
    sections: [
      { title: "평가 방법", content: "ACE Pilot 장치 이용 표준 조건 평가. Feed: Paraffinic VGO 기준. Cat/Oil Ratio 5.0/6.0/7.0 3조건." },
      { title: "결과 비교", content: "Grace: Gasoline +1.2%, Bottoms -0.8%. BASF: Gasoline +0.8%, Bottoms -0.3%. Albemarle: LPG 선택성 우수." },
      { title: "경제성", content: "Grace 선정 시 연간 마진 +15억원 예상. 촉매 단가 차이 반영 후 순효과 +12억원." },
    ],
    lessons: ["Pilot 평가와 상업 운전 Gap 모니터링 필요", "Metal 내성은 BASF가 우수 - 고금속 Feed 시 재평가"] },
  { id: "RPT-I05", title: "에너지 절감 - CDU Preheat Train 최적화", category: "improvement", process: "CDU", date: "2024-05-15", year: 2024, author: "이철수", approver: "박팀장", relatedTicketId: "TKT-2024-0055", tags: ["에너지", "Preheat", "열효율"], summary: "Preheat Train 열교환 순서 변경 및 Fouling 관리 강화로 Heater Duty 8% 감소. 연간 약 6억원 연료비 절감.", assetValue: "high",
    sections: [
      { title: "현황 분석", content: "Pinch Analysis 기반 현 Preheat Train 열효율 72%. 이론 최적 대비 8%p Gap 존재." },
      { title: "개선 방안", content: "E-103/E-105 순서 변경, E-101 세정 주기 단축(4개월->3개월). 신규 HEX 1기 추가 검토(TA Scope)." },
    ],
    lessons: ["Fouling 관리가 에너지 절감의 핵심", "Crude Blend 변경 시 열수지 재계산 필수"] },

  // -- 트러블슈팅 --
  { id: "RPT-T01", title: "VDU Heater Coking 진행률 분석 및 Decoking 시점 권고", category: "troubleshooting", process: "VDU", date: "2024-08-15", year: 2024, author: "최지훈", approver: "박팀장", relatedTicketId: "TKT-2024-0085", tags: ["Coking", "Heater", "TMT"], summary: "VDU Heater TMT 상승 추이로부터 Coking 진행률 산출. 현재 65% 수준, 2025년 TA까지 운전 가능하나 TMT 관리 필요.", assetValue: "high",
    sections: [
      { title: "현상", content: "VDU Heater Tube Metal Temperature (TMT) 3개월간 15도 상승. Coking 진행 의심." },
      { title: "분석", content: "TMT Trend 외삽 분석. 현재 Coking Rate 0.5도/week. Limit(530도) 도달 예상: 약 40주 후." },
      { title: "권고 사항", content: "2025 TA에서 Mechanical Decoking 시행. TA 전까지 운전 온도 5도 하향 운전 권고." },
    ],
    lessons: ["TMT 주간 모니터링 강화 필요", "Crude Blend 변경 시 Coking Rate 재계산"] },
  { id: "RPT-T02", title: "E-101 화학 세정 전후 UA값 비교 분석", category: "troubleshooting", process: "CDU", date: "2024-11-18", year: 2024, author: "박민수", approver: "박팀장", relatedTicketId: "TKT-2024-0108", tags: ["Fouling", "화학세정", "UA값"], summary: "E-101 열교환기 화학 세정 효과 분석. 세정 전 UA 320 -> 세정 후 UA 485로 회복(회복률 85%). 세정 주기 3개월 권고.", assetValue: "high",
    sections: [
      { title: "배경", content: "E-101 UA값 설계 대비 55% 수준으로 저하. 에너지 손실 연간 약 4억원 추정." },
      { title: "세정 결과", content: "Chemical Cleaning(산/알칼리 2단계) 12시간 수행. UA 320->485 회복. 설계 대비 85%." },
      { title: "경제성", content: "세정 비용 약 3,000만원. 에너지 절감 효과 분기당 약 1억원. ROI 3.3배." },
    ],
    lessons: ["Crude Blend 변경 후 Fouling Rate 가속 확인", "세정 주기 4개월->3개월 단축 결정"] },
  { id: "RPT-T03", title: "HCR WABT 상승 원인 분석 및 EOR 시점 예측", category: "troubleshooting", process: "HCR", date: "2024-12-22", year: 2024, author: "김철수", approver: "박팀장", relatedTicketId: "TKT-2024-0120", tags: ["WABT", "촉매수명", "EOR"], summary: "Arabian Medium 전환 후 HCR 촉매 WABT 상승 추이 분석. 기존 대비 약 15% 빠른 Aging 속도 확인. EOR 시점 2025년 8월로 예측.", assetValue: "high",
    sections: [
      { title: "현상", content: "Arabian Medium 비중 확대 후 WABT 상승 기울기 변화 (0.3도/week -> 0.35도/week)." },
      { title: "원인 분석", content: "Feed Nitrogen 증가에 의한 촉매 피독 가속. Metal(Ni+V) 축적량도 예상보다 10% 높음." },
      { title: "EOR 예측", content: "현 추세 유지 시 EOR(WABT 410도 기준) 도달 예상: 2025년 8월. AI 모델 예측과 일치." },
    ],
    relatedDocs: ["AI-MDL-H01 WABT 예측 모델", "RG-004 촉매 활성도 월간 평가"],
    lessons: ["Feed 변경 시 촉매 수명 즉시 재평가 필요", "AI 모델 정기 재학습 반영"] },
  { id: "RPT-T04", title: "CCR 촉매 재생 조건 최적화 결과", category: "troubleshooting", process: "CCR", date: "2024-09-25", year: 2024, author: "이연구원", approver: "박팀장", relatedTicketId: "TKT-2024-0092", tags: ["촉매재생", "Coke", "에너지절감"], summary: "재생 온도 520->510도 하향 시 Coke 잔류량 0.05% 증가하나 에너지 15% 절감 확인. 촉매 수명 영향 미미.", assetValue: "high",
    sections: [
      { title: "실험 조건", content: "재생 온도 500/510/520도 3조건. Air/Coke Ratio 고정. 4주간 운전 안정성 평가." },
      { title: "결과", content: "510도: Coke 잔류 0.05% 증가(허용범위). 촉매 Activity 99.5% 유지. 연료 15% 절감." },
    ],
    lessons: ["재생 온도 하한은 505도 (Coke 잔류 급증)", "계절별 Air 보정 필요"] },
  { id: "RPT-T05", title: "FCC Regenerator Air Grid 불균일 연소 분석", category: "troubleshooting", process: "FCC", date: "2025-01-15", year: 2025, author: "이연구원", approver: "박팀장", relatedTicketId: "TKT-2025-0005", tags: ["Air Grid", "Regenerator", "온도편차"], summary: "Air Distributor 부분 막힘에 의한 국부 과열. TA Scope에 Grid 교체 반영.", assetValue: "high",
    sections: [
      { title: "현상", content: "Regenerator 다점 온도 최대 편차 35도 (정상 15도 이내). 특정 Zone 과열 반복." },
      { title: "원인", content: "Air Grid Nozzle 12개 중 3개 Plugging 확인 (Thermocouple 분포 분석). 촉매 Fines 축적." },
      { title: "조치", content: "TA Scope에 Air Grid 전체 교체 반영. 임시 조치로 Air Flow 재분배 수행." },
    ],
    lessons: ["Air Grid 수명 약 4년 - PM 주기 설정 권고", "Fines 관리 강화 필요"] },
  { id: "RPT-T06", title: "SRU Tail Gas Analyzer 결빙 방지 대책", category: "troubleshooting", process: "SRU", date: "2024-12-31", year: 2024, author: "한엔지니어", approver: "박팀장", relatedTicketId: "TKT-2024-0130", tags: ["Analyzer", "동절기", "Heat Tracing"], summary: "Sample Line 결빙 원인(Heat Tracing 불량) 및 재발 방지 대책. 동절기 관리 체크리스트 수립.", assetValue: "medium",
    sections: [
      { title: "현상", content: "Tail Gas Analyzer 영하 10도 이하 시 반복적 결빙. 2024 동절기 3회 발생." },
      { title: "원인", content: "Heat Tracing 배선 접촉 불량 2개소 확인. 보온재 탈락 1개소." },
      { title: "대책", content: "Heat Tracing 전수 점검 및 교체. 보온재 보수. 동절기 관리 체크리스트 수립." },
    ],
    lessons: ["동절기 전 Heat Tracing 전수 점검 반드시 시행", "Analyzer Shelter 설치 검토"] },
  { id: "RPT-T07", title: "HCR HP Separator Level 계기 오류 분석", category: "troubleshooting", process: "HCR", date: "2024-12-22", year: 2024, author: "김철수", approver: "박팀장", relatedTicketId: "TKT-2024-0125", tags: ["Level", "계기", "이중화"], summary: "LT Drift 원인 분석(Sensing Line 막힘). 백업 LT 설치 및 교정 주기 변경 권고.", assetValue: "medium",
    sections: [
      { title: "현상", content: "Level Transmitter 지시값 실제 대비 12% 과대 지시. 운전원 수동 보정으로 대응 중." },
      { title: "원인", content: "Sensing Line 내 Process Fluid 고화에 의한 부분 막힘. Winterization 불량." },
      { title: "대책", content: "Sensing Line 교체, 백업 LT 설치, 교정 주기 6개월->3개월 변경." },
    ],
    lessons: ["Critical Level에 LT 이중화 필수", "Sensing Line 동절기 관리 추가"] },
  { id: "RPT-T08", title: "FCC Slide Valve Actuator 유압 누설 원인 및 대책", category: "troubleshooting", process: "FCC", date: "2024-12-01", year: 2024, author: "이연구원", approver: "박팀장", relatedTicketId: "TKT-2024-0110", tags: ["Slide Valve", "유압", "O-ring"], summary: "O-ring 재질 부적합에 의한 열화. 내열 소재(Viton -> Kalrez) 변경 결정.", assetValue: "high",
    sections: [
      { title: "현상", content: "Slide Valve 동작 지연 및 유압 누설. 반복 발생 (2024년 3회)." },
      { title: "원인", content: "O-ring 열화 (Viton 소재, 사용 온도 대비 내열성 부족). 열화 주기 약 4개월." },
      { title: "대책", content: "Kalrez 소재 변경. 예상 수명 2년 이상. 단가 차이 연간 200만원 증가하나 정비비 절감." },
    ],
    lessons: ["고온 환경 Seal 재질 선정 시 충분한 마진 확보", "예비품 관리에 소재 정보 필수 기록"] },

  // -- TA 결과레포트 --
  { id: "RPT-TA01", title: "2024 정기보수 종합 결과 레포트", category: "ta-result", process: "전체", date: "2024-07-30", year: 2024, author: "기술팀", approver: "공장장", tags: ["TA", "정비", "종합"], summary: "2024년 정기보수 전체 요약. 총 352개 작업 항목 중 347개 완료(98.6%). 주요 발견사항 15건.", assetValue: "high",
    sections: [
      { title: "TA 개요", content: "기간: 2024.06.20 ~ 07.20 (30일). 투입 인원: 연인원 12,500명. 안전사고: 0건." },
      { title: "주요 실적", content: "총 352개 항목 중 347개 완료(98.6%). 미완료 5건은 자재 미입수에 의한 연기(다음 TA 반영)." },
      { title: "주요 발견사항", content: "HCR Reactor 내부 검사: 촉매 분포 양호. FCC Air Grid 3개 Nozzle Plugging 확인. VDU Heater Coking 제거 완료." },
      { title: "비용 실적", content: "예산 150억 대비 145억 집행(96.7%). 추가 Scope 8건 반영, 미사용 예산 5건 이월." },
    ],
    relatedDocs: ["2023 TA 결과 레포트 (비교)", "TA Worklist 최종본"],
    lessons: ["자재 Long Lead Item 발주 시점 TA 6개월 전으로 변경", "FCC Air Grid PM 주기 설정 필요"] },
  { id: "RPT-TA02", title: "2023 정기보수 종합 결과 레포트", category: "ta-result", process: "전체", date: "2023-08-20", year: 2023, author: "기술팀", approver: "공장장", tags: ["TA", "정비"], summary: "2023년 정기보수 종합 요약. 총 310개 항목 완료. VDU Heater Decoking 성공.", assetValue: "high",
    sections: [
      { title: "TA 개요", content: "기간: 2023.07.01 ~ 08.05 (35일). 투입 인원: 연인원 11,200명." },
      { title: "주요 실적", content: "310개 항목 전수 완료(100%). VDU Heater Decoking 실시. HCR 촉매 교체." },
    ],
    lessons: ["VDU Decoking 소요 기간 예상보다 3일 초과 - 여유 일정 반영 필요"] },
  { id: "RPT-TA03", title: "2024 TA HCR 촉매 교체 상세 레포트", category: "ta-result", process: "HCR", date: "2024-07-25", year: 2024, author: "김철수", approver: "박팀장", tags: ["TA", "촉매교체", "HCR"], summary: "HCR 3개 Bed 촉매 교체 결과. Dense Loading 품질 양호. 활성화 절차 정상 완료.", assetValue: "high",
    sections: [
      { title: "교체 내역", content: "Bed 1/2/3 전량 교체. 총 180톤. 구촉매 인출 -> 검사 -> 신촉매 Dense Loading 순서." },
      { title: "품질 확인", content: "Loading Density: Bed1 880kg/m3, Bed2 875, Bed3 882 (스펙 860-900 충족). 활성화 48hr 정상 완료." },
    ] },

  // -- OOP 월간 레포트 --
  { id: "RPT-M01", title: "2025년 1월 OOP 월간 요약 레포트", category: "oop-monthly", process: "전체", date: "2025-02-05", year: 2025, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI", "운전실적"], summary: "2025년 1월 실적. EII 96.5%, OA 97.8%. VDU Heater Trip 1건, HCR 온도 이상 1건.", assetValue: "medium",
    sections: [
      { title: "운전 실적", content: "EII 96.5%(목표 97.0%), OA 97.8%(목표 98.0%). 비계획 정지: VDU Heater Trip 1건(4hr)." },
      { title: "주요 이벤트", content: "VDU H-1001 Heater Trip(Flame Scanner), HCR 온도 이상(Feed Sulfur). 모두 종결." },
      { title: "에너지", content: "EII 96.5%. 목표 대비 -0.5%p. CDU Preheat 효율 저하가 주요인." },
    ] },
  { id: "RPT-M02", title: "2024년 12월 OOP 월간 요약 레포트", category: "oop-monthly", process: "전체", date: "2025-01-10", year: 2025, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "2024년 12월 운전 실적. EII 97.2%, OA 98.1%. 주요 이벤트 8건 종결.", assetValue: "medium",
    sections: [
      { title: "운전 실적", content: "EII 97.2%, OA 98.1%. 비계획 정지 없음." },
      { title: "주요 이벤트", content: "SRU Analyzer 결빙, HCR Level 이상 등 8건 발생 및 모두 종결." },
    ] },
  { id: "RPT-M03", title: "2024년 11월 OOP 월간 요약 레포트", category: "oop-monthly", process: "전체", date: "2024-12-08", year: 2024, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "EII 96.8%, OA 97.5%. CDU E-101 세정 성공.", assetValue: "medium",
    sections: [{ title: "요약", content: "EII 96.8%, OA 97.5%. CDU E-101 화학 세정 실시 및 UA 회복 확인." }] },
  { id: "RPT-M04", title: "2024년 10월 OOP 월간 요약 레포트", category: "oop-monthly", process: "전체", date: "2024-11-10", year: 2024, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "EII 97.5%, OA 98.3%. 안정 운전.", assetValue: "medium",
    sections: [{ title: "요약", content: "전 공정 안정 운전. 특이사항 없음. 에너지 원단위 전월 대비 개선." }] },
  { id: "RPT-M05", title: "2024년 9월 OOP 월간 요약 레포트", category: "oop-monthly", process: "전체", date: "2024-10-08", year: 2024, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "EII 97.8%, OA 98.5%. TA 후 정상 운전 안정화 완료.", assetValue: "medium",
    sections: [{ title: "요약", content: "TA 후 전 공정 안정화 완료. 신촉매 활성도 우수." }] },
  { id: "RPT-M06", title: "2024년 3Q 분기 운전 리뷰", category: "oop-monthly", process: "전체", date: "2024-10-15", year: 2024, author: "기술팀", approver: "공장장", tags: ["분기", "KPI", "마진"], summary: "3분기 종합 리뷰. Gross Margin 전분기 대비 +2.3%. 에너지 원단위 개선 1.5%.", assetValue: "high",
    sections: [
      { title: "운전 실적", content: "TA 기간 제외 OA 99.2%. EII 97.0%. Feed Processing 105% 달성." },
      { title: "경제성", content: "Gross Margin 전분기 대비 +2.3%. 에너지 원단위 1.5% 개선. 연간 목표 달성률 92%." },
    ] },
]

const CATEGORIES = [
  { id: "all", label: "전체", icon: FileBarChart },
  { id: "improvement", label: "개선과제", icon: Star },
  { id: "troubleshooting", label: "트러블슈팅", icon: Wrench },
  { id: "ta-result", label: "TA 결과레포트", icon: Settings },
  { id: "oop-monthly", label: "OOP 월간 레포트", icon: BarChart3 },
]
const catColors: Record<string, string> = {
  improvement: "bg-blue-50 text-blue-700 border-blue-200",
  troubleshooting: "bg-red-50 text-red-700 border-red-200",
  "ta-result": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "oop-monthly": "bg-indigo-50 text-indigo-700 border-indigo-200",
}
const catLabels: Record<string, string> = { improvement: "개선과제", troubleshooting: "트러블슈팅", "ta-result": "TA 결과", "oop-monthly": "OOP 월간" }
const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU", "전체(공통)"]

export default function FinalReportsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [yearFilter, setYearFilter] = useState("전체")
  const [selectedReport, setSelectedReport] = useState<FinalReport | null>(null)

  const getFiltered = (cat: string) => REPORTS.filter(r => {
    if (cat !== "all" && r.category !== cat) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processFilter !== "전체" && r.process !== processFilter && !(processFilter === "전체(공통)" && r.process === "전체")) return false
    if (yearFilter !== "전체" && r.year !== Number(yearFilter)) return false
    return true
  })

  const currentList = getFiltered(activeTab)

  if (selectedReport) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <Button variant="ghost" size="sm" className="gap-1.5 mb-2 -ml-2" onClick={() => setSelectedReport(null)}>
                <ArrowLeft className="h-4 w-4" />뒤로
              </Button>
              <div className="flex items-center gap-3">
                {selectedReport.assetValue === "high" && <Star className="h-5 w-5 text-amber-500 shrink-0" />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{selectedReport.id}</span>
                    <Badge className={cn("text-[10px]", catColors[selectedReport.category])} variant="outline">{catLabels[selectedReport.category]}</Badge>
                    <Badge variant="outline" className="text-[10px]">{selectedReport.process}</Badge>
                  </div>
                  <h1 className="text-lg font-semibold mt-1">{selectedReport.title}</h1>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Meta info */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-xs text-muted-foreground">작성자</span><p className="font-medium flex items-center gap-1 mt-0.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{selectedReport.author}</p></div>
                  <div><span className="text-xs text-muted-foreground">승인자</span><p className="font-medium flex items-center gap-1 mt-0.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />{selectedReport.approver}</p></div>
                  <div><span className="text-xs text-muted-foreground">작성일</span><p className="font-medium flex items-center gap-1 mt-0.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{selectedReport.date}</p></div>
                  {selectedReport.relatedTicketId && (
                    <div><span className="text-xs text-muted-foreground">관련 티켓</span><p className="font-medium text-blue-600 mt-0.5">{selectedReport.relatedTicketId}</p></div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">요약</h3>
                <p className="text-sm leading-relaxed">{selectedReport.summary}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {selectedReport.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            {selectedReport.sections.map((s, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2">{i + 1}. {s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
                </CardContent>
              </Card>
            ))}

            {/* Lessons Learned */}
            {selectedReport.lessons && selectedReport.lessons.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-4 pb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" />Lessons Learned</h3>
                  <div className="space-y-1.5">
                    {selectedReport.lessons.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="h-5 w-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Documents */}
            {selectedReport.relatedDocs && selectedReport.relatedDocs.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">관련 문서</h3>
                  <div className="space-y-1.5">
                    {selectedReport.relatedDocs.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/40">
                        <ExternalLink className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-blue-600">{d}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />원문 보기</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />PDF 다운로드</Button>
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">최종 레포트</h1>
            <p className="text-sm text-muted-foreground mt-1">팀장 승인 완료된 자산화 레포트를 카테고리별로 조회합니다</p>
          </div>
        </header>

        <main className="p-6 space-y-4">
          {/* Category summary */}
          <div className="grid grid-cols-5 gap-3">
            {CATEGORIES.map(cat => {
              const count = cat.id === "all" ? REPORTS.length : REPORTS.filter(r => r.category === cat.id).length
              const Icon = cat.icon
              return (
                <Card key={cat.id} className={cn("cursor-pointer transition-colors", activeTab === cat.id && "ring-1 ring-primary")} onClick={() => setActiveTab(cat.id)}>
                  <CardContent className="pt-3 pb-3 flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{cat.label}</div>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="제목, 태그로 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{["전체", "2025", "2024", "2023"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <div className="space-y-2">
            {currentList.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</CardContent></Card>
            ) : currentList.map(r => (
              <Card key={r.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedReport(r)}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {r.assetValue === "high" ? <Star className="h-4 w-4 text-amber-500 shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                        <Badge className={cn("text-[10px]", catColors[r.category])} variant="outline">{catLabels[r.category]}</Badge>
                        <span className="text-sm font-medium truncate">{r.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.summary}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{r.process}</Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 w-20 text-right">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      {r.date}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
