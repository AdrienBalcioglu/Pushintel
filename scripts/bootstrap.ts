import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const existing = await prisma.apiKey.findFirst({ where: { role: 'ADMIN', active: true } })
  if (existing) {
    process.stdout.write('An ADMIN key already exists — skipping.\n')
    return
  }

  const raw = `pi_${randomBytes(32).toString('hex')}`
  const keyHash = await bcrypt.hash(raw, 12)

  await prisma.apiKey.create({
    data: { name: 'bootstrap-admin', keyHash, role: 'ADMIN' },
  })

  process.stdout.write('\n✅ First ADMIN API key created:\n\n')
  process.stdout.write(`   ${raw}\n\n`)
  process.stdout.write('⚠️  Save this key — it will never be shown again.\n\n')
}

main()
  .catch((e) => { process.stderr.write(`${e}\n`); process.exit(1) })
  .finally(() => prisma.$disconnect())
