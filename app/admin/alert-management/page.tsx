"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Bell,
  Plus,
  Search,
  AlertTriangle,
  AlertCircle,
  Clock,
  Download,
  Edit as EditIcon,
  Trash2,
  User,
  Settings,
  FileText,
} from "lucide-react"
import { ALERT_MASTER_DATA, PERSONAL_ALERT_DATA, ALERT_STATUS_DATA, getGradeColor } from "./alert-data"

export default function AlertListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterGrade, setFilterGrade] = useState("all")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  
  // 알람 등록 폼 상태
  const [alarmTagId, setAlarmTagId] = useState("")
  const [alarmUnit, setAlarmUnit] = useState("")
  const [alarmDescription, setAlarmDescription] = useState("")
  const [alarmType, setAlarmType] = useState<"process" | "equipment" | "safety">("process")
  const [alarmPriority, setAlarmPriority] = useState<"critical" | "high" | "medium" | "low">("medium")
  const [alarmGrade, setAlarmGrade] = useState<"상" | "중" | "하">("중")
  const [alarmSetpointHigh, setAlarmSetpointHigh] = useState("")
  const [alarmSetpointLow, setAlarmSetpointLow] = useState("")
  const [alarmDeadband, setAlarmDeadband] = useState("")
  const [alarmDelay, setAlarmDelay] = useState("")
  const [alarmOnCondition, setAlarmOnCondition] = useState("")
  const [alarmOffCondition, setAlarmOffCondition] = useState("")
  const [alarmRationale, setAlarmRationale] = useState("")
  const [alarmResponseGuide, setAlarmResponseGuide] = useState("")
  const [alarmUom, setAlarmUom] = useState("degC")

  const handleRegisterAlarm = () => {
    alert(`알람이 등록되었습니다.\n\nTag ID: ${alarmTagId}\nUnit: ${alarmUnit}\n설명: ${alarmDescription}`)
    setShowRegisterDialog(false)
    // Reset form
    setAlarmTagId("")
    setAlarmUnit("")
    setAlarmDescription("")
    setAlarmType("process")
    setAlarmPriority("medium")
    setAlarmGrade("중")
    setAlarmSetpointHigh("")
    setAlarmSetpointLow("")
    setAlarmDeadband("")
    setAlarmDelay("")
    setAlarmOnCondition("")
    setAlarmOffCondition("")
    setAlarmRationale("")
    setAlarmResponseGuide("")
    setAlarmUom("degC")
  }

  const filteredMasterAlerts = ALERT_MASTER_DATA.filter(a => {
    const matchSearch = searchQuery === "" ||
      a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchUnit = filterUnit === "all" || a.unit === filterUnit
    const matchGrade = filterGrade === "all" || a.grade === filterGrade
    return matchSearch && matchUnit && matchGrade
  })

  const units = [...new Set(ALERT_MASTER_DATA.map(a => a.unit))]

  const totalAlerts = ALERT_MASTER_DATA.length
  const enabledAlerts = ALERT_MASTER_DATA.filter(a => a.enabled).length
  const newAlertCount = ALERT_STATUS_DATA.filter(a => a.state === "new").length
  const standingAlertCount = ALERT_STATUS_DATA.filter(a => a.state === "standing").length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Alert 전체 리스트</h1>
              <p className="text-sm text-muted-foreground">시스템에 등록된 전체 Alert 목록 관리 및 신규 Alert 등록</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                내보내기
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 Alert</p>
                    <p className="text-2xl font-bold">{totalAlerts}</p>
                  </div>
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">활성 {enabledAlerts} / 비활성 {totalAlerts - enabledAlerts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New Alert</p>
                    <p className="text-2xl font-bold text-red-600">{newAlertCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">즉시 확인 필요</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Standing Alert</p>
                    <p className="text-2xl font-bold text-amber-600">{standingAlertCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">지속 관찰 중</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">개인화 Alert</p>
                    <p className="text-2xl font-bold text-primary">{PERSONAL_ALERT_DATA.filter(a => a.enabled).length}</p>
                  </div>
                  <User className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">내가 설정한 Alert</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Register */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tag ID 또는 Alert 명칭 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 Unit</SelectItem>
                {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="등급" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 등급</SelectItem>
                <SelectItem value="상">상</SelectItem>
                <SelectItem value="중">중</SelectItem>
                <SelectItem value="하">하</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowRegisterDialog(true)} className="gap-1.5 ml-auto">
              <Plus className="h-4 w-4" />
              Alert 등록
            </Button>
          </div>

          {/* Alert Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">타입</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">등급</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Limit</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">방향</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">생성자</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMasterAlerts.map(alert => (
                      <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{alert.id}</td>
                        <td className="px-4 py-3 font-mono font-medium">{alert.tagId}</td>
                        <td className="px-4 py-3">{alert.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{alert.unit}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{alert.type}</Badge></td>
                        <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", getGradeColor(alert.grade))}>{alert.grade}</Badge></td>
                        <td className="px-4 py-3 text-right font-mono">{alert.limit} {alert.uom}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={cn("text-xs", alert.direction === "High" ? "border-red-200 text-red-600" : "border-blue-200 text-blue-600")}>
                            {alert.direction === "High" ? "\u25B2 High" : "\u25BC Low"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {alert.enabled ? (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">활성</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">비활성</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">{alert.createdBy}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><EditIcon className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                전체 {filteredMasterAlerts.length}건 표시 (총 {ALERT_MASTER_DATA.length}건)
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ===== Alert 등록 Dialog (Enhanced) ===== */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert 등록
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
                      {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alarm-desc">Alert 명칭 *</Label>
                <Input 
                  id="alarm-desc"
                  value={alarmDescription}
                  onChange={(e) => setAlarmDescription(e.target.value)}
                  placeholder="예: Reactor Inlet Temperature High"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <Label>등급 *</Label>
                  <Select value={alarmGrade} onValueChange={(v: typeof alarmGrade) => setAlarmGrade(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="상">상 - Critical</SelectItem>
                      <SelectItem value="중">중 - High</SelectItem>
                      <SelectItem value="하">하 - Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>우선순위</Label>
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
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Settings className="h-4 w-4" />
                    Setpoint 설정
                  </div>
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
                        <Select value={alarmUom} onValueChange={setAlarmUom}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="degC">°C</SelectItem>
                            <SelectItem value="bar">bar</SelectItem>
                            <SelectItem value="kgcm2">kg/cm2</SelectItem>
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
                        <Select value={alarmUom} onValueChange={setAlarmUom}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="degC">°C</SelectItem>
                            <SelectItem value="bar">bar</SelectItem>
                            <SelectItem value="kgcm2">kg/cm2</SelectItem>
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
              Alert 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
