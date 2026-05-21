import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import type { PrismaClient, Role } from '@prisma/client'

const SALT_ROUNDS = 12
const KEY_PREFIX = 'pi_'

export class ApiKeyService {
  constructor(private prisma: PrismaClient) {}

  async generate(name: string, role: Role): Promise<{ raw: string; id: string }> {
    const raw = `${KEY_PREFIX}${randomBytes(32).toString('hex')}`
    const keyHash = await bcrypt.hash(raw, SALT_ROUNDS)

    const apiKey = await this.prisma.apiKey.create({
      data: { name, keyHash, role },
    })

    return { raw, id: apiKey.id }
  }

  async verify(raw: string): Promise<{ id: string; role: Role } | null> {
    const keys = await this.prisma.apiKey.findMany({ where: { active: true } })

    for (const key of keys) {
      const match = await bcrypt.compare(raw, key.keyHash)
      if (match) {
        await this.prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsed: new Date() },
        })
        return { id: key.id, role: key.role }
      }
    }

    return null
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.apiKey.update({ where: { id }, data: { active: false } })
  }
}
