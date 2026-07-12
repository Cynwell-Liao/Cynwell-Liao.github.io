import type { z } from 'zod'

const formatIssuePath = (path: PropertyKey[]): string =>
  path.length > 0 ? path.map(String).join('.') : '<root>'

export const parseContent = <Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  sourcePath: string
): z.output<Schema> => {
  const result = schema.safeParse(input)

  if (!result.success) {
    const issueSummary = result.error.issues
      .map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid ${sourcePath}: ${issueSummary}`, {
      cause: result.error,
    })
  }

  return result.data
}
