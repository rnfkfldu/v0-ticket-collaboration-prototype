"use client"

import { Input } from "@/components/ui/input"
import type { DataInsertBox } from "@/lib/types"
import { useState } from "react"

interface DataVisualizationProps {
  box?: DataInsertBox
  dataBox?: DataInsertBox
  onTableDataChange?: (data: string[][]) => void
}

export function DataVisualization({ box, dataBox, onTableDataChange }: DataVisualizationProps) {
  // Support both 'box' and 'dataBox' props for backwards compatibility
  const inputBox = box || dataBox

  const safeBox: DataInsertBox = inputBox || {
    id: "default",
    type: "trend",
    config: {
      title: "기본 트렌드",
      tags: ["TI-2002", "FIC-2001"],
      unit: "VDU",
      fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
    },
  }

  const [tableData, setTableData] = useState<string[][]>(() => {
    if (safeBox.type === "table") {
      const rows = safeBox.config?.rows || 3
      const cols = safeBox.config?.columns || 3
      if (safeBox.config?.tableData) {
        return safeBox.config.tableData
      }
      return Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(""))
    }
    return []
  })

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = tableData.map((row, ri) =>
      row.map((cell, ci) => (ri === rowIndex && ci === colIndex ? value : cell)),
    )
    setTableData(newData)
    onTableDataChange?.(newData)
  }

  const boxType = safeBox.type

  if (boxType === "dcs") {
    const unit = safeBox.config?.unit || "VDU"
    const graphicNumber = safeBox.config?.graphicNumber || "G-2002"
    const timestamp = safeBox.config?.fromDate || new Date().toISOString()

    const dcsData = {
      "TI-2001": 320.5 + Math.random() * 10,
      "TI-2002": 340.2 + Math.random() * 10,
      "PI-2001": 15.8 + Math.random() * 2,
      "FIC-2001": 125.4 + Math.random() * 20,
      "LI-2001": 65.3 + Math.random() * 10,
      "TIC-2001": 335.1 + Math.random() * 10,
      "PIC-2001": 16.2 + Math.random() * 2,
      "FI-2001": 130.7 + Math.random() * 20,
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base text-foreground">
            {unit} - {graphicNumber}
          </span>
          <span className="text-muted-foreground text-sm">
            {new Date(timestamp).toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="bg-slate-900 rounded-lg p-6 min-h-[280px] border-2 border-slate-700 shadow-lg">
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-cyan-400 font-semibold text-sm">{unit} 운전 화면</span>
            </div>
            <span className="text-slate-400 text-xs font-mono">{graphicNumber}</span>
          </div>

          {/* 태그 데이터 그리드 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {Object.entries(dcsData).map(([tag, value]) => (
              <div
                key={tag}
                className="bg-slate-800 rounded-md p-4 flex items-center justify-between border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <span className="text-sm text-cyan-300 font-mono font-medium">{tag}</span>
                <span className="text-base font-mono text-green-400 font-semibold tabular-nums">
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* 공정 개요 박스 */}
          <div className="flex items-center justify-center mt-6">
            <div className="border-2 border-cyan-500/70 rounded-lg px-8 py-4 text-center bg-slate-800/80 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <p className="text-xs text-cyan-400 mb-2 font-medium">공정 Unit</p>
              <p className="text-2xl font-mono text-white font-bold">{unit}</p>
              <p className="text-xs text-slate-400 mt-1">{graphicNumber}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (boxType === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-border p-0">
                    <Input
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="border-0 rounded-none h-10 text-sm font-medium"
                      placeholder={rowIndex === 0 ? `헤더 ${colIndex + 1}` : `데이터`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (boxType === "trend" || !boxType) {
    const tags = safeBox.config?.tags || ["TI-2002", "FIC-2001"]
    const fromDate = safeBox.config?.fromDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const toDate = safeBox.config?.toDate || new Date().toISOString()

    const dataPoints = 50
    const timeRange = new Date(toDate).getTime() - new Date(fromDate).getTime()
    const trendData = Array.from({ length: dataPoints }, (_, i) => {
      const timestamp = new Date(new Date(fromDate).getTime() + (timeRange / dataPoints) * i)
      const values: Record<string, number> = {}
      tags.forEach((tag) => {
        const baseValue = 50 + Math.random() * 50
        const variation = Math.sin((i / dataPoints) * Math.PI * 4) * 10
        values[tag] = baseValue + variation
      })
      return { timestamp, values }
    })

    const colors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <div key={tag} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-sm font-medium text-foreground">{tag}</span>
            </div>
          ))}
        </div>
        <div className="h-56 bg-card border-2 border-border rounded-lg p-4 relative shadow-sm">
          <svg viewBox="0 0 400 150" className="w-full h-full">
            <line x1="10" y1="140" x2="390" y2="140" stroke="hsl(var(--border))" strokeWidth="2" />
            <line x1="10" y1="10" x2="10" y2="140" stroke="hsl(var(--border))" strokeWidth="2" />

            {tags.map((tag, tagIndex) => {
              const values = trendData.map((d) => d.values[tag])
              const min = Math.min(...values)
              const max = Math.max(...values)
              const range = max - min || 1

              const points = trendData
                .map((d, i) => {
                  const x = (i / (trendData.length - 1)) * 380 + 10
                  const y = 140 - ((d.values[tag] - min) / range) * 130
                  return `${x},${y}`
                })
                .join(" ")

              return (
                <polyline
                  key={tag}
                  points={points}
                  fill="none"
                  stroke={colors[tagIndex % colors.length]}
                  strokeWidth="2.5"
                />
              )
            })}
          </svg>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground font-medium">
          <span>{new Date(fromDate).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit" })}</span>
          <span>{new Date(toDate).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit" })}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
      <p className="text-sm text-muted-foreground font-medium">알 수 없는 데이터 타입: {boxType}</p>
    </div>
  )
}
