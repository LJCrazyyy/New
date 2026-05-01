import { createFirestoreModel } from './firestore-model'

export type UserRecord = Record<string, any>
export type StudentProfileRecord = Record<string, any>
export type FacultyProfileRecord = Record<string, any>
export type AdminProfileRecord = Record<string, any>
export type CourseRecord = Record<string, any>
export type EnrollmentRecord = Record<string, any>
export type NotificationRecord = Record<string, any>
export type AcademicHistoryRecord = Record<string, any>
export type MedicalRecord = Record<string, any>
export type CounselingRecord = Record<string, any>
export type DisciplineRecord = Record<string, any>
export type StudentDocumentRecord = Record<string, any>
export type StudentOrganizationRecord = Record<string, any>
export type AuditLogRecord = Record<string, any>
export type SystemSettingRecord = Record<string, any>
export type AttendanceRecord = Record<string, any>
export type AttendanceLogRecord = Record<string, any>
export type GradeScaleRecord = Record<string, any>
export type CoursePrerequisiteRecord = Record<string, any>
export type CourseActivityRecord = Record<string, any>
export type ActivitySubmissionRecord = Record<string, any>

export const User = createFirestoreModel<UserRecord>({
  modelName: 'User',
  collectionName: 'users',
  uniqueFields: [['systemId'], ['email']],
  dateFields: ['joinedAt', 'lastLoginAt', 'createdAt', 'updatedAt'],
})

export const StudentProfile = createFirestoreModel<StudentProfileRecord>({
  modelName: 'StudentProfile',
  collectionName: 'studentprofiles',
  uniqueFields: [['user'], ['studentNumber']],
  dateFields: ['admissionDate', 'createdAt', 'updatedAt'],
  relations: {
    user: { model: () => User },
  },
})

export const FacultyProfile = createFirestoreModel<FacultyProfileRecord>({
  modelName: 'FacultyProfile',
  collectionName: 'facultyprofiles',
  uniqueFields: [['user'], ['employeeNumber']],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    user: { model: () => User },
    coursesAssigned: { model: () => Course, many: true },
  },
})

export const AdminProfile = createFirestoreModel<AdminProfileRecord>({
  modelName: 'AdminProfile',
  collectionName: 'adminprofiles',
  uniqueFields: [['user'], ['employeeNumber']],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    user: { model: () => User },
  },
})

export const Course = createFirestoreModel<CourseRecord>({
  modelName: 'Course',
  collectionName: 'courses',
  uniqueFields: [['code', 'section', 'semester']],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    faculty: { model: () => User },
  },
})

export const Enrollment = createFirestoreModel<EnrollmentRecord>({
  modelName: 'Enrollment',
  collectionName: 'enrollments',
  uniqueFields: [['student', 'course', 'semester']],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
    course: { model: () => Course },
  },
})

export const Notification = createFirestoreModel<NotificationRecord>({
  modelName: 'Notification',
  collectionName: 'notifications',
  dateFields: ['readAt', 'createdAt', 'updatedAt'],
  relations: {
    createdBy: { model: () => User },
  },
})

export const AcademicHistory = createFirestoreModel<AcademicHistoryRecord>({
  modelName: 'AcademicHistory',
  collectionName: 'academichistories',
  dateFields: ['recordedAt', 'createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
    relatedCourse: { model: () => Course },
    createdBy: { model: () => User },
  },
})

export const MedicalRecord = createFirestoreModel<MedicalRecord>({
  modelName: 'MedicalRecord',
  collectionName: 'medicalrecords',
  dateFields: ['recordedAt', 'createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
  },
})

export const CounselingRecord = createFirestoreModel<CounselingRecord>({
  modelName: 'CounselingRecord',
  collectionName: 'counselingrecords',
  dateFields: ['sessionDate', 'replyAt', 'createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
    counselor: { model: () => User },
    replyBy: { model: () => User },
  },
})

export const DisciplineRecord = createFirestoreModel<DisciplineRecord>({
  modelName: 'DisciplineRecord',
  collectionName: 'disciplinerecords',
  dateFields: ['incidentDate', 'createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
  },
})

export const StudentDocument = createFirestoreModel<StudentDocumentRecord>({
  modelName: 'StudentDocument',
  collectionName: 'studentdocuments',
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
  },
})

export const StudentOrganization = createFirestoreModel<StudentOrganizationRecord>({
  modelName: 'StudentOrganization',
  collectionName: 'studentorganizations',
  dateFields: ['joinedAt', 'eventDate', 'decisionDate', 'createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
    managedBy: { model: () => User },
    reviewedBy: { model: () => User },
  },
})

export const AuditLog = createFirestoreModel<AuditLogRecord>({
  modelName: 'AuditLog',
  collectionName: 'auditlogs',
  dateFields: ['occurredAt', 'createdAt', 'updatedAt'],
  relations: {
    actor: { model: () => User },
  },
})

export const SystemSetting = createFirestoreModel<SystemSettingRecord>({
  modelName: 'SystemSetting',
  collectionName: 'systemsettings',
  dateFields: ['createdAt', 'updatedAt'],
})

export const Attendance = createFirestoreModel<AttendanceRecord>({
  modelName: 'Attendance',
  collectionName: 'attendances',
  uniqueFields: [['student', 'course', 'semester']],
  dateFields: ['lastUpdated', 'createdAt', 'updatedAt'],
  relations: {
    student: { model: () => User },
    course: { model: () => Course },
  },
})

export const AttendanceLog = createFirestoreModel<AttendanceLogRecord>({
  modelName: 'AttendanceLog',
  collectionName: 'attendancelogs',
  dateFields: ['sessionDate', 'createdAt', 'updatedAt'],
  relations: {
    attendance: { model: () => Attendance },
  },
})

export const GradeScale = createFirestoreModel<GradeScaleRecord>({
  modelName: 'GradeScale',
  collectionName: 'gradescales',
  uniqueFields: [['institution', 'letterGrade']],
  dateFields: ['createdAt', 'updatedAt'],
})

export const CoursePrerequisite = createFirestoreModel<CoursePrerequisiteRecord>({
  modelName: 'CoursePrerequisite',
  collectionName: 'courseprerequisites',
  uniqueFields: [['course', 'prerequisiteCourse']],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    course: { model: () => Course },
    prerequisiteCourse: { model: () => Course },
  },
})

export const CourseActivity = createFirestoreModel<CourseActivityRecord>({
  modelName: 'CourseActivity',
  collectionName: 'courseactivities',
  dateFields: ['dueDate', 'createdAt', 'updatedAt'],
  relations: {
    course: { model: () => Course },
    faculty: { model: () => User },
  },
})

export const ActivitySubmission = createFirestoreModel<ActivitySubmissionRecord>({
  modelName: 'ActivitySubmission',
  collectionName: 'activitysubmissions',
  uniqueFields: [['activity', 'student']],
  dateFields: ['submittedAt', 'gradedAt', 'createdAt', 'updatedAt'],
  relations: {
    activity: { model: () => CourseActivity },
    course: { model: () => Course },
    student: { model: () => User },
    gradedBy: { model: () => User },
  },
})