import { connectToDatabase } from '@/lib/database'
import {
  AcademicHistory,
  AdminProfile,
  AuditLog,
  Attendance,
  AttendanceLog,
  CounselingRecord,
  Course,
  CoursePrerequisite,
  DisciplineRecord,
  Enrollment,
  FacultyProfile,
  GradeScale,
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
  targetTotal: number
  createdUsers: number
  createdProfiles: number
  totalStudents: number
  coursesEnsured: number
  coursesNewlyCreated: number
  enrollmentsCreated: number
  attendanceRecordsUpserted: number
  counselingRecordsUpserted: number
  documentsUpserted: number
  organizationsUpserted: number
  academicHistoryUpserted: number
  medicalRecordsUpserted: number
  disciplineRecordsUpserted: number
  gradeScalesEnsured: number
  prerequisitesEnsured: number
  defaultPassword: string
  firstStudentSystemId: string | null
  lastStudentSystemId: string | null
}

const facultyFirstNames = [
  'Maria', 'Jose', 'Ana', 'Rafael', 'Catherine', 'Mark', 'Lea', 'Daniel', 'Grace', 'Andres',
  'Elena', 'Paolo', 'Rosa', 'Victor', 'Nina', 'Samuel', 'Theresa', 'Miguel', 'Clara', 'Hector',
]

const facultyLastNames = [
  'Garcia', 'Reyes', 'Santos', 'Cruz', 'Mendoza', 'Lopez', 'Dela Cruz', 'Ramos', 'Torres', 'Flores',
]

const facultyDepartments = [
  'General Education',
  'Information Technology',
  'Computer Science',
  'Business Administration',
  'Education',
  'Social Sciences',
  'Natural Sciences',
  'Mathematics',
  'Humanities',
  'Student Affairs',
]

function normalizeEmailHandle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
}

function padFacultySequence(value: number) {
  return String(value).padStart(3, '0')
}

function buildFacultyRoster(total = 200) {
  const roster: Array<{
    systemId: string
    name: string
    email: string
    passwordHash: string
    role: 'faculty'
    status: 'active'
    joinedAt: Date
    department: string
    title: string
    office: string
    coursesAssigned: never[]
  }> = []

  for (let index = 0; index < total; index += 1) {
    const firstName = facultyFirstNames[index % facultyFirstNames.length]
    const lastName = facultyLastNames[Math.floor(index / facultyFirstNames.length) % facultyLastNames.length]
    const prefix = index % 3 === 0 ? 'Dr.' : index % 3 === 1 ? 'Prof.' : 'Mr.'
    const name = `${prefix} ${firstName} ${lastName}`
    const emailHandle = normalizeEmailHandle(`${firstName}.${lastName}.${index + 1}`)
    const department = facultyDepartments[index % facultyDepartments.length]

    roster.push({
      systemId: `FAC${padFacultySequence(index + 1)}`,
      name,
      email: `${emailHandle}@school.com`,
      passwordHash: 'faculty123',
      role: 'faculty',
      status: 'active',
      joinedAt: new Date(2019 + (index % 5), index % 12, (index % 25) + 1),
      department,
      title: prefix === 'Dr.' ? 'Professor' : prefix === 'Prof.' ? 'Associate Professor' : 'Instructor',
      office: `Faculty Room ${String((index % 25) + 1).padStart(2, '0')}`,
      coursesAssigned: [],
    })
  }

  return roster
}

async function ensureFacultyRoster(total = 200) {
  const roster = buildFacultyRoster(total)
  const existingFacultyUsers = (await User.find({ role: 'faculty' }).sort({ systemId: 1 }).select('_id systemId email').lean()) as Array<{
    systemId: string
    email: string
  }>
  const existingSystemIds = new Set(existingFacultyUsers.map((faculty) => faculty.systemId))
  const existingEmails = new Set(existingFacultyUsers.map((faculty) => faculty.email))

  const usersToCreate = roster.filter((faculty) => !existingSystemIds.has(faculty.systemId) && !existingEmails.has(faculty.email))

  if (usersToCreate.length > 0) {
    await User.insertMany(usersToCreate, { ordered: true })
  }

  const facultyUsers = (await User.find({ role: 'faculty' }).sort({ systemId: 1 }).select('_id systemId name email role status').lean()) as Array<{
    _id: string
    systemId: string
    name: string
    email: string
    role: string
    status: string
  }>
  const facultyIds = facultyUsers.map((faculty) => faculty._id)
  const existingProfiles = (await FacultyProfile.find({ user: { $in: facultyIds } }).select('user').lean()) as Array<{
    user: string
  }>
  const profiledFacultyIds = new Set(existingProfiles.map((profile) => String(profile.user)))

  const profilesToInsert = facultyUsers
    .filter((faculty) => !profiledFacultyIds.has(String(faculty._id)))
    .map((faculty, index) => {
      const rosterEntry = roster[index % roster.length]

      return {
        user: faculty._id,
        employeeNumber: `EMP${padFacultySequence(index + 1)}`,
        department: rosterEntry.department,
        title: rosterEntry.title,
        office: rosterEntry.office,
        coursesAssigned: [],
      }
    })

  if (profilesToInsert.length > 0) {
    await FacultyProfile.insertMany(profilesToInsert, { ordered: false })
  }

  return facultyUsers
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

  const facultyUsers = await ensureFacultyRoster(200)
  const testFacultyUser = (await User.create({
    systemId: 'FACTEST001',
    name: 'Test Faculty',
    email: 'faculty.test@school.com',
    passwordHash: 'faculty123',
    role: 'faculty',
    status: 'active',
    joinedAt: new Date('2023-01-01T00:00:00.000Z'),
  })) as { _id: string }

  await FacultyProfile.create({
    user: testFacultyUser._id,
    employeeNumber: 'EMP-TEST-001',
    department: 'Information Technology',
    title: 'Instructor',
    office: 'Test Room 1',
    coursesAssigned: [],
  })

  const firstFaculty = facultyUsers[0]
  const secondFaculty = facultyUsers[1] ?? firstFaculty
  const thirdFaculty = facultyUsers[2] ?? firstFaculty

  const [studentUser, studentUserTwo, studentUserThree, adminUser] = await User.insertMany([
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
      systemId: 'STU002',
      name: 'Jane Doe',
      email: 'student2@school.com',
      passwordHash: 'student123',
      role: 'student',
      status: 'active',
      joinedAt: new Date('2024-02-01T00:00:00.000Z'),
    },
    {
      systemId: 'STU003',
      name: 'Alex Cruz',
      email: 'student3@school.com',
      passwordHash: 'student123',
      role: 'student',
      status: 'active',
      joinedAt: new Date('2024-03-01T00:00:00.000Z'),
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
      unitsEnrolled: 22,
    },
    {
      user: studentUserTwo._id,
      studentNumber: '2024-002',
      course: 'BS Information Technology',
      section: 'BSIT-2B',
      yearLevel: '2nd Year',
      admissionDate: new Date('2024-01-15T00:00:00.000Z'),
      gpa: 3.2,
      unitsCompleted: 45,
      unitsEnrolled: 18,
    },
    {
      user: studentUserThree._id,
      studentNumber: '2024-003',
      course: 'BS Computer Science',
      section: 'BSCS-1A',
      yearLevel: '1st Year',
      admissionDate: new Date('2024-01-15T00:00:00.000Z'),
      gpa: 3.8,
      unitsCompleted: 30,
      unitsEnrolled: 18,
    },
  ])

  const [introProgramming, dataStructures, databaseSystems, softwareEngineering, computerNetworks, operatingSystems, technicalWriting, discreteMathematics] = await Course.insertMany([
    {
      code: 'CS101',
      name: 'Introduction to Programming',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'MWF 10:00-11:00 AM',
      room: 'Science Bldg 101',
      faculty: firstFaculty?._id,
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
      faculty: secondFaculty?._id,
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
      faculty: thirdFaculty?._id,
      capacity: 30,
      enrolledCount: 28,
    },
    {
      code: 'CS201',
      name: 'Software Engineering',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'TTh 9:00-10:30 AM',
      room: 'Science Bldg 110',
      faculty: testFacultyUser._id,
      capacity: 40,
      enrolledCount: 1,
    },
    {
      code: 'CS402',
      name: 'Computer Networks',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'MWF 3:00-4:00 PM',
      room: 'Science Bldg 302',
      faculty: firstFaculty?._id,
      capacity: 35,
      enrolledCount: 1,
    },
    {
      code: 'CS403',
      name: 'Operating Systems',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'TTh 10:30-12:00 PM',
      room: 'Science Bldg 303',
      faculty: secondFaculty?._id,
      capacity: 35,
      enrolledCount: 1,
    },
    {
      code: 'ENG201',
      name: 'Technical Writing',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'MWF 4:00-5:00 PM',
      room: 'Main 210',
      faculty: thirdFaculty?._id,
      capacity: 40,
      enrolledCount: 1,
    },
    {
      code: 'MATH201',
      name: 'Discrete Mathematics',
      section: '01',
      units: 3,
      semester: 'Spring 2024',
      schedule: 'TTh 4:30-6:00 PM',
      room: 'Main 312',
      faculty: firstFaculty?._id,
      capacity: 40,
      enrolledCount: 1,
    },
  ])

  if (firstFaculty?._id) {
    await FacultyProfile.updateOne(
      { user: firstFaculty._id },
      {
        $set: {
          coursesAssigned: [introProgramming._id, dataStructures._id, databaseSystems._id, computerNetworks._id],
        },
      }
    )
  }

  if (testFacultyUser?._id) {
    await FacultyProfile.updateOne(
      { user: testFacultyUser._id },
      {
        $set: {
          coursesAssigned: [softwareEngineering._id, operatingSystems._id],
        },
      }
    )
  }

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
    {
      student: studentUser._id,
      course: dataStructures._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 88,
      midterm: 90,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUser._id,
      course: softwareEngineering._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 89,
      midterm: 91,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUser._id,
      course: computerNetworks._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 86,
      midterm: 88,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUser._id,
      course: operatingSystems._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 88,
      midterm: 90,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUser._id,
      course: technicalWriting._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 90,
      midterm: 92,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUser._id,
      course: discreteMathematics._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 87,
      midterm: 89,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUserTwo._id,
      course: softwareEngineering._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 85,
      midterm: 88,
      final: null,
      average: null,
      gradeLetter: null,
    },
    {
      student: studentUserThree._id,
      course: dataStructures._id,
      semester: 'Spring 2024',
      status: 'enrolled',
      prelim: 90,
      midterm: 92,
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
      createdBy: firstFaculty?._id,
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
      counselor: secondFaculty?._id,
      topic: 'Academic workload',
      summary: 'Reviewed study schedule and support options.',
      nextStep: 'Follow up after midterm week.',
      sessionDate: new Date('2024-02-20T00:00:00.000Z'),
      status: 'closed',
      reply: 'Keep monitoring your workload and submit the registration form before the deadline.',
      replyBy: secondFaculty?._id,
      replyAt: new Date('2024-02-21T00:00:00.000Z'),
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
      details: 'Initial Firebase system data seeded for the campus system.',
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
    users: facultyUsers.length + 5,
    studentProfiles: 3,
    facultyProfiles: facultyUsers.length + 1,
    adminProfiles: 1,
    courses: 8,
    enrollments: 10,
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
    capacity: 50,
  },
  {
    code: 'CS102',
    name: 'Web Development Fundamentals',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'TTh 09:00-10:30 AM',
    room: 'IT Lab 201',
    capacity: 50,
  },
  {
    code: 'IT103',
    name: 'Database Concepts',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'MWF 10:00-11:00 AM',
    room: 'Science Bldg 205',
    capacity: 50,
  },
  {
    code: 'MATH101',
    name: 'College Algebra',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'TTh 01:00-02:30 PM',
    room: 'Main 303',
    capacity: 50,
  },
  {
    code: 'ENG101',
    name: 'Communication Skills',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'MWF 02:00-03:00 PM',
    room: 'Main 207',
    capacity: 50,
  },
  {
    code: 'HIST101',
    name: 'Philippine History',
    section: '01',
    units: 3,
    semester: 'Fall 2026',
    schedule: 'TTh 03:00-04:30 PM',
    room: 'Main 105',
    capacity: 50,
  },
]

async function ensureFacultyForBulkCourses() {
  const facultyUsers = await ensureFacultyRoster(200)

  if (facultyUsers.length > 0) {
    return facultyUsers[0]
  }

  const fallbackFaculty = (await User.create({
    systemId: 'FAC-BULK-001',
    name: 'Dr. Bulk Faculty',
    email: 'bulk.faculty@school.com',
    passwordHash: 'faculty123',
    role: 'faculty',
    status: 'active',
    joinedAt: new Date(),
  })) as { _id: string }

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
  const facultyUsers = await ensureFacultyRoster(200)
  const facultyPool = facultyUsers.length > 0 ? facultyUsers : [await ensureFacultyForBulkCourses()]

  const existingCourses = (await Course.find({ semester: defaultSemester }).select('_id code section semester')) as Array<{
    code: string
    section: string
    semester: string
  }>
  const existingCourseKeys = new Set(existingCourses.map((course) => `${course.code}|${course.section}|${course.semester}`))

  const createdCourseDocs: Array<{ _id: unknown }> = []
  let coursesNewlyCreated = 0

  for (const courseInput of bulkStudentCourseCatalog) {
    const courseKey = `${courseInput.code}|${courseInput.section}|${courseInput.semester}`
    const assignedFaculty = facultyPool[coursesNewlyCreated % facultyPool.length]

    if (!existingCourseKeys.has(courseKey)) {
      const createdCourse = (await Course.create({
        ...courseInput,
        faculty: assignedFaculty._id,
        enrolledCount: 0,
      })) as { _id: string }
      createdCourseDocs.push({ _id: createdCourse._id })
      coursesNewlyCreated += 1
      existingCourseKeys.add(courseKey)
    }
  }

  const allCourses = (await Course.find({ semester: defaultSemester, code: { $in: bulkStudentCourseCatalog.map((course) => course.code) } }).select('_id code section semester')) as Array<{
    _id: string
    code: string
    section: string
    semester: string
  }>
  const selectedCourses = allCourses.slice(0, 4)

  const studentUsers = (await User.find({ role: 'student' }).select('_id')) as Array<{ _id: string }>

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

      const status = average >= 90 ? 'completed' as const : average >= 75 ? 'enrolled' as const : 'pending' as const

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
              status,
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
    enrollmentsCreated: enrollmentOperations.length,
  }
}

async function ensureBulkMedicalAndDisciplineRecords() {
  const studentUsers = (await User.find({ role: 'student' }).select('_id systemId').lean()) as Array<{
    _id: string
    systemId: string
  }>
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

  return {
    medicalUpserted: medicalOperations.length,
    disciplineUpserted: disciplineOperations.length,
  }
}

async function ensureGradeScalesAndPrerequisites(defaultSemester: string) {
  const gradeScaleSeed = [
    { institution: 'Campus System', letterGrade: 'A', minScore: 90, maxScore: 100, pointValue: 4, description: 'Excellent' },
    { institution: 'Campus System', letterGrade: 'B', minScore: 80, maxScore: 89.99, pointValue: 3, description: 'Very Good' },
    { institution: 'Campus System', letterGrade: 'C', minScore: 70, maxScore: 79.99, pointValue: 2, description: 'Good' },
    { institution: 'Campus System', letterGrade: 'D', minScore: 60, maxScore: 69.99, pointValue: 1, description: 'Passing' },
    { institution: 'Campus System', letterGrade: 'F', minScore: 0, maxScore: 59.99, pointValue: 0, description: 'Failing' },
  ]

  const gradeScaleOperations = gradeScaleSeed.map((entry) => ({
    updateOne: {
      filter: {
        institution: entry.institution,
        letterGrade: entry.letterGrade,
      },
      update: {
        $set: entry,
      },
      upsert: true,
    },
  }))

  if (gradeScaleOperations.length > 0) {
    await GradeScale.bulkWrite(gradeScaleOperations, { ordered: false })
  }

  const prerequisitePairs = [
    { courseCode: 'CS102', prerequisiteCode: 'CS101', minGrade: 'D' },
    { courseCode: 'IT103', prerequisiteCode: 'CS101', minGrade: 'D' },
  ]

  const prerequisiteCourses = (await Course.find({
    semester: defaultSemester,
    code: { $in: Array.from(new Set(prerequisitePairs.flatMap((item) => [item.courseCode, item.prerequisiteCode]))) },
  }).select('_id code')) as Array<{
    _id: string
    code: string
  }>

  const courseByCode = new Map(prerequisiteCourses.map((course) => [course.code, course]))
  const prerequisiteOperations = prerequisitePairs
    .map((pair) => {
      const targetCourse = courseByCode.get(pair.courseCode)
      const prerequisiteCourse = courseByCode.get(pair.prerequisiteCode)

      if (!targetCourse || !prerequisiteCourse) {
        return null
      }

      return {
        updateOne: {
          filter: {
            course: targetCourse._id,
            prerequisiteCourse: prerequisiteCourse._id,
          },
          update: {
            $set: {
              course: targetCourse._id,
              prerequisiteCourse: prerequisiteCourse._id,
              minGrade: pair.minGrade,
            },
          },
          upsert: true,
        },
      }
    })
    .filter(Boolean) as Array<Record<string, unknown>>

  if (prerequisiteOperations.length > 0) {
    await CoursePrerequisite.bulkWrite(prerequisiteOperations as any, { ordered: false })
  }

  return {
    gradeScalesEnsured: gradeScaleOperations.length,
    prerequisitesEnsured: prerequisiteOperations.length,
  }
}

async function ensureBulkEnhancementRecords(defaultSemester: string) {
  const [studentUsers, facultyUsers, adminUser] = await Promise.all([
    User.find({ role: 'student' }).select('_id systemId name').lean(),
    User.find({ role: 'faculty' }).sort({ systemId: 1 }).select('_id').lean(),
    User.findOne({ role: 'admin' }).select('_id').lean(),
  ])

  if (studentUsers.length === 0) {
    return {
      attendanceRecordsUpserted: 0,
      counselingRecordsUpserted: 0,
      documentsUpserted: 0,
      organizationsUpserted: 0,
      academicHistoryUpserted: 0,
    }
  }

  const counselorPool = facultyUsers.length > 0 ? facultyUsers : adminUser?._id ? [adminUser] : []

  const enrollments = (await Enrollment.find({
    semester: defaultSemester,
    student: { $in: studentUsers.map((student: { _id: string }) => student._id) },
  })
    .select('_id student course semester status average gradeLetter')
    .populate('course', 'code name')) as Array<{
    _id: string
    student: string
    course: { _id?: string } | string
    semester: string
    status: string
    average?: number | null
    gradeLetter?: string | null
  }>

  const enrollmentByStudent = new Map<string, any[]>()
  for (const enrollment of enrollments) {
    const studentId = String(enrollment.student)
    if (!enrollmentByStudent.has(studentId)) {
      enrollmentByStudent.set(studentId, [])
    }
    enrollmentByStudent.get(studentId)?.push(enrollment)
  }

  const now = Date.now()

  const attendanceOperations = enrollments.map((enrollment, index) => {
    const averageValue = typeof enrollment.average === 'number' ? enrollment.average : 78
    const totalSessions = 28 + (index % 6)
    const percentage = Math.max(65, Math.min(98, Math.round(averageValue)))
    const sessionAttended = Math.min(totalSessions, Math.max(0, Math.round((percentage / 100) * totalSessions)))

    return {
      updateOne: {
        filter: {
          student: enrollment.student,
          course: typeof enrollment.course === 'string' ? enrollment.course : enrollment.course?._id ?? '',
          semester: enrollment.semester,
        },
        update: {
          $set: {
            student: enrollment.student,
            course: typeof enrollment.course === 'string' ? enrollment.course : enrollment.course?._id ?? '',
            semester: enrollment.semester,
            totalSessions,
            sessionAttended,
            attendancePercentage: Number(((sessionAttended / totalSessions) * 100).toFixed(2)),
            lastUpdated: new Date(now - (index % 14) * 24 * 60 * 60 * 1000),
          },
        },
        upsert: true,
      },
    }
  })

  if (attendanceOperations.length > 0) {
    await Attendance.bulkWrite(attendanceOperations, { ordered: false })
  }

  const attendanceRecords = await Attendance.find({
    semester: defaultSemester,
    student: { $in: studentUsers.map((student: { _id: string }) => student._id) },
  }).select('_id student totalSessions sessionAttended') as Array<{
    _id: string
    student: string
    totalSessions?: number
    sessionAttended?: number
  }>

  const attendanceLogOperations = attendanceRecords.flatMap((record, index) => {
    const baseDate = now - ((index % 21) + 1) * 24 * 60 * 60 * 1000

    return [
      {
        updateOne: {
          filter: {
            attendance: record._id,
            sessionDate: new Date(baseDate),
          },
          update: {
            $set: {
              attendance: record._id,
              sessionDate: new Date(baseDate),
              status: 'present' as const,
              remarks: 'Auto-seeded present session.',
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: {
            attendance: record._id,
            sessionDate: new Date(baseDate - 2 * 24 * 60 * 60 * 1000),
          },
          update: {
            $set: {
              attendance: record._id,
              sessionDate: new Date(baseDate - 2 * 24 * 60 * 60 * 1000),
              status: (index % 5 === 0 ? 'absent' : 'late') as 'absent' | 'late',
              remarks: 'Auto-seeded attendance variance.',
            },
          },
          upsert: true,
        },
      },
    ]
  })

  if (attendanceLogOperations.length > 0) {
    await AttendanceLog.bulkWrite(attendanceLogOperations, { ordered: false })
  }

  const counselingOperations = counselorPool.length > 0
    ? studentUsers.map((student: { _id: string }, index: number) => {
        const counselor = counselorPool[index % counselorPool.length]

        return {
          updateOne: {
            filter: {
              student: student._id,
              topic: 'Academic planning',
            },
            update: {
              $set: {
                student: student._id,
                counselor: counselor._id,
                topic: 'Academic planning',
                summary: 'Reviewed semester workload, attendance trend, and study cadence.',
                nextStep: 'Follow up after the next major exam cycle.',
                sessionDate: new Date(now - ((index % 90) + 10) * 24 * 60 * 60 * 1000),
                status: 'open',
                reply: index % 6 === 0 ? 'Please visit the guidance office after your next class.' : '',
                replyBy: index % 6 === 0 ? counselor._id : undefined,
                replyAt: index % 6 === 0 ? new Date(now - ((index % 60) + 5) * 24 * 60 * 60 * 1000) : undefined,
              },
            },
            upsert: true,
          },
        }
      })
    : []

  if (counselingOperations.length > 0) {
    await CounselingRecord.bulkWrite(counselingOperations, { ordered: false })
  }

  const counselingNotificationOperations = counselorPool.length > 0
    ? studentUsers.map((student: { _id: string; systemId?: string; name?: string }, index: number) => {
        const counselor = counselorPool[index % counselorPool.length]

        return {
          updateOne: {
            filter: {
              recipientRole: 'faculty' as const,
              recipientId: String(counselor._id),
              title: `Counseling request from ${student.systemId ?? 'student'}`,
            },
            update: {
              $set: {
                recipientRole: 'faculty' as const,
                recipientId: String(counselor._id),
                title: `Counseling request from ${student.systemId ?? 'student'}`,
                message: `A counseling thread was created for ${student.name ?? 'a student'} and assigned to you.`,
                type: 'counseling' as const,
                link: '/dashboard',
                isRead: false,
              },
            },
            upsert: true,
          },
        }
      })
    : []

  if (counselingNotificationOperations.length > 0) {
    await Notification.bulkWrite(counselingNotificationOperations, { ordered: false })
  }

  const documentOperations = studentUsers.flatMap((student: { _id: string; systemId?: string }, index: number) => {
    const suffix = String(student.systemId ?? '').toLowerCase()

    return [
      {
        updateOne: {
          filter: {
            student: student._id,
            title: 'Official Study Load',
          },
          update: {
            $set: {
              student: student._id,
              title: 'Official Study Load',
              category: 'Transcript',
              fileName: `${suffix}-study-load.pdf`,
              fileUrl: `/documents/${suffix}-study-load.pdf`,
              status: 'available',
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: {
            student: student._id,
            title: 'Registration Form',
          },
          update: {
            $set: {
              student: student._id,
              title: 'Registration Form',
              category: 'Certificate',
              fileName: `${suffix}-registration.pdf`,
              fileUrl: `/documents/${suffix}-registration.pdf`,
              status: index % 7 === 0 ? 'pending' : 'available',
            },
          },
          upsert: true,
        },
      },
    ]
  })

  if (documentOperations.length > 0) {
    await StudentDocument.bulkWrite(documentOperations, { ordered: false })
  }

  const organizationNames = ['IT Society', 'Code Collective', 'Campus Peer Mentors', 'Robotics Guild']
  const organizationRoles = ['Member', 'Officer', 'Secretary', 'Treasurer']

  const organizationOperations = studentUsers.map((student: { _id: string }, index: number) => ({
    updateOne: {
      filter: {
        student: student._id,
        organizationName: organizationNames[index % organizationNames.length],
      },
      update: {
        $set: {
          student: student._id,
          organizationName: organizationNames[index % organizationNames.length],
          role: organizationRoles[index % organizationRoles.length],
          joinedAt: new Date(now - ((index % 180) + 30) * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      },
      upsert: true,
    },
  }))

  if (organizationOperations.length > 0) {
    await StudentOrganization.bulkWrite(organizationOperations, { ordered: false })
  }

  const historyOperations = studentUsers.flatMap((student: { _id: string }, index: number) => {
    const studentEnrollments = enrollmentByStudent.get(String(student._id)) ?? []
    const topEnrollment = studentEnrollments[0]
    const counselor = counselorPool.length > 0 ? counselorPool[index % counselorPool.length] : undefined

    return [
      {
        updateOne: {
          filter: {
            student: student._id,
            type: 'enrollment' as const,
            description: `Fall 2026 enrollment processed`,
          },
          update: {
            $set: {
              student: student._id,
              type: 'enrollment' as const,
              description: 'Fall 2026 enrollment processed',
              details: `Student enrolled in ${studentEnrollments.length} courses for ${defaultSemester}.`,
              recordedAt: new Date(now - ((index % 40) + 5) * 24 * 60 * 60 * 1000),
              createdBy: counselor?._id,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: {
            student: student._id,
            type: 'milestone' as const,
            description: `Attendance baseline established`,
          },
          update: {
            $set: {
              student: student._id,
              type: 'milestone' as const,
              description: 'Attendance baseline established',
              details: 'Attendance tracking initialized for current semester classes.',
              relatedCourse: topEnrollment?.course?._id ?? topEnrollment?.course,
              recordedAt: new Date(now - ((index % 30) + 3) * 24 * 60 * 60 * 1000),
              createdBy: counselor?._id,
            },
          },
          upsert: true,
        },
      },
    ]
  })

  if (historyOperations.length > 0) {
    await AcademicHistory.bulkWrite(historyOperations, { ordered: false })
  }

  const notificationOperations = studentUsers.map((student: { _id: string }) => ({
    updateOne: {
      filter: {
        recipientRole: 'student' as const,
        recipientId: String(student._id),
        title: 'Semester data sync complete',
      },
      update: {
        $set: {
          recipientRole: 'student' as const,
          recipientId: String(student._id),
          title: 'Semester data sync complete',
          message: 'Your enrollments, attendance, documents, and records are fully connected for the current semester.',
          type: 'system' as const,
          link: '/',
          isRead: false,
        },
      },
      upsert: true,
    },
  }))

  if (notificationOperations.length > 0) {
    await Notification.bulkWrite(notificationOperations, { ordered: false })
  }

  return {
    attendanceRecordsUpserted: attendanceOperations.length,
    counselingRecordsUpserted: counselingOperations.length,
    documentsUpserted: documentOperations.length,
    organizationsUpserted: organizationOperations.length,
    academicHistoryUpserted: historyOperations.length,
  }
}

async function pruneStudentPopulation(targetTotal: number) {
  const currentStudents = (await User.find({ role: 'student' }).sort({ systemId: 1 }).select('_id systemId').lean()) as Array<{
    _id: string
    systemId: string
  }>

  if (targetTotal <= 0 || currentStudents.length <= targetTotal) {
    return { removed: 0 }
  }

  const overflowStudents = currentStudents.slice(targetTotal)
  const overflowIds = overflowStudents.map((student) => student._id)
  const overflowIdStrings = overflowStudents.map((student) => String(student._id))

  const attendanceRecords = (await Attendance.find({ student: { $in: overflowIds } }).select('_id').lean()) as Array<{
    _id: string
  }>
  const attendanceIds = attendanceRecords.map((record) => record._id)

  await Promise.all([
    StudentProfile.deleteMany({ user: { $in: overflowIds } }),
    Enrollment.deleteMany({ student: { $in: overflowIds } }),
    MedicalRecord.deleteMany({ student: { $in: overflowIds } }),
    CounselingRecord.deleteMany({ student: { $in: overflowIds } }),
    DisciplineRecord.deleteMany({ student: { $in: overflowIds } }),
    StudentDocument.deleteMany({ student: { $in: overflowIds } }),
    StudentOrganization.deleteMany({ student: { $in: overflowIds } }),
    AcademicHistory.deleteMany({ student: { $in: overflowIds } }),
    Attendance.deleteMany({ student: { $in: overflowIds } }),
    Notification.deleteMany({ recipientRole: 'student', recipientId: { $in: overflowIdStrings } }),
  ])

  if (attendanceIds.length > 0) {
    await AttendanceLog.deleteMany({ attendance: { $in: attendanceIds } })
  }

  await User.deleteMany({ _id: { $in: overflowIds } })

  return {
    removed: overflowStudents.length,
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

  let existingStudentUsers = (await User.find({ role: 'student' }).sort({ systemId: 1 }).select('_id systemId').lean()) as Array<{
    _id: string
    systemId: string
  }>
  const maxExistingSequence = existingStudentUsers.reduce((maxSequence, student) => {
    const sequence = parseStudentSequence(student.systemId ?? '')
    return sequence > maxSequence ? sequence : maxSequence
  }, 0)

  if (existingStudentUsers.length > generatedStudentIdentities.length) {
    throw new Error(`Seed identity pool is too small for ${existingStudentUsers.length} students.`)
  }

  const targetTotal = requested === 0 ? existingStudentUsers.length : requested

  if (targetTotal > generatedStudentIdentities.length) {
    throw new Error(`Seed identity pool is too small for target total ${targetTotal} students.`)
  }

  const studentsToCreate = Math.max(0, targetTotal - existingStudentUsers.length)

  if (requested > 0 && existingStudentUsers.length > targetTotal) {
    await pruneStudentPopulation(targetTotal)
    existingStudentUsers = await User.find({ role: 'student' }).sort({ systemId: 1 }).select('_id systemId').lean()
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

  for (let index = 1; index <= studentsToCreate; index += 1) {
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

  const allStudentUsers = (await User.find({ role: 'student' }).select('_id systemId').lean()) as Array<{
    _id: string
    systemId: string
  }>
  const studentUserIds = allStudentUsers.map((student) => student._id)

  await StudentProfile.deleteMany({ user: { $nin: studentUserIds } })

  const existingProfiles = (await StudentProfile.find({ user: { $in: studentUserIds } }).select('user studentNumber').lean()) as Array<{
    user: string
    studentNumber?: string | null
  }>
  const profiledUserIds = new Set(existingProfiles.map((profile) => String(profile.user)))
  const existingStudentNumbers = new Set(existingProfiles.map((profile) => String(profile.studentNumber ?? '').trim()).filter(Boolean))

  let profileNumberCursor = 1
  const getNextStudentNumber = () => {
    while (existingStudentNumbers.has(`2026-${padStudentSequence(profileNumberCursor, 5)}`)) {
      profileNumberCursor += 1
    }

    const nextNumber = `2026-${padStudentSequence(profileNumberCursor, 5)}`
    existingStudentNumbers.add(nextNumber)
    profileNumberCursor += 1
    return nextNumber
  }

  const missingProfileUsers = allStudentUsers.filter((student, index) => !profiledUserIds.has(String(student._id)))
  const missingProfiles = missingProfileUsers.map((student, profileIndex) => {
    const yearLevelNumber = ((existingProfiles.length + profileIndex) % 4) + 1

    return {
      user: student._id,
      studentNumber: getNextStudentNumber(),
      course: 'BS Information Technology',
      section: `BSIT-${yearLevelNumber}${String.fromCharCode(65 + ((existingProfiles.length + profileIndex) % 4))}`,
      yearLevel: `${yearLevelNumber}${yearLevelNumber === 1 ? 'st' : yearLevelNumber === 2 ? 'nd' : yearLevelNumber === 3 ? 'rd' : 'th'} Year`,
      admissionDate: new Date('2025-08-01T00:00:00.000Z'),
      gpa: 0,
      unitsCompleted: 0,
      unitsEnrolled: 0,
    }
  })

  if (missingProfiles.length > 0) {
    await StudentProfile.insertMany(missingProfiles, { ordered: true })
  }

  const enrollmentSummary = await ensureBulkCoursesAndEnrollStudents(defaultSemester)
  const medicalAndDisciplineSummary = await ensureBulkMedicalAndDisciplineRecords()
  const enhancementSummary = await ensureBulkEnhancementRecords(defaultSemester)
  const gradingAndPrerequisiteSummary = await ensureGradeScalesAndPrerequisites(defaultSemester)

  await ensureRoleNotifications()

  return {
    requested,
    targetTotal,
    createdUsers: createdUsers.length,
    createdProfiles: createdProfiles.length + missingProfiles.length,
    totalStudents: enrollmentSummary.totalStudents,
    coursesEnsured: enrollmentSummary.coursesEnsured,
    coursesNewlyCreated: enrollmentSummary.coursesNewlyCreated,
    enrollmentsCreated: enrollmentSummary.enrollmentsCreated,
    attendanceRecordsUpserted: enhancementSummary.attendanceRecordsUpserted,
    counselingRecordsUpserted: enhancementSummary.counselingRecordsUpserted,
    documentsUpserted: enhancementSummary.documentsUpserted,
    organizationsUpserted: enhancementSummary.organizationsUpserted,
    academicHistoryUpserted: enhancementSummary.academicHistoryUpserted,
    medicalRecordsUpserted: medicalAndDisciplineSummary.medicalUpserted,
    disciplineRecordsUpserted: medicalAndDisciplineSummary.disciplineUpserted,
    gradeScalesEnsured: gradingAndPrerequisiteSummary.gradeScalesEnsured,
    prerequisitesEnsured: gradingAndPrerequisiteSummary.prerequisitesEnsured,
    defaultPassword,
    firstStudentSystemId: createdUsers[0]?.systemId ?? null,
    lastStudentSystemId: createdUsers[createdUsers.length - 1]?.systemId ?? null,
  }
}
