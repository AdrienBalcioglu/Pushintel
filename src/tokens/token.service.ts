import type { Platform } from '@prisma/client'
import type { TokenRepository, RegisterTokenInput } from './token.repository'

export class TokenService {
  constructor(private repo: TokenRepository) {}

  async register(input: RegisterTokenInput) {
    return this.repo.upsert(input)
  }

  async deactivate(token: string): Promise<void> {
    await this.repo.deactivate(token)
  }

  async getForSegment(filters: { platform?: Platform; tags?: string[]; userIds?: string[] }) {
    return this.repo.findByFilters(filters)
  }

  async countForSegment(filters: { platform?: Platform; tags?: string[]; userIds?: string[] }) {
    return this.repo.countByFilters(filters)
  }
}
