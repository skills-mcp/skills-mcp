import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { SkillsConfig } from './types.js'
import { SkillRegistry } from './registry.js'
import { skillsMCPInstructions } from './instructions.js'

/**
 * Create and configure the Skills MCP Server
 */
export function createServer(config: SkillsConfig): {
  server: McpServer
  skillRegistry: SkillRegistry
} {
  const server = new McpServer({
    name: 'skills-mcp',
    version: '0.0.4',
  })

  const skillRegistry = new SkillRegistry(config)

  // Register list_skills tool
  server.registerTool(
    'list_skills',
    {
      title: 'List Skills',
      description:
        'List all available skills with their names and descriptions. Call this tool at the start of a conversation to discover available skills.',
      inputSchema: {},
      outputSchema: {
        skills: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
          }),
        ),
      },
    },
    async () => {
      // Refresh registry if stale
      await skillRegistry.refreshIfStale()

      const skillInfos = skillRegistry.getSkillInfos()

      const output = {
        skills: skillInfos.map((skillInfo) => ({
          id: skillInfo.id,
          name: skillInfo.metadata.name,
          description: skillInfo.metadata.description,
        })),
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
        structuredContent: output,
      }
    },
  )

  // Register get_skill tool
  server.registerTool(
    'get_skill',
    {
      title: 'Get Skill',
      description:
        'Get the full instructions (SKILL.md content) for a specific skill. Returns the skill content along with the absolute path to the skill file, enabling you to resolve and read any referenced resources (references/, scripts/, assets/) using your own file-reading tools.',
      inputSchema: {
        id: z.string().describe('The skill identifier (directory name)'),
      },
      outputSchema: {
        path: z.string(),
        name: z.string(),
        description: z.string(),
        content: z.string(),
      },
    },
    async (args) => {
      const skill = await skillRegistry.getSkill(args.id)

      if (!skill) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Skill '${args.id}' not found`,
            },
          ],
          isError: true,
        }
      }

      const output = {
        path: skill.path,
        name: skill.metadata.name,
        description: skill.metadata.description,
        content: skill.content,
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
        structuredContent: output,
      }
    },
  )

  // Register init-skills prompt
  server.registerPrompt(
    'init-skills',
    {
      title: 'Initialize Skills',
      description:
        'Initialize a conversation with skill awareness and usage instructions',
      argsSchema: {},
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: skillsMCPInstructions,
          },
        },
      ],
    }),
  )

  return {
    server,
    skillRegistry,
  }
}
