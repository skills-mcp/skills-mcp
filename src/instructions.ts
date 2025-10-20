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

Skills are self-contained packages that provide specialized expertise for specific domains or tasks. Think of them as onboarding guides that transform you into a specialist for particular workflows.

Each skill contains:

- **Instructions** (SKILL.md) - Core procedural knowledge and workflows (~5,000 tokens)
- **References** - Additional documentation loaded only when needed
- **Scripts** - Executable code that runs without loading into context
- **Assets** - Templates and files for output generation

## Core Design Philosophy: Progressive Disclosure

**Progressive disclosure is the guiding principle**: Load information in stages, only as needed, rather than consuming context upfront.

Skills use a three-level loading system:

1. **Level 1 - Metadata (~100 tokens per skill)**: Lightweight names and descriptions for discovery
2. **Level 2 - Instructions (~5,000 tokens)**: Core SKILL.md content, loaded only when skill is relevant
3. **Level 3 - Resources (unbounded)**: References, scripts, and assets loaded progressively as the workflow requires

This architecture means you can have access to many skills without context penalty—you only pay for what you actually use.

## Your Responsibilities

The Skills MCP is a minimal wrapper. It provides discovery and content access; you handle everything else:

**The MCP provides:**
- Skill metadata via \`list_skills\`
- SKILL.md content and absolute file paths via \`get_skill\`

**You handle:**
- Reading referenced files (using your file-reading tools)
- Executing scripts (using your bash tools)
- Navigating directories (using your existing capabilities)

The absolute path returned by \`get_skill\` enables you to resolve any relative references within the skill.

## When to Use Skills

### Call \`list_skills\` - Discovery Phase

Call \`list_skills\` to discover available skills in two scenarios:

1. **Early in conversations** - Get a lightweight view of available capabilities (~100 tokens per skill)
2. **If skills information is missing** - Re-query if you need to refresh your awareness of available skills

The metadata includes each skill's name and description, explaining what it does and when to use it.

### Call \`get_skill\` - Loading Phase

**Critical**: Only call \`get_skill\` when a skill is clearly relevant to your current task or objective.

Throughout the conversation:

1. **Continuously evaluate** - As tasks emerge, assess whether any skill description matches the objective
2. **Load when relevant** - If a skill clearly matches, call \`get_skill\` to load its instructions
3. **Don't preload** - Never load skills "just in case" or before you need them
4. **One at a time** - Load skills individually as needed, not in batches

When you call \`get_skill\`, it returns:
- \`path\`: Absolute path to SKILL.md (e.g., \`/path/to/pdf-processing/SKILL.md\`)
- \`name\`: Skill name
- \`description\`: Skill description
- \`content\`: Complete SKILL.md instructions (core workflow guidance)

### Access Resources - Progressive Phase

After loading a skill, follow its instructions. Skills may reference additional resources:

**References** (\`references/\`): Documentation to read when the skill directs you to
- Example: \`references/FORMS.md\`, \`references/API.md\`
- Load into context only when the workflow requires them
- Access by resolving relative paths against the skill's absolute path

**Scripts** (\`scripts/\`): Executable code that runs without entering context
- Example: \`scripts/extract.py\`, \`scripts/validate.sh\`
- Execute using bash: \`cd /path/to/skill && python scripts/script.py\`
- Provides deterministic reliability and efficiency for specific operations

**Assets** (\`assets/\`): Files used in output (templates, images, etc.)
- Copy or modify as needed for the final output
- Not loaded into context

## Example Workflow

Here's how to progressively load and use a PDF processing skill:

1. **User requests**: "Fill out this PDF form"
2. **You discover skills**: Call \`list_skills\` → see "PDF Processing - Extract text and tables from PDF files, fill forms..."
3. **You evaluate**: Description matches task → this skill is relevant
4. **You load skill**: Call \`get_skill\` with id \`pdf-processing\`
5. **Skill loaded**: Receive SKILL.md path and content (~5k tokens now in context)
6. **Follow instructions**: Skill mentions form filling is in \`references/FORMS.md\`
7. **Load reference**: Read \`/path/to/pdf-processing/references/FORMS.md\` (only loaded because workflow needs it)
8. **Execute script**: Run \`cd /path/to/pdf-processing && python scripts/fill_form.py\` (executes without loading into context)
9. **Complete task**: Use guidance to finish the user's request

Notice: You discovered all skills (~100 tokens), loaded one skill (~5k tokens), read one reference (as needed), and executed one script (no context cost).

## Key Principles

1. **Discover early**: Call \`list_skills\` early to understand available capabilities
2. **Evaluate continuously**: As tasks emerge, check if skill descriptions match
3. **Load only when relevant**: Don't preload skills; load when clearly needed
4. **Follow progressive disclosure**: Let the skill guide you to additional resources
5. **Leverage existing tools**: Use your file-reading and bash capabilities for all resource access

## Important Notes

- **Skills don't load automatically** - You must call \`list_skills\` to discover them and \`get_skill\` to load them
- **Context efficiency matters** - The progressive disclosure model saves tokens; respect it by loading only what you need
- **You control the workflow** - The skill provides guidance, but you decide when to read references and execute scripts
- **Multiple skills can work together** - Load multiple skills if a task requires different domains of expertise

---

**Remember**: This is background information. Use skills only when they clearly align with the task or objective you're working on. Start by calling \`list_skills\` early in conversations to understand available capabilities.
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
