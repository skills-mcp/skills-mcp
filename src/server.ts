import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { SkillsConfig } from './types.js'
import { SkillRegistry } from './registry.js'

/**
 * Create and configure the Skills MCP Server
 */
export function createServer(config: SkillsConfig): {
  server: McpServer
  skillRegistry: SkillRegistry
} {
  const server = new McpServer({
    name: 'skills-mcp',
    version: '0.0.1',
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
            text: `You have access to a Skills MCP Server that provides specialized expertise through Agent Skills.

Skills are organized, self-contained packages with:

- **Instructions** (SKILL.md) - procedural knowledge for specific domains
- **References** - documentation loaded as needed
- **Scripts** - executable code you can run with bash tools
- **Assets** - templates and files for output

## Using Skills

1. **Discover**: Call \`list_skills\` to see available skills and their descriptions
2. **Load**: When a skill matches the user's request, call \`get_skill\` to load its instructions and get the absolute path to the skill file
3. **Follow**: Read and follow the instructions in the skill content
4. **Access resources**: The skill may reference additional files like \`references/FORMS.md\` or \`scripts/validate.py\`
   - Use the absolute path from \`get_skill\` (e.g., \`/path/to/skill/SKILL.md\`) to construct full paths
   - Example: If path is \`/path/to/pdf-processing/SKILL.md\` and skill references \`references/FORMS.md\`, read \`/path/to/pdf-processing/references/FORMS.md\`
5. **Execute scripts**: Use your bash tool with the skill directory path
   - Example: \`cd /path/to/pdf-processing && python scripts/validate.py\`

## Important

The Skills MCP provides skill discovery and content. You handle all file operations (reading references, executing scripts, navigating directories) using your existing tools. The absolute path in \`get_skill\` enables you to resolve any relative references within the skill.

## Example Workflow

**MANDATORY - READ ENTIRE FILE**: Some skills explicitly direct you to read referenced files completely. For example:

\`\`\`markdown
Workflow MANDATORY - READ ENTIRE FILE: references/complete-guide.md
\`\`\`

When you see this pattern, use the skill's absolute path to construct the full path and read the entire referenced file before proceeding.`,
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
