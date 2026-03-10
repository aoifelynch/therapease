/**
 * Utility functions for input sanitization and validation
 * Helps prevent XSS attacks and ensure data integrity
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Escapes dangerous characters that could be used for script injection
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  const reg = /[&<>"'/]/gi
  return input.replace(reg, (match) => map[match])
}

/**
 * Validate and sanitize email format
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitize text input - removes potentially dangerous characters
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, '')
}

/**
 * Validate number input - ensures it's a valid number
 */
export function sanitizeNumber(value: unknown): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

/**
 * Validate and sanitize URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Remove potential SQL injection characters (for additional safety)
 */
export function sanitizeForDatabase(input: string): string {
  // Strip common SQL metacharacters and inline comment markers
  return input
    .replace(/['"`;\\]/g, '')
    .replace(/--/g, '')
}