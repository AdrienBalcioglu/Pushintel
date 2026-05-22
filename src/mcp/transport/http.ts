import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Router } from 'express'
import type { Logger } from 'pino'
import type { PushintelMCPServer } from '../server'

export function mountHttpTransport(router: Router, mcpServer: PushintelMCPServer, logger: Logger): void {
  router.all('/http', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      const server = mcpServer.createInstance()
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      logger.error({ err }, 'HTTP transport error')
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', code: 'TRANSPORT_ERROR' })
      }
    }
  })
}
