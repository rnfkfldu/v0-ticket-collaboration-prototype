"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Gauge,
  Thermometer,
  Droplets,
  Wind,
  BarChart3,
  FileText,
  Cpu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_PROCESSES } from "@/lib/user-context"
import Link from "next/link"

// CDU process flow nodes
const CDU_NODES = [
  { id: "feed", label: "Crude Feed", x: 60, y: 180, w: 100, h: 50, type: "feed" },
  { id: "desalter", label: "Desalter", x: 200, y: 180, w: 90, h: 50, type: "equipment" },
  { id: "furnace", label: "Furnace", x: 340, y: 180, w: 90, h: 50, type: "equipment" },
  { id: "column", label: "CDU Column", x: 490, y: 100, w: 100, h: 160, type: "column" },
  { id: "ovhd", label: "OVHD", x: 650, y: 50, w: 80, h: 35, type: "product" },
  { id: "lk", label: "LK", x: 650, y: 100, w: 80, h: 35, type: "product" },
  { id: "hk", label: "HK", x: 650, y: 150, w: 80, h: 35, type: "product" },
  { id: "lgo", label: "LGO", x: 650, y: 200, w: 80, h: 35, type: "product" },
  { id: "hgo", label: "HGO", x: 650, y: 250, w: 80, h: 35, type: "product" },
  { id: "ar", label: "AR", x: 650, y: 300, w: 80, h: 35, type: "product" },
  { id: "vdu", label: "VDU", x: 780, y: 300, w: 80, h: 35, type: "downstream" },
]

const CDU_CONNECTIONS = [
  { from: "feed", to: "desalter" },
  { from: "desalter", to: "furnace" },
  { from: "furnace", to: "column" },
  { from: "column", to: "ovhd", label: "0 BD" },
  { from: "column", to: "lk", label: "0 BD" },
  { from: "column", to: "hk", label: "0 BD" },
  { from: "column", to: "lgo", label: "0 BD" },
  { from: "column", to: "hgo", label: "0 BD" },
  { from: "column", to: "ar", label: "0 BD" },
  { from: "ar", to: "vdu" },
]

// Generate mock variables
function generateVariables(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return [
    { tag: `TI-${1000 + (hash % 100)}`, name: "Column Top Temp", value: (120 + (hash % 30)).toFixed(1), unit: "C", guide: (125).toFixed(1), status: hash % 5 === 0 ? "warning" : "normal" },
    { tag: `PI-${1100 + (hash % 100)}`, name: "Column Pressure", value: (1.2 + (hash % 5) * 0.1).toFixed(2), unit: "kg/cm2", guide: "1.50", status: "normal" },
    { tag: `FI-${1200 + (hash % 100)}`, name: "Feed Flow", value: (330 + (hash % 40)).toFixed(0), unit: "m3/h", guide: "350", status: "normal" },
    { tag: `TI-${1300 + (hash % 100)}`, name: "Furnace Outlet", value: (360 + (hash % 15)).toFixed(1), unit: "C", guide: "365.0", status: hash % 3 === 0 ? "warning" : "normal" },
    { tag: `FI-${1400 + (hash % 100)}`, name: "Reflux Flow", value: (85 + (hash % 20)).toFixed(1), unit: "m3/h", guide: "90.0", status: "normal" },
    { tag: `TI-${1500 + (hash % 100)}`, name: "OVHD Temp", value: (105 + (hash % 15)).toFixed(1), unit: "C", guide: "110.0", status: "normal" },
    { tag: `LI-${1600 + (hash % 100)}`, name: "Column Level", value: (48 + (hash % 10)).toFixed(1), unit: "%", guide: "50.0", status: "normal" },
    { tag: `AI-${1700 + (hash % 100)}`, name: "AR Flash Point", value: (68 + (hash % 12)).toFixed(1), unit: "C", guide: "65.0", status: hash % 4 === 0 ? "warning" : "normal" },
  ]
}

// Feed/product data
function generateFeedData(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return {
    feeds: [
      { name: unitName, subLabel: "Feed", actual: (330000 + hash * 100) , capacity: 330000, percentage: 100 },
    ],
    products: [
      { label: "LPG", bd: 7216, pct: 2.2, color: "#ef4444" },
      { label: "WSR", bd: 59460, pct: 18.0, color: "#3b82f6" },
      { label: "LK", bd: 36059, pct: 10.9, color: "#eab308" },
      { label: "HK", bd: 22533, pct: 6.8, color: "#f97316" },
      { label: "LGO", bd: 34611, pct: 10.5, color: "#8b5cf6" },
      { label: "HGO", bd: 42855, pct: 13.0, color: "#6366f1" },
      { label: "AR", bd: 127762, pct: 38.7, color: "#64748b" },
    ]
  }
}

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const decodedId = decodeURIComponent(id)

  const process = ALL_PROCESSES.find(p => p.id === decodedId)
  const unitName = process?.name || decodedId

  const variables = useMemo(() => generateVariables(unitName), [unitName])
  const feedData = useMemo(() => generateFeedData(unitName), [unitName])
  const warningCount = variables.filter(v => v.status === "warning").length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-card px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/operations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{unitName}</h1>
              <p className="text-xs text-muted-foreground">Monitoring Detail</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </Badge>
              <span className="text-xs text-muted-foreground">2026-02-19 07:14:21</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="flex h-full">
            {/* Left Summary Panel */}
            <div className="w-72 border-r bg-card p-5 flex-shrink-0 space-y-5 overflow-y-auto">
              <div>
                <h3 className="text-sm font-semibold mb-3">Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">처리량 가이드 준수율</p>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded border">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">(-)</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Product Spec Guide 준수율</p>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded border">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">- / 100%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Operation Guide 준수율</p>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded border">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">- / 100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Quick Link</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-8 bg-card justify-center">생산포탈</Button>
                  <Button variant="outline" size="sm" className="text-xs h-8 bg-card justify-center">SFD</Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">알림</h4>
                {warningCount > 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    주의 변수 {warningCount}건 발생 중
                  </div>
                ) : (
                  <div className="p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    모든 변수 정상 범위
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="overview" className="h-full">
                <div className="border-b bg-card px-6">
                  <TabsList className="bg-transparent h-10 p-0 gap-0">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-xs">Unit Overview</TabsTrigger>
                    <TabsTrigger value="variables" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-xs">Key Operating Variables</TabsTrigger>
                    <TabsTrigger value="anomaly" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-xs">Anomaly Detection</TabsTrigger>
                  </TabsList>
                </div>

                {/* Unit Overview */}
                <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Process Status</h3>
                    <Card className="p-4">
                      <svg viewBox="0 0 900 360" className="w-full h-auto">
                        <defs>
                          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                          </marker>
                        </defs>
                        {/* Connections */}
                        {CDU_CONNECTIONS.map((conn, i) => {
                          const from = CDU_NODES.find(n => n.id === conn.from)!
                          const to = CDU_NODES.find(n => n.id === conn.to)!
                          const x1 = from.x + from.w
                          const y1 = from.y + from.h / 2
                          const x2 = to.x
                          const y2 = to.y + to.h / 2
                          return (
                            <g key={i}>
                              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                              {conn.label && (
                                <text x={(x1 + x2) / 2} y={y2 - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{conn.label}</text>
                              )}
                            </g>
                          )
                        })}
                        {/* Nodes */}
                        {CDU_NODES.map(node => (
                          <g key={node.id}>
                            <rect
                              x={node.x} y={node.y} width={node.w} height={node.h}
                              rx={node.type === "column" ? 8 : 4}
                              fill={node.type === "feed" ? "#f1f5f9" : node.type === "column" ? "#e0f2fe" : node.type === "product" ? "#f0fdf4" : node.type === "downstream" ? "#fef3c7" : "#f8fafc"}
                              stroke={node.type === "column" ? "#0ea5e9" : node.type === "product" ? "#22c55e" : node.type === "downstream" ? "#f59e0b" : "#cbd5e1"}
                              strokeWidth="1.5"
                            />
                            <text x={node.x + node.w / 2} y={node.y + node.h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="500" fill="#334155">
                              {node.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </Card>
                  </div>

                  {/* Analyze Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Analyze</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Feed */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Feed 처리량</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-4">
                            {feedData.feeds.map(f => (
                              <div key={f.name} className="text-center space-y-3 p-4 border rounded-lg">
                                <p className="text-sm font-semibold">{f.name}</p>
                                <p className="text-xs text-muted-foreground">{f.subLabel}</p>
                                <div className="relative mx-auto w-28 h-28">
                                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#0d9488" strokeWidth="8" strokeDasharray={`${f.percentage * 2.51} 251`} strokeLinecap="round" />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">{f.percentage}%</span>
                                  </div>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between"><span className="text-muted-foreground">Actual</span><span className="font-medium">{f.actual.toLocaleString()} BD</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{f.capacity.toLocaleString()} BD</span></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Product Yield */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Product Yield</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium text-muted-foreground">Label</th>
                                <th className="text-right py-2 font-medium text-muted-foreground">BD</th>
                                <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {feedData.products.map(p => (
                                <tr key={p.label} className="border-b last:border-0">
                                  <td className="py-2 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    {p.label}
                                  </td>
                                  <td className="text-right py-2 font-mono">{p.bd.toLocaleString()}</td>
                                  <td className="text-right py-2">{p.pct}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Key Operating Variables */}
                <TabsContent value="variables" className="p-6 mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          Key Operating Variables
                          <Badge variant="secondary" className="text-xs">{variables.length}</Badge>
                        </CardTitle>
                        {warningCount > 0 && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {warningCount} Warning
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Tag ID</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Description</th>
                            <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">현재값</th>
                            <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Unit</th>
                            <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Guide</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variables.map(v => (
                            <tr key={v.tag} className={cn("border-b last:border-0 hover:bg-muted/30", v.status === "warning" && "bg-amber-50/50")}>
                              <td className="px-3 py-2.5">
                                {v.status === "warning" ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{v.tag}</td>
                              <td className="px-3 py-2.5 text-sm">{v.name}</td>
                              <td className={cn("text-right px-3 py-2.5 font-mono text-sm font-medium", v.status === "warning" ? "text-amber-700" : "text-foreground")}>{v.value}</td>
                              <td className="text-right px-3 py-2.5 text-xs text-muted-foreground">{v.unit}</td>
                              <td className="text-right px-3 py-2.5 text-xs text-muted-foreground">{v.guide}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Anomaly Detection */}
                <TabsContent value="anomaly" className="p-6 mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Anomaly Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {warningCount > 0 ? (
                        <div className="space-y-3">
                          {variables.filter(v => v.status === "warning").map(v => (
                            <div key={v.tag} className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{v.name} ({v.tag})</p>
                                <p className="text-xs text-amber-700 mt-0.5">현재값 {v.value} {v.unit} (Guide: {v.guide})</p>
                              </div>
                              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">주의</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-foreground">이상징후 미탐지</p>
                          <p className="text-xs text-muted-foreground mt-1">모든 운전 변수가 정상 범위 내에서 운전 중입니다.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
