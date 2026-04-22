import { connectToDatabase } from '@/lib/mongodb'
import {
  AcademicHistory,
  AdminProfile,
  AuditLog,
  CounselingRecord,
  Course,
  DisciplineRecord,
  Enrollment,
  FacultyProfile,
  MedicalRecord,
  Notification,
  StudentDocument,
  StudentOrganization,
  StudentProfile,
  SystemSetting,
  User,
} from '@/lib/system-models'

export type SeedResult = {
  users: number
  studentProfiles: number
  facultyProfiles: number
  adminProfiles: number
  courses: number
  enrollments: number
  academicHistory: number
  medicalRecords: number
  counselingRecords: number
  disciplineRecords: number
  studentDocuments: number
  studentOrganizations: number
  auditLogs: number
  systemSettings: number
}

export type BulkStudentSeedResult = {
  requested: number
  createdUsers: number
  createdProfiles: number
  totalStudents: number
  coursesEnsured: number
  coursesNewlyCreated: number
  enrollmentsCreated: number
  defaultPassword: string
  firstStudentSystemId: string | null
  lastStudentSystemId: string | null
}

async function ensureRoleNotifications() {
  const notifications = [
    {
      recipientRole: 'student' as const,
      title: 'Student portal update',
      message: 'Check your grades, attendance, and enrollment notifications in the student portal.',
      type: 'system' as const,
      link: '/',
    },
    {
      recipientRole: 'faculty' as const,
      title: 'Faculty dashboard update',
      message: 'Review your class roster, grade entry, and attendance notifications.',
      type: 'system' as const,
      link: '/',
    },
    {
      recipientRole: 'admin' as const,
      title: 'Admin console update',
      message: 'Track enrollment approvals, reports, and system activity from the admin dashboard.',
      type: 'system' as const,
      link: '/',
    },
  ]

  await Promise.all(
    notifications.map((notification) =>
      Notification.updateOne(
        {
          recipientRole: notification.recipientRole,
          title: notification.title,
        },
        {
          $setOnInsert: {
            ...notification,
            recipientId: '',
            isRead: false,
          },
        },
        { upsert: true }
      )
    )
  )
}

export async function seedSystemDatabase(): Promise<SeedResult> {
  await connectToDatabase()

  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    FacultyProfile.deleteMany({}),
    AdminProfile.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    AcademicHistory.deleteMany({}),
    MedicalRecord.deleteMany({}),
    CounselingRecord.deleteMany({}),
    DisciplineRecord.deleteMany({}),
    StudentDocument.deleteMany({}),
    StudentOrganization.deleteMany({}),
    AuditLog.deleteMany({}),
    SystemSetting.deleteMany({}),
  ])

  await ensureRoleNotifications()

  const [studentUser, facultyUser, adminUser] = await User.insertMany([
    {
      systemId: 'STU001',
      name: 'John Smith',
      email: 'student@school.com',
      passwordHash: 'student123',
      role: 'student',
      status: 'active',
      joinedAt: new Date('2024-01-10T00:00:00.000Z'),
    },
    {
      systemId: 'FAC001',
      name: 'Dr. Maria Garcia',
      email: 'faculty@school.com',
      passwordHash: 'faculty123',
      role: 'faculty',
      status: 'active',
      joinedAt: new Date('2020-08-20T00:00:00.000Z'),
    },
    {
      systemId: 'ADM001',
      name: 'Admin User',
      email: 'admin@school.com',
      passwordHash: 'admin123',
      role: 'admin',
      status: 'active',
      joinedAt: new Date('2019-06-10T00:00:00.000Z'),
    },
  ])

  await StudentProfile.insertMany([
    {
      user: studentUser._id,
      studentNumber: '2024-001',
      course: 'BS Information Technology',
      section: 'BSIT-2A',
      yearLevel: '2nd Year',
      admissionDate: new Date('2023-08-15T00:00:00.000Z'),
      gpa: 3.6,
      unitsCompleted: 60,
      unitsEnrolled: 18,
    },
  ])

  const [introProgramming, dataStructures, databaseSystems] = await Course.insertMany([
    {
      code: 'CS101',
      name: 'Introduction to Programming',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'MWF 10:00-11:00 AM',
      room: 'Science Bldg 101',
      faculty: facultyUser._id,
      capacity: 45,
      enrolledCount: 45,
    },
    {
      code: 'CS301',
      name: 'Data Structures',
      section: '02',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'TTh 2:00-3:30 PM',
      room: 'Science Bldg 205',
      faculty: facultyUser._id,
      capacity: 35,
      enrolledCount: 32,
    },
    {
      code: 'CS401',
      name: 'Database Systems',
      section: '01',
      units: 4,
      semester: 'Spring 2024',
      schedule: 'MWF 1:00-2:00 PM',
      room: 'Science Bldg 301',
      faculty: facultyUser._id,
      capacity: 30,
      enrolledCount: 28,
    },
  ])

  await FacultyProfile.insertMany([
    {
      user: facultyUser._id,
      employeeNumber: 'EMP-FAC-001',
      department: 'Computer Science',
      title: 'Associate Professor',
      office: 'Room 302, Science Building',
      coursesAssigned: [introProgramming._id, dataStructures._id, databaseSystems._id],
    },
  ])

  await AdminProfile.insertMany([
    {
      user: adminUser._id,
      employeeNumber: 'EMP-ADM-001',
      permissions: ['users.manage', 'courses.manage', 'enrollment.manage', 'reports.view'],
    },
  ])

  await Enrollment.insertMany([
    {
      student: studentUser._id,
      course: introProgramming._id,
      semester: 'Spring 2024',
      status: 'completed',
      prelim: 88,
      midterm: 90,
      final: 92,
      average: 90,
      gradeLetter: 'A',
    },
    {
      student: studentUser._id,
      course: databaseSystems._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 87,
      midterm: 89,
      final: null,
      average: null,
      gradeLetter: null,
    },
  ])

  await AcademicHistory.insertMany([
    {
      student: studentUser._id,
      type: 'milestone',
      description: 'Completed 60 Units',
      details: 'Achieved 60 total units completed milestone',
      recordedAt: new Date('2024-03-11T00:00:00.000Z'),
      createdBy: adminUser._id,
    },
    {
      student: studentUser._id,
      type: 'grade-change',
      description: 'Grade Posted - CS401',
      details: 'Final grade for Database Systems recorded as A-',
      relatedCourse: databaseSystems._id,
      recordedAt: new Date('2024-03-05T00:00:00.000Z'),
      createdBy: facultyUser._id,
    },
    {
      student: studentUser._id,
      type: 'enrollment',
      description: 'Enrolled in Spring 2024 Courses',
      details: 'Successfully enrolled in 4 courses for the Spring semester',
      recordedAt: new Date('2024-03-01T00:00:00.000Z'),
      createdBy: adminUser._id,
    },
  ])

  await MedicalRecord.insertMany([
    {
      student: studentUser._id,
      title: 'Annual Physical Clearance',
      category: 'medical-clearance',
      notes: 'Cleared for regular academic activities.',
      status: 'active',
      recordedAt: new Date('2024-02-08T00:00:00.000Z'),
    },
  ])

  await CounselingRecord.insertMany([
    {
      student: studentUser._id,
      counselor: adminUser._id,
      topic: 'Academic workload',
      summary: 'Reviewed study schedule and support options.',
      nextStep: 'Follow up after midterm week.',
      sessionDate: new Date('2024-02-20T00:00:00.000Z'),
    },
  ])

  await DisciplineRecord.insertMany([
    {
      student: studentUser._id,
      incident: 'Late submission pattern',
      severity: 'low',
      actionTaken: 'Advisory note issued',
      status: 'resolved',
      incidentDate: new Date('2024-01-25T00:00:00.000Z'),
    },
  ])

  await StudentDocument.insertMany([
    {
      student: studentUser._id,
      title: 'Enrollment Form',
      category: 'academic',
      fileName: 'enrollment-form.pdf',
      fileUrl: '/documents/enrollment-form.pdf',
      status: 'available',
    },
  ])

  await StudentOrganization.insertMany([
    {
      student: studentUser._id,
      organizationName: 'IT Student Society',
      role: 'Member',
      joinedAt: new Date('2023-09-05T00:00:00.000Z'),
      status: 'active',
    },
  ])

  await AuditLog.insertMany([
    {
      actor: adminUser._id,
      action: 'seeded_database',
      entity: 'system',
      entityId: 'bootstrap',
      details: 'Initial MongoDB system data seeded for the campus system.',
      occurredAt: new Date('2024-04-01T00:00:00.000Z'),
    },
  ])

  await SystemSetting.insertMany([
    {
      key: 'currentSemester',
      value: 'Spring 2024',
      description: 'Active semester for the campus system',
    },
    {
      key: 'registrationStatus',
      value: 'open',
      description: 'Course registration availability',
    },
    {
      key: 'academicYear',
      value: '2023-2024',
      description: 'Current academic year',
    },
  ])

  return {
    users: 3,
    studentProfiles: 1,
    facultyProfiles: 1,
    adminProfiles: 1,
    courses: 3,
    enrollments: 2,
    academicHistory: 3,
    medicalRecords: 1,
    counselingRecords: 1,
    disciplineRecords: 1,
    studentDocuments: 1,
    studentOrganizations: 1,
    auditLogs: 1,
    systemSettings: 3,
  }
}

function parseStudentSequence(systemId: string) {
  const match = systemId.match(/^STU(\d+)$/)
  return match ? Number(match[1]) : 0
}

function padStudentSequence(sequence: number, size = 4) {
  return String(sequence).padStart(size, '0')
}

type CourseSeedInput = {
  code: string
  name: string
  section: string
  units: number
  semester: string
  schedule: string
  room: string
  capacity: number
}

type StudentIdentity = {
  name: string
  email: string
}

const studentFirstNames = [
  'Aaron', 'Aiden', 'Amelia', 'Andrea', 'Benjamin', 'Bianca', 'Caleb', 'Carla', 'Daniel', 'Diana',
  'Elena', 'Ethan', 'Gabriel', 'Grace', 'Hannah', 'Isaac', 'Isabella', 'Jacob', 'Jasmine', 'Joshua',
  'Liam', 'Lina', 'Mason', 'Mia', 'Nathan', 'Nicole', 'Oliver', 'Olivia', 'Paula', 'Rafael',
  'Samuel', 'Sara', 'Sophia', 'Thomas', 'Valerie', 'Victor', 'Yasmine', 'Zoe', 'Adrian', 'Beatriz',
  'Cecilia', 'Darren', 'Emman', 'Frances', 'Jocelyn', 'Kieran', 'Leandro', 'Marisol', 'Noah', 'Quinn',
  'Rina', 'Selena', 'Tobias', 'Ulysses', 'Vivian',
]

const studentLastNames = [
  'Adams', 'Bautista', 'Carter', 'Dela Cruz', 'Diaz', 'Evans', 'Flores', 'Garcia', 'Gonzales', 'Hernandez',
  'Johnson', 'Lopez', 'Martinez', 'Mendoza', 'Nguyen', 'Ortiz', 'Perez', 'Reyes', 'Rivera', 'Santos',
  'Torres', 'Valdez', 'Villanueva', 'Wilson', 'Yap',
]

const generatedStudentIdentities: StudentIdentity[] = studentFirstNames.flatMap((firstName) =>
  studentLastNames.map((lastName) => {
    const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]+/g, '').replace(/\.+/g, '.')
    return {
      name: `${firstName} ${lastName}`,
      email: `${slug}@school.edu`,
    }
  })
).sort((left, right) => left.name.localeCompare(right.name))

const bulkStudentCourseCatalog: CourseSeedInput[] = [
  {
    code: 'CS101',
    name: 'Introduction to Programming',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'MWF 08:00-09:00 AM',
    room: 'Science Bldg 101',
    capacity: 1500,
  },
  {
    code: 'CS102',
    name: 'Web Development Fundamentals',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'TTh 09:00-10:30 AM',
    room: 'IT Lab 201',
    capacity: 1500,
  },
  {
    code: 'IT103',
    name: 'Database Concepts',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'MWF 10:00-11:00 AM',
    room: 'Science Bldg 205',
    capacity: 1500,
  },
  {
    code: 'MATH101',
    name: 'College Algebra',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'TTh 01:00-02:30 PM',
    room: 'Main 303',
    capacity: 1500,
  },
  {
    code: 'ENG101',
    name: 'Communication Skills',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'MWF 02:00-03:00 PM',
    room: 'Main 207',
    capacity: 1500,
  },
  {
    code: 'HIST101',
    name: 'Philippine History',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'TTh 03:00-04:30 PM',
    room: 'Main 105',
    capacity: 1500,
  },
]

async function ensureFacultyForBulkCourses() {
  const facultyUser = await User.findOne({ role: 'faculty' })

  if (facultyUser) {
    return facultyUser
  }

  const fallbackFaculty = await User.create({
    systemId: 'FAC-BULK-001',
    name: 'Dr. Bulk Faculty',
    email: 'bulk.faculty@school.com',
    passwordHash: 'faculty123',
    role: 'faculty',
    status: 'active',
    joinedAt: new Date(),
  })

  await FacultyProfile.create({
    user: fallbackFaculty._id,
    employeeNumber: 'EMP-FAC-BULK-001',
    department: 'General Education',
    title: 'Instructor',
    office: 'Faculty Room 1',
    coursesAssigned: [],
  })

  return fallbackFaculty
}

async function ensureBulkCoursesAndEnrollStudents(defaultSemester: string) {
  const facultyUser = await ensureFacultyForBulkCourses()

  const existingCourses = await Course.find({ semester: defaultSemester }).select('_id code section semester')
  const existingCourseKeys = new Set(existingCourses.map((course) => `${course.code}|${course.section}|${course.semester}`))

  const createdCourseDocs: Array<{ _id: unknown }> = []
  let coursesNewlyCreated = 0

  for (const courseInput of bulkStudentCourseCatalog) {
    const courseKey = `${courseInput.code}|${courseInput.section}|${courseInput.semester}`

    if (!existingCourseKeys.has(courseKey)) {
      const createdCourse = await Course.create({
        ...courseInput,
        faculty: facultyUser._id,
        enrolledCount: 0,
      })
      createdCourseDocs.push({ _id: createdCourse._id })
      coursesNewlyCreated += 1
      existingCourseKeys.add(courseKey)
    }
  }

  const allCourses = await Course.find({ semester: defaultSemester, code: { $in: bulkStudentCourseCatalog.map((course) => course.code) } }).select('_id code section semester')
  const selectedCourses = allCourses.slice(0, 4)

  const studentUsers = await User.find({ role: 'student' }).select('_id')

  function clampGrade(value: number) {
    return Math.max(65, Math.min(99, Number(value.toFixed(1))))
  }

  function calculateGradeLetter(average: number) {
    if (average >= 97) return 'A+'
    if (average >= 93) return 'A'
    if (average >= 90) return 'A-'
    if (average >= 87) return 'B+'
    if (average >= 83) return 'B'
    if (average >= 80) return 'B-'
    if (average >= 77) return 'C+'
    if (average >= 73) return 'C'
    if (average >= 70) return 'C-'
    if (average >= 68) return 'D+'
    if (average >= 65) return 'D'
    return 'F'
  }

  const enrollmentOperations = studentUsers.flatMap((student) =>
    selectedCourses.map((course, courseIndex) => {
      const studentIdString = String(student._id)
      const hashSeed = studentIdString
        .split('')
        .reduce((total, char, charIndex) => total + char.charCodeAt(0) * (charIndex + 1), 0)
      const gradeSeed = hashSeed + (courseIndex + 1) * 37
      const prelim = clampGrade(68 + (gradeSeed % 23))
      const midterm = clampGrade(70 + ((gradeSeed * 3) % 21))
      const final = clampGrade(72 + ((gradeSeed * 5) % 19))
      const average = Number(((prelim + midterm + final) / 3).toFixed(1))

      return {
        updateOne: {
          filter: {
            student: student._id,
            course: course._id,
            semester: defaultSemester,
          },
          update: {
            $set: {
              student: student._id,
              course: course._id,
              semester: defaultSemester,
              status: average >= 90 ? 'completed' : average >= 75 ? 'enrolled' : 'pending',
              prelim,
              midterm,
              final,
              average,
              gradeLetter: calculateGradeLetter(average),
            },
          },
          upsert: true,
        },
      }
    })
  )

  const enrollmentWriteResult = enrollmentOperations.length > 0
    ? await Enrollment.bulkWrite(enrollmentOperations, { ordered: false })
    : null

  for (const course of selectedCourses) {
    const enrolledCount = await Enrollment.countDocuments({ course: course._id, semester: defaultSemester })
    await Course.updateOne({ _id: course._id }, { $set: { enrolledCount } })
  }

  return {
    totalStudents: studentUsers.length,
    coursesEnsured: allCourses.length,
    coursesNewlyCreated,
    enrollmentsCreated: enrollmentWriteResult?.upsertedCount ?? 0,
  }
}

async function ensureBulkMedicalAndDisciplineRecords() {
  const studentUsers = await User.find({ role: 'student' }).select('_id systemId').lean()
  const now = Date.now()

  const medicalTemplates = [
    {
      title: 'Annual Physical Clearance',
      category: 'medical-clearance',
      notes: 'Cleared for regular academic activities after annual assessment.',
      status: 'active',
    },
    {
      title: 'Immunization Record Update',
      category: 'immunization',
      notes: 'Updated immunization record submitted to clinic office.',
      status: 'active',
    },
    {
      title: 'Clinic Follow-up',
      category: 'consultation',
      notes: 'Routine consultation completed and wellness guidance provided.',
      status: 'active',
    },
  ] as const

  const disciplineTemplates = [
    {
      incident: 'Late submission pattern',
      severity: 'low',
      actionTaken: 'Advisory note issued',
      status: 'resolved',
    },
    {
      incident: 'Class attendance warning',
      severity: 'medium',
      actionTaken: 'Parent/guardian notified and counseling referral provided',
      status: 'open',
    },
    {
      incident: 'Improper laboratory protocol',
      severity: 'medium',
      actionTaken: 'Safety briefing and written reminder completed',
      status: 'resolved',
    },
  ] as const

  const medicalOperations = studentUsers.flatMap((student, studentIndex) =>
    medicalTemplates.map((template, templateIndex) => {
      const daysAgo = ((studentIndex + 1) * (templateIndex + 3)) % 320

      return {
        updateOne: {
          filter: {
            student: student._id,
            title: template.title,
          },
          update: {
            $set: {
              student: student._id,
              title: template.title,
              category: template.category,
              notes: template.notes,
              status: template.status,
              recordedAt: new Date(now - (daysAgo + 1) * 24 * 60 * 60 * 1000),
            },
          },
          upsert: true,
        },
      }
    })
  )

  const disciplineOperations = studentUsers.flatMap((student, studentIndex) =>
    disciplineTemplates.map((template, templateIndex) => {
      const daysAgo = ((studentIndex + 2) * (templateIndex + 5)) % 280

      return {
        updateOne: {
          filter: {
            student: student._id,
            incident: template.incident,
          },
          update: {
            $set: {
              student: student._id,
              incident: template.incident,
              severity: template.severity,
              actionTaken: template.actionTaken,
              status: template.status,
              incidentDate: new Date(now - (daysAgo + 1) * 24 * 60 * 60 * 1000),
            },
          },
          upsert: true,
        },
      }
    })
  )

  if (medicalOperations.length > 0) {
    await MedicalRecord.bulkWrite(medicalOperations, { ordered: false })
  }

  if (disciplineOperations.length > 0) {
    await DisciplineRecord.bulkWrite(disciplineOperations, { ordered: false })
  }
}

export async function seedBulkStudents(options?: {
  count?: number
  defaultPassword?: string
}): Promise<BulkStudentSeedResult> {
  await connectToDatabase()

  const requested = Math.max(0, Math.min(options?.count ?? 1000, 5000))
  const defaultPassword = options?.defaultPassword?.trim() || 'student123'
  const defaultSemester = 'Fall 2026'

  const existingStudentUsers = await User.find({ role: 'student' }).sort({ systemId: 1 }).select('_id systemId').lean()
  const maxExistingSequence = existingStudentUsers.reduce((maxSequence, student) => {
    const sequence = parseStudentSequence(student.systemId ?? '')
    return sequence > maxSequence ? sequence : maxSequence
  }, 0)

  if (existingStudentUsers.length > generatedStudentIdentities.length) {
    throw new Error(`Seed identity pool is too small for ${existingStudentUsers.length} students.`)
  }

  if (existingStudentUsers.length > 0) {
    const renameOperations = existingStudentUsers.map((student, index) => {
      const identity = generatedStudentIdentities[index]

      return {
        updateOne: {
          filter: { _id: student._id },
          update: {
            $set: {
              name: identity.name,
              email: identity.email,
            },
          },
        },
      }
    })

    await User.bulkWrite(renameOperations, { ordered: true })
  }

  const usersToInsert: Array<{
    systemId: string
    name: string
    email: string
    passwordHash: string
    role: 'student'
    status: 'active'
    joinedAt: Date
  }> = []

  for (let index = 1; index <= requested; index += 1) {
    const sequence = maxExistingSequence + index
    const suffix = padStudentSequence(sequence)
    const identity = generatedStudentIdentities[existingStudentUsers.length + index - 1]

    usersToInsert.push({
      systemId: `STU${suffix}`,
      name: identity.name,
      email: identity.email,
      passwordHash: defaultPassword,
      role: 'student',
      status: 'active',
      joinedAt: new Date(),
    })
  }

  usersToInsert.sort((left, right) => left.name.localeCompare(right.name))

  const createdUsers = usersToInsert.length > 0
    ? await User.insertMany(usersToInsert, { ordered: true })
    : []

  const profilesToInsert = createdUsers.map((user, profileIndex) => {
    const yearLevelNumber = (profileIndex % 4) + 1

    return {
      user: user._id,
      studentNumber: `2026-${padStudentSequence(maxExistingSequence + profileIndex + 1, 5)}`,
      course: 'BS Information Technology',
      section: `BSIT-${yearLevelNumber}${String.fromCharCode(65 + (profileIndex % 4))}`,
      yearLevel: `${yearLevelNumber}${yearLevelNumber === 1 ? 'st' : yearLevelNumber === 2 ? 'nd' : yearLevelNumber === 3 ? 'rd' : 'th'} Year`,
      admissionDate: new Date('2025-08-01T00:00:00.000Z'),
      gpa: 0,
      unitsCompleted: 0,
      unitsEnrolled: 0,
    }
  })

  const createdProfiles = profilesToInsert.length > 0
    ? await StudentProfile.insertMany(profilesToInsert, { ordered: true })
    : []

  const enrollmentSummary = await ensureBulkCoursesAndEnrollStudents(defaultSemester)
  await ensureBulkMedicalAndDisciplineRecords()

  await ensureRoleNotifications()

  return {
    requested,
    createdUsers: createdUsers.length,
    createdProfiles: createdProfiles.length,
    totalStudents: enrollmentSummary.totalStudents,
    coursesEnsured: enrollmentSummary.coursesEnsured,
    coursesNewlyCreated: enrollmentSummary.coursesNewlyCreated,
    enrollmentsCreated: enrollmentSummary.enrollmentsCreated,
    defaultPassword,
    firstStudentSystemId: createdUsers[0]?.systemId ?? null,
    lastStudentSystemId: createdUsers[createdUsers.length - 1]?.systemId ?? null,
  }
}
