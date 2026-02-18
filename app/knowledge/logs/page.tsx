"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Clock,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

const LOGS = [
  { time: "10:32:15", level: "info", source: "RTO-HCR", message: "Optimization cycle completed successfully" },
  { time: "10:30:45", level: "warning", source: "DCS-A", message: "Communication delay detected (>100ms)" },
  { time: "10:28:33", level: "info", source: "ML-M001", message: "Prediction generated for TI-2001" },
  { time: "10:25:12", level: "error", source: "DATA-SVC", message: "Failed to fetch historian data for tag FI-3001" },
  { time: "10:22:08", level: "info", source: "AUTH", message: "User login: 김지수 (Process Engineering)" },
  { time: "10:20:00", level: "info", source: "SCHEDULER", message: "Hourly data aggregation started" },
]

export default function SystemLogsPage() {
  const [levelFilter, setLevelFilter] = useState("all")

  const filteredLogs = LOGS.filter(log => levelFilter === "all" || log.level === levelFilter)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Logs</h1>
            <p className="text-muted-foreground">시스템 로그 및 이벤트 기록</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="레벨" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              로그 ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {filteredLogs.map((log, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded",
                    log.level === "error" && "bg-red-50",
                    log.level === "warning" && "bg-amber-50"
                  )}
                >
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.time}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      log.level === "info" && "border-blue-300 text-blue-600",
                      log.level === "warning" && "border-amber-300 text-amber-600",
                      log.level === "error" && "border-red-300 text-red-600"
                    )}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{log.source}</Badge>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
