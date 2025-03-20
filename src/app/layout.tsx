'use client';

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/components/auth/AuthContext'
import { ChatProvider } from '@/components/chat/ChatContext'
import AppLayout from '@/components/layout/AppLayout'
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleOAuthProvider clientId="your-client-id.apps.googleusercontent.com">
          <AuthProvider>
            <ChatProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </ChatProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}