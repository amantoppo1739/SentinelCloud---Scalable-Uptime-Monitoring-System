import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Decode HTML entities in URLs that were previously stored escaped (e.g. &#x2F; → /) */
export function decodeUrlForDisplay(url: string): string {
  if (typeof url !== 'string') return ''
  return url
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x3A;/gi, ':')
    .replace(/&amp;/g, '&')
}

