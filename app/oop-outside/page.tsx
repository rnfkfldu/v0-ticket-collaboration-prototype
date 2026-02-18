"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  HelpCircle, 
  Upload, 
  MessageSquare,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  Building2
} from "lucide-react"

export default function OOPOutsidePage() {
  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">OOP Outside</h1>
              <p className="text-sm text-muted-foreground">외부 데이터 입력 및 라이센서 커뮤니케이션</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.location.href = "/oop-outside/analysis"}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">분석 데이터 입력</CardTitle>
                    <CardDescription>Lab 분석 결과 및 외부 데이터 입력</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">대기 중: 5건</Badge>
                    <Badge variant="outline">오늘 입력: 12건</Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.location.href = "/oop-outside/licensor"}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">라이센서 질의</CardTitle>
                    <CardDescription>기술 질의 및 응답 관리</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">진행 중: 3건</Badge>
                    <Badge variant="outline">응답 대기: 2건</Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-2 gap-6">
            {/* 최근 데이터 입력 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">최근 분석 데이터 입력</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "HCR Product Quality Analysis", time: "30분 전", status: "completed" },
                    { title: "CDU Crude Oil Assay", time: "2시간 전", status: "completed" },
                    { title: "VDU Residue Analysis", time: "3시간 전", status: "pending" },
                    { title: "CCR Catalyst Sample", time: "어제", status: "completed" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm">{item.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 라이센서 질의 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">라이센서 질의 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "HCR 촉매 재생 주기 관련 질의", licensor: "UOP", status: "응답 대기", days: 5 },
                    { title: "CCR Regenerator 운전 조건 확인", licensor: "Axens", status: "진행 중", days: 3 },
                    { title: "VDU Pack Section 설계 검토", licensor: "Shell", status: "완료", days: 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.licensor}</Badge>
                          <Badge 
                            variant={item.status === "완료" ? "secondary" : item.status === "응답 대기" ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                      {item.days > 0 && (
                        <span className="text-xs text-muted-foreground">{item.days}일 경과</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
