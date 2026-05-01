import { seedSystemDatabase } from '@/lib/system-seed'

export const runtime = 'nodejs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ message: 'Seeding is disabled in production.' }, { status: 403 })
  }

  try {
    const result = await seedSystemDatabase()
    return Response.json({ success: true, message: 'Firebase database seeded successfully.', result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, message }, { status: 500 })
  }
}
