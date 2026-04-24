import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchAllPages<T>(urlForPage: (page: number) => string): Promise<T[]> {
  const aggregated: T[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await fetch(urlForPage(page))
    const payload = await response.json()

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to load data.')
    }

    aggregated.push(...((Array.isArray(payload.data) ? payload.data : []) as T[]))

    const pagesFromMeta = Number(payload?.meta?.pagination?.pages)
    totalPages = Number.isFinite(pagesFromMeta) && pagesFromMeta > 0 ? pagesFromMeta : 1
    page += 1
  }

  return aggregated
}
