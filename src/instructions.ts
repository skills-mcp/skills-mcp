/**
 * Shared Skills MCP instructions content
 * Used by both the /init-skills prompt and the instructions CLI command
 */

/**
 * The core Skills MCP usage instructions content
 */
export const skillsMCPInstructions = /* md */ `
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
`.trim()

/**
 * Get the Skills MCP instructions with optional formatting
 */
export function getSkillsMCPInstructions(
  /** Whether to wrap in XML tags (default: true for export) */
  xml: boolean = true,
): string {
  if (!xml) return skillsMCPInstructions

  return `<skills-mcp-instructions>
${skillsMCPInstructions}
</skills-mcp-instructions>`
}

export const instructionsCommandHelpText = `
USAGE
  npx skills-mcp instructions [options]

DESCRIPTION
  Export Skills MCP agent instructions for use in agent configuration files,
  custom instructions, or project documentation.

  By default, instructions are wrapped in <skills-mcp-instructions> XML tags
  to provide clear boundaries when appending to existing files.

OPTIONS
  --no-xml    Disable XML tag wrapper (default: XML tags included)
  --help      Show this help message

EXAMPLES
  # Append to AGENTS.md (recommended)
  npx skills-mcp instructions >> AGENTS.md

  # For agents without AGENTS.md support (e.g., Claude Code)
  npx skills-mcp instructions >> CLAUDE.md

  # View in terminal
  npx skills-mcp instructions

  # Export without XML tags
  npx skills-mcp instructions --no-xml > custom-format.md

ABOUT
  This command outputs the same content as the /init-skills prompt, wrapped
  in XML tags for easy identification and organization.

  Use this when you want skills guidance always present in context, rather than
  loading it on-demand with the /init-skills prompt.
`
