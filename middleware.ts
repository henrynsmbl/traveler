import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add this to skip middleware for webhook requests
  if (request.nextUrl.pathname.startsWith('/api/webhook')) {
    return;
  }

  // Only add CORS headers to OPTIONS requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
    return response
  }

  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}

export const config = {
  matcher: '/api/:path*',
}