"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

// 알람 히스토리 상세 데이터
const alertHistoryDetails: Record<string, {
  id: number
  timestamp: string
  tagId: string
  unit: string
  team: string
  description: string
  grade: string
  status: string
  resolvedAt: string
  resolvedBy: string
  resolution: string
  value: number
  setpoint: number
  duration: string
  relatedTicket: string | null
  similarAlerts: { date: string; value: number }[]
}> = {
  "1": {
    id: 1,
    timestamp: "2025-02-04 09:23",
    tagId: "TI-2001",
    unit: "HCR",
    team: "2공정팀",
    description: "Reactor Inlet Temperature High",
    grade: "high",
    status: "resolved",
    resolvedAt: "2025-02-04 09:45",
    resolvedBy: "김철수",
    resolution: "Feed Flow 감소 조치 (120 → 115 m3/h)로 온도 정상화. Reactor Inlet 온도가 설정치를 초과하여 즉시 Feed Flow를 감량하고 모니터링을 강화함. 약 20분 후 온도가 안정화되어 정상 운전 복귀.",
    value: 402.5,
    setpoint: 400,
    duration: "22분",
    relatedTicket: "TKT-2025-0123",
    similarAlerts: [
      { date: "2025-01-28 11:20", value: 398.5 },
      { date: "2025-01-15 16:45", value: 401.2 },
      { date: "2024-12-20 09:30", value: 399.8 },
    ]
  },
  "2": {
    id: 2,
    timestamp: "2025-02-03 15:42",
    tagId: "PI-3001",
    unit: "VDU",
    team: "1공정팀",
    description: "Column Pressure High",
    grade: "medium",
    status: "resolved",
    resolvedAt: "2025-02-03 16:10",
    resolvedBy: "이영희",
    resolution: "Reflux Flow 증가로 압력 안정화. Column 상부 압력이 상승하여 Reflux Flow를 10% 증가시켜 압력을 낮춤.",
    value: 2.8,
    setpoint: 2.5,
    duration: "28분",
    relatedTicket: null,
    similarAlerts: [
      { date: "2025-01-20 10:30", value: 2.6 },
      { date: "2025-01-05 14:15", value: 2.7 },
    ]
  },
  "3": {
    id: 3,
    timestamp: "2025-02-02 22:15",
    tagId: "LI-1002",
    unit: "CDU",
    team: "1공정팀",
    description: "Drum Level Low-Low",
    grade: "critical",
    status: "resolved",
    resolvedAt: "2025-02-02 22:35",
    resolvedBy: "박민수",
    resolution: "Pump 재가동 및 Feed Valve 조정으로 레벨 회복. Drum Level이 Low-Low 알람 발생하여 긴급 Pump 점검 후 재가동, Feed Valve 개도 조정으로 레벨 정상화.",
    value: 12.3,
    setpoint: 20,
    duration: "20분",
    relatedTicket: "TKT-2025-0098",
    similarAlerts: [
      { date: "2024-11-15 03:20", value: 15.2 },
    ]
  },
  "4": {
    id: 4,
    timestamp: "2025-02-01 08:30",
    tagId: "FI-2005",
    unit: "HCR",
    team: "2공정팀",
    description: "Recycle Gas Flow Low",
    grade: "medium",
    status: "resolved",
    resolvedAt: "2025-02-01 09:15",
    resolvedBy: "최지훈",
    resolution: "Compressor 점검 후 재가동. Recycle Gas Compressor의 미세 진동으로 인한 유량 저하. 점검 후 재가동하여 정상화.",
    value: 850,
    setpoint: 1000,
    duration: "45분",
    relatedTicket: null,
    similarAlerts: []
  },
  "5": {
    id: 5,
    timestamp: "2025-01-30 14:20",
    tagId: "TI-4001",
    unit: "CCR",
    team: "3공정팀",
    description: "Regenerator Temperature High",
    grade: "high",
    status: "resolved",
    resolvedAt: "2025-01-30 14:55",
    resolvedBy: "정수민",
    resolution: "Air Flow 조정 및 Catalyst Circulation Rate 감소. Regenerator 온도가 상승하여 Air Flow를 5% 감소, Catalyst Circulation Rate를 낮추어 온도 안정화.",
    value: 715,
    setpoint: 700,
    duration: "35분",
    relatedTicket: "TKT-2025-0076",
    similarAlerts: [
      { date: "2025-01-10 11:00", value: 708 },
      { date: "2024-12-28 16:30", value: 712 },
    ]
  },
}

const getGradeConfig = (grade: string) => {
  switch (grade) {
    case "critical":
      return { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", iconColor: "text-red-500" }
    case "high":
      return { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200", iconColor: "text-orange-500" }
    case "medium":
      return { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200", iconColor: "text-amber-500" }
    default:
      return { label: "Low", color: "bg-blue-100 text-blue-700 border-blue-200", iconColor: "text-blue-500" }
  }
}

export default function AlertHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const entry = alertHistoryDetails[id]

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

  const gradeConfig = getGradeConfig(entry.grade)

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
                <AlertTriangle className={cn("h-6 w-6", gradeConfig.iconColor)} />
                <span className="font-mono text-xl font-semibold">{entry.tagId}</span>
                <Badge variant="outline" className={gradeConfig.color}>
                  {gradeConfig.label}
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  해결됨
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  알람 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">발생 시간</span>
                    <p className="text-sm font-medium">{entry.timestamp}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">해결 시간</span>
                    <p className="text-sm font-medium">{entry.resolvedAt}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Unit / 팀</span>
                    <p className="text-sm font-medium">{entry.unit} / {entry.team}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">해결 담당자</span>
                    <p className="text-sm font-medium">{entry.resolvedBy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 알람 상세 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">알람 상세</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
                    <span className="text-sm text-muted-foreground">발생값</span>
                    <p className="text-2xl font-bold text-red-600 mt-1">{entry.value}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Setpoint</span>
                    <p className="text-2xl font-bold mt-1">{entry.setpoint}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">지속 시간</span>
                    <p className="text-2xl font-bold mt-1">{entry.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 해결 방법 */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  해결 방법
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{entry.resolution}</p>
                {entry.relatedTicket && (
                  <div className="mt-4 p-3 bg-white rounded-lg border flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">관련 티켓: {entry.relatedTicket}</span>
                    <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto ml-auto">
                      티켓 보기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 동일 태그 과거 알람 */}
            {entry.similarAlerts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    동일 태그 과거 알람 (최근 90일)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {entry.similarAlerts.map((alert, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{alert.date}</span>
                        </div>
                        <span className="text-sm font-medium">발생값: {alert.value}</span>
                        <Badge variant="secondary" className="text-xs">해결</Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="text-xs mt-3 p-0 h-auto">
                    전체 이력 보기
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
