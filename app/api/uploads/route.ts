import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
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
  const file = formData.get('file')
  const category = typeof formData.get('category') === 'string' ? String(formData.get('category')) : 'general'

  if (!file || typeof (file as any).arrayBuffer !== 'function') {
    return Response.json({ success: false, message: 'File upload is required.' }, { status: 400 })
  }

  const targetDir = path.join(UPLOAD_DIR, sanitizeFileName(category))
  await ensureUploadDirectory(targetDir)

  const originalName = String((file as any).name || 'uploaded-file')
  const safeFileName = await getSafeFileName(targetDir, originalName)
  const filePath = path.join(targetDir, safeFileName)
  const fileBuffer = Buffer.from(await (file as any).arrayBuffer())

  try {
    await fs.writeFile(filePath, fileBuffer)
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unable to save uploaded file.',
      },
      { status: 500 }
    )
  }

  const fileUrl = `/uploads/${encodeURIComponent(sanitizeFileName(category))}/${encodeURIComponent(safeFileName)}`
  return Response.json({ success: true, data: { fileUrl } }, { status: 201 })
}
