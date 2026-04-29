import mongoose, { type InferSchemaType, type Model, Schema } from 'mongoose'

const userSchema = new Schema(
  {
    systemId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    joinedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
)

export type UserRecord = InferSchemaType<typeof userSchema>
const ExistingUser = mongoose.models.User as Model<UserRecord> | undefined
export const User = ExistingUser ?? mongoose.model<UserRecord>('User', userSchema)

const studentProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentNumber: { type: String, required: true, unique: true, trim: true },
    course: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    yearLevel: { type: String, required: true, trim: true },
    admissionDate: { type: Date, required: true },
    gpa: { type: Number, default: 0 },
    unitsCompleted: { type: Number, default: 0 },
    unitsEnrolled: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export type StudentProfileRecord = InferSchemaType<typeof studentProfileSchema>
const ExistingStudentProfile = mongoose.models.StudentProfile as Model<StudentProfileRecord> | undefined
export const StudentProfile = ExistingStudentProfile ?? mongoose.model<StudentProfileRecord>('StudentProfile', studentProfileSchema)

const facultyProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeNumber: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    office: { type: String, required: true, trim: true },
    coursesAssigned: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
)

export type FacultyProfileRecord = InferSchemaType<typeof facultyProfileSchema>
const ExistingFacultyProfile = mongoose.models.FacultyProfile as Model<FacultyProfileRecord> | undefined
export const FacultyProfile = ExistingFacultyProfile ?? mongoose.model<FacultyProfileRecord>('FacultyProfile', facultyProfileSchema)

const adminProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeNumber: { type: String, required: true, unique: true, trim: true },
    permissions: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

export type AdminProfileRecord = InferSchemaType<typeof adminProfileSchema>
const ExistingAdminProfile = mongoose.models.AdminProfile as Model<AdminProfileRecord> | undefined
export const AdminProfile = ExistingAdminProfile ?? mongoose.model<AdminProfileRecord>('AdminProfile', adminProfileSchema)

const courseSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    units: { type: Number, required: true },
    semester: { type: String, required: true, trim: true },
    schedule: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    faculty: { type: Schema.Types.ObjectId, ref: 'User' },
    capacity: {
      type: Number,
      default: 50,
      min: [1, 'Course capacity must be at least 1.'],
      max: [50, 'Course capacity cannot exceed 50 students.'],
    },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

courseSchema.index({ code: 1, section: 1, semester: 1 }, { unique: true })

export type CourseRecord = InferSchemaType<typeof courseSchema>
const ExistingCourse = mongoose.models.Course as Model<CourseRecord> | undefined
export const Course = ExistingCourse ?? mongoose.model<CourseRecord>('Course', courseSchema)

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped', 'pending'],
      default: 'enrolled',
    },
    prelim: { type: Number, default: null },
    midterm: { type: Number, default: null },
    final: { type: Number, default: null },
    average: { type: Number, default: null },
    gradeLetter: { type: String, default: null },
  },
  { timestamps: true }
)

enrollmentSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true })

export type EnrollmentRecord = InferSchemaType<typeof enrollmentSchema>
const ExistingEnrollment = mongoose.models.Enrollment as Model<EnrollmentRecord> | undefined
export const Enrollment = ExistingEnrollment ?? mongoose.model<EnrollmentRecord>('Enrollment', enrollmentSchema)

const notificationSchema = new Schema(
  {
    recipientId: { type: String, trim: true, index: true },
    recipientRole: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['system', 'enrollment', 'academic', 'attendance', 'discipline', 'counseling', 'organization'],
      default: 'system',
    },
    link: { type: String, default: '', trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

notificationSchema.index({ recipientRole: 1, recipientId: 1, isRead: 1, createdAt: -1 })

export type NotificationRecord = InferSchemaType<typeof notificationSchema>
const ExistingNotification = mongoose.models.Notification as Model<NotificationRecord> | undefined
export const Notification = ExistingNotification ?? mongoose.model<NotificationRecord>('Notification', notificationSchema)

const academicHistorySchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['enrollment', 'grade-change', 'status-change', 'milestone'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    relatedCourse: { type: Schema.Types.ObjectId, ref: 'Course' },
    recordedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

export type AcademicHistoryRecord = InferSchemaType<typeof academicHistorySchema>
const ExistingAcademicHistory = mongoose.models.AcademicHistory as Model<AcademicHistoryRecord> | undefined
export const AcademicHistory = ExistingAcademicHistory ?? mongoose.model<AcademicHistoryRecord>('AcademicHistory', academicHistorySchema)

const medicalRecordSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    notes: { type: String, required: true, trim: true },
    status: { type: String, default: 'active' },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export type MedicalRecord = InferSchemaType<typeof medicalRecordSchema>
const ExistingMedicalRecord = mongoose.models.MedicalRecord as Model<MedicalRecord> | undefined
export const MedicalRecord = ExistingMedicalRecord ?? mongoose.model<MedicalRecord>('MedicalRecord', medicalRecordSchema)

const counselingRecordSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    counselor: { type: Schema.Types.ObjectId, ref: 'User' },
    topic: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    nextStep: { type: String, required: true, trim: true },
    sessionDate: { type: Date, required: true },
    status: { type: String, default: 'open', trim: true },
    reply: { type: String, default: '', trim: true },
    replyBy: { type: Schema.Types.ObjectId, ref: 'User' },
    replyAt: { type: Date },
  },
  { timestamps: true }
)

export type CounselingRecord = InferSchemaType<typeof counselingRecordSchema>
const ExistingCounselingRecord = mongoose.models.CounselingRecord as Model<CounselingRecord> | undefined
export const CounselingRecord = ExistingCounselingRecord ?? mongoose.model<CounselingRecord>('CounselingRecord', counselingRecordSchema)

const disciplineRecordSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    incident: { type: String, required: true, trim: true },
    severity: { type: String, required: true, trim: true },
    actionTaken: { type: String, required: true, trim: true },
    status: { type: String, default: 'open' },
    incidentDate: { type: Date, required: true },
  },
  { timestamps: true }
)

export type DisciplineRecord = InferSchemaType<typeof disciplineRecordSchema>
const ExistingDisciplineRecord = mongoose.models.DisciplineRecord as Model<DisciplineRecord> | undefined
export const DisciplineRecord = ExistingDisciplineRecord ?? mongoose.model<DisciplineRecord>('DisciplineRecord', disciplineRecordSchema)

const studentDocumentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    status: { type: String, default: 'available' },
  },
  { timestamps: true }
)

export type StudentDocumentRecord = InferSchemaType<typeof studentDocumentSchema>
const ExistingStudentDocument = mongoose.models.StudentDocument as Model<StudentDocumentRecord> | undefined
export const StudentDocument = ExistingStudentDocument ?? mongoose.model<StudentDocumentRecord>('StudentDocument', studentDocumentSchema)

const studentOrganizationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    organizationName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    joinedAt: { type: Date, required: true },
    status: { type: String, default: 'active' },
    notes: { type: String, trim: true, default: '' },
    eventDate: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decisionDate: { type: Date },
  },
  { timestamps: true }
)

export type StudentOrganizationRecord = InferSchemaType<typeof studentOrganizationSchema>
const ExistingStudentOrganization = mongoose.models.StudentOrganization as Model<StudentOrganizationRecord> | undefined
export const StudentOrganization = ExistingStudentOrganization ?? mongoose.model<StudentOrganizationRecord>('StudentOrganization', studentOrganizationSchema)

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, trim: true },
    entity: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export type AuditLogRecord = InferSchemaType<typeof auditLogSchema>
const ExistingAuditLog = mongoose.models.AuditLog as Model<AuditLogRecord> | undefined
export const AuditLog = ExistingAuditLog ?? mongoose.model<AuditLogRecord>('AuditLog', auditLogSchema)

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export type SystemSettingRecord = InferSchemaType<typeof systemSettingSchema>
const ExistingSystemSetting = mongoose.models.SystemSetting as Model<SystemSettingRecord> | undefined
export const SystemSetting = ExistingSystemSetting ?? mongoose.model<SystemSettingRecord>('SystemSetting', systemSettingSchema)

const attendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: String, required: true, trim: true },
    totalSessions: { type: Number, default: 0 },
    sessionAttended: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

attendanceSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true })

export type AttendanceRecord = InferSchemaType<typeof attendanceSchema>
const ExistingAttendance = mongoose.models.Attendance as Model<AttendanceRecord> | undefined
export const Attendance = ExistingAttendance ?? mongoose.model<AttendanceRecord>('Attendance', attendanceSchema)

const attendanceLogSchema = new Schema(
  {
    attendance: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
    sessionDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
)

export type AttendanceLogRecord = InferSchemaType<typeof attendanceLogSchema>
const ExistingAttendanceLog = mongoose.models.AttendanceLog as Model<AttendanceLogRecord> | undefined
export const AttendanceLog = ExistingAttendanceLog ?? mongoose.model<AttendanceLogRecord>('AttendanceLog', attendanceLogSchema)

const gradeScaleSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    letterGrade: { type: String, required: true, trim: true },
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    pointValue: { type: Number, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
)

gradeScaleSchema.index({ institution: 1, letterGrade: 1 }, { unique: true })

export type GradeScaleRecord = InferSchemaType<typeof gradeScaleSchema>
const ExistingGradeScale = mongoose.models.GradeScale as Model<GradeScaleRecord> | undefined
export const GradeScale = ExistingGradeScale ?? mongoose.model<GradeScaleRecord>('GradeScale', gradeScaleSchema)

const coursePrerequisiteSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    prerequisiteCourse: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    minGrade: { type: String, default: 'D', trim: true },
  },
  { timestamps: true }
)

coursePrerequisiteSchema.index({ course: 1, prerequisiteCourse: 1 }, { unique: true })

export type CoursePrerequisiteRecord = InferSchemaType<typeof coursePrerequisiteSchema>
const ExistingCoursePrerequisite = mongoose.models.CoursePrerequisite as Model<CoursePrerequisiteRecord> | undefined
export const CoursePrerequisite = ExistingCoursePrerequisite ?? mongoose.model<CoursePrerequisiteRecord>('CoursePrerequisite', coursePrerequisiteSchema)

const courseActivitySchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'task', 'lecture'],
      required: true,
    },
    dueDate: { type: Date },
    points: { type: Number, default: 100 },
    contentUrl: { type: String, default: '', trim: true },
    status: { type: String, default: 'active', trim: true },
  },
  { timestamps: true }
)

courseActivitySchema.index({ course: 1, type: 1, createdAt: -1 })

export type CourseActivityRecord = InferSchemaType<typeof courseActivitySchema>
const ExistingCourseActivity = mongoose.models.CourseActivity as Model<CourseActivityRecord> | undefined
export const CourseActivity = ExistingCourseActivity ?? mongoose.model<CourseActivityRecord>('CourseActivity', courseActivitySchema)

const activitySubmissionSchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: 'CourseActivity', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answer: { type: String, default: '', trim: true },
    attachmentUrl: { type: String, default: '', trim: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    score: { type: Number, default: null },
    feedback: { type: String, default: '', trim: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
  },
  { timestamps: true }
)

activitySubmissionSchema.index({ activity: 1, student: 1 }, { unique: true })

export type ActivitySubmissionRecord = InferSchemaType<typeof activitySubmissionSchema>
const ExistingActivitySubmission = mongoose.models.ActivitySubmission as Model<ActivitySubmissionRecord> | undefined
export const ActivitySubmission = ExistingActivitySubmission ?? mongoose.model<ActivitySubmissionRecord>('ActivitySubmission', activitySubmissionSchema)

