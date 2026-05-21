import { describe, it, expect, beforeAll } from 'vitest'
import { JwtService } from '../auth/jwt.service'

describe('JwtService', () => {
  let service: JwtService

  beforeAll(() => {
    service = new JwtService()
  })

  it('signs and verifies a token', async () => {
    const token = await service.sign({ sub: 'user-1', role: 'ADMIN' })
    expect(token).toBeTruthy()

    const payload = await service.verify(token)
    expect(payload.sub).toBe('user-1')
    expect(payload.role).toBe('ADMIN')
  })

  it('rejects a tampered token', async () => {
    const token = await service.sign({ sub: 'user-1', role: 'ADMIN' })
    const tampered = token.slice(0, -5) + 'XXXXX'
    await expect(service.verify(tampered)).rejects.toThrow()
  })
})
