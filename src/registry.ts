import * as path from 'node:path'
import * as fs from 'node:fs'

import fg from 'fast-glob'

import type { Skill, SkillEntry, SkillInfo, SkillsConfig } from './types.js'
import { getSkillId, readSkillFile } from './parser.js'
import { validateSkillId } from './validation.js'

const DEFAULT_STALENESS_THRESHOLD = 5000 // 5 seconds

export class SkillRegistry {
  private skills: Map<string, SkillEntry> = new Map()
  private config: SkillsConfig
  private lastScan: number = 0

  constructor(config: SkillsConfig) {
    this.config = {
      ...config,
      stalenessThreshold:
        config.stalenessThreshold ?? DEFAULT_STALENESS_THRESHOLD,
    }
  }

  /**
   * Scan the skills directory and load all skills
   */
  async scan(): Promise<void> {
    // Find all SKILL.md files across all configured directories
    const skillFilePatterns = this.config.skillsDirs.map((skillsDir) =>
      path.join(skillsDir, '**/SKILL.md').replace(/\\/g, '/'),
    )

    const skillFilePaths = await fg(skillFilePatterns, {
      absolute: true,
      onlyFiles: true,
    })

    // Clear existing skills
    this.skills.clear()

    // Parse each skill file (metadata only)
    await Promise.all(
      skillFilePaths.map(async (skillFilePath) => {
        try {
          const skillId = getSkillId(skillFilePath)

          // Validate skill ID
          if (!validateSkillId(skillId)) {
            console.warn(
              `Skipping skill with invalid ID: ${skillId} (should be lowercase with hyphens)`,
            )
            return
          }

          // Check for duplicate skill IDs
          if (this.skills.has(skillId)) {
            console.warn(
              `Warning: Duplicate skill ID '${skillId}' found at ${skillFilePath}. Previous skill at ${
                this.skills.get(skillId)?.info.path
              } will be overwritten.`,
            )
          }

          const skillFile = await readSkillFile(skillFilePath)

          const skillInfo: SkillInfo = {
            id: skillId,
            path: skillFilePath,
            metadata: skillFile.parsed.data,
            lastModified: skillFile.lastModified,
          }

          this.skills.set(skillId, {
            info: skillInfo,
            lastChecked: Date.now(),
          })
        } catch (error) {
          console.error(`Failed to load skill from ${skillFilePath}:`, error)
        }
      }),
    )

    this.lastScan = Date.now()
  }

  /**
   * Check if the registry is stale and needs refreshing
   */
  isStale(): boolean {
    const now = Date.now()

    return now - this.lastScan > this.config.stalenessThreshold!
  }

  /**
   * Check if a specific skill file has been modified
   */
  async isSkillModified(skillId: string): Promise<boolean> {
    const skillEntry = this.skills.get(skillId)

    // Skill not found, consider it modified
    if (!skillEntry) return true

    try {
      const stats = await fs.promises.stat(skillEntry.info.path)

      return stats.mtimeMs > skillEntry.info.lastModified
    } catch (error) {
      console.error(`Failed to check modification time for ${skillId}:`, error)

      return true // Error checking, consider it modified
    }
  }

  /**
   * Refresh the registry if stale
   */
  async refreshIfStale(): Promise<boolean> {
    if (this.isStale()) {
      await this.scan()

      return true
    }

    return false
  }

  /**
   * Get all skill info (metadata without content)
   */
  getSkillInfos(): SkillInfo[] {
    return Array.from(this.skills.values()).map((entry) => entry.info)
  }

  /**
   * Get a specific skill by ID with content loaded on-demand
   */
  async getSkill(skillId: string): Promise<Skill | undefined> {
    let skillEntry = this.skills.get(skillId)

    if (!skillEntry) {
      if (!this.isStale()) return undefined

      // If skill not found AND registry is stale,
      // rescan to check for newly added skills
      await this.scan()

      skillEntry = this.skills.get(skillId)

      // Skill not found after rescan
      if (!skillEntry) return undefined
    }

    // Check if the skill file has been modified
    if (await this.isSkillModified(skillId)) {
      try {
        // Reload and parse the skill file (single read/parse operation)
        const skillFile = await readSkillFile(skillEntry.info.path)

        const skillInfo: SkillInfo = {
          id: skillId,
          path: skillEntry.info.path,
          metadata: skillFile.parsed.data,
          lastModified: skillFile.lastModified,
        }

        // Update cache
        this.skills.set(skillId, {
          info: skillInfo,
          lastChecked: Date.now(),
        })

        return {
          ...skillInfo,
          content: skillFile.parsed.content.trim(),
        }
      } catch (error) {
        console.error(`Failed to reload skill ${skillId}:`, error)

        // Try to read from cached info on error
        try {
          const skillFile = await readSkillFile(skillEntry.info.path)

          return {
            ...skillEntry.info,
            content: skillFile.parsed.content.trim(),
          }
        } catch {
          return undefined
        }
      }
    }

    // Read content on-demand from cached metadata
    try {
      const skillFile = await readSkillFile(skillEntry.info.path)

      return {
        ...skillEntry.info,
        content: skillFile.parsed.content.trim(),
      }
    } catch (error) {
      console.error(`Failed to read skill content for ${skillId}:`, error)

      return undefined
    }
  }

  /**
   * Get the skills directory paths
   */
  getSkillsDirs(): string[] {
    return this.config.skillsDirs
  }
}
