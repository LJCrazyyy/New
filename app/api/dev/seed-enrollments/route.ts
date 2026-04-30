import { connectToDatabase } from '@/lib/mongodb'
import { User, Course, Enrollment } from '@/lib/system-models'

export const runtime = 'nodejs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ success: false, message: 'Seeding is disabled in production.' }, { status: 403 })
  }

  try {
    await connectToDatabase()

    const students = await User.find({ role: 'student' }).limit(20)
    if (!students || students.length === 0) {
      return Response.json({ success: false, message: 'No student accounts found. Run /api/dev/seed-students first.' }, { status: 400 })
    }

    const courses = await Course.find().limit(50)
    if (!courses || courses.length === 0) {
      return Response.json({ success: false, message: 'No courses found. Create courses before seeding enrollments.' }, { status: 400 })
    }

    const created: Array<{ student: string; course: string }> = []

    for (const student of students) {
      // enroll each student into up to 3 random courses from the available courses
      const shuffled = courses.slice().sort(() => Math.random() - 0.5)
      const pick = shuffled.slice(0, Math.min(3, shuffled.length))

      for (const course of pick) {
        try {
          const exists = await Enrollment.findOne({ student: student._id, course: course._id })
          if (exists) continue

          const newEnroll = await Enrollment.create({
            student: student._id,
            course: course._id,
            semester: course.semester ?? 'Spring 2024',
            status: 'enrolled',
          })

          // increment course enrolled count safely
          await Course.updateOne({ _id: course._id }, { $inc: { enrolledCount: 1 } })

          created.push({ student: student._id.toString(), course: course._id.toString() })
        } catch (err) {
          // ignore duplicate or validation errors per-enrollment
        }
      }
    }

    return Response.json({ success: true, message: 'Enrollments seeded.', result: { createdCount: created.length, created } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, message }, { status: 500 })
  }
}
