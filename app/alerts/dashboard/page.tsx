"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Gauge,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"

// 알람 분석 데이터
const ALARM_STATS = {
  totalAlarms: 1247,
  activeAlarms: 23,
  alarmRate: 4.2, // alarms per 10 minutes
  flooding: {
    status: "normal", // normal, warning, critical
    current: 3,
    threshold: 10,
    recentFloodingEvents: 2
  },
  standing: {
    count: 8,
    trend: -2,
    byUnit: [
      { unit: "CDU", count: 2 },
      { unit: "VDU", count: 1 },
      { unit: "HCR", count: 3 },
      { unit: "CCR", count: 2 },
    ]
  },
  shelved: {
    count: 15,
    pendingReview: 5,
    expiringSoon: 3
  },
  priority: {
    critical: 2,
    high: 5,
    medium: 12,
    low: 4
  }
}

const UNIT_ALARM_DATA = [
  { unit: "CDU", total: 312, active: 5, rate: 3.2, standing: 2, shelved: 4, flooding: false },
  { unit: "VDU", total: 198, active: 3, rate: 2.8, standing: 1, shelved: 3, flooding: false },
  { unit: "HCR", total: 423, active: 8, rate: 5.1, standing: 3, shelved: 5, flooding: true },
  { unit: "CCR", total: 314, active: 7, rate: 4.5, standing: 2, shelved: 3, flooding: false },
]

const RECENT_ALARMS = [
  { id: 1, tagId: "TI-2001", description: "Reactor Inlet Temp High", unit: "HCR", priority: "high", time: "2분 전", status: "active" },
  { id: 2, tagId: "PI-3001", description: "Regenerator Pressure Low", unit: "CCR", priority: "critical", time: "5분 전", status: "active" },
  { id: 3, tagId: "FI-1001", description: "Feed Flow Deviation", unit: "CDU", priority: "medium", time: "12분 전", status: "acknowledged" },
  { id: 4, tagId: "LI-2003", description: "Separator Level High", unit: "HCR", priority: "high", time: "18분 전", status: "active" },
  { id: 5, tagId: "TI-4002", description: "Column Top Temp Low", unit: "VDU", priority: "medium", time: "25분 전", status: "cleared" },
]

const HOURLY_TREND = [
  { hour: "00:00", count: 12 },
  { hour: "02:00", count: 8 },
  { hour: "04:00", count: 15 },
  { hour: "06:00", count: 22 },
  { hour: "08:00", count: 35 },
  { hour: "10:00", count: 28 },
  { hour: "12:00", count: 18 },
  { hour: "14:00", count: 24 },
  { hour: "16:00", count: 31 },
  { hour: "18:00", count: 19 },
  { hour: "20:00", count: 14 },
  { hour: "22:00", count: 10 },
]

export default function AlarmDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  
  // 알람 등록 폼 상태
  const [alarmTagId, setAlarmTagId] = useState("")
  const [alarmUnit, setAlarmUnit] = useState("")
  const [alarmDescription, setAlarmDescription] = useState("")
  const [alarmType, setAlarmType] = useState<"process" | "equipment" | "safety">("process")
  const [alarmPriority, setAlarmPriority] = useState<"critical" | "high" | "medium" | "low">("medium")
  const [alarmSetpointHigh, setAlarmSetpointHigh] = useState("")
  const [alarmSetpointLow, setAlarmSetpointLow] = useState("")
  const [alarmDeadband, setAlarmDeadband] = useState("")
  const [alarmDelay, setAlarmDelay] = useState("")
  const [alarmOnCondition, setAlarmOnCondition] = useState("")
  const [alarmOffCondition, setAlarmOffCondition] = useState("")
  const [alarmRationale, setAlarmRationale] = useState("")
  const [alarmResponseGuide, setAlarmResponseGuide] = useState("")

  const handleRegisterAlarm = () => {
    alert(`알람이 등록되었습니다.\n\nTag ID: ${alarmTagId}\nUnit: ${alarmUnit}\n설명: ${alarmDescription}`)
    setShowRegisterDialog(false)
    // Reset form
    setAlarmTagId("")
    setAlarmUnit("")
    setAlarmDescription("")
    setAlarmType("process")
    setAlarmPriority("medium")
    setAlarmSetpointHigh("")
    setAlarmSetpointLow("")
    setAlarmDeadband("")
    setAlarmDelay("")
    setAlarmOnCondition("")
    setAlarmOffCondition("")
    setAlarmRationale("")
    setAlarmResponseGuide("")
  }

  const getFloodingStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "text-red-600 bg-red-100"
      case "warning": return "text-amber-600 bg-amber-100"
      default: return "text-green-600 bg-green-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-amber-500"
      default: return "bg-blue-500"
    }
  }

  const maxTrendCount = Math.max(...HOURLY_TREND.map(t => t.count))

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">알람 분석 대시보드</h1>
              <p className="text-sm text-muted-foreground">실시간 알람 현황 및 분석</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 Unit</SelectItem>
                  <SelectItem value="CDU">CDU</SelectItem>
                  <SelectItem value="VDU">VDU</SelectItem>
                  <SelectItem value="HCR">HCR</SelectItem>
                  <SelectItem value="CCR">CCR</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="기간" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="week">이번 주</SelectItem>
                  <SelectItem value="month">이번 달</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowRegisterDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                신규 알람 등록
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            {/* Alarm Flooding Status */}
            <Card className={cn(
              "border-l-4",
              ALARM_STATS.flooding.status === "critical" && "border-l-red-500",
              ALARM_STATS.flooding.status === "warning" && "border-l-amber-500",
              ALARM_STATS.flooding.status === "normal" && "border-l-green-500"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Alarm Flooding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn(
                      "text-2xl font-bold",
                      ALARM_STATS.flooding.status === "critical" && "text-red-600",
                      ALARM_STATS.flooding.status === "warning" && "text-amber-600",
                      ALARM_STATS.flooding.status === "normal" && "text-green-600"
                    )}>
                      {ALARM_STATS.flooding.current}/10min
                    </p>
                    <p className="text-xs text-muted-foreground">Threshold: {ALARM_STATS.flooding.threshold}</p>
                  </div>
                  <Badge className={getFloodingStatusColor(ALARM_STATS.flooding.status)}>
                    {ALARM_STATS.flooding.status === "normal" ? "정상" : ALARM_STATS.flooding.status === "warning" ? "주의" : "위험"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  최근 24시간 Flooding 발생: {ALARM_STATS.flooding.recentFloodingEvents}회
                </p>
              </CardContent>
            </Card>

            {/* Standing Alarms */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Standing Alarm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{ALARM_STATS.standing.count}건</p>
                    <p className="text-xs text-muted-foreground">24시간 이상 지속</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    ALARM_STATS.standing.trend < 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {ALARM_STATS.standing.trend < 0 ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    {Math.abs(ALARM_STATS.standing.trend)}
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  {ALARM_STATS.standing.byUnit.map(u => (
                    <Badge key={u.unit} variant="outline" className="text-xs">
                      {u.unit}: {u.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shelved Alarms */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Shelved Alarm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{ALARM_STATS.shelved.count}건</p>
                    <p className="text-xs text-muted-foreground">일시 보류 중</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">검토 필요</span>
                    <span className="font-medium text-amber-600">{ALARM_STATS.shelved.pendingReview}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">만료 임박</span>
                    <span className="font-medium text-red-600">{ALARM_STATS.shelved.expiringSoon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Alarms by Priority */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Active Alarm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{ALARM_STATS.activeAlarms}건</p>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{ALARM_STATS.priority.critical}</div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{ALARM_STATS.priority.high}</div>
                    <div className="text-xs text-muted-foreground">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">{ALARM_STATS.priority.medium}</div>
                    <div className="text-xs text-muted-foreground">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{ALARM_STATS.priority.low}</div>
                    <div className="text-xs text-muted-foreground">Low</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Hourly Trend */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">시간대별 알람 발생 추이</CardTitle>
                <CardDescription>최근 24시간</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-40">
                  {HOURLY_TREND.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${(item.count / maxTrendCount) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{item.hour.split(":")[0]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                  <span>평균: {(HOURLY_TREND.reduce((a, b) => a + b.count, 0) / HOURLY_TREND.length).toFixed(1)} 건/2시간</span>
                  <span>최대: {maxTrendCount}건 (08:00)</span>
                </div>
              </CardContent>
            </Card>

            {/* Unit별 알람 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Unit별 알람 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {UNIT_ALARM_DATA.map(unit => (
                  <div key={unit.unit} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{unit.unit}</span>
                        {unit.flooding && (
                          <Badge variant="destructive" className="text-xs">Flooding</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{unit.active} active</span>
                    </div>
                    <Progress value={(unit.active / 10) * 100} className="h-2" />
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Standing: {unit.standing}</span>
                      <span>|</span>
                      <span>Shelved: {unit.shelved}</span>
                      <span>|</span>
                      <span>Rate: {unit.rate}/10min</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Alarms */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">최근 알람</CardTitle>
                  <CardDescription>실시간 알람 발생 현황</CardDescription>
                </div>
                <Button variant="outline" size="sm">전체 보기</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {RECENT_ALARMS.map(alarm => (
                  <div 
                    key={alarm.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      alarm.status === "active" && "bg-red-50/50 border-red-200",
                      alarm.status === "acknowledged" && "bg-amber-50/50 border-amber-200",
                      alarm.status === "cleared" && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getPriorityColor(alarm.priority)
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">{alarm.tagId}</Badge>
                          <span className="text-sm font-medium">{alarm.description}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{alarm.unit}</span>
                          <span>|</span>
                          <span>{alarm.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={alarm.status === "active" ? "destructive" : alarm.status === "acknowledged" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {alarm.status === "active" ? "Active" : alarm.status === "acknowledged" ? "Ack" : "Cleared"}
                      </Badge>
                      {alarm.status === "active" && (
                        <Button size="sm" variant="outline">인지</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alarm Performance Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">평균 응답 시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">2.3</span>
                  <span className="text-sm text-muted-foreground">분</span>
                </div>
                <p className="text-xs text-green-600 mt-1">목표 대비 -0.7분</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">알람 인지율</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">94.2</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Progress value={94.2} className="h-2 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nuisance Alarm Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">8.5</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">목표: 5% 이하</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">알람 해결율</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">87.3</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Progress value={87.3} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* 신규 알람 등록 다이얼로그 */}
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                신규 알람 등록
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">알람 정보</TabsTrigger>
                <TabsTrigger value="trigger">Trigger 설정</TabsTrigger>
                <TabsTrigger value="rules">발생/해제 규칙</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag-id">Tag ID *</Label>
                    <Input 
                      id="tag-id"
                      value={alarmTagId}
                      onChange={(e) => setAlarmTagId(e.target.value)}
                      placeholder="예: TI-2001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit *</Label>
                    <Select value={alarmUnit} onValueChange={setAlarmUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDU">CDU</SelectItem>
                        <SelectItem value="VDU">VDU</SelectItem>
                        <SelectItem value="HCR">HCR</SelectItem>
                        <SelectItem value="CCR">CCR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alarm-desc">알람 설명 *</Label>
                  <Input 
                    id="alarm-desc"
                    value={alarmDescription}
                    onChange={(e) => setAlarmDescription(e.target.value)}
                    placeholder="예: Reactor Inlet Temperature High"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>알람 유형</Label>
                    <Select value={alarmType} onValueChange={(v: typeof alarmType) => setAlarmType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="process">공정 알람</SelectItem>
                        <SelectItem value="equipment">설비 알람</SelectItem>
                        <SelectItem value="safety">안전 알람</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>우선순위 *</Label>
                    <Select value={alarmPriority} onValueChange={(v: typeof alarmPriority) => setAlarmPriority(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical - 즉시 대응</SelectItem>
                        <SelectItem value="high">High - 10분 내 대응</SelectItem>
                        <SelectItem value="medium">Medium - 30분 내 대응</SelectItem>
                        <SelectItem value="low">Low - 정보성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rationale">등록 근거</Label>
                  <Textarea
                    id="rationale"
                    value={alarmRationale}
                    onChange={(e) => setAlarmRationale(e.target.value)}
                    placeholder="알람 등록 근거 및 배경 설명 (예: Safety Study 결과, 과거 사고 사례 등)"
                    className="min-h-20"
                  />
                </div>
              </TabsContent>

              <TabsContent value="trigger" className="space-y-4 mt-4">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Setpoint 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="setpoint-high">High Setpoint</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="setpoint-high"
                            value={alarmSetpointHigh}
                            onChange={(e) => setAlarmSetpointHigh(e.target.value)}
                            placeholder="예: 400"
                            type="number"
                          />
                          <Select defaultValue="degC">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="degC">°C</SelectItem>
                              <SelectItem value="bar">bar</SelectItem>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="m3h">m3/h</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="setpoint-low">Low Setpoint</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="setpoint-low"
                            value={alarmSetpointLow}
                            onChange={(e) => setAlarmSetpointLow(e.target.value)}
                            placeholder="예: 350"
                            type="number"
                          />
                          <Select defaultValue="degC">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="degC">°C</SelectItem>
                              <SelectItem value="bar">bar</SelectItem>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="m3h">m3/h</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deadband">Deadband</Label>
                        <Input 
                          id="deadband"
                          value={alarmDeadband}
                          onChange={(e) => setAlarmDeadband(e.target.value)}
                          placeholder="예: 2"
                          type="number"
                        />
                        <p className="text-xs text-muted-foreground">알람 해제를 위한 히스테리시스 값</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delay">Delay (초)</Label>
                        <Input 
                          id="delay"
                          value={alarmDelay}
                          onChange={(e) => setAlarmDelay(e.target.value)}
                          placeholder="예: 5"
                          type="number"
                        />
                        <p className="text-xs text-muted-foreground">알람 발생 전 대기 시간</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50/50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Trigger Point 미리보기</p>
                        <p className="mt-1">
                          {alarmSetpointHigh && `High: ${alarmSetpointHigh} 초과 시 알람 발생`}
                          {alarmSetpointHigh && alarmSetpointLow && " | "}
                          {alarmSetpointLow && `Low: ${alarmSetpointLow} 미만 시 알람 발생`}
                          {!alarmSetpointHigh && !alarmSetpointLow && "Setpoint를 입력하세요"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="on-condition">알람 발생 조건 (상세)</Label>
                  <Textarea
                    id="on-condition"
                    value={alarmOnCondition}
                    onChange={(e) => setAlarmOnCondition(e.target.value)}
                    placeholder="예: TI-2001 > 400°C AND 5초 이상 지속 시 발생"
                    className="min-h-20 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="off-condition">알람 해제 조건</Label>
                  <Textarea
                    id="off-condition"
                    value={alarmOffCondition}
                    onChange={(e) => setAlarmOffCondition(e.target.value)}
                    placeholder="예: TI-2001 < 398°C (Deadband 적용) 시 해제"
                    className="min-h-20 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response-guide">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      운전원 응답 가이드
                    </div>
                  </Label>
                  <Textarea
                    id="response-guide"
                    value={alarmResponseGuide}
                    onChange={(e) => setAlarmResponseGuide(e.target.value)}
                    placeholder="알람 발생 시 운전원이 취해야 할 조치 사항을 상세히 기술&#10;&#10;1. 즉시 확인 사항&#10;2. 초기 대응 조치&#10;3. 에스컬레이션 기준"
                    className="min-h-32"
                  />
                </div>

                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-700">
                        <p className="font-medium">알람 등록 검토 사항</p>
                        <ul className="mt-1 space-y-1 list-disc list-inside">
                          <li>Nuisance Alarm 가능성 검토 완료 여부</li>
                          <li>기존 유사 알람과의 중복 여부</li>
                          <li>응답 가이드의 구체성 및 실행 가능성</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>취소</Button>
              <Button 
                onClick={handleRegisterAlarm}
                disabled={!alarmTagId || !alarmUnit || !alarmDescription}
              >
                <Bell className="h-4 w-4 mr-2" />
                알람 등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
