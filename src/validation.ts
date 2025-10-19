import type { ParsedSkillFile } from './schemas.js'
import { parsedSkillFileSchema } from './schemas.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Assert skill metadata from YAML frontmatter is valid
 */
export function assertParsedSkillFile(
  parsedSkillFile: any,
  skillFilePath: string,
): asserts parsedSkillFile is ParsedSkillFile {
  const validatedSkillFile = parsedSkillFileSchema.safeParse(parsedSkillFile)

  if (!validatedSkillFile.success) {
    throw new ValidationError(
      `Invalid skill file at ${skillFilePath}: ${validatedSkillFile.error.message}`,
    )
  }
}

// Skill IDs should be lowercase with hyphens
const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Validate skill directory name
 */
export function validateSkillId(skillId: string): boolean {
  return validPattern.test(skillId)
}
