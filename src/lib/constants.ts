// Get admin emails from environment variables
export const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS 
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(email => email.trim())
  : [];

// For development fallback (don't use in production)
if (process.env.NODE_ENV === 'development' && ADMIN_EMAILS.length === 0) {
  console.warn('No admin emails configured. Using development fallback.');
  ADMIN_EMAILS.push('your-email@example.com');
} 