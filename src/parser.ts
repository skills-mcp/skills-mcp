import * as path from 'node:path'
import * as fs from 'node:fs'

import matter from 'gray-matter'

import type { ParsedSkillFile } from './schemas.js'
import { assertParsedSkillFile, ValidationError } from './validation.js'

/**
 * Result of parsing a skill file - contains the gray-matter result and file stats
 */
export interface SkillFile {
  /** The gray-matter parsed result (data + content) */
  parsed: ParsedSkillFile
  /** File modification time in milliseconds */
  lastModified: number
}

/**
 * Parse a SKILL.md file - reads and parses once, returns gray-matter result and stats
 */
export async function readSkillFile(skillFilePath: string): Promise<SkillFile> {
  try {
    const skillFileContent = await fs.promises.readFile(skillFilePath, 'utf-8')
    const skillFileStats = await fs.promises.stat(skillFilePath)
    const parsedSkillFile = matter(skillFileContent)

    assertParsedSkillFile(parsedSkillFile, skillFilePath)

    return {
      parsed: parsedSkillFile,
      lastModified: skillFileStats.mtimeMs,
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error(
      `Failed to parse skill file ${skillFilePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

/**
 * Extract skill ID from directory path
 */
export function getSkillId(skillFilePath: string): string {
  const skillDirPath = path.dirname(skillFilePath)

  return path.basename(skillDirPath)
}
