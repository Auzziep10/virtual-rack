import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create a mock Merchant
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Maison Virtual',
      storeMetadata: {
        location: 'Paris, FR',
        aesthetic: 'Luxury Minimalist'
      }
    }
  })
  console.log(`Created Merchant: ${merchant.name}`)

  // 2. Create Garments
  const garment1 = await prisma.garment.create({
    data: {
      merchantId: merchant.id,
      name: 'Obsidian Velvet Tuxedo',
      description: 'A finely tailored tuxedo mapped for standard SMPL-X geometry.',
      occasionTags: ['Gala', 'Formal'],
      fabricMetadata: { material: 'velvet', stretch: 'low', weight: 'heavy' },
      assetGlbUrl: 'https://example.com/assets/tuxedo.glb',
      assetUsdzUrl: 'https://example.com/assets/tuxedo.usdz'
    }
  })

  const garment2 = await prisma.garment.create({
    data: {
      merchantId: merchant.id,
      name: 'Aegean Silk Wrap Dress',
      description: 'Flowing silk dress suitable for resort wear.',
      occasionTags: ['Resort', 'Evening'],
      fabricMetadata: { material: 'silk', stretch: 'medium', weight: 'light' },
      assetGlbUrl: 'https://example.com/assets/wrap_dress.glb',
      assetUsdzUrl: 'https://example.com/assets/wrap_dress.usdz'
    }
  })

  console.log(`Created Garments: ${garment1.name}, ${garment2.name}`)

  // 3. Create a mock User
  const user = await prisma.user.create({
    data: {
      email: 'client@virtualrack.ai',
      name: 'Evelyn Wright',
      avatar3dUrl: 'https://example.com/assets/evelyn_splat.usdz',
      measurements: {
        gender: 'female',
        height_cm: 172,
        betas: [0.2, -0.5, 0.1, 1.2, -0.3, 0.0, 0.0, 0.0, 0.0, 0.0] // SMPL shape params
      }
    }
  })
  console.log(`Created User: ${user.name}`)

  // 4. Populate Virtual Rack (Many-to-Many link)
  await prisma.virtualRack.createMany({
    data: [
      { userId: user.id, garmentId: garment1.id },
      { userId: user.id, garmentId: garment2.id }
    ]
  })
  
  console.log('Virtual Rack seeded with garments.')
  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
