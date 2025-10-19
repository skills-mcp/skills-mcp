import { z } from 'zod'

const MAX_NAME_LENGTH = 64
const MAX_DESCRIPTION_LENGTH = 1024

const skillMetadataSchema = z.object({
  name: z.string().max(MAX_NAME_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH),
})

/**
 * Skill metadata from YAML frontmatter
 */
export type SkillMetadata = z.infer<typeof skillMetadataSchema>

export const parsedSkillFileSchema = z.object({
  data: skillMetadataSchema,
  content: z.string(),
})

export type ParsedSkillFile = z.infer<typeof parsedSkillFileSchema>
