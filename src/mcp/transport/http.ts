import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Router } from 'express'
import type { Server as McServer } from '@modelcontextprotocol/sdk/server/index.js'
import type { Logger } from 'pino'

export function mountHttpTransport(router: Router, mcpServer: McServer, logger: Logger): void {
  router.all('/http', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      })
      await mcpServer.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      logger.error({ err }, 'HTTP transport error')
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', code: 'TRANSPORT_ERROR' })
      }
    }
  })
}
