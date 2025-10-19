# Skills MCP Specification

## Objective

Implement an MCP Server that exposes Claude's Skills pattern as MCP Tools, enabling any AI agent to discover, understand, and execute skills through the Model Context Protocol.

Anthropic designed Skills as a portable, convention-based format for specialized expertise. This MCP Server re-exposes that design pattern as a standard capability available to all AI agents—not just Claude. This allows organizations to maintain a single skills directory that works across Claude, open-source agents, and proprietary AI systems.

### Design Philosophy

**Core principle**: The Skills MCP is a minimal wrapper that offloads as much responsibility as possible to the consuming AI agent. Modern AI agents already have robust capabilities for reading files, executing scripts, searching code, and running shell commands. The Skills MCP should leverage these existing capabilities rather than duplicating them.

**What the Skills MCP provides**:

- **Skill discovery**: Expose available skills with metadata (names and descriptions)
- **Skill access**: Provide skill content with absolute file paths for reference
- **Skills-specific context**: Present information in the skills format that agents can understand

**What agents already do** (and the MCP should NOT duplicate):

- Read files from the filesystem
- Execute scripts (Python, shell, etc.)
- Search and grep through files
- Navigate directory trees
- Manage their own context window

**Example workflow**:

1. Agent calls `list_skills` to discover available skills
2. Agent calls `get_skill` which returns the absolute path to `SKILL.md` and its content
3. Agent reads the skill instructions, which may reference additional resources like `references/FORMS.md`
4. Agent uses its own file-reading capabilities to access `references/FORMS.md` by resolving the relative path against the skill's absolute path
5. Agent executes any scripts mentioned in the skill using its bash/shell tools

This design keeps the MCP server focused and simple while leveraging the full power of modern AI agents.

While Claude has native Skills support, the Skills MCP enables:

- **Universal agent compatibility**: Any agent with MCP support can access skills
- **Unified skill management**: Single skills folder works across all agents and platforms
- **Interoperable expertise**: Share specialized capabilities across your entire AI agent ecosystem
- **Standards-based approach**: Leverage Anthropic's design pattern via the Model Context Protocol

## Implementation Notes

This MCP Server is implemented using the **Model Context Protocol TypeScript SDK** with **stdio transport**. While the core implementation is TypeScript, the Skills format supports resources and scripts in multiple languages (Python, shell scripts, etc.), making the expertise portable across different runtime environments.

### Transport

The server uses **stdio (standard input/output) transport** for communication with MCP clients. This provides:

- **Seamless integration**: Direct communication with editors and tools
- **Process isolation**: Each editor instance gets its own server process
- **Simplicity**: No network configuration or port management required
- **Security**: No exposed network endpoints

> **Future consideration**: HTTP transport support may be added in future versions for use cases requiring network-based access or multiple simultaneous client connections.

---

## What are Claude Skills?

Agent Skills are modular, self-contained packages that extend Claude's functionality. Think of them as "onboarding guides" for specific domains or tasks—they transform general-purpose agents into specialized agents equipped with procedural knowledge that no model can fully possess.

### Why Skills Matter

Skills are reusable, filesystem-based resources that provide AI agents with domain-specific expertise: workflows, context, and best practices. Unlike prompts (conversation-level instructions for one-off tasks), Skills load on-demand and eliminate the need to repeatedly provide the same guidance across multiple conversations.

### What Skills Provide

1. **Specialized workflows**: Multi-step procedures for specific domains
2. **Tool integrations**: Instructions for working with specific file formats or APIs
3. **Domain expertise**: Company-specific knowledge, schemas, business logic
4. **Bundled resources**: Scripts, references, and assets for complex and repetitive tasks

**Key benefits**:

- **Specialize agents**: Tailor capabilities for domain-specific tasks
- **Reduce repetition**: Create once, use automatically
- **Compose capabilities**: Combine Skills to build complex workflows
- **Progressive disclosure**: Load information in stages as needed, rather than consuming context upfront

### Skills Characteristics

- **Composable**: Multiple skills work together; the MCP server coordinates their use
- **Portable**: Same skill format works across different platforms and tools
- **Efficient**: Only relevant skill metadata is exposed when needed
- **Powerful**: Skills include executable code for reliable task automation
- **Convention-based**: Standardized folder structure and SKILL.md format enable automation

---

## How Skills Work: Progressive Disclosure

Skills leverage a filesystem-based architecture that enables **progressive disclosure**: AI agents load information in stages as needed, rather than consuming context upfront.

### Three Levels of Content Loading

Skills use a three-level progressive disclosure system to manage context efficiently:

#### Level 1: Metadata (always loaded)

The Skill's YAML frontmatter provides discovery information:

```yaml
---
name: PDF Processing
description: Extract text and tables from PDF files, fill forms, merge documents. This skill should be used when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---
```

The agent loads this metadata at startup and includes it in the system prompt. This lightweight approach means you can install many Skills without context penalty; the agent only knows each Skill exists and when to use it.

**Token cost**: ~100 tokens per Skill (~100 words)

**Metadata quality**: The `name` and `description` determine when the agent will use the skill. Be specific about what the skill does and when to use it. Use third-person voice (e.g., "This skill should be used when..." instead of "Use this skill when...").

#### Level 2: Instructions (loaded when triggered)

The main body of SKILL.md contains procedural knowledge: workflows, best practices, and guidance:

````markdown
# PDF Processing

## Quick start

Use pdfplumber to extract text from PDFs:

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

For advanced form filling, see [references/FORMS.md](references/FORMS.md).
````

When you request something that matches a Skill's description, the agent reads SKILL.md from the filesystem. Only then does this content enter the context window.

**Token cost**: Under 5k tokens (<5k words)

**Writing style**: Use imperative/infinitive form (verb-first instructions), not second person. Use objective, instructional language (e.g., "To accomplish X, do Y" rather than "You should do X").

#### Level 3: Bundled Resources (loaded as needed)

Skills can bundle additional materials organized by purpose:

```
pdf-skill/
├── SKILL.md                    # Main instructions (loaded when triggered)
├── references/                 # Documentation loaded into context as needed
│   ├── FORMS.md               # Form-filling guide
│   └── API_REFERENCE.md       # Detailed API documentation
├── scripts/                    # Executable code (may be executed without loading)
│   ├── fill_form.py           # Utility script
│   └── validate.py            # Validation script
└── assets/                     # Files used in output (not loaded into context)
    ├── logo.png               # Brand assets
    └── template.pdf           # PDF template
```

**References (`references/`)**: Documentation and reference material loaded into context when needed to inform the agent's process.

- **When to include**: For documentation that the agent should reference while working
- **Examples**: Database schemas, API documentation, domain knowledge, company policies
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information should live in either SKILL.md or references files, not both

**Scripts (`scripts/`)**: Executable code for tasks requiring deterministic reliability or frequently rewritten operations.

- **When to include**: When the same code is repeatedly rewritten or deterministic reliability is needed
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read by the agent for patching or adjustments

**Assets (`assets/`)**: Files not intended to be loaded into context, but used in the output the agent produces.

- **When to include**: When the skill needs files that will be used in the final output
- **Examples**: Templates, images, icons, boilerplate code, fonts, sample documents
- **Use cases**: Files that get copied or modified rather than referenced

**Token cost**: Effectively unlimited (scripts can be executed without reading into context)

### Example: Loading a PDF Processing Skill

Here's how an agent loads and uses a PDF processing skill:

1. **Startup**: System prompt includes: `PDF Processing - Extract text and tables from PDF files, fill forms, merge documents`
2. **User request**: "Extract the text from this PDF and summarize it"
3. **Agent invokes**: `bash: read pdf-skill/SKILL.md` → Instructions loaded into context
4. **Agent determines**: Form filling is not needed, so FORMS.md is not read
5. **Agent executes**: Uses instructions from SKILL.md to complete the task

This dynamic loading ensures only relevant skill content occupies the context window.

---

## Skill Structure

Every Skill requires a `SKILL.md` file with YAML frontmatter and markdown body:

```yaml
---
name: Your Skill Name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
[Clear, step-by-step guidance for the agent to follow]

## Examples
[Concrete examples of using this Skill]
```

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

### Required YAML Frontmatter Fields

**Only two fields are supported**:

- `name`: Human-readable name of the Skill (64 characters maximum)
- `description`: One-line description of what the Skill does and when to use it (1024 characters maximum)

The `description` should include both **what the Skill does** and **when the agent should use it**. This is critical for skill discovery and selection. Use third-person voice (e.g., "This skill should be used when...").

### Directory Structure

Skills follow a conventional directory structure with three types of optional bundled resources:

```
skill-name/
├── SKILL.md              # Required: Skill metadata and main instructions
├── references/           # Optional: Documentation loaded into context as needed
├── scripts/              # Optional: Executable code (Python, shell, etc.)
└── assets/               # Optional: Files used in output (not loaded into context)
```

**Common patterns**:

```
pdf-processing/
├── SKILL.md              # Main instructions
├── references/
│   ├── FORMS.md          # Form-filling guide (loaded as needed)
│   └── API_REFERENCE.md  # API reference (loaded as needed)
├── scripts/
│   ├── analyze_form.py   # Extract form fields
│   ├── fill_form.py      # Apply values to PDF
│   └── validate.py       # Validation script
└── assets/
    └── template.pdf      # PDF template for output

bigquery-analysis/
├── SKILL.md              # Overview and navigation
└── references/
    ├── finance.md        # Revenue metrics schema
    ├── sales.md          # Pipeline data schema
    └── product.md        # Usage analytics schema

frontend-webapp-builder/
├── SKILL.md              # Development guidance
└── assets/
    └── hello-world/      # HTML/React boilerplate template
        ├── index.html
        ├── app.js
        └── styles.css
```

**Best practice**: Keep SKILL.md lean by moving detailed reference material to `references/` files. Information should live in either SKILL.md or references files, not both. Reserve SKILL.md for essential procedural instructions and workflow guidance.

---

## Runtime Environment

Skills run in a code execution environment where the agent has:

- **Filesystem access**: Read/write files in the skill directory
- **Bash commands**: Execute shell commands
- **Code execution**: Run Python, JavaScript/TypeScript, and other scripts

**Key constraints**:

- **No network access**: Skills cannot make external API calls or access the internet
- **No runtime package installation**: Only pre-installed packages are available
- **Pre-configured dependencies only**: Scripts must use available packages

This environment enables the filesystem-based architecture and progressive disclosure model.

---

## Skills MCP Architecture

### Discovery and Registration

The Skills MCP will:

1. **Scan**: Monitor a designated skills directory (e.g., `~/.claude/skills/`)
2. **Parse**: Read SKILL.md files and extract YAML frontmatter
3. **Index**: Build an internal registry of available skills
4. **Watch**: Optionally monitor for changes and reload skills

### MCP Tool Mapping

The Skills MCP exposes two core tools:

**`list_skills`**: Discovery tool that returns metadata for all available skills

- Input: None
- Output: Array of skill objects with name, description, and id

**`get_skill`**: Access tool that returns the full skill content with its absolute path

- Input: Skill name/ID
- Output: Object containing:
  - `path`: Absolute path to the SKILL.md file
  - `name`: Name from YAML frontmatter
  - `description`: Description from YAML frontmatter
  - `content`: Complete SKILL.md markdown content (body only, without frontmatter), read on-demand

The absolute path enables agents to resolve relative references within the skill. When a skill references `references/FORMS.md` or `scripts/analyze.py`, the agent can read or execute these files using its own tools.

**Performance Note**: The MCP server stores skill metadata (name, description, path) in memory after scanning, but reads SKILL.md content on-demand when `get_skill` is called. This minimizes memory usage while maintaining fast skill discovery.

**Skill Execution Tools**: Run skill scripts

- Input: Skill name/ID, script path, parameters
- Output: Script execution results

**Note**: Script execution is delegated to the AI agent. The agent uses its own bash/shell tools to execute scripts. The MCP server provides the skill path; the agent handles execution.

### Tool Discovery Flow

**Initial conversation setup**:

1. Agent calls `list_skills` (typically at conversation start or when user mentions tasks that might use skills)
2. Server scans configured skills directory and returns metadata for all skills
3. Agent matches user requests to skill descriptions and calls `get_skill` as needed
4. Agent uses the returned absolute path to read additional resources referenced in the skill instructions

**Example flow**:

User: "Extract text from this PDF"

- Agent calls `list_skills`, finds "PDF Processing" skill
- Agent calls `get_skill` with id, receives:
  - `path`: `/Users/username/.claude/skills/pdf-processing/SKILL.md`
  - `content`: The skill instructions
- Skill mentions `references/FORMS.md` for form filling
- Agent reads `/Users/username/.claude/skills/pdf-processing/references/FORMS.md` using its own file-reading tool
- Agent executes any needed scripts using bash with paths relative to `/Users/username/.claude/skills/pdf-processing/`

**Mid-conversation updates**:

- Each tool call checks for staleness and refreshes the skill index if needed
- Agent can call `list_skills` again to refresh if directed by user
- No real-time notifications for new skills (agent discovers on next tool invocation)

---

## Security Considerations

Skills provide agents with new capabilities through instructions and code. This makes them powerful but also requires careful security consideration.

### Trust Model

**Use Skills only from trusted sources**: those you created yourself or obtained from Anthropic.

A malicious Skill can direct the agent to invoke tools or execute code in ways that don't match the Skill's stated purpose. If you must use a Skill from an untrusted or unknown source, exercise extreme caution and thoroughly audit it before use.

### Key Security Risks

- **Tool misuse**: Malicious Skills can invoke tools (file operations, bash commands) in harmful ways
- **Data exposure**: Skills with access to sensitive data could be designed to leak information
- **Script execution**: Bundled scripts execute with the agent's privileges
- **External sources**: Skills that reference external URLs or data sources pose additional risk

### Security Best Practices for the MCP Server

1. **Skill verification**: Validate SKILL.md structure and required fields
2. **Script sandboxing**: Execute scripts in isolated environments with limited privileges
3. **Resource access control**: Restrict file access to the skill directory
4. **Audit logging**: Log all skill executions and resource accesses
5. **Permission model**: Allow users to enable/disable specific skills or capabilities

### Treat Skills Like Software Installation

Only use Skills from trusted sources. Be especially careful when integrating Skills into production systems with access to sensitive data or critical operations.

---

## Skill Validation and Packaging

### Validation Requirements

The MCP server should validate skills to ensure they meet structural requirements:

- **YAML frontmatter format**: Valid YAML with required `name` and `description` fields
- **Naming conventions**: Skill directory names follow conventions (lowercase, hyphens)
- **Description completeness**: Description includes what the skill does and when to use it
- **File organization**: Proper use of `scripts/`, `references/`, and `assets/` directories

### Distribution Format

Skills can be distributed as zip files, but users must unpack them into the configured skills directory:

- Zip file named after the skill (e.g., `my-skill.zip`)
- Maintains directory structure with SKILL.md at root
- Includes all bundled resources (scripts, references, assets)
- **User responsibility**: Unpack skills into the MCP server's configured skills directory

**MCP Server Implementation**: The server only loads skills from unpacked directories. The skills directory paths must be specified via the `--skills-dir` CLI argument (required, can be specified multiple times for multiple directories). All paths must be absolute.

---

## Pre-built Agent Skills

Anthropic provides pre-built Agent Skills for common document tasks:

- **PowerPoint (pptx)**: Create presentations, edit slides, analyze presentation content
- **Excel (xlsx)**: Create spreadsheets, analyze data, generate reports with charts
- **Word (docx)**: Create documents, edit content, format text
- **PDF (pdf)**: Generate formatted PDF documents and reports

These Skills demonstrate the format and patterns that custom Skills should follow. The Skills MCP should be able to load and expose these pre-built Skills alongside custom ones.

---

## Implementation Roadmap

### Phase 1: Core Discovery and Metadata

- [ ] MCP server configuration (--skills-dir CLI argument required, supports multiple directories with absolute paths)
- [ ] Skills directory scanner (glob for SKILL.md files)
- [ ] YAML frontmatter parser
- [ ] Skill validation (structure, naming, required fields)
- [ ] Skill registry/index with staleness checking
- [ ] `list_skills` MCP tool implementation

### Phase 2: Skill Content Access

- [ ] `get_skill` MCP tool for reading SKILL.md content
- [ ] Return absolute path to skill file in `get_skill` response
- [ ] File path resolution and validation (security: prevent directory traversal)
- [ ] Error handling for missing skills
- [ ] Caching with staleness detection using existing library

### Phase 3: Optional Enhancements

- [ ] `init-skills` MCP prompt for conversation initialization
- [ ] Audit logging for tool invocations
- [ ] Performance optimization

### Phase 4: Polish and Documentation

- [ ] Comprehensive error messages
- [ ] Usage examples and documentation
- [ ] Integration testing with MCP clients
- [ ] Example skills for testing

---

## Design Decisions

### Package Dependencies

**Decision**: The Skills MCP assumes necessary packages are already installed in the runtime environment.

**Rationale**: Package management is outside the scope of this MCP server. Skills run in environments where the agent already has access to required packages (Python, Node.js, etc.). The skill documentation should specify required packages, but installation is the responsibility of the environment setup, not the MCP server.

### Skill Composition

**Decision**: Not supported in initial implementation.

**Rationale**: Skill composition (one skill referencing another) adds complexity without clear immediate value. Skills should be self-contained. If composition patterns emerge as necessary, this can be revisited in future iterations.

### Script Execution

**Decision**: The MCP server does NOT execute scripts. Script execution is delegated to the AI agent.

**Rationale**:

- AI agents using this MCP server already have access to bash/shell tools
- The agent can execute scripts directly using relative paths from skill directories
- Removes security and sandboxing concerns from the MCP server
- Keeps the MCP server focused on providing context, not code execution
- Skills can include execution instructions in SKILL.md if specific invocation patterns are required

**Implementation**: The MCP server provides tools to discover and read skill files. The agent executes scripts using its own bash/shell capabilities.

### Skill Updates and File Watching

**Decision**: Check for skill changes on-demand rather than live file watching.

**Rationale**:

- Simpler implementation without managing file watchers
- Leverage existing library for detecting file changes
- Check for staleness when tools are invoked (e.g., when listing skills)
- Avoids complexity of notifying agents mid-conversation about new skills

**Open consideration**: Determine optimal timing for parsing SKILL.md files:

- Option A: Parse on server initialization (fast, but misses updates)
- Option B: Parse on first tool call (lazy loading, always fresh)
- **Preferred**: Parse on-demand when tools are called, with caching and staleness checks

### Skill Distribution Format

**Decision**: The MCP server only loads skills from unpacked directories, not zip files.

**Rationale**:

- Keeps implementation simple and focused
- MCP server configuration (environment variable or CLI flag) points to a skills directory
- Conventional structure allows simple glob patterns to discover SKILL.md files
- Users unpack skills into the configured directory before use
- Zip file handling is a distribution concern, not a runtime concern

### Grep Search and File Operations

**Decision**: File searching, reading, and manipulation is delegated to the AI agent's existing tools.

**Rationale**:

- AI agents already have tools for reading, writing, and searching files
- The Skills MCP is a minimal wrapper providing skills-specific context
- Adding file operation tools duplicates existing agent capabilities
- Providing absolute paths in `get_skill` enables agents to resolve relative references
- Keep the MCP server focused on skill discovery and access, not general file operations

**Implementation**: When `get_skill` returns a skill, it includes the absolute path to the SKILL.md file. If the skill references `references/FORMS.md`, the agent can construct the full path and read it using its own file-reading tool.

### Design Philosophy

**Core principle**: The Skills MCP is a minimal wrapper that exposes Anthropic's Skills format via MCP tools. It offloads as much responsibility as possible to the consuming AI agent, providing only the essential functionality needed to enable skills behavior.

Modern AI agents already have robust capabilities for reading files, executing scripts, searching code, and running shell commands. The Skills MCP should leverage these existing capabilities rather than duplicating them.

**What the server DOES**:

- **Discover skills**: Scan configured directory and expose available skills
- **Parse metadata**: Extract and provide skill names and descriptions from YAML frontmatter
- **Provide skill content**: Return SKILL.md content with absolute file paths
- **Enable context**: Present skills in a format agents can understand and use

**What the server DOES NOT do** (delegated to agent):

- Read referenced files (agent reads `references/`, `scripts/`, `assets/` directly)
- Execute scripts (agent uses bash/shell tools)
- Search/grep files (agent has these tools)
- Navigate directory trees (agent can use `ls`, `tree`, or read directories)
- Manage packages (environment's responsibility)
- Watch files in real-time (check on-demand instead)
- Handle zip files (distribution concern)

**Why this approach**:

- **Simplicity**: Minimal API surface, easier to implement and maintain
- **Leverage existing tools**: Agents already have powerful file and execution capabilities
- **Flexibility**: Agents can use their preferred methods for file operations
- **No duplication**: Avoid reimplementing functionality agents already have
- **Future-proof**: As agent capabilities improve, they benefit automatically

**Example: How agents use skill references**

A skill's SKILL.md might include:

````markdown
For advanced form filling, see [references/FORMS.md](references/FORMS.md).

To validate results, run:

```bash
python scripts/validate.py
```
````

When `get_skill` returns this skill, it includes `path: /path/to/pdf-processing/SKILL.md`. The agent:

1. Reads the skill content and sees the reference to `references/FORMS.md`
2. Constructs the absolute path: `/path/to/pdf-processing/references/FORMS.md`
3. Uses its own file-reading tool to access the file
4. Sees the script reference and uses bash: `cd /path/to/pdf-processing && python scripts/validate.py`

No additional MCP tools needed—the agent handles everything using its existing capabilities.

---

## MCP Tools Design

The Skills MCP exposes two core tools that provide the minimal functionality needed for skills behavior:

### `list_skills`

Lists all available skills with their metadata (Level 1: names and descriptions).

```typescript
{
  name: "list_skills",
  description: "List all available skills with their names and descriptions. Call this tool at the start of a conversation to discover available skills.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Output**: Array of skill objects with:

- `id`: Skill identifier (directory name)
- `name`: Human-readable name from YAML frontmatter
- `description`: Description from YAML frontmatter

**Behavior**: Checks for file changes and refreshes skill index if stale.

**Example response**:

```json
[
  {
    "id": "pdf-processing",
    "name": "PDF Processing",
    "description": "Extract text and tables from PDF files, fill forms, merge documents. This skill should be used when working with PDF files or when the user mentions PDFs, forms, or document extraction."
  }
]
```

### `get_skill`

Retrieves the full SKILL.md content for a specific skill with its absolute path (Level 2: instructions).

```typescript
{
  name: "get_skill",
  description: "Get the full instructions (SKILL.md content) for a specific skill. Returns the skill content along with the absolute path to the skill file, enabling you to resolve and read any referenced resources (references/, scripts/, assets/) using your own file-reading tools.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The skill identifier (directory name)"
      }
    },
    required: ["id"]
  }
}
```

**Output**: Object containing:

- `path`: Absolute path to the SKILL.md file (e.g., `/Users/username/.claude/skills/pdf-processing/SKILL.md`)
- `name`: Name from YAML frontmatter
- `description`: Description from YAML frontmatter
- `content`: Complete SKILL.md markdown content (body only, without YAML frontmatter)

**Behavior**:

- Returns the parsed skill content without the YAML frontmatter (metadata is already available from `list_skills`)
- Provides absolute path so agents can resolve relative references within the skill
- Enables agents to read `references/`, execute `scripts/`, and access `assets/` using their own tools

**Example response**:

````json
{
  "path": "/Users/username/.claude/skills/pdf-processing/SKILL.md",
  "name": "PDF Processing",
  "description": "Extract text and tables from PDF files...",
  "content": "# PDF Processing\n\n## Quick start\n\nUse pdfplumber to extract text from PDFs:\n\n```python\nimport pdfplumber\n...\n```\n\nFor advanced form filling, see [references/FORMS.md](references/FORMS.md)."
}
````

**Agent workflow**:

1. Agent calls `get_skill` and receives the skill content and absolute path
2. Agent reads the content and sees a reference to `references/FORMS.md`
3. Agent extracts the directory path from `path`: `/Users/username/.claude/skills/pdf-processing/`
4. Agent constructs the full path: `/Users/username/.claude/skills/pdf-processing/references/FORMS.md`
5. Agent uses its own file-reading tool to read the referenced file
6. Agent executes scripts mentioned in the skill using bash: `cd /Users/username/.claude/skills/pdf-processing && python scripts/validate.py`

### Removed Tools

**`read_skill_file`**: Not needed. Agents can read files directly using their own tools once they have the skill's absolute path.

**`get_skill_tree`**: Not needed. Agents can use `ls`, `tree`, or directory reading tools if they want to explore a skill's structure.

---

## MCP Prompts

The Skills MCP exposes an MCP prompt to provide background guidance about the skills workflow:

### `init-skills` Prompt

A prompt that provides informational guidance about working with the Skills MCP. This prompt is designed to be run at the start of a conversation to establish context without triggering immediate actions.

**Usage**: `/init-skills` or similar

**Design Goals**:

- **Informational, not directive**: Provides background context rather than action directives
- **Progressive disclosure emphasis**: Clearly communicates that skills should only be loaded when needed for specific tasks
- **Task-centric language**: Uses "task or objective" rather than "user request" to encompass both explicit user requests and autonomous agentic workflows
- **Minimal wrapper philosophy**: Makes clear that the MCP only provides discovery and content access; agents handle all file operations

**Content** (current implementation in `src/server.ts`):

````markdown
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

The absolute path returned by `get_skill` enables you to resolve any relative references within the skill.

## When to Use Skills

Skills follow a **progressive disclosure model**. Only load content when it's needed to accomplish a task:

1. **Call `list_skills`** when you need to discover what skills are available (typically when a task might benefit from specialized expertise)
2. **Call `get_skill`** only when a skill matches the specific task or objective at hand
3. **Read referenced files** only when the skill instructions direct you to do so
4. **Execute scripts** only when required by the workflow

## Working with Skills

### Step 1: Discovery

Call `list_skills` to see available skills and their descriptions. Each skill description explains what it does and when to use it.

### Step 2: Loading

When a skill clearly matches the task at hand, call `get_skill` with the skill ID. This returns:

- `path`: Absolute path to SKILL.md (e.g., `/path/to/skill/SKILL.md`)
- `name`: Skill name
- `description`: Skill description
- `content`: Complete SKILL.md instructions

### Step 3: Following Instructions

Read and follow the instructions in the skill content. The skill will guide you through the workflow.

### Step 4: Accessing Resources

Skills may reference additional files like `references/guide.md` or `scripts/process.py`. To access these:

1. Extract the directory path from the skill's absolute path
   - Example: `/path/to/pdf-processing/SKILL.md` → `/path/to/pdf-processing/`
2. Construct the full path to the referenced resource
   - Example: `/path/to/pdf-processing/references/FORMS.md`
3. Use your file-reading tools to access the file

### Step 5: Executing Scripts

When skills reference executable scripts, use your bash tool:

```bash
cd /path/to/skill-directory && python scripts/script_name.py
```

## Important Notes

### Resource Access

All resource access (references, scripts, assets) is your responsibility using your existing file-reading and bash tools. The Skills MCP only provides the starting point (the SKILL.md path).

### Progressive Loading

Skills are designed to minimize context usage. Only load what you need, when you need it. Load skills when they match the task at hand, and read references only as directed by the skill instructions.

---

**Remember**: This is background information. Use skills when they align with the task or objective you're working on.
````

**Key Refinements** (October 2025):

- **Opening statement**: Explicitly states this is informational guidance and not an action directive
- **Task-centric**: Uses "task or objective" to include both user requests and agentic workflows
- **Removed redundancy**: Consolidated progressive disclosure guidance into clear, non-repetitive sections
- **Positive framing**: Final reminder uses positive language ("Use skills when...") rather than negative constraints
- **Clarity over conciseness**: Prioritizes clear understanding over token minimization

**Benefit**: Users can run this at the start of conversations to establish context, helping agents understand the skills workflow without triggering premature tool calls.

---

## Agent Instructions Export

### Overview

While the `/init-skills` prompt provides on-demand access to Skills MCP guidance, some users may prefer to have the instructions always present in their agent's context. The instructions export feature enables this workflow.

### Command Interface

```bash
npx skills-mcp instructions [options]
```

**Purpose**: Output the Skills MCP usage guide to stdout, enabling users to save it to files for inclusion in agent instruction configurations.

**Options**:

- `--no-xml`: Disable XML tag wrapper. Default: false (XML tags included)
- `--help`: Show help for the instructions command

### Use Cases

#### 1. Agent Custom Instructions

Users can export instructions and add them to agent-specific configuration:

- **Claude Desktop**: Custom instructions in settings
- **ChatGPT**: Custom instructions in settings
- **Other agents**: System prompts or configuration files

#### 2. Project-Level Instructions

**Recommended**: Use AGENTS.md (growing adoption as standard)

```bash
npx -y skills-mcp instructions >> AGENTS.md
```

**Alternative** for agents without AGENTS.md support:

```bash
# Claude Code
npx -y skills-mcp instructions >> CLAUDE.md
```

#### 3. Team Documentation

Teams can commit instructions to their repository for consistent agent setup across developers.

### Design Decisions

#### Why CLI Export vs API?

**Decision**: Provide CLI command rather than MCP tool/resource

**Rationale**:

- Instructions are a one-time setup concern, not a runtime concern
- CLI is the natural place for setup/configuration commands
- Shell redirection (>>, >) is the idiomatic way to save command output
- Keeps MCP server focused on runtime skill operations

#### Why stdout vs File Writing?

**Decision**: Output to stdout, let users handle file operations

**Rationale**:

- Maximum flexibility—users choose destination, filename, append vs overwrite
- Shell redirection is familiar to developers
- No need to guess project structure or file locations
- Simpler implementation—no file system concerns
- Composable with other shell tools (grep, sed, etc.)

#### Content Source

**Decision**: Share the same content between `/init-skills` prompt and `instructions` command

**Rationale**:

- Single source of truth for instructions
- Consistency between on-demand and always-available approaches
- Easier maintenance—update once, reflected everywhere
- Users can choose their preferred workflow without content differences

### Output Format

**Default (with XML tags)**:

Instructions are wrapped in `<skills-mcp-instructions>` XML tags to provide clear boundaries when appending to existing files:

```markdown
<skills-mcp-instructions>
# Skills MCP - Usage Guide

This is informational guidance about the Skills MCP...
[full content]
</skills-mcp-instructions>
```

**With `--no-xml`**:

Plain markdown without XML wrapper:

```markdown
# Skills MCP - Usage Guide

This is informational guidance about the Skills MCP...
[full content]
```

### Implementation Notes

The instructions content is extracted to a shared module (`src/instructions.ts`) and imported by both:

- MCP server for the `/init-skills` prompt
- CLI handler for the `instructions` command

This ensures consistency and eliminates duplication.

### Relationship to /init-skills Prompt

These are complementary approaches serving different user preferences:

| Aspect            | `/init-skills` Prompt     | `instructions` Export |
| ----------------- | ------------------------- | --------------------- |
| **Context usage** | Loaded on-demand          | Always present        |
| **Setup effort**  | Run each session          | One-time setup        |
| **User action**   | Must remember to run      | Automatic             |
| **Best for**      | Minimizing context window | Seamless workflow     |

Both use identical content—the difference is **when** and **how** the agent receives it.

---

## References

- [Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
