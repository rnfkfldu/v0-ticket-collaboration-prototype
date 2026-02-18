"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search,
  Filter,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  ChevronRight,
  Minus,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

// 프로세스 히스토리 데이터
const processHistoryData = [
  {
    id: 1,
    date: "2025-02-04",
    unit: "HCR",
    team: "2공정팀",
    status: "normal",
    summary: "정상 운전 유지",
    details: "모든 운전 변수 정상 범위 내, 촉매 활성도 양호",
    shift: "주간",
    operator: "김철수",
  },
  {
    id: 2,
    date: "2025-02-03",
    unit: "HCR",
    team: "2공정팀",
    status: "caution",
    summary: "Reactor 온도 상승 주의",
    details: "TI-2001 온도 상승 추세 감지, 모니터링 강화 중",
    shift: "야간",
    operator: "이영희",
  },
  {
    id: 3,
    date: "2025-02-02",
    unit: "CDU",
    team: "1공정팀",
    status: "normal",
    summary: "정상 운전",
    details: "Crude Blend 변경 완료, 운전 안정",
    shift: "주간",
    operator: "박민수",
  },
  {
    id: 4,
    date: "2025-02-01",
    unit: "VDU",
    team: "1공정팀",
    status: "abnormal",
    summary: "Heater Trip 발생",
    details: "H-1001 Heater Trip으로 인한 감량 운전 실시",
    shift: "야간",
    operator: "최지훈",
    relatedTicket: "TKT-2025-0089"
  },
  {
    id: 5,
    date: "2025-01-31",
    unit: "CCR",
    team: "3공정팀",
    status: "normal",
    summary: "촉매 재생 완료",
    details: "정기 촉매 재생 작업 완료, 활성도 회복 확인",
    shift: "주간",
    operator: "정수민",
  },
  {
    id: 6,
    date: "2025-01-30",
    unit: "HCR",
    team: "2공정팀",
    status: "caution",
    summary: "Feed 품질 변동",
    details: "Feed 황 함량 증가로 인한 모니터링 강화",
    shift: "주간",
    operator: "김철수",
  },
  {
    id: 7,
    date: "2025-01-29",
    unit: "CDU",
    team: "1공정팀",
    status: "normal",
    summary: "안정 운전",
    details: "모든 지표 정상 범위 내",
    shift: "야간",
    operator: "이영희",
  },
  {
    id: 8,
    date: "2025-01-28",
    unit: "VDU",
    team: "1공정팀",
    status: "normal",
    summary: "정비 후 재가동",
    details: "정기 정비 완료 후 정상 운전 재개",
    shift: "주간",
    operator: "박민수",
  },
]

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

export default function ProcessHistoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredData = processHistoryData.filter(entry => {
    const matchesSearch = entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = selectedUnit === "all" || entry.unit === selectedUnit
    const matchesTeam = selectedTeam === "all" || entry.team === selectedTeam
    const matchesStatus = selectedStatus === "all" || entry.status === selectedStatus
    return matchesSearch && matchesUnit && matchesTeam && matchesStatus
  })

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Process Unit History
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                공정별 운전 연대기 - 정상/주의/비정상 기록 및 운전 로그
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* 필터 영역 */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="키워드 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="공정" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 공정</SelectItem>
                    <SelectItem value="CDU">CDU</SelectItem>
                    <SelectItem value="VDU">VDU</SelectItem>
                    <SelectItem value="HCR">HCR</SelectItem>
                    <SelectItem value="CCR">CCR</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="팀" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 팀</SelectItem>
                    <SelectItem value="1공정팀">1공정팀</SelectItem>
                    <SelectItem value="2공정팀">2공정팀</SelectItem>
                    <SelectItem value="3공정팀">3공정팀</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="normal">정상</SelectItem>
                    <SelectItem value="caution">주의</SelectItem>
                    <SelectItem value="abnormal">비정상</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 히스토리 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                공정 히스토리 ({filteredData.length}건)
              </h3>
            </div>
            
            <div className="grid gap-3">
              {filteredData.map((entry) => {
                const statusConfig = getStatusConfig(entry.status)
                const StatusIcon = statusConfig.icon
                return (
                  <Card 
                    key={entry.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => router.push(`/knowledge/history/process/${entry.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <StatusIcon className={cn("h-6 w-6", statusConfig.iconColor)} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-lg">{entry.unit}</span>
                              <Badge variant="outline" className={statusConfig.color}>
                                {statusConfig.label}
                              </Badge>
                              {entry.relatedTicket && (
                                <Badge variant="secondary" className="text-xs">
                                  {entry.relatedTicket}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1">{entry.summary}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{entry.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {entry.date}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{entry.shift}</span>
                              <span>|</span>
                              <span>{entry.team}</span>
                              <span>|</span>
                              <span>{entry.operator}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
