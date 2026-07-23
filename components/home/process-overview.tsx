"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Ship,
  Database,
  Factory,
  FlaskConical,
  Flame,
  Layers,
  Droplets,
  Package,
  Warehouse,
  Zap,
  Building2,
  ShieldAlert,
  ChevronRight,
} from "lucide-react"

interface Unit {
  id: string
  name: string
  sub?: string
  value: string
  icon: React.ElementType
  href: string
  highlight?: boolean
}

function UnitCard({ unit }: { unit: Unit }) {
  const router = useRouter()
  const Icon = unit.icon
  return (
    <button
      onClick={() => router.push(unit.href)}
      className={cn(
        "w-full text-left rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-primary/50 hover:bg-muted/40",
        unit.highlight ? "border-primary ring-1 ring-primary/30 bg-primary/[0.04]" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0",
            unit.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground leading-tight truncate">{unit.name}</p>
          {unit.sub && <p className="text-[10px] text-muted-foreground leading-tight">{unit.sub}</p>}
        </div>
      </div>
      <p className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">{unit.value}</p>
    </button>
  )
}

function FlowArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center px-1 text-muted-foreground/50" aria-hidden="true">
      <ChevronRight className="h-5 w-5" />
    </div>
  )
}

function StageColumn({ title, units }: { title: string; units: Unit[] }) {
  return (
    <div className="flex-1 min-w-[150px]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-0.5">{title}</p>
      <div className="space-y-2">
        {units.map((u) => (
          <UnitCard key={u.id} unit={u} />
        ))}
      </div>
    </div>
  )
}

const FEED: Unit[] = [
  { id: "unload", name: "원유하역", value: "742,000 BPD", icon: Ship, href: "/operations" },
  { id: "tank", name: "원유탱크", value: "738,000 BPD", icon: Database, href: "/operations" },
]

const DISTILL: Unit[] = [
  { id: "cdu", name: "상압증류공정", sub: "CDU", value: "730,000 BPD", icon: Factory, href: "/operations", highlight: true },
]

const CONVERSION: Unit[] = [
  { id: "hdt", name: "감압잔유 수첨탈황", sub: "HDT", value: "27,000 BPD", icon: FlaskConical, href: "/operations" },
  { id: "vhcf", name: "감압잔유 수첨분해", sub: "VHCF/CC", value: "95,000 BPD", icon: Flame, href: "/operations" },
  { id: "vgofcc", name: "유동상촉매분해", sub: "VGOFCC", value: "41,000 BPD", icon: Layers, href: "/operations" },
  { id: "bdp", name: "바이오오일 수첨", sub: "BDP", value: "13,500 BPD", icon: Droplets, href: "/operations" },
]

const PRODUCT: Unit[] = [
  { id: "petro", name: "석유화학원료공정", value: "25,000 BPD", icon: FlaskConical, href: "/operations" },
  { id: "recovery", name: "제품회수", value: "198,000 BPD", icon: Package, href: "/operations" },
  { id: "storage", name: "제품저장", value: "158,000 BPD", icon: Warehouse, href: "/operations" },
]

const SUPPORT: Unit[] = [
  { id: "ppd", name: "울산아로마추출", sub: "PPD", value: "31,000 BPD", icon: FlaskConical, href: "/operations" },
  { id: "sru", name: "황회수공정", sub: "SRU", value: "23,500 BPD", icon: Flame, href: "/operations" },
  { id: "water", name: "수처리시설", value: "13,500 BPD", icon: Droplets, href: "/operations" },
  { id: "power", name: "발전 · 스팀 · 소각", value: "54.0 MW", icon: Zap, href: "/operations" },
]

const CDU_TRAINS = [
  { name: "1 CDU", capacity: "185,000", actual: "183,100" },
  { name: "2 CDU", capacity: "185,000", actual: "182,700" },
  { name: "3 CDU", capacity: "185,000", actual: "182,400" },
  { name: "4 CDU", capacity: "185,000", actual: "181,800" },
]

export function ProcessOverview() {
  const router = useRouter()
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">공정 개요도</h2>
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
          실시간 처리량 기준
        </Badge>
      </div>

      {/* Main flow */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 lg:gap-0">
        <StageColumn title="원유 수급" units={FEED} />
        <FlowArrow />
        <StageColumn title="상압증류" units={DISTILL} />
        <FlowArrow />
        <StageColumn title="전환 공정" units={CONVERSION} />
        <FlowArrow />
        <StageColumn title="제품 · 저장" units={PRODUCT} />
      </div>

      {/* CDU trains detail */}
      <div className="mt-5 rounded-lg border border-primary/30 bg-primary/[0.03] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Factory className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">상압증류공정 (CDU) 트레인 현황</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CDU_TRAINS.map((t) => (
            <button
              key={t.name}
              onClick={() => router.push("/operations")}
              className="text-left rounded-md border border-border bg-card px-3 py-2 hover:border-primary/50 transition-colors"
            >
              <p className="text-xs font-medium text-foreground">{t.name}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{t.actual}</p>
              <p className="text-[10px] text-muted-foreground">Capacity {t.capacity} BPD</p>
            </button>
          ))}
        </div>
      </div>

      {/* Support facilities */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">지원 설비</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SUPPORT.map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
        </div>
      </div>
    </Card>
  )
}
