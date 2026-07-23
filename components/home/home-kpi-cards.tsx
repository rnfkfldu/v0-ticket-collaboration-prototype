"use client"

import { Card } from "@/components/ui/card"
import { Droplets, Factory, Leaf, BrainCircuit, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Sparkline {
  points: number[]
  color: string
}

function Sparkline({ points, color }: Sparkline) {
  const width = 88
  const height = 36
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = height - ((p - min) / range) * (height - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const lastX = (points.length - 1) * step
  const lastY = height - ((points[points.length - 1] - min) / range) * (height - 6) - 3

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}

interface KpiCard {
  id: string
  label: string
  icon: React.ElementType
  iconColor: string
  value: string
  unit: string
  sub?: string
  footerLabel: string
  footerValue: string
  footerTone: "positive" | "negative" | "neutral"
  footerIcon?: "up" | "down"
  spark: number[]
}

const KPIS: KpiCard[] = [
  {
    id: "throughput",
    label: "원유 처리량",
    icon: Droplets,
    iconColor: "text-primary",
    value: "730,000",
    unit: "BPD",
    footerLabel: "목표 750,000 BPD",
    footerValue: "97.3%",
    footerTone: "positive",
    spark: [710, 715, 712, 720, 725, 722, 728, 730],
  },
  {
    id: "availability",
    label: "설비 가동률",
    icon: Factory,
    iconColor: "text-primary",
    value: "96.4",
    unit: "%",
    sub: "(81/84)",
    footerLabel: "81개 가동중",
    footerValue: "3개 TA중",
    footerTone: "neutral",
    spark: [94, 95, 96, 95.5, 96.2, 96, 96.4, 96.4],
  },
  {
    id: "eii",
    label: "EII",
    icon: Leaf,
    iconColor: "text-emerald-600",
    value: "91.3",
    unit: "Index",
    footerLabel: "목표 90.0 Index",
    footerValue: "+1.3%",
    footerTone: "negative",
    footerIcon: "up",
    spark: [89, 90, 90.5, 90.2, 91, 90.8, 91.2, 91.3],
  },
  {
    id: "optimizer",
    label: "Optimizer 가동률 (AI/RTO)",
    icon: BrainCircuit,
    iconColor: "text-primary",
    value: "87.6",
    unit: "%",
    footerLabel: "목표 90.0%",
    footerValue: "-2.4%p",
    footerTone: "negative",
    footerIcon: "down",
    spark: [90, 89, 88.5, 89, 88, 87.8, 87.5, 87.6],
  },
]

export function HomeKpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {KPIS.map((kpi) => {
        const Icon = kpi.icon
        const toneClass =
          kpi.footerTone === "positive"
            ? "text-emerald-600"
            : kpi.footerTone === "negative"
              ? "text-red-500"
              : "text-amber-600"
        return (
          <Card key={kpi.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className={cn("h-5 w-5", kpi.iconColor)} />
                </div>
                <span className="text-sm font-medium text-muted-foreground text-pretty">{kpi.label}</span>
              </div>
              <Sparkline points={kpi.spark} color="var(--color-primary)" />
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{kpi.unit}</span>
              {kpi.sub && <span className="text-sm text-muted-foreground ml-0.5">{kpi.sub}</span>}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{kpi.footerLabel}</span>
              <span className={cn("text-sm font-semibold flex items-center gap-0.5", toneClass)}>
                {kpi.footerIcon === "up" && <ArrowUp className="h-3.5 w-3.5" />}
                {kpi.footerIcon === "down" && <ArrowDown className="h-3.5 w-3.5" />}
                {kpi.footerValue}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
