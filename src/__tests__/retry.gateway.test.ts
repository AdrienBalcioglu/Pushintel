import { describe, it, expect, vi } from 'vitest'
import { RetryGateway } from '../push/gateway/retry.gateway'
import type { PushGateway } from '../push/gateway/base.gateway'
import type { Notification } from '../push/push.types'

const notification: Notification = { title: 'Test', body: 'Hello' }

describe('RetryGateway', () => {
  it('returns success on first try', async () => {
    const inner: PushGateway = { send: vi.fn().mockResolvedValue({ success: true }) }
    const gateway = new RetryGateway(inner, 3)
    const result = await gateway.send('token-1', notification)
    expect(result.success).toBe(true)
    expect(inner.send).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and eventually succeeds', async () => {
    const inner: PushGateway = {
      send: vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'timeout' })
        .mockResolvedValueOnce({ success: true }),
    }
    const gateway = new RetryGateway(inner, 3)
    const result = await gateway.send('token-1', notification)
    expect(result.success).toBe(true)
    expect(inner.send).toHaveBeenCalledTimes(2)
  })

  it('stops retrying on invalidToken', async () => {
    const inner: PushGateway = {
      send: vi.fn().mockResolvedValue({ success: false, invalidToken: true }),
    }
    const gateway = new RetryGateway(inner, 3)
    const result = await gateway.send('token-1', notification)
    expect(result.invalidToken).toBe(true)
    expect(inner.send).toHaveBeenCalledTimes(1)
  })

  it('exhausts retries and returns failure', async () => {
    const inner: PushGateway = {
      send: vi.fn().mockResolvedValue({ success: false, error: 'server error' }),
    }
    const gateway = new RetryGateway(inner, 3)
    const result = await gateway.send('token-1', notification)
    expect(result.success).toBe(false)
    expect(inner.send).toHaveBeenCalledTimes(3)
  })
})
