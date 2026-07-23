"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Building2, Users, Factory, Clock } from "lucide-react"

export interface KpiDimensions {
  division: string
  team: string
  process: string
  shift: string
}

export const DEFAULT_KPI_DIMENSIONS: KpiDimensions = {
  division: "all",
  team: "all",
  process: "all",
  shift: "all",
}

const DIVISIONS = [
  { value: "all", label: "전체 부문" },
  { value: "refining-1", label: "정유 1부문" },
  { value: "refining-2", label: "정유 2부문" },
  { value: "chemical", label: "석유화학 부문" },
  { value: "lube", label: "윤활유 부문" },
]

const TEAMS: Record<string, { value: string; label: string }[]> = {
  all: [{ value: "all", label: "전체 팀" }],
  "refining-1": [
    { value: "all", label: "전체 팀" },
    { value: "tech-1", label: "기술 1팀" },
    { value: "tech-2", label: "기술 2팀" },
    { value: "production", label: "생산팀" },
  ],
  "refining-2": [
    { value: "all", label: "전체 팀" },
    { value: "tech-3", label: "기술 3팀" },
    { value: "tech-4", label: "기술 4팀" },
  ],
  chemical: [
    { value: "all", label: "전체 팀" },
    { value: "olefin", label: "올레핀팀" },
    { value: "aromatic", label: "방향족팀" },
  ],
  lube: [
    { value: "all", label: "전체 팀" },
    { value: "lube-tech", label: "윤활기술팀" },
  ],
}

const PROCESSES: Record<string, { value: string; label: string }[]> = {
  all: [{ value: "all", label: "전체 공정" }],
  "tech-1": [
    { value: "all", label: "전체 공정" },
    { value: "CDU", label: "CDU" },
    { value: "VDU", label: "VDU" },
    { value: "HCR", label: "HCR" },
    { value: "HDS", label: "HDS" },
  ],
  "tech-2": [
    { value: "all", label: "전체 공정" },
    { value: "FCC", label: "FCC" },
    { value: "Reformer", label: "Reformer" },
    { value: "Alkylation", label: "Alkylation" },
  ],
  "tech-3": [
    { value: "all", label: "전체 공정" },
    { value: "CDU-2", label: "CDU-2" },
    { value: "RFCC", label: "RFCC" },
  ],
  "tech-4": [
    { value: "all", label: "전체 공정" },
    { value: "HOU", label: "HOU" },
    { value: "SRU", label: "SRU" },
  ],
}

const SHIFTS = [
  { value: "all", label: "전체 근무조" },
  { value: "A", label: "A조" },
  { value: "B", label: "B조" },
  { value: "C", label: "C조" },
  { value: "D", label: "D조" },
  { value: "day", label: "주간" },
]

interface KpiDimensionFilterProps {
  dimensions: KpiDimensions
  onChange: (dimensions: KpiDimensions) => void
}

export function KpiDimensionFilter({ dimensions, onChange }: KpiDimensionFilterProps) {
  const teams = TEAMS[dimensions.division] || TEAMS.all
  const processes = PROCESSES[dimensions.team] || [{ value: "all", label: "전체 공정" }]

  const activeCount = Object.values(dimensions).filter(v => v !== "all").length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
        <Building2 className="h-3.5 w-3.5" />
        KPI 조회 기준
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">{activeCount}</Badge>
        )}
      </div>

      <Select value={dimensions.division} onValueChange={(v) => onChange({ ...dimensions, division: v, team: "all", process: "all" })}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIVISIONS.map(d => (
            <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dimensions.team} onValueChange={(v) => onChange({ ...dimensions, team: v, process: "all" })}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <Users className="h-3 w-3 mr-1 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {teams.map(t => (
            <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dimensions.process} onValueChange={(v) => onChange({ ...dimensions, process: v })}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <Factory className="h-3 w-3 mr-1 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {processes.map(p => (
            <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dimensions.shift} onValueChange={(v) => onChange({ ...dimensions, shift: v })}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SHIFTS.map(s => (
            <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => onChange(DEFAULT_KPI_DIMENSIONS)}
        >
          초기화
        </Button>
      )}
    </div>
  )
}
