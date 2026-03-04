"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Server,
  Activity
} from "lucide-react"

const dataQualityMetrics = [
  { source: "DCS Tags", total: 12450, valid: 12380, quality: 99.4, status: "good" },
  { source: "Lab Data", total: 856, valid: 842, quality: 98.4, status: "good" },
  { source: "Manual Entry", total: 234, valid: 218, quality: 93.2, status: "warning" },
  { source: "External Feed", total: 128, valid: 125, quality: 97.7, status: "good" },
]

const recentIssues = [
  { id: 1, source: "DCS", tag: "TI-2001", issue: "Sensor Freeze", timestamp: "14:25", status: "active" },
  { id: 2, source: "Lab", tag: "S-1234", issue: "Missing Value", timestamp: "13:40", status: "resolved" },
  { id: 3, source: "Manual", tag: "LOG-045", issue: "Out of Range", timestamp: "12:15", status: "active" },
]

export default function AdminPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">데이터 품질 현황</h1>
              <p className="text-sm text-muted-foreground">데이터 품질 모니터링 및 관리</p>
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Quality</p>
                    <p className="text-2xl font-bold text-green-600">98.7%</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Data Points</p>
                    <p className="text-2xl font-bold">13,668</p>
                  </div>
                  <Database className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Issues</p>
                    <p className="text-2xl font-bold text-amber-600">2</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Sync</p>
                    <p className="text-2xl font-bold">2분 전</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Data Quality by Source */}
            <Card>
              <CardHeader>
                <CardTitle>소스별 데이터 품질</CardTitle>
                <CardDescription>데이터 소스별 품질 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataQualityMetrics.map((metric) => (
                    <div key={metric.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{metric.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {metric.valid.toLocaleString()} / {metric.total.toLocaleString()}
                          </span>
                          <Badge variant={metric.status === "good" ? "default" : "destructive"}>
                            {metric.quality}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={metric.quality} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card>
              <CardHeader>
                <CardTitle>최근 이슈</CardTitle>
                <CardDescription>데이터 품질 관련 이슈 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {issue.status === "active" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{issue.tag}</p>
                          <p className="text-xs text-muted-foreground">{issue.issue}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={issue.status === "active" ? "destructive" : "secondary"}>
                          {issue.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{issue.timestamp}</p>
                      </div>
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
