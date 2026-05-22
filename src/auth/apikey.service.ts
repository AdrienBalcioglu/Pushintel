import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import type { PrismaClient, Role } from '@prisma/client'

const SALT_ROUNDS = 12

// Key format: pi_<16hex>_<48hex>
// keyPrefix = pi_<16hex> — stored in DB, indexed, used for O(1) lookup
// Full key is bcrypt-hashed for final verification
function generateRawKey(): { raw: string; prefix: string } {
  const prefixHex = randomBytes(8).toString('hex')   // 16 chars
  const secretHex = randomBytes(24).toString('hex')  // 48 chars
  const raw = `pi_${prefixHex}_${secretHex}`
  const prefix = `pi_${prefixHex}`
  return { raw, prefix }
}

function extractPrefix(raw: string): string | null {
  const match = raw.match(/^(pi_[0-9a-f]{16})_/)
  return match ? match[1] : null
}

export class ApiKeyService {
  constructor(private prisma: PrismaClient) {}

  async generate(name: string, role: Role): Promise<{ raw: string; id: string }> {
    const { raw, prefix } = generateRawKey()
    const keyHash = await bcrypt.hash(raw, SALT_ROUNDS)

    const apiKey = await this.prisma.apiKey.create({
      data: { name, keyHash, keyPrefix: prefix, role },
    })

    return { raw, id: apiKey.id }
  }

  async verify(raw: string): Promise<{ id: string; role: Role } | null> {
    const prefix = extractPrefix(raw)

    if (prefix) {
      // O(1) lookup by indexed prefix, then one bcrypt compare
      const key = await this.prisma.apiKey.findFirst({
        where: { keyPrefix: prefix, active: true },
      })
      if (!key) return null
      const match = await bcrypt.compare(raw, key.keyHash)
      if (!match) return null
      await this.prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsed: new Date() },
      })
      return { id: key.id, role: key.role }
    }

    // Fallback for legacy keys without prefix (O(n) — will disappear once all keys are rotated)
    const keys = await this.prisma.apiKey.findMany({
      where: { active: true, keyPrefix: null },
    })
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
