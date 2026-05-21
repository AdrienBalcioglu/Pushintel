import { Server as McServer } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import type { Logger } from 'pino'
import type { McpTool } from './tools/index'

export class PushintelMCPServer {
  private server: McServer

  constructor(
    private tools: McpTool[],
    private logger: Logger,
  ) {
    this.server = new McServer(
      { name: 'pushintel', version: '1.0.0' },
      { capabilities: { tools: {} } },
    )
    this.registerHandlers()
  }

  private registerHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (req: { params: { name: string; arguments?: unknown } }) => {
      const tool = this.tools.find((t) => t.name === req.params.name)
      if (!tool) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Unknown tool: ${req.params.name}`, code: 'TOOL_NOT_FOUND' }) }],
        }
      }

      try {
        const result = await tool.handler(req.params.arguments)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        this.logger.warn({ tool: req.params.name, error }, 'tool call failed')
        return {
          isError: true,
          content: [{ type: 'text' as const, text: JSON.stringify({ error, code: 'TOOL_ERROR' }) }],
        }
      }
    })
  }

  async connectStdio(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    this.logger.info('MCP server connected via stdio')
  }
}
