# Development

## Setup

```bash
# Install dependencies
pnpm install

# Build Skills MCP
pnpm build
```

## Testing Workflow

### Option 1: VS Code Integration

1. Build the project:

```bash
pnpm build
```

2. Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "skills-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["build/index.js", "-s", "/absolute/path/to/skills"]
    }
  }
}
```

3. Restart VS Code or reload the MCP connection
4. Test using GitHub Copilot chat with the available MCP tools

### Option 2: MCP Inspector

The MCP Inspector can be used to test the server's JSON-RPC communication:

```bash
# 1. Build
pnpm build

# 2. Start inspector and point it to your server
npx @modelcontextprotocol/inspector node build/index.js -s /absolute/path/to/skills

# 3. Test in Inspector UI:
#    - Tools: list_skills, get_skill
#    - Prompts: init-skills
```

### Option 3: Manual Testing

You can manually test the stdio transport:

```bash
# Start the server
node build/index.js -s /absolute/path/to/skills

# Server will wait for JSON-RPC messages on stdin
# Press Ctrl+C to exit
```

## Development Tips

- All console output must use `console.error()` (stderr) to avoid interfering with the JSON-RPC protocol on stdout
- The server automatically scans and loads skills on startup
- Skill changes are detected through file modification times
- Use absolute paths for `-s` arguments
