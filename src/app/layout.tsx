import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import '@/lib/amplify-config'; // Initialize Amplify
import { AuthProvider } from '@/contexts/AuthContext';
import { ClearOldAuth } from '@/components/ClearOldAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ToastContainer } from '@/components/ui/Alert';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ResumeMate - AI-Powered Resume Builder',
  description: 'Create professional, ATS-optimized resumes with AI assistance',
  keywords: ['resume builder', 'CV creator', 'ATS optimization', 'AI resume', 'job application'],
  authors: [{ name: 'ResumeMate Team' }],
  openGraph: {
    title: 'ResumeMate - AI-Powered Resume Builder',
    description: 'Create professional, ATS-optimized resumes with AI assistance',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} bg-[#fafafc] text-gray-900 antialiased`}>
        <ClearOldAuth />
        <AuthProvider>
          <div className="flex flex-col min-h-screen relative">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1e1b4b',
              border: '1px solid #e9e5fc',
              borderRadius: '16px',
              fontSize: '14px',
              boxShadow: '0 4px 16px rgba(99, 68, 236, 0.08)',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              duration: 5000,
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <ToastContainer />
      </body>
    </html>
  );
}
