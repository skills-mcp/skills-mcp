# Skills MCP

Transform any AI agent into a domain expert by giving it access to modular, reusable skills through the Model Context Protocol.

> **Inspired by [Claude Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)**: This MCP server brings Claude's Skills pattern to any MCP-compatible agent.

- **What**: An MCP server that brings Claude's Skills format to any MCP-compatible agent
- **Why**: Create skills once, use them everywhere—across Claude, VS Code, Cursor, and any MCP tool
- **How**: Point the server at your skills directory and agents discover them automatically

## Quick Setup

The fastest way to get started is with npx. Choose your platform:

<details>
<summary><strong>Claude Code</strong></summary>

Create `.mcp.json` in your project or `~/.claude.json` globally:

```json
{
  "mcpServers": {
    "skills-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "skills-mcp", "-s", "/absolute/path/to/skills"]
    }
  }
}
```

</details>

<details>
<summary><strong>Claude for Desktop</strong></summary>

Create `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "skills-mcp": {
      "command": "npx",
      "args": ["-y", "skills-mcp", "-s", "/absolute/path/to/skills"]
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Create `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "skills-mcp": {
      "command": "npx",
      "args": ["-y", "skills-mcp", "-s", "/absolute/path/to/skills"]
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code</strong></summary>

Create `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "skills-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "skills-mcp", "-s", "/absolute/path/to/skills"]
    }
  }
}
```

</details>

**Replace** `/absolute/path/to/skills` with your actual skills directory path.

### Try It Out

1. Start the MCP server in your agent
2. **Recommended**: Run the `/init-skills` prompt at the start of each session to provide background guidance on the Skills MCP workflow
3. **Alternative**: Simply ask the agent to complete a task—it will discover and use skills when needed

That's it! Your agent can now discover and use skills.

## Get Example Skills

Want to try it out with ready-made skills? Anthropic maintains a [collection of example skills](https://github.com/anthropics/skills) that you can bring into your project instantly using `npx degit`:

```bash
# Get the skill creator skill
npx degit anthropics/skills/skill-creator skills/skill-creator

# Get the MCP builder skill
npx degit anthropics/skills/mcp-builder skills/mcp-builder
```

These commands will download the skills directly into your `skills/` directory without any git history. Browse the [Anthropic skills repository](https://github.com/anthropics/skills) to see all available examples.

## Agent Instructions Setup

Want Skills MCP guidance always available in your agent's context? Export the instructions:

**Recommended**: Use [`AGENTS.md`](https://agents.md) for broad agent support:

```bash
npx -y skills-mcp instructions >> AGENTS.md
```

**For agents without `AGENTS.md` support**:

```bash
# Claude Code
npx -y skills-mcp instructions >> CLAUDE.md
```

### When to Use Instructions File vs `/init-skills` Prompt

- **Use instructions export** if you want skills guidance always present in every conversation
- **Use `/init-skills` prompt** if you want to minimize context usage and only load guidance when needed

Both approaches use the same content—choose based on your preference for context management.

---

## Understanding Skills

<details>
<summary><strong>What are Skills?</strong></summary>

Skills are modular, self-contained packages that transform general-purpose AI agents into specialized experts. Think of them as "onboarding guides" for specific domains or tasks—they provide procedural knowledge that no model can fully possess.

**Example: A PDF Processing Skill might include:**

- Instructions for extracting text and filling forms
- Python scripts for reliable PDF operations
- Reference documentation for advanced use cases
- Template files for generating documents

Instead of explaining PDF processing in every conversation, you install the skill once and the agent knows when and how to use it.

</details>

<details>
<summary><strong>Why Skills MCP?</strong></summary>

While Claude has native Skills support built-in, this MCP server brings that same capability to other agents:

- **Universal compatibility**: Any MCP-compatible agent can now use Claude Skills
- **Unified management**: Single skills directory works across all agents and platforms
- **Optional for Claude**: When using Claude Desktop or Claude Code, you can disable this server and use native Skills instead
- **Progressive disclosure**: Skills load information in stages, minimizing context usage

**Key benefit**: Create skills once in Claude's format, use them everywhere—whether with Claude's native support or via MCP in VS Code, Cursor, and other tools.

</details>

<details>
<summary><strong>How Skills Work</strong></summary>

Skills use a **three-level progressive disclosure** system to manage context efficiently:

1. **Metadata** (~100 tokens): Name and description loaded at startup
2. **Instructions** (~5k tokens): Main SKILL.md content loaded when skill is triggered
3. **Resources** (loaded as needed): References, scripts, and assets accessed on-demand

This means you can install dozens of skills without context penalty—agents only load what they need, when they need it.

</details>

---

## Creating Skills

<details>
<summary><strong>Quick Start: Basic Skill Structure</strong></summary>

Skills follow Anthropic's convention-based format from [Claude Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview):

```
skill-name/
├── SKILL.md              # Required: Skill metadata and instructions
├── references/           # Optional: Documentation loaded as needed
├── scripts/              # Optional: Executable code
└── assets/               # Optional: Templates and files for output
```

### SKILL.md Format

```markdown
---
name: Skill Name
description: What this skill does and when to use it (be specific!)
---

# Skill Name

## Instructions

[Step-by-step guidance for the agent]

## Examples

[Concrete usage examples]
```

**Tips for writing good skills:**

- Make descriptions specific about WHEN to use the skill
- Use imperative/infinitive form in instructions ("To do X, use Y")
- Keep SKILL.md under 5k words; move detailed docs to `references/`
- Bundle scripts for deterministic operations
- Include templates in `assets/` for files used in output

For more details, see the [Skills specification](docs/spec.md).

</details>

---

## Advanced Usage

<details>
<summary><strong>Command Line Options</strong></summary>

### Arguments

- `-s, --skills-dir`: Path to skills directory (**required**, can be specified multiple times, must be absolute paths)

### Multiple Skills Directories

When specifying multiple skills directories, all directories are scanned for skills. If multiple skills with the same ID are found across different directories, a warning will be logged and the last loaded skill will be used.

Example configuration with multiple directories:

```json
{
  "servers": {
    "skills-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "skills-mcp",
        "-s",
        "/path/to/skills1",
        "-s",
        "/path/to/skills2"
      ]
    }
  }
}
```

### Testing the Server

You can test the server manually using stdio:

```bash
npx skills-mcp --skills-dir /absolute/path/to/skills
```

The server will start and wait for JSON-RPC messages on stdin. Press `Ctrl+C` to stop the server.

</details>

<details>
<summary><strong>Security Considerations</strong></summary>

**⚠️ Important**: Skills provide agents with instructions and executable code. Only use skills from trusted sources—those you created yourself or obtained from Anthropic.

A malicious skill can:

- Direct agents to invoke tools in harmful ways
- Execute code with the agent's privileges
- Access or expose sensitive data

**Treat skills like software installation**: Only install from trusted sources, especially in production systems with access to sensitive data or critical operations.

For more details, see the [Security Considerations](docs/spec.md#security-considerations) section in the spec.

</details>

---

## API Reference

<details>
<summary><strong>Available Tools</strong></summary>

### `list_skills`

Lists all available skills with their metadata.

**Output:**

```json
{
  "skills": [
    {
      "id": "pdf-processing",
      "name": "PDF Processing",
      "description": "Extract text and tables from PDF files..."
    }
  ]
}
```

### `get_skill`

Retrieves the full skill content and absolute path.

**Input:**

```json
{
  "id": "pdf-processing"
}
```

**Output:**

```json
{
  "path": "/Users/username/.claude/skills/pdf-processing/SKILL.md",
  "name": "PDF Processing",
  "description": "Extract text and tables...",
  "content": "# PDF Processing\n\n## Quick start\n..."
}
```

</details>

<details>
<summary><strong>Available Prompts</strong></summary>

### `init-skills`

Provides informational guidance about the Skills MCP workflow. This prompt:

- Explains what skills are and how they're structured
- Outlines the progressive disclosure model (load only what you need, when you need it)
- Describes the step-by-step workflow for discovering, loading, and using skills
- Clarifies that the MCP is a minimal wrapper—agents handle all file operations

**When to use**: Run at the start of a conversation to provide background context. The prompt is informational only—it doesn't trigger any immediate actions. Agents will use skills when they encounter tasks that match available skill descriptions.

</details>

<details>
<summary><strong>How It Works</strong></summary>

The Skills MCP follows a **minimal wrapper design** that leverages the full capabilities of modern AI agents:

**What the server provides:**

- Skill discovery and metadata
- Skill content with absolute file paths
- Skills-specific context formatting

**What agents handle** (using their existing tools):

- Reading referenced files (`references/`, `scripts/`, `assets/`)
- Executing scripts
- Searching and navigating directories

**Example workflow:**

1. Agent calls `list_skills` and finds "PDF Processing"
2. Agent calls `get_skill` and receives `/path/to/pdf-processing/SKILL.md`
3. Skill mentions `references/FORMS.md` for advanced features
4. Agent constructs full path and reads it: `/path/to/pdf-processing/references/FORMS.md`
5. Agent executes scripts: `cd /path/to/pdf-processing && python scripts/fill_form.py`

This design keeps the MCP server simple while giving agents maximum flexibility.

</details>

---

## Learn More

- **[Claude Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)**: The original Skills format this server implements
- **[Full Specification](docs/spec.md)**: Complete technical specification and design rationale
- **[Model Context Protocol](https://modelcontextprotocol.io/)**: Learn about MCP
