const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Delete transactions first (foreign key dependency on assets + users)
  const txResult = await prisma.transaction.deleteMany({})
  console.log(`✅ Transactions cleared: ${txResult.count} rows deleted`)

  // Delete assets
  const assetResult = await prisma.asset.deleteMany({})
  console.log(`✅ Assets cleared: ${assetResult.count} rows deleted`)

  console.log('\n⚠️  Users table was NOT touched — all accounts preserved.')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  prisma.$disconnect()
  process.exit(1)
})
