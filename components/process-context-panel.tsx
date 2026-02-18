"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Ticket } from "@/lib/types"
import { getProcessData } from "@/lib/process-data"
import { Activity, Gauge, Thermometer, Info, Wrench, FileBarChart, Clock, AlertTriangle } from "lucide-react"

interface ProcessContextPanelProps {
  ticket: Ticket
}

export function ProcessContextPanel({ ticket }: ProcessContextPanelProps) {
  if (!ticket.unit) return null

  const processData = getProcessData(ticket.unit, ticket.fromTime, ticket.toTime)

  if (processData.length === 0) return null

  const data = processData[0]

  const getEquipmentInfo = (unit: string) => {
    return {
      designCapacity: "50,000 BPD",
      permitCapacity: "52,000 BPD",
      installDate: "2015-03-15",
      lastMaintenance: "2025-11-20",
      manufacturer: "제조사 A",
      model: "Model XYZ-2000",
      maintenanceHistory: [
        { date: "2025-11-20", type: "정기점검", description: "촉매 교체 및 압력 용기 점검" },
        { date: "2025-08-15", type: "긴급수리", description: "펌프 씰 교체" },
        { date: "2025-05-10", type: "정기점검", description: "열교환기 세척" },
      ],
      analysisHistory: [
        { date: "2025-12-01", title: "공정 효율성 분석", result: "정상 범위 내 운전" },
        { date: "2025-09-15", title: "에너지 소비 분석", result: "최적화 필요" },
      ],
      inspectionHistory: [
        { date: "2025-10-20", inspector: "이철수", result: "적합" },
        { date: "2025-07-15", inspector: "박영희", result: "적합" },
      ],
    }
  }

  const equipmentInfo = ticket.context?.unit ? getEquipmentInfo(ticket.context.unit) : null

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">공정 데이터</h3>
      </div>

      <div className="space-y-4">
        {/* Time Range */}
        {(ticket.fromTime || ticket.toTime) && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-foreground">이벤트 프레임</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {ticket.ticketType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">시간 범위</p>
            <p className="text-sm font-medium text-foreground">
              {ticket.fromTime && new Date(ticket.fromTime).toLocaleString("ko-KR")}
              {ticket.fromTime && ticket.toTime && " → "}
              {ticket.toTime && new Date(ticket.toTime).toLocaleString("ko-KR")}
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-muted-foreground">
                영향도: <span className="font-medium text-foreground">{ticket.impact}</span>
              </span>
            </div>
          </div>
        )}

        {/* Operating Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">운전 모드</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{data.mode}</p>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">처리량</p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {data.throughput.toLocaleString()} {data.throughputUnit}
            </p>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">온도 / 압력</p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {data.temperature}°C / {data.pressure} bar
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">주요 성능 지표</p>
          <div className="space-y-2">
            {data.kpis.map((kpi) => (
              <div key={kpi.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">{kpi.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {kpi.value} {kpi.unit}
                  </span>
                  <Badge variant={kpi.status === "Normal" ? "secondary" : "destructive"} className="text-xs">
                    {kpi.status === "Normal" ? "정상" : "비정상"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {equipmentInfo && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Wrench className="h-4 w-4" />
                장치정보 확인하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{ticket.context?.unit} 장치 정보</DialogTitle>
                <DialogDescription>장치 기본 정보 및 이력</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    기본 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground">설계 용량</p>
                      <p className="text-sm font-medium">{equipmentInfo.designCapacity}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground">인허가 용량</p>
                      <p className="text-sm font-medium">{equipmentInfo.permitCapacity}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground">설치일</p>
                      <p className="text-sm font-medium">{equipmentInfo.installDate}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground">최근 정비</p>
                      <p className="text-sm font-medium">{equipmentInfo.lastMaintenance}</p>
                    </div>
                  </div>
                </div>

                {/* Maintenance History */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    정비 이력
                  </h4>
                  <div className="space-y-2">
                    {equipmentInfo.maintenanceHistory.map((item, i) => (
                      <div key={i} className="p-3 border border-border rounded">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                        <p className="text-sm">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis History */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileBarChart className="h-4 w-4" />
                    분석 이력
                  </h4>
                  <div className="space-y-2">
                    {equipmentInfo.analysisHistory.map((item, i) => (
                      <div key={i} className="p-3 border border-border rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.result}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inspection History */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">점검 이력</h4>
                  <div className="space-y-2">
                    {equipmentInfo.inspectionHistory.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                        <div>
                          <p className="text-sm font-medium">{item.inspector}</p>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                        </div>
                        <Badge variant={item.result === "적합" ? "secondary" : "destructive"}>{item.result}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">운행 메모</p>
            <p className="text-sm text-foreground">{data.notes}</p>
          </div>
        )}

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">관련 태그</p>
            <div className="flex flex-wrap gap-2">
              {ticket.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
