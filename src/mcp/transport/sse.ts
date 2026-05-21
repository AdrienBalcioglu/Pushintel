import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import type { Router } from 'express'
import type { Server as McServer } from '@modelcontextprotocol/sdk/server/index.js'
import type { Logger } from 'pino'

export function mountSseTransport(router: Router, mcpServer: McServer, logger: Logger): void {
  const transports = new Map<string, SSEServerTransport>()

  router.get('/sse', async (_req, res) => {
    const transport = new SSEServerTransport('/mcp/messages', res)
    transports.set(transport.sessionId, transport)
    logger.info({ sessionId: transport.sessionId }, 'SSE client connected')

    res.on('close', () => {
      transports.delete(transport.sessionId)
      logger.info({ sessionId: transport.sessionId }, 'SSE client disconnected')
    })

    await mcpServer.connect(transport)
  })

  router.post('/messages', async (req, res) => {
    const sessionId = req.query['sessionId'] as string
    const transport = transports.get(sessionId)
    if (!transport) {
      res.status(404).json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' })
      return
    }
    await transport.handlePostMessage(req, res)
  })
}
