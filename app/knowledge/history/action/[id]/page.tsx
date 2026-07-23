"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  Wrench,
  CheckCircle,
  Clock,
  User,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

// 액션 히스토리 상세 데이터
const actionHistoryDetails: Record<string, {
  id: number
  ticketId: string
  title: string
  unit: string
  team: string
  type: string
  status: string
  createdAt: string
  completedAt: string
  assignee: string
  description: string
  actions: { time: string; action: string }[]
  relatedAlerts: string[]
  result: string
}> = {
  "1": {
    id: 1,
    ticketId: "TKT-2025-0123",
    title: "HCR Reactor 온도 이상 대응",
    unit: "HCR",
    team: "2공정팀",
    type: "corrective",
    status: "completed",
    createdAt: "2025-02-04 09:30",
    completedAt: "2025-02-04 14:00",
    assignee: "김철수",
    description: "Reactor Inlet Temperature High 알람에 대한 대응 조치. TI-2001 태그에서 온도 상승 알람이 발생하여 즉각 대응팀이 구성되었으며, Feed Flow 감량 등의 조치를 통해 온도를 안정화시킴.",
    actions: [
      { time: "09:30", action: "이벤트 생성 및 담당자 배정" },
      { time: "09:35", action: "현장 확인 및 상황 파악" },
      { time: "09:45", action: "Feed Flow 120 → 115 m3/h 감소" },
      { time: "10:30", action: "온도 안정화 추세 확인" },
      { time: "12:00", action: "정상 범위 진입 확인" },
      { time: "14:00", action: "정상 운전 복귀 확인 후 이벤트 종료" },
    ],
    relatedAlerts: ["TI-2001 High Alarm"],
    result: "성공"
  },
  "2": {
    id: 2,
    ticketId: "TKT-2025-0118",
    title: "CDU Crude Blend 변경",
    unit: "CDU",
    team: "1공정팀",
    type: "planned",
    status: "completed",
    createdAt: "2025-02-02 08:00",
    completedAt: "2025-02-02 16:00",
    assignee: "박민수",
    description: "정기 Crude Blend 변경 작업 (Kuwait → Arab Light). 계획된 일정에 따라 원유 종류를 변경하는 작업으로, 품질 규격을 모두 충족하며 성공적으로 완료됨.",
    actions: [
      { time: "08:00", action: "Blend 변경 계획 검토 및 준비" },
      { time: "09:00", action: "Crude Tank 전환 시작" },
      { time: "10:30", action: "전환 50% 완료" },
      { time: "12:00", action: "Blend 완료, 품질 샘플링 시작" },
      { time: "14:00", action: "품질 분석 완료 - 규격 충족" },
      { time: "15:00", action: "품질 확인 완료" },
      { time: "16:00", action: "작업 종료" },
    ],
    relatedAlerts: [],
    result: "성공"
  },
  "3": {
    id: 3,
    ticketId: "TKT-2025-0098",
    title: "VDU Heater Trip 비상 대응",
    unit: "VDU",
    team: "1공정팀",
    type: "emergency",
    status: "completed",
    createdAt: "2025-02-01 01:15",
    completedAt: "2025-02-01 04:30",
    assignee: "최지훈",
    description: "H-1001 Heater Trip으로 인한 비상 대응. 야간에 Flame Scanner 오작동으로 Heater Trip이 발생했으며, 비상 대응 절차에 따라 감량 운전 후 원인 파악 및 재가동을 진행함.",
    actions: [
      { time: "01:15", action: "Heater Trip 발생 확인 - 비상 호출" },
      { time: "01:20", action: "비상 대응 절차 가동" },
      { time: "01:30", action: "감량 운전 시작 (50% 부하)" },
      { time: "02:00", action: "원인 파악 시작" },
      { time: "02:30", action: "원인 확인 (Flame Scanner 오작동)" },
      { time: "03:00", action: "Heater 재가동 시작" },
      { time: "03:30", action: "부하 점진적 회복" },
      { time: "04:30", action: "정상 운전 복귀 완료" },
    ],
    relatedAlerts: ["LI-1002 Low-Low Alarm", "H-1001 Trip"],
    result: "성공"
  },
  "4": {
    id: 4,
    ticketId: "TKT-2025-0085",
    title: "CCR 촉매 재생 작업",
    unit: "CCR",
    team: "3공정팀",
    type: "planned",
    status: "completed",
    createdAt: "2025-01-31 08:00",
    completedAt: "2025-01-31 18:00",
    assignee: "정수민",
    description: "정기 촉매 재생 작업. 촉매 활성도가 82%로 저하되어 재생 작업을 실시, 98%까지 회복시킴.",
    actions: [
      { time: "08:00", action: "재생 작업 시작" },
      { time: "10:00", action: "1차 재생 단계 진행" },
      { time: "12:00", action: "1차 재생 완료" },
      { time: "14:00", action: "활성도 측정 - 95% 확인" },
      { time: "15:00", action: "2차 재생 진행" },
      { time: "16:00", action: "2차 재생 완료" },
      { time: "17:00", action: "최종 활성도 98% 확인" },
      { time: "18:00", action: "작업 완료, 정상 운전 재개" },
    ],
    relatedAlerts: [],
    result: "성공"
  },
  "5": {
    id: 5,
    ticketId: "TKT-2025-0076",
    title: "CCR Regenerator 온도 이상 조치",
    unit: "CCR",
    team: "3공정팀",
    type: "corrective",
    status: "completed",
    createdAt: "2025-01-30 14:20",
    completedAt: "2025-01-30 17:00",
    assignee: "정수민",
    description: "Regenerator Temperature High 알람 대응. TI-4001에서 온도 상승 알람이 발생하여 Air Flow 및 Catalyst Circulation Rate 조정으로 온도를 안정화시킴.",
    actions: [
      { time: "14:20", action: "알람 발생 및 이벤트 생성" },
      { time: "14:30", action: "Air Flow 5% 감소" },
      { time: "14:45", action: "Catalyst Circulation Rate 감소" },
      { time: "15:30", action: "온도 하락 추세 확인" },
      { time: "16:30", action: "정상 범위 진입" },
      { time: "17:00", action: "정상화 확인 후 종료" },
    ],
    relatedAlerts: ["TI-4001 High Alarm"],
    result: "성공"
  },
}

const getTypeConfig = (type: string) => {
  switch (type) {
    case "emergency":
      return { label: "비상", color: "bg-red-100 text-red-700 border-red-200" }
    case "corrective":
      return { label: "교정", color: "bg-amber-100 text-amber-700 border-amber-200" }
    case "planned":
      return { label: "계획", color: "bg-blue-100 text-blue-700 border-blue-200" }
    default:
      return { label: "기타", color: "bg-gray-100 text-gray-700 border-gray-200" }
  }
}

export default function ActionHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const entry = actionHistoryDetails[id]

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

  const typeConfig = getTypeConfig(entry.type)

  // 소요 시간 계산
  const getDuration = () => {
    const start = new Date(entry.createdAt.replace(" ", "T"))
    const end = new Date(entry.completedAt.replace(" ", "T"))
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffHours > 0) {
      return `${diffHours}시간 ${diffMins}분`
    }
    return `${diffMins}분`
  }

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
                <span className="font-mono text-sm text-muted-foreground">{entry.ticketId}</span>
                <Badge variant="outline" className={typeConfig.color}>
                  {typeConfig.label}
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  완료
                </Badge>
              </div>
              <h1 className="text-xl font-semibold mt-1">{entry.title}</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  이벤트 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">생성 시간</span>
                    <p className="text-sm font-medium">{entry.createdAt}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">완료 시간</span>
                    <p className="text-sm font-medium">{entry.completedAt}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Unit / 팀</span>
                    <p className="text-sm font-medium">{entry.unit} / {entry.team}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">담당자</span>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entry.assignee}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 조치 Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  조치 Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entry.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-16 flex-shrink-0">
                        <span className="text-sm font-mono font-medium">{action.time}</span>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-primary" />
                        {i < entry.actions.length - 1 && (
                          <div className="absolute left-[4px] top-4 w-0.5 h-full bg-border" />
                        )}
                        <div className="pl-6 pb-4">
                          <p className="text-sm">{action.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 관련 알람 */}
            {entry.relatedAlerts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    관련 알람
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {entry.relatedAlerts.map((alert, i) => (
                      <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {alert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 결과 */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Badge className="bg-green-500 text-white">{entry.result}</Badge>
                  <span className="text-sm text-green-700">
                    총 소요 시간: {getDuration()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
