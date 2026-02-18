"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

// 프로세스 히스토리 상세 데이터
const processHistoryDetails: Record<string, {
  id: number
  date: string
  unit: string
  team: string
  status: string
  summary: string
  details: string
  shift: string
  operator: string
  keyMetrics: { conversion: number; yield: number; energy: number }
  logs: { time: string; content: string }[]
  relatedTicket?: string
}> = {
  "1": {
    id: 1,
    date: "2025-02-04",
    unit: "HCR",
    team: "2공정팀",
    status: "normal",
    summary: "정상 운전 유지",
    details: "모든 운전 변수 정상 범위 내, 촉매 활성도 양호. Feed Rate 118 m3/h로 안정적 운전 중. Reactor 온도 및 압력 모두 정상 범위 내에서 유지되고 있으며, 제품 품질도 규격을 만족함.",
    shift: "주간",
    operator: "김철수",
    keyMetrics: { conversion: 92.3, yield: 88.5, energy: 102 },
    logs: [
      { time: "08:00", content: "교대 인수인계 완료 - 이상 없음" },
      { time: "10:30", content: "Feed Rate 미세 조정 (120 → 118 m3/h)" },
      { time: "12:00", content: "중간 점검 - 모든 지표 정상" },
      { time: "14:00", content: "정기 샘플링 실시 - 품질 양호" },
      { time: "16:00", content: "교대 인계 준비" },
    ]
  },
  "2": {
    id: 2,
    date: "2025-02-03",
    unit: "HCR",
    team: "2공정팀",
    status: "caution",
    summary: "Reactor 온도 상승 주의",
    details: "TI-2001 온도 상승 추세 감지, 모니터링 강화 중. 23시경 온도가 395도에서 상승 추세를 보여 Feed Rate를 2% 감량 조치함. 02시경 온도 안정화 확인.",
    shift: "야간",
    operator: "이영희",
    keyMetrics: { conversion: 91.8, yield: 87.2, energy: 105 },
    logs: [
      { time: "22:00", content: "TI-2001 온도 상승 트렌드 확인 (395 → 398°C)" },
      { time: "22:30", content: "상황 보고 및 모니터링 강화" },
      { time: "23:30", content: "Feed Rate 2% 감량 조치 (120 → 117.6 m3/h)" },
      { time: "01:00", content: "온도 하락 추세 확인" },
      { time: "02:00", content: "온도 안정화 확인 (393°C)" },
    ]
  },
  "3": {
    id: 3,
    date: "2025-02-02",
    unit: "CDU",
    team: "1공정팀",
    status: "normal",
    summary: "정상 운전",
    details: "Crude Blend 변경 완료, 운전 안정. Kuwait Crude에서 Arab Light로 전환 작업 완료. 품질 검사 결과 모든 규격 충족.",
    shift: "주간",
    operator: "박민수",
    keyMetrics: { conversion: 95.1, yield: 91.2, energy: 98 },
    logs: [
      { time: "09:00", content: "Crude Blend 변경 시작 (Kuwait → Arab Light)" },
      { time: "10:30", content: "Tank 전환 50% 완료" },
      { time: "12:00", content: "변경 완료, 품질 샘플링 시작" },
      { time: "14:00", content: "품질 분석 완료 - 규격 충족" },
      { time: "15:00", content: "정상 운전 확인" },
    ]
  },
  "4": {
    id: 4,
    date: "2025-02-01",
    unit: "VDU",
    team: "1공정팀",
    status: "abnormal",
    summary: "Heater Trip 발생",
    details: "H-1001 Heater Trip으로 인한 감량 운전 실시. 01:15 Flame Scanner 오작동으로 인한 Heater Trip 발생. 비상 대응 절차에 따라 조치 후 04:00 정상 운전 복귀.",
    shift: "야간",
    operator: "최지훈",
    keyMetrics: { conversion: 78.5, yield: 72.1, energy: 125 },
    logs: [
      { time: "01:15", content: "H-1001 Heater Trip 발생 - Flame Scanner 알람" },
      { time: "01:20", content: "비상 대응 절차 가동, 감량 운전 시작" },
      { time: "01:45", content: "원인 파악 시작" },
      { time: "02:30", content: "원인 확인: Flame Scanner 오작동" },
      { time: "03:00", content: "Heater 재가동 시작" },
      { time: "03:30", content: "부하 점진적 회복 중" },
      { time: "04:00", content: "정상 운전 복귀 완료" },
    ],
    relatedTicket: "TKT-2025-0089"
  },
  "5": {
    id: 5,
    date: "2025-01-31",
    unit: "CCR",
    team: "3공정팀",
    status: "normal",
    summary: "촉매 재생 완료",
    details: "정기 촉매 재생 작업 완료, 활성도 회복 확인. 재생 전 활성도 82%에서 재생 후 98%로 회복. 정상 운전 재개.",
    shift: "주간",
    operator: "정수민",
    keyMetrics: { conversion: 94.2, yield: 90.8, energy: 100 },
    logs: [
      { time: "08:00", content: "촉매 재생 작업 시작" },
      { time: "10:00", content: "1차 재생 단계 진행 중" },
      { time: "12:00", content: "1차 재생 완료" },
      { time: "14:00", content: "활성도 측정 - 95% 확인" },
      { time: "15:00", content: "2차 재생 진행" },
      { time: "16:00", content: "활성도 98% 회복 확인" },
      { time: "17:00", content: "정상 운전 재개" },
    ]
  },
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "normal":
      return { label: "정상", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle, iconColor: "text-green-500" }
    case "caution":
      return { label: "주의", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle, iconColor: "text-amber-500" }
    case "abnormal":
      return { label: "비정상", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, iconColor: "text-red-500" }
    default:
      return { label: "미정", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Minus, iconColor: "text-gray-500" }
  }
}

export default function ProcessHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const entry = processHistoryDetails[id]

  if (!entry) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">해당 기록을 찾을 수 없습니다.</p>
            <Button variant="link" onClick={() => router.back()}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const statusConfig = getStatusConfig(entry.status)
  const StatusIcon = statusConfig.icon

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <StatusIcon className={cn("h-6 w-6", statusConfig.iconColor)} />
                <h1 className="text-xl font-semibold">{entry.unit} - {entry.summary}</h1>
                <Badge variant="outline" className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {entry.date} | {entry.shift} | {entry.team} | {entry.operator}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 상세 설명 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  상세 내용
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{entry.details}</p>
                {entry.relatedTicket && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">관련 티켓: {entry.relatedTicket}</span>
                    <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto ml-auto">
                      티켓 보기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">주요 운전 지표</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Conversion</span>
                    <p className="text-2xl font-bold mt-1">{entry.keyMetrics.conversion}%</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">+0.5%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Yield</span>
                    <p className="text-2xl font-bold mt-1">{entry.keyMetrics.yield}%</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">-0.3%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Energy Index</span>
                    <p className="text-2xl font-bold mt-1">{entry.keyMetrics.energy}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Minus className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">유지</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 운전 로그 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  운전 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entry.logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-16 flex-shrink-0">
                        <span className="text-sm font-mono font-medium">{log.time}</span>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-primary" />
                        {i < entry.logs.length - 1 && (
                          <div className="absolute left-[4px] top-4 w-0.5 h-full bg-border" />
                        )}
                        <div className="pl-6 pb-4">
                          <p className="text-sm">{log.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 담당자 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  담당자 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">{entry.operator[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{entry.operator}</p>
                    <p className="text-sm text-muted-foreground">{entry.team} | {entry.shift}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
