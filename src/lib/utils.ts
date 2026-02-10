import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { env } from './env'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export const pageTitle = (title: string) => {
  return `${env.VITE_APP_NAME} - ${title}`
}

export const capitalizeWords = (str: string) => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
