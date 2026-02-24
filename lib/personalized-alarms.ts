// Personalized Alarm storage (client-side state management via events)

export interface PersonalizedAlarm {
  id: string
  tagId: string
  tagDescription?: string
  min?: number
  max?: number
  unit: string
  createdAt: string
  active: boolean
  source?: string // "manual" | "screen-tag"
}

const STORAGE_KEY = "personalized-alarms"

export function getPersonalizedAlarms(): PersonalizedAlarm[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePersonalizedAlarm(alarm: Omit<PersonalizedAlarm, "id" | "createdAt" | "active">): PersonalizedAlarm {
  const alarms = getPersonalizedAlarms()
  const newAlarm: PersonalizedAlarm = {
    ...alarm,
    id: `PA-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    active: true,
  }
  alarms.push(newAlarm)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms))
  window.dispatchEvent(new CustomEvent("personalized-alarms-changed"))
  return newAlarm
}

export function deletePersonalizedAlarm(id: string): void {
  const alarms = getPersonalizedAlarms().filter(a => a.id !== id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms))
  window.dispatchEvent(new CustomEvent("personalized-alarms-changed"))
}

export function togglePersonalizedAlarm(id: string): void {
  const alarms = getPersonalizedAlarms().map(a => a.id === id ? { ...a, active: !a.active } : a)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms))
  window.dispatchEvent(new CustomEvent("personalized-alarms-changed"))
}

// ===== Focus Monitoring (집중 모니터링) =====
export interface FocusMonitoringItem {
  id: string
  equipId: string
  equipName: string
  process: string
  category: string
  healthIndexName: string
  healthIndexUnit: string
  currentValue: number
  limitValue: number
  driftPct: number
  trend: number[]
  createdAt: string
}

const FOCUS_KEY = "focus-monitoring-items"

export function getFocusMonitoringItems(): FocusMonitoringItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(FOCUS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveFocusMonitoringItem(item: Omit<FocusMonitoringItem, "id" | "createdAt">): FocusMonitoringItem {
  const items = getFocusMonitoringItems()
  const newItem: FocusMonitoringItem = {
    ...item,
    id: `FM-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
  }
  items.push(newItem)
  window.localStorage.setItem(FOCUS_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("focus-monitoring-changed"))
  return newItem
}

export function deleteFocusMonitoringItem(id: string): void {
  const items = getFocusMonitoringItems().filter(i => i.id !== id)
  window.localStorage.setItem(FOCUS_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("focus-monitoring-changed"))
}

// ===== Custom KPIs (퍼포먼스 지표) =====
export interface CustomKPI {
  id: string
  name: string
  value: number
  target: number
  unit: string
  createdAt: string
}

const KPI_KEY = "custom-kpis"

export function getCustomKPIs(): CustomKPI[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KPI_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveCustomKPI(kpi: Omit<CustomKPI, "id" | "createdAt">): CustomKPI {
  const items = getCustomKPIs()
  const newKPI: CustomKPI = {
    ...kpi,
    id: `KPI-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
  }
  items.push(newKPI)
  window.localStorage.setItem(KPI_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("custom-kpis-changed"))
  return newKPI
}

export function deleteCustomKPI(id: string): void {
  const items = getCustomKPIs().filter(i => i.id !== id)
  window.localStorage.setItem(KPI_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("custom-kpis-changed"))
}
