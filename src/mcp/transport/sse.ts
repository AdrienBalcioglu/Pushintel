import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import type { Router } from 'express'
import type { Logger } from 'pino'
import type { PushintelMCPServer } from '../server'

export function mountSseTransport(router: Router, mcpServer: PushintelMCPServer, logger: Logger): void {
  const transports = new Map<string, SSEServerTransport>()

  router.get('/sse', async (_req, res) => {
    const transport = new SSEServerTransport('/mcp/messages', res)
    const server = mcpServer.createInstance()

    transports.set(transport.sessionId, transport)
    logger.info({ sessionId: transport.sessionId }, 'SSE client connected')

    res.on('close', () => {
      transports.delete(transport.sessionId)
      logger.info({ sessionId: transport.sessionId }, 'SSE client disconnected')
    })

    await server.connect(transport)
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
