---
date: 2025-06-12
tags:
  - ai
---
This is clever - [Mastra](https://mastra.ai/) has launched a [how to build agents course](https://mastra.ai/course) as a MCP. Notes on the course.

## Setup Mastra MCP + Editor

Instal an MCP capable ide - I went with [Cursor](https://www.cursor.com/): `brew install --cask cursor` and then the Mastra MCP: `npx create-mastra@latest --default -m cursor`

I installed the mastra thingamajig in a folder called `mastra101`.

Aside: I already have VSCode and [Zed](https://zed.dev/docs/ai/mcp), but this is a good excuse to finally try out Cursor. 

Enable the mastra MCP server by adding to  `mastra101/.cursor/mcp.json`

```
{
  "mcpServers": {
    "mastra": {
      "command": "npx",
      "args": ["-y", "@mastra/mcp-docs-server@latest"]
    }
  }
}
```

That only took 2 minutes, but it is an artifact of mid 2025 - we would look back at this in late 2025 and say how quaint, we had to edit JSON files to tell IDEs anything! Future IDE's i assume will have built in logic to install/run MCP servers or connect to remote ones.