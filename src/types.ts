import type { SkillMetadata } from './schemas.js'

/**
 * Skill metadata stored in registry (without content)
 */
export interface SkillInfo {
  id: string
  path: string
  metadata: SkillMetadata
  lastModified: number
}

/**
 * Complete skill with content (returned by get_skill)
 */
export interface Skill extends SkillInfo {
  content: string
}

/**
 * Skill registry entry
 */
export interface SkillEntry {
  info: SkillInfo
  lastChecked: number
}

/**
 * Configuration for the Skills MCP Server
 */
export interface SkillsConfig {
  skillsDirs: string[]
  stalenessThreshold?: number // milliseconds
}
