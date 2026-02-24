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
