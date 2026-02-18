"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Activity } from "lucide-react"

const STREAMS = [
  { from: "CDU", to: "VDU", stream: "Residue", flow: "450 m3/hr", status: "normal" },
  { from: "CDU", to: "HCR", stream: "VGO", flow: "280 m3/hr", status: "normal" },
  { from: "VDU", to: "HCR", stream: "HVGO", flow: "180 m3/hr", status: "normal" },
  { from: "HCR", to: "CCR", stream: "Heavy Naphtha", flow: "120 m3/hr", status: "warning" },
  { from: "CCR", to: "Tank", stream: "Reformate", flow: "115 m3/hr", status: "normal" },
]

export default function ProcessInterconnectionPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Process Interconnection</h1>
          <p className="text-muted-foreground">공정 간 스트림 연결 현황</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              주요 스트림 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STREAMS.map((stream, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    stream.status === "warning" ? "border-amber-300 bg-amber-50/50" : ""
                  }`}
                >
                  <Badge variant="outline" className="text-sm font-medium w-16 justify-center">{stream.from}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-sm font-medium w-16 justify-center">{stream.to}</Badge>
                  <div className="flex-1">
                    <span className="font-medium">{stream.stream}</span>
                  </div>
                  <span className="font-mono text-sm">{stream.flow}</span>
                  <Badge variant={stream.status === "normal" ? "secondary" : "outline"}
                    className={stream.status === "warning" ? "border-amber-300 text-amber-600" : ""}>
                    {stream.status === "normal" ? "정상" : "주의"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
