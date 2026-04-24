import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'student-documents')

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function sanitizeStudentId(studentId: string) {
  return studentId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

async function ensureUploadDirectory(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function getSafeFileName(dir: string, name: string) {
  const baseName = sanitizeFileName(name)
  let candidate = baseName
  let index = 0

  while (true) {
    const candidatePath = path.join(dir, candidate)
    try {
      await fs.access(candidatePath)
      index += 1
      const extension = path.extname(baseName)
      const basenameWithoutExt = path.basename(baseName, extension)
      candidate = `${basenameWithoutExt}-${index}${extension}`
    } catch {
      return candidate
    }
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return Response.json({ success: false, message: 'Expected multipart/form-data.' }, { status: 400 })
  }

  const formData = await request.formData()
  const student = formData.get('student')
  const file = formData.get('file')

  if (!student || typeof student !== 'string') {
    return Response.json({ success: false, message: 'Student id is required.' }, { status: 400 })
  }

  if (!file || typeof (file as any).arrayBuffer !== 'function') {
    return Response.json({ success: false, message: 'File upload is required.' }, { status: 400 })
  }

  const fileName = String((file as any).name || 'uploaded-file')
  const studentDirectory = path.join(UPLOAD_DIR, sanitizeStudentId(student))

  try {
    await ensureUploadDirectory(studentDirectory)

    const safeFileName = await getSafeFileName(studentDirectory, fileName)
    const filePath = path.join(studentDirectory, safeFileName)
    const fileBuffer = Buffer.from(await (file as any).arrayBuffer())

    await fs.writeFile(filePath, fileBuffer)

    const fileUrl = `/uploads/student-documents/${encodeURIComponent(sanitizeStudentId(student))}/${encodeURIComponent(safeFileName)}`

    return Response.json({ success: true, data: { fileUrl } }, { status: 201 })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unable to upload file.',
      },
      { status: 500 }
    )
  }
}
