import { connectToDatabase } from '@/lib/mongodb'
import { CourseActivity } from '@/lib/system-models'

export const runtime = 'nodejs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ message: 'Seeding is disabled in production.' }, { status: 403 })
  }

  try {
    await connectToDatabase()

    // Sample lecture activities
    const sampleLectures = [
      {
        course: '69ebd16637c3a565a9e152df', // CS101
        faculty: '69ebd16637c3a565a9e1514c', // Dr. Maria Garcia
        title: 'Introduction to Programming Concepts',
        description: 'Overview of basic programming principles, algorithms, and problem-solving techniques.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs101-lecture1',
        points: 0,
        dueDate: null,
      },
      {
        course: '69ebd16637c3a565a9e152df', // CS101
        faculty: '69ebd16637c3a565a9e1514c', // Dr. Maria Garcia
        title: 'Variables and Data Types',
        description: 'Understanding variables, data types, and basic operations in programming.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs101-lecture2',
        points: 0,
        dueDate: null,
      },
      {
        course: '69ebd16637c3a565a9e152df', // CS101
        faculty: '69ebd16637c3a565a9e1514c', // Dr. Maria Garcia
        title: 'Control Structures',
        description: 'Conditional statements, loops, and flow control in programming.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs101-lecture3',
        points: 0,
        dueDate: null,
      },
      {
        course: '69ebd16637c3a565a9e152e0', // CS301
        faculty: '69ebd16637c3a565a9e1514d', // Prof. Jose Garcia
        title: 'Arrays and Linked Lists',
        description: 'Implementation and usage of arrays and linked lists in data structures.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs301-lecture1',
        points: 0,
        dueDate: null,
      },
      {
        course: '69ebd16637c3a565a9e152e0', // CS301
        faculty: '69ebd16637c3a565a9e1514d', // Prof. Jose Garcia
        title: 'Stacks and Queues',
        description: 'Understanding stack and queue data structures and their applications.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs301-lecture2',
        points: 0,
        dueDate: null,
      },
      {
        course: '69ebd16637c3a565a9e152e1', // CS401
        faculty: '69ebd16637c3a565a9e1514e', // Mr. Ana Garcia
        title: 'Relational Database Design',
        description: 'Principles of database design, normalization, and ER diagrams.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs401-lecture1',
        points: 0,
        dueDate: null,
      },
      {
        course: '69ebd16637c3a565a9e152e1', // CS401
        faculty: '69ebd16637c3a565a9e1514e', // Mr. Ana Garcia
        title: 'SQL Fundamentals',
        description: 'Basic SQL queries, joins, and database operations.',
        type: 'lecture',
        contentUrl: 'https://example.com/cs401-lecture2',
        points: 0,
        dueDate: null,
      },
    ]

    // Insert the sample lectures
    const result = await CourseActivity.insertMany(sampleLectures)

    return Response.json({
      success: true,
      message: 'Sample lecture activities seeded successfully.',
      result: {
        insertedCount: result.length,
        lectures: sampleLectures.map((lecture, index) => ({
          ...lecture,
          _id: result[index]._id,
        })),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, message }, { status: 500 })
  }
}