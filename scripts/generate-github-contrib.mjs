import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUTPUT_FILE = '../public/assets/github-contrib.svg'
const DEFAULT_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LEVEL_TO_COUNT = [0, 1, 4, 8, 12]

/**
 * @typedef {{date: string, weekday: number, contributionCount: number, color?: string}} ContributionDay
 * @typedef {{contributionDays: ContributionDay[]}} ContributionWeek
 * @typedef {{totalContributions: number, colors: string[], weeks: ContributionWeek[]}} ContributionCalendar
 */

const formatDate = (value) => value.toISOString().slice(0, 10)

const hashString = (value) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const levelFromCount = (count) => {
  if (count === 0) return 0
  if (count < 3) return 1
  if (count < 6) return 2
  if (count < 10) return 3
  return 4
}

const fallbackCount = (username, date) => {
  const seed = hashString(`${username}:${date}`)
  const bucket = seed % 100

  if (bucket < 52) return 0
  if (bucket < 76) return 1 + (seed % 2)
  if (bucket < 90) return 3 + (seed % 3)
  return 7 + (seed % 8)
}

/**
 * @param {string} username
 * @returns {ContributionCalendar}
 */
const buildFallbackCalendar = (username) => {
  const today = new Date()
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - 371)
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay())

  const weeks = []
  const cursor = new Date(startDate)

  for (let week = 0; week < 53; week += 1) {
    const contributionDays = []
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = formatDate(cursor)
      const contributionCount = fallbackCount(username, date)
      contributionDays.push({
        date,
        weekday,
        contributionCount,
        color: DEFAULT_COLORS[levelFromCount(contributionCount)],
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push({ contributionDays })
  }

  const totalContributions = weeks.reduce(
    (total, week) =>
      total +
      week.contributionDays.reduce((weekTotal, day) => weekTotal + day.contributionCount, 0),
    0,
  )

  return {
    totalContributions,
    colors: DEFAULT_COLORS,
    weeks,
  }
}

/**
 * @param {ContributionCalendar} calendar
 * @param {string} username
 * @param {string} headline
 * @param {string} subtitle
 * @returns {string}
 */
const buildCalendarSvg = (calendar, username, headline, subtitle) => {
  const cell = 10
  const gap = 3
  const stride = cell + gap
  const originX = 44
  const originY = 40
  const width = originX + calendar.weeks.length * stride + 16
  const height = originY + 7 * stride + 36
  const palette = calendar.colors?.length ? calendar.colors : DEFAULT_COLORS

  const dayLabels = [
    { label: 'Mon', weekday: 1 },
    { label: 'Wed', weekday: 3 },
    { label: 'Fri', weekday: 5 },
  ]

  let previousMonth = -1
  const monthLabels = calendar.weeks
    .map((week, weekIndex) => {
      const firstDay = week.contributionDays[0]
      const date = new Date(firstDay.date)
      const month = date.getUTCMonth()

      if (date.getUTCDate() <= 7 && month !== previousMonth) {
        previousMonth = month
        return {
          x: originX + weekIndex * stride,
          label: MONTHS[month],
        }
      }

      return null
    })
    .filter(Boolean)

  const cells = calendar.weeks
    .map((week, weekIndex) =>
      week.contributionDays
        .map((day) => {
          const x = originX + weekIndex * stride
          const y = originY + day.weekday * stride
          const color = day.color || palette[levelFromCount(day.contributionCount)]
          return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${color}" />`
        })
        .join(''),
    )
    .join('')

  const monthText = monthLabels
    .map((label) => `<text x="${label.x}" y="24">${label.label}</text>`)
    .join('')

  const dayText = dayLabels
    .map((label) => `<text x="8" y="${originY + label.weekday * stride + 8}">${label.label}</text>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="GitHub contributions for ${username}">
  <rect width="${width}" height="${height}" rx="14" fill="#f8fafc" />
  <text x="12" y="16" fill="#0f172a" font-size="11" font-family="JetBrains Mono Variable, ui-monospace">${headline}</text>
  <text x="12" y="${height - 10}" fill="#64748b" font-size="10" font-family="JetBrains Mono Variable, ui-monospace">${subtitle}</text>
  <g fill="#64748b" font-size="10" font-family="JetBrains Mono Variable, ui-monospace">${monthText}${dayText}</g>
  <g>${cells}</g>
</svg>
`
}

/**
 * @param {string} username
 * @returns {Promise<ContributionCalendar>}
 */
const fetchPublicGitHubCalendar = async (username) => {
  const dayCellRegex = /<td\b[^>]*class="ContributionCalendar-day"[^>]*>/g

  /**
   * @param {number} year
   * @returns {Promise<Array<{date: string, level: number, contributionCount: number}>>}
   */
  const fetchDaysForYear = async (year) => {
    const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${year}-01-01&to=${year}-12-31`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'portfolio-contrib-generator',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub contributions endpoint returned ${response.status} for year ${year}`)
    }

    const html = await response.text()
    const tooltipMap = new Map()

    for (const tooltip of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
      const targetId = tooltip[1]
      const tooltipText = tooltip[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      let contributionCount = 0

      if (/No contributions on/i.test(tooltipText)) {
        contributionCount = 0
      } else {
        const countMatch = tooltipText.match(/([0-9,]+)\s+contributions?\s+on/i)
        if (countMatch) {
          contributionCount = Number(countMatch[1].replace(/,/g, ''))
        }
      }

      tooltipMap.set(targetId, contributionCount)
    }

    const parsedDays = []
    for (const cell of html.match(dayCellRegex) || []) {
      const idMatch = cell.match(/\bid="([^"]+)"/)
      const dateMatch = cell.match(/\bdata-date="([^"]+)"/)
      const levelMatch = cell.match(/\bdata-level="([0-4])"/)
      if (!idMatch || !dateMatch || !levelMatch) {
        continue
      }
      const level = Number(levelMatch[1])
      const contributionCount = tooltipMap.get(idMatch[1]) ?? (LEVEL_TO_COUNT[level] ?? 0)
      parsedDays.push({
        date: dateMatch[1],
        level,
        contributionCount,
      })
    }
    return parsedDays
  }

  const today = new Date()
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const rangeStart = new Date(endDate)
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 364)

  const startYear = rangeStart.getUTCFullYear()
  const endYear = endDate.getUTCFullYear()
  const years = startYear === endYear ? [startYear] : [startYear, endYear]

  const parsedDays = (await Promise.all(years.map((year) => fetchDaysForYear(year)))).flat()
  if (!parsedDays.length) {
    throw new Error('GitHub response did not include contribution day cells')
  }

  const startDate = new Date(rangeStart)
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay())
  endDate.setUTCDate(endDate.getUTCDate() + (6 - endDate.getUTCDay()))

  const dayByDate = new Map(
    parsedDays.map((day) => [
      day.date,
      { level: day.level, contributionCount: day.contributionCount },
    ]),
  )
  const weeks = []
  const cursor = new Date(startDate)

  while (cursor <= endDate) {
    const contributionDays = []
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = formatDate(cursor)
      const day = dayByDate.get(date)
      const level = day?.level ?? 0
      const contributionCount = day?.contributionCount ?? 0
      contributionDays.push({
        date,
        weekday,
        contributionCount,
        color: DEFAULT_COLORS[level] || DEFAULT_COLORS[0],
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push({ contributionDays })
  }

  const totalContributions = parsedDays.reduce(
    (total, day) => {
      const date = new Date(`${day.date}T00:00:00Z`)
      if (date < rangeStart || date > endDate) {
        return total
      }
      return total + day.contributionCount
    },
    0,
  )

  return {
    totalContributions,
    colors: DEFAULT_COLORS,
    weeks,
  }
}

const username = process.env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY_OWNER
if (!username) {
  throw new Error('Set GITHUB_USERNAME (or GITHUB_REPOSITORY_OWNER) before running this script.')
}

const allowFallback = process.env.ALLOW_CONTRIB_FALLBACK === 'true'

let svg
try {
  const calendar = await fetchPublicGitHubCalendar(username)
  svg = buildCalendarSvg(
    calendar,
    username,
    `${calendar.totalContributions.toLocaleString('en-US')} contributions in the last year`,
    `Generated from github.com on ${formatDate(new Date())}`,
  )
  console.log(`Fetched real contribution activity for @${username} from github.com`)
} catch (error) {
  if (!allowFallback) {
    throw error
  }
  console.warn(`GitHub fetch failed (${error.message}). Falling back to mock contribution graph.`)
  const fallback = buildFallbackCalendar(username)
  svg = buildCalendarSvg(
    fallback,
    username,
    `Fallback contribution graph for @${username} · ${fallback.totalContributions}`,
    'Generated locally because GitHub fetch failed.',
  )
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(scriptDirectory, OUTPUT_FILE)
await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, svg, 'utf8')
console.log(`Contribution graph written to ${outputPath}`)
