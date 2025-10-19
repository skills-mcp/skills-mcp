#!/usr/bin/env node

import * as path from 'node:path'
import * as util from 'node:util'

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { createServer } from './server.js'

const args = util.parseArgs({
  options: {
    'skills-dir': {
      type: 'string',
      multiple: true,
      short: 's',
    },
  },
})

const skillsDirs = args.values['skills-dir']

async function main() {
  // Validate arguments
  if (!skillsDirs || !skillsDirs.length) {
    console.error('Error: At least one --skills-dir argument is required')
    console.error('Usage: npx skills-mcp --skills-dir /path/to/skills')
    console.error(
      '       npx skills-mcp --skills-dir /path/to/skills1 --skills-dir /path/to/skills2',
    )
    console.error('       npx skills-mcp -s /path/to/skills')
    process.exit(1)
  }

  const nonAbsoluteSkillsDirs = skillsDirs.filter(
    (skillsDir) => !path.isAbsolute(skillsDir),
  )

  if (nonAbsoluteSkillsDirs.length) {
    console.error('Error: All skills directories must be absolute paths')
    console.error('Non-absolute paths found:')
    nonAbsoluteSkillsDirs.forEach((skillsDir) =>
      console.error(`  - ${skillsDir}`),
    )
    process.exit(1)
  }

  // Log startup information (to stderr to not interfere with stdio transport)
  console.error(`Skills MCP Server starting...`)
  console.error(`Skills directories:`)
  skillsDirs.forEach((dir) => console.error(`  - ${dir}`))

  // Create the MCP server
  const { server, skillRegistry } = createServer({ skillsDirs })

  // Initial scan of skills directory
  console.error(`Scanning skills directory...`)
  try {
    await skillRegistry.scan()

    const skillInfos = skillRegistry.getSkillInfos()

    console.error(`Loaded ${skillInfos.length} skill(s)`)

    skillInfos.forEach((skillInfo) => {
      console.error(`  - ${skillInfo.id}: ${skillInfo.metadata.name}`)
    })
  } catch (error) {
    console.error(`Failed to scan skills directory:`, error)

    process.exit(1)
  }

  // Start stdio transport
  console.error('Starting stdio transport...')

  const transport = new StdioServerTransport()

  await server.connect(transport)

  console.error('Stdio transport connected and ready')
}

main().catch((error) => {
  console.error('Fatal error:', error)

  process.exit(1)
})
