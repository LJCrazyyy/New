import { seedBulkStudents } from '@/lib/system-seed'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ success: false, message: 'Seeding is disabled in production.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const count = typeof body?.count === 'number' ? body.count : 1000
  const password = typeof body?.password === 'string' ? body.password : 'student123'

  try {
    const result = await seedBulkStudents({
      count,
      defaultPassword: password,
    })

    return Response.json({
      success: true,
      message:
        count === 0
          ? `Enrollment sync complete. ${result.totalStudents} students processed.`
          : `${result.createdUsers} student accounts created successfully.`,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, message }, { status: 500 })
  }
}