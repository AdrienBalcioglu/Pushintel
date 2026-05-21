import type { Redis } from 'ioredis'

const BLACKLIST_PREFIX = 'blacklist:'
const DEFAULT_TTL = 60 * 60 * 24 * 7 // 7 days

export class BlacklistService {
  constructor(private redis: Redis) {}

  async add(token: string, ttlSeconds = DEFAULT_TTL): Promise<void> {
    await this.redis.set(`${BLACKLIST_PREFIX}${token}`, '1', 'EX', ttlSeconds)
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const val = await this.redis.get(`${BLACKLIST_PREFIX}${token}`)
    return val !== null
  }
}
