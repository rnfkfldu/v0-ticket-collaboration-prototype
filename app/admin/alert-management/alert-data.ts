// ========== 전체 Alert 마스터 데이터 ==========
export const ALERT_MASTER_DATA = [
  { id: "ALT-M001", tagId: "TI-2001", name: "HCR Reactor Inlet Temp High", unit: "HCR", type: "Process", grade: "상", limit: 400, uom: "\u00b0C", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
  { id: "ALT-M002", tagId: "PI-3001", name: "Low Pressure Alert", unit: "HCR", type: "Process", grade: "중", limit: 140, uom: "kg/cm2", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
  { id: "ALT-M003", tagId: "FI-1001", name: "Feed Flow Low Alert", unit: "CDU", type: "Process", grade: "하", limit: 300, uom: "m3/h", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2023-07-01" },
  { id: "ALT-M004", tagId: "TI-2931", name: "HCR Exchanger Fouling Alert", unit: "HCR", type: "Health", grade: "상", limit: 470, uom: "W/m2K", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2024-01-10" },
  { id: "ALT-M005", tagId: "TI-3005", name: "VDU Column Bottom Temp High", unit: "VDU", type: "Process", grade: "중", limit: 360, uom: "\u00b0C", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-08-20" },
  { id: "ALT-M006", tagId: "PI-1501", name: "VDU Column Pressure Low", unit: "VDU", type: "Process", grade: "중", limit: 0.5, uom: "kg/cm2", direction: "Low", enabled: true, createdBy: "시스템", createdAt: "2023-08-20" },
  { id: "ALT-M007", tagId: "FI-3002", name: "H2 Makeup Flow High", unit: "HCR", type: "Process", grade: "하", limit: 95000, uom: "Nm3/h", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-09-01" },
  { id: "ALT-M008", tagId: "AI-3002", name: "Product Sulfur High", unit: "HCR", type: "Quality", grade: "상", limit: 10, uom: "ppm", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
  { id: "ALT-M009", tagId: "LI-1001", name: "Column Level High", unit: "CDU", type: "Process", grade: "중", limit: 70, uom: "%", direction: "High", enabled: false, createdBy: "시스템", createdAt: "2023-07-01" },
  { id: "ALT-M010", tagId: "TI-4001", name: "Reformer Outlet Temp High", unit: "NHT", type: "Process", grade: "상", limit: 520, uom: "\u00b0C", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2024-03-15" },
  { id: "ALT-M011", tagId: "VI-2001", name: "Compressor Vibration High", unit: "UTIL", type: "Mechanical", grade: "상", limit: 7.1, uom: "mm/s", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2024-05-10" },
  { id: "ALT-M012", tagId: "FI-5001", name: "Flare Flow Abnormal", unit: "UTIL", type: "Safety", grade: "상", limit: 50, uom: "ton/h", direction: "High", enabled: true, createdBy: "시스템", createdAt: "2023-06-15" },
]

// ========== 개인화 Alert 데이터 ==========
export const PERSONAL_ALERT_DATA = [
  { id: "PA-001", tagId: "TI-2001", name: "내 관심: HCR Reactor Temp", unit: "HCR", threshold: 395, uom: "\u00b0C", direction: "High", notification: "앱+이메일", enabled: true, createdAt: "2025-01-15", owner: "김지수" },
  { id: "PA-002", tagId: "FI-1001", name: "CDU Feed Flow 감시", unit: "CDU", threshold: 310, uom: "m3/h", direction: "Low", notification: "앱", enabled: true, createdAt: "2025-01-20", owner: "김지수" },
  { id: "PA-003", tagId: "AI-3002", name: "HCR Product Sulfur 사전경고", unit: "HCR", threshold: 8, uom: "ppm", direction: "High", notification: "앱+이메일", enabled: true, createdAt: "2025-02-01", owner: "김지수" },
  { id: "PA-004", tagId: "TI-4001", name: "NHT Outlet Temp 모니터링", unit: "NHT", threshold: 510, uom: "\u00b0C", direction: "High", notification: "앱", enabled: false, createdAt: "2025-01-10", owner: "김지수" },
]

// ========== Alert 현황 데이터 ==========
export const ALERT_STATUS_DATA = [
  { id: "AS-001", alertId: "ALT-M001", tagId: "TI-2001", name: "HCR Reactor Inlet Temp High", unit: "HCR", grade: "상", state: "new", value: 412, limit: 400, uom: "\u00b0C", occurrences: 8, firstOccurrence: "2025-02-01 10:30", lastOccurrence: "2025-02-02 14:32", assignee: "김지수" },
  { id: "AS-002", alertId: "ALT-M002", tagId: "PI-3001", name: "Low Pressure Alert", unit: "HCR", grade: "중", state: "standing", value: 138.5, limit: 140, uom: "kg/cm2", occurrences: 3, firstOccurrence: "2025-02-01 13:15", lastOccurrence: "2025-02-02 13:15", assignee: "박현우" },
  { id: "AS-003", alertId: "ALT-M003", tagId: "FI-1001", name: "Feed Flow Low Alert", unit: "CDU", grade: "하", state: "shelved", value: 295, limit: 300, uom: "m3/h", occurrences: 1, firstOccurrence: "2025-02-01 22:45", lastOccurrence: "2025-02-01 22:45", assignee: "김지수" },
  { id: "AS-004", alertId: "ALT-M004", tagId: "TI-2931", name: "HCR Exchanger Fouling Alert", unit: "HCR", grade: "상", state: "new", value: 480, limit: 470, uom: "W/m2K", occurrences: 5, firstOccurrence: "2025-02-01 18:00", lastOccurrence: "2025-02-02 10:15", assignee: "김지수" },
  { id: "AS-005", alertId: "ALT-M008", tagId: "AI-3002", name: "Product Sulfur High", unit: "HCR", grade: "상", state: "standing", value: 9.2, limit: 10, uom: "ppm", occurrences: 2, firstOccurrence: "2025-02-01 08:00", lastOccurrence: "2025-02-02 08:00", assignee: "이승호" },
  { id: "AS-006", alertId: "ALT-M011", tagId: "VI-2001", name: "Compressor Vibration High", unit: "UTIL", grade: "상", state: "resolved", value: 5.2, limit: 7.1, uom: "mm/s", occurrences: 4, firstOccurrence: "2025-01-28 06:00", lastOccurrence: "2025-01-30 18:00", assignee: "박현우" },
]

export const PERSONAL_STATUS_DATA = [
  { id: "PS-001", alertId: "PA-001", tagId: "TI-2001", name: "내 관심: HCR Reactor Temp", unit: "HCR", threshold: 395, value: 412, uom: "\u00b0C", state: "active", triggeredAt: "2025-02-02 10:15", owner: "김지수" },
  { id: "PS-002", alertId: "PA-003", tagId: "AI-3002", name: "HCR Product Sulfur 사전경고", unit: "HCR", threshold: 8, value: 9.2, uom: "ppm", state: "active", triggeredAt: "2025-02-02 08:30", owner: "김지수" },
]

export function getGradeColor(grade: string) {
  switch (grade) {
    case "상": return "bg-red-100 text-red-700 border-red-200"
    case "중": return "bg-amber-100 text-amber-700 border-amber-200"
    case "하": return "bg-blue-100 text-blue-700 border-blue-200"
    default: return "bg-muted text-muted-foreground"
  }
}

export function getStateInfo(state: string) {
  switch (state) {
    case "new": return { label: "New", color: "bg-red-100 text-red-700 border-red-200" }
    case "standing": return { label: "Standing", color: "bg-amber-100 text-amber-700 border-amber-200" }
    case "shelved": return { label: "Shelved", color: "bg-muted text-muted-foreground border-border" }
    case "resolved": return { label: "Resolved", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
    case "active": return { label: "Active", color: "bg-red-100 text-red-700 border-red-200" }
    default: return { label: state, color: "bg-muted text-muted-foreground" }
  }
}
