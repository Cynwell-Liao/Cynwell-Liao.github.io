import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUTPUT_FILE = '../public/assets/github-contrib.svg'
const DEFAULT_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * @typedef {{date: string, weekday: number, contributionCount: number, color?: string}} ContributionDay
 * @typedef {{contributionDays: ContributionDay[]}} ContributionWeek
 * @typedef {{totalContributions: number, colors: string[], weeks: ContributionWeek[]}} ContributionCalendar
 */

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

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
 * @param {string} username
 * @param {string} token
 * @returns {Promise<ContributionCalendar>}
 */
const fetchGitHubCalendar = async (username, token) => {
  const to = new Date()
  const from = new Date(to)
  from.setUTCFullYear(to.getUTCFullYear() - 1)

  const query = `
    query ContributionCalendar($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            colors
            weeks {
              contributionDays {
                color
                contributionCount
                date
                weekday
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        username,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`)
  }

  const payload = await response.json()
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '))
  }

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar
  if (!calendar?.weeks?.length) {
    throw new Error(`No contribution calendar returned for ${username}`)
  }

  const weeks = calendar.weeks.map((week) => ({
    contributionDays: week.contributionDays.map((day) => ({
      date: day.date,
      weekday: day.weekday,
      contributionCount: day.contributionCount,
      color: day.color,
    })),
  }))

  return {
    totalContributions: calendar.totalContributions,
    colors: calendar.colors?.length ? calendar.colors : DEFAULT_COLORS,
    weeks,
  }
}

/**
 * @param {ContributionCalendar} calendar
 * @param {string} username
 * @param {boolean} fromApi
 * @returns {string}
 */
const buildSvg = (calendar, username, fromApi) => {
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
          const title = `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'}`
          return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${color}"><title>${escapeXml(title)}</title></rect>`
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

  const subtitle = fromApi
    ? 'Generated from GitHub GraphQL API'
    : 'Fallback mock generated locally (token missing)'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="GitHub contributions for ${escapeXml(username)}">
  <rect width="${width}" height="${height}" rx="14" fill="#f8fafc" />
  <text x="12" y="16" fill="#0f172a" font-size="11" font-family="JetBrains Mono Variable, ui-monospace">Contributions for @${escapeXml(username)} · ${calendar.totalContributions} in last year</text>
  <text x="12" y="${height - 10}" fill="#64748b" font-size="10" font-family="JetBrains Mono Variable, ui-monospace">${escapeXml(subtitle)}</text>
  <g fill="#64748b" font-size="10" font-family="JetBrains Mono Variable, ui-monospace">${monthText}${dayText}</g>
  <g>${cells}</g>
</svg>
`
}

const username = process.env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY_OWNER
if (!username) {
  throw new Error('Set GITHUB_USERNAME (or GITHUB_REPOSITORY_OWNER) before running this script.')
}

const token = process.env.GITHUB_TOKEN
let fromApi = false
let calendar

if (token) {
  try {
    calendar = await fetchGitHubCalendar(username, token)
    fromApi = true
  } catch (error) {
    console.warn(`GitHub API unavailable: ${error.message}`)
    calendar = buildFallbackCalendar(username)
  }
} else {
  console.warn('GITHUB_TOKEN not found. Using fallback contribution data.')
  calendar = buildFallbackCalendar(username)
}

const svg = buildSvg(calendar, username, fromApi)
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(scriptDirectory, OUTPUT_FILE)
await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, svg, 'utf8')
console.log(`Contribution graph written to ${outputPath}`)
