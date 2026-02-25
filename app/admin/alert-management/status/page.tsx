"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  Archive,
  BarChart3,
  User,
} from "lucide-react"
import { ALERT_STATUS_DATA, PERSONAL_STATUS_DATA, getGradeColor, getStateInfo } from "../alert-data"

export default function AlertStatusPage() {
  const [statusTab, setStatusTab] = useState("all")

  const newCount = ALERT_STATUS_DATA.filter(a => a.state === "new").length
  const standingCount = ALERT_STATUS_DATA.filter(a => a.state === "standing").length
  const shelvedCount = ALERT_STATUS_DATA.filter(a => a.state === "shelved").length
  const resolvedCount = ALERT_STATUS_DATA.filter(a => a.state === "resolved").length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Alert 현황</h1>
              <p className="text-sm text-muted-foreground">현재 발생 중인 Alert 현황 모니터링 (전체 / 개인화)</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs value={statusTab} onValueChange={setStatusTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                전체 Alert 현황
              </TabsTrigger>
              <TabsTrigger value="personal" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                개인화 Alert 현황
              </TabsTrigger>
            </TabsList>

            {/* ===== 전체 Alert 현황 ===== */}
            <TabsContent value="all" className="space-y-4">
              {/* Status summary cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { state: "new", icon: AlertTriangle, iconColor: "text-red-500" },
                  { state: "standing", icon: Clock, iconColor: "text-amber-500" },
                  { state: "shelved", icon: Archive, iconColor: "text-muted-foreground" },
                  { state: "resolved", icon: CheckCircle, iconColor: "text-emerald-500" },
                ].map(item => {
                  const info = getStateInfo(item.state)
                  const count = ALERT_STATUS_DATA.filter(a => a.state === item.state).length
                  const Icon = item.icon
                  return (
                    <Card key={item.state} className={cn("hover:shadow-sm transition-shadow", item.state === "new" && count > 0 && "border-red-200")}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className={cn("text-xs mb-1", info.color)}>{info.label}</Badge>
                            <p className="text-2xl font-bold mt-1">{count}</p>
                          </div>
                          <Icon className={cn("h-8 w-8 opacity-40", item.iconColor)} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Full status table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">등급</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">현재값</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Limit</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">발생횟수</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">최초 발생</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">최근 발생</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">담당자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ALERT_STATUS_DATA.map(a => {
                          const stateInfo = getStateInfo(a.state)
                          return (
                            <tr key={a.id} className={cn("border-b hover:bg-muted/30 transition-colors", a.state === "new" && "bg-red-50/30")}>
                              <td className="px-4 py-3 font-mono font-medium">{a.tagId}</td>
                              <td className="px-4 py-3">{a.name}</td>
                              <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.unit}</Badge></td>
                              <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", getGradeColor(a.grade))}>{a.grade}</Badge></td>
                              <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", stateInfo.color)}>{stateInfo.label}</Badge></td>
                              <td className={cn("px-4 py-3 text-right font-mono", a.state === "new" && "text-red-600 font-semibold")}>{a.value} {a.uom}</td>
                              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{a.limit} {a.uom}</td>
                              <td className="px-4 py-3 text-center">
                                {a.occurrences > 1 ? (
                                  <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                    {a.occurrences}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">{a.occurrences}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{a.firstOccurrence}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{a.lastOccurrence}</td>
                              <td className="px-4 py-3 text-center text-xs">{a.assignee}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                    전체 {ALERT_STATUS_DATA.length}건
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== 개인화 Alert 현황 ===== */}
            <TabsContent value="personal" className="space-y-4">
              {/* Personal summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card className={cn(PERSONAL_STATUS_DATA.length > 0 && "border-red-200")}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">발생 중</p>
                        <p className="text-2xl font-bold text-red-600">{PERSONAL_STATUS_DATA.filter(a => a.state === "active").length}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500/40" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">모니터링 중</p>
                        <p className="text-2xl font-bold text-primary">{PERSONAL_STATUS_DATA.filter(a => a.state === "monitoring").length}</p>
                      </div>
                      <Clock className="h-8 w-8 text-primary/40" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">정상 복귀</p>
                        <p className="text-2xl font-bold text-emerald-600">{PERSONAL_STATUS_DATA.filter(a => a.state === "normal").length}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-500/40" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">현재값</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Threshold</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">발생 시각</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PERSONAL_STATUS_DATA.map(a => {
                          const stateInfo = getStateInfo(a.state)
                          return (
                            <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-mono font-medium">{a.tagId}</td>
                              <td className="px-4 py-3">{a.name}</td>
                              <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.unit}</Badge></td>
                              <td className="px-4 py-3 text-center"><Badge className={cn("text-xs", stateInfo.color)}>{stateInfo.label}</Badge></td>
                              <td className="px-4 py-3 text-right font-mono text-red-600 font-semibold">{a.value} {a.uom}</td>
                              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{a.threshold} {a.uom}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{a.triggeredAt}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {PERSONAL_STATUS_DATA.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">현재 발생 중인 개인화 Alert이 없습니다.</p>
                    </div>
                  )}
                  <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                    전체 {PERSONAL_STATUS_DATA.length}건
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
