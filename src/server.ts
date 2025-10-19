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
    version: '0.0.2',
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
            text: /* md */ `
# Skills MCP - Usage Guide

This is informational guidance about the Skills MCP. Do not take any action based on this message alone. Wait for a specific task or objective before using skills.

## What Are Skills?

Skills are self-contained packages that provide you with specialized expertise for specific domains or tasks. Each skill contains:

- **Instructions** (SKILL.md) - procedural knowledge and workflows
- **References** - documentation you can read as needed
- **Scripts** - executable code you can run using bash
- **Assets** - templates and files for output generation

## Core Design Philosophy

The Skills MCP is a minimal wrapper that provides skill discovery and content access. You are responsible for all file operations:

- **The MCP provides**: Skill metadata, SKILL.md content, and absolute file paths
- **You handle**: Reading referenced files, executing scripts, navigating directories using your existing tools

The absolute path returned by \`get_skill\` enables you to resolve any relative references within the skill.

## When to Use Skills

Skills follow a **progressive disclosure model**. Only load content when it's needed to accomplish a task:

1. **Call \`list_skills\`** when you need to discover what skills are available (typically when a task might benefit from specialized expertise)
2. **Call \`get_skill\`** only when a skill matches the specific task or objective at hand
3. **Read referenced files** only when the skill instructions direct you to do so
4. **Execute scripts** only when required by the workflow

## Working with Skills

### Step 1: Discovery

Call \`list_skills\` to see available skills and their descriptions. Each skill description explains what it does and when to use it.

### Step 2: Loading

When a skill clearly matches the task at hand, call \`get_skill\` with the skill ID. This returns:

- \`path\`: Absolute path to SKILL.md (e.g., \`/path/to/skill/SKILL.md\`)
- \`name\`: Skill name
- \`description\`: Skill description
- \`content\`: Complete SKILL.md instructions

### Step 3: Following Instructions

Read and follow the instructions in the skill content. The skill will guide you through the workflow.

### Step 4: Accessing Resources

Skills may reference additional files like \`references/guide.md\` or \`scripts/process.py\`. To access these:

1. Extract the directory path from the skill's absolute path
   - Example: \`/path/to/pdf-processing/SKILL.md\` → \`/path/to/pdf-processing/\`
2. Construct the full path to the referenced resource
   - Example: \`/path/to/pdf-processing/references/FORMS.md\`
3. Use your file-reading tools to access the file

### Step 5: Executing Scripts

When skills reference executable scripts, use your bash tool:

\`\`\`bash
cd /path/to/skill-directory && python scripts/script_name.py
\`\`\`

## Important Notes

### Resource Access

All resource access (references, scripts, assets) is your responsibility using your existing file-reading and bash tools. The Skills MCP only provides the starting point (the SKILL.md path).

### Progressive Loading

Skills are designed to minimize context usage. Only load what you need, when you need it. Load skills when they match the task at hand, and read references only as directed by the skill instructions.

---

**Remember**: This is background information. Use skills when they align with the task or objective you're working on.
`.trim(),
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
