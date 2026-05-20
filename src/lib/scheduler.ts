export type Frequency = "daily" | "weekly" | "monthly" | "hourly" | "every_minute"

export interface Schedule {
  frequency: Frequency
  hour: number
  minute: number
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  timezone?: string
}

// Lit les parties date/heure d'un timestamp dans un fuseau donné
function tzParts(date: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  })
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]))
  return {
    year:    parseInt(p["year"]  ?? "0"),
    month:   parseInt(p["month"] ?? "1") - 1, // 0-indexed
    day:     parseInt(p["day"]   ?? "1"),
    hour:    parseInt(p["hour"]  ?? "0") % 24, // formatToParts peut donner "24" pour minuit
    minute:  parseInt(p["minute"]?? "0"),
    second:  parseInt(p["second"]?? "0"),
  }
}

// Offset en ms entre UTC et le fuseau cible à une date donnée
function tzOffsetMs(date: Date, tz: string): number {
  const p = tzParts(date, tz)
  const localAsUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second)
  return date.getTime() - localAsUtc
}

// Convertit une heure locale (year/month/day/hour/minute en fuseau tz) → UTC
function localToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  // Estimation initiale (traite l'heure locale comme UTC)
  const rough = new Date(Date.UTC(year, month, day, hour, minute, 0))
  // Corrige avec l'offset réel
  const offset = tzOffsetMs(rough, tz)
  return new Date(rough.getTime() + offset)
}

export function computeNextRunAt(schedule: Schedule, from: Date = new Date()): Date {
  const tz = schedule.timezone ?? "Europe/Paris"
  const { hour, minute, frequency } = schedule

  // Heure locale actuelle dans le fuseau cible
  const now = tzParts(from, tz)

  // Le job peut-il encore tourner aujourd'hui ?
  const todayStillPossible =
    hour > now.hour || (hour === now.hour && minute > now.minute)

  // Jour de la semaine dans le fuseau (0=dim)
  const weekdayShort = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(from)
  const currentDow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayShort)

  const y = now.year
  let m = now.month
  let d = now.day

  if (frequency === "every_minute") {
    // Prochaine minute pleine (ignore hour/minute de la config)
    return new Date(from.getTime() + (60 - now.second) * 1000)
  }

  if (frequency === "hourly") {
    // Prochaine occurrence de la minute X dans l'heure courante ou suivante
    if (now.minute < minute) {
      return localToUtc(y, m, d, now.hour, minute, tz)
    } else {
      // Heure suivante
      const nextHour = now.hour + 1
      if (nextHour < 24) return localToUtc(y, m, d, nextHour, minute, tz)
      return localToUtc(y, m, d + 1, 0, minute, tz)
    }
  }

  if (frequency === "daily") {
    if (!todayStillPossible) d += 1
  } else if (frequency === "weekly") {
    const target = schedule.dayOfWeek ?? 1
    let diff = (target - currentDow + 7) % 7
    if (diff === 0 && !todayStillPossible) diff = 7
    d += diff
  } else if (frequency === "monthly") {
    const target = schedule.dayOfMonth ?? 1
    if (now.day < target || (now.day === target && todayStillPossible)) {
      d = target
    } else {
      m += 1
      d = target
    }
  }

  return localToUtc(y, m, d, hour, minute, tz)
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  every_minute: "Chaque minute",
  hourly:       "Chaque heure",
  daily:        "Tous les jours",
  weekly:       "Toutes les semaines",
  monthly:      "Tous les mois",
}

export const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

export function describeSchedule(schedule: Schedule): string {
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = schedule
  const time = `${String(hour).padStart(2, "0")}h${String(minute).padStart(2, "0")}`
  const mm   = String(minute).padStart(2, "0")
  if (frequency === "every_minute") return `Chaque minute`
  if (frequency === "hourly")       return `Chaque heure à :${mm}`
  if (frequency === "daily")        return `Tous les jours à ${time}`
  if (frequency === "weekly")       return `Chaque ${DAY_LABELS[dayOfWeek ?? 1]} à ${time}`
  if (frequency === "monthly")      return `Le ${dayOfMonth ?? 1} de chaque mois à ${time}`
  return time
}
