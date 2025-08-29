import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { TranslationProvider } from '@/components/providers/TranslationProvider';
import { FirebaseProvider } from '@/components/providers/FirebaseProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Titanium Tunisia Open - Compétition de Pêche',
  description: 'Système officiel de gestion de tournoi pour la compétition de pêche Titanium Tunisia Open',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0891b2' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tunisia Open',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = savedTheme || systemTheme;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                  
                  // Ensure judge logins always exist
                  var defaultUsers = [
                    {
                      id: 1,
                      name: 'Admin User',
                      username: 'Black@2050',
                      email: 'admin@tunisiaopen.com',
                      role: 'admin',
                      status: 'active',
                      password: '2050@5020',
                      lastLogin: '',
                      createdAt: '2025-01-01',
                    },
                    {
                      id: 2,
                      name: 'Juge A',
                      username: 'juge.a',
                      email: 'juge.a@tunisiaopen.com',
                      role: 'judge',
                      status: 'active',
                      password: '#Juge@A',
                      lastLogin: '',
                      createdAt: '2025-01-15',
                    },
                    {
                      id: 3,
                      name: 'Juge B',
                      username: 'juge.b',
                      email: 'juge.b@tunisiaopen.com',
                      role: 'judge',
                      status: 'active',
                      password: '#Juge@B',
                      lastLogin: '',
                      createdAt: '2025-01-15',
                    },
                    {
                      id: 4,
                      name: 'Juge C',
                      username: 'juge.c',
                      email: 'juge.c@tunisiaopen.com',
                      role: 'judge',
                      status: 'active',
                      password: '#Juge@C',
                      lastLogin: '',
                      createdAt: '2025-01-15',
                    },
                    {
                      id: 5,
                      name: 'Juge D',
                      username: 'juge.d',
                      email: 'juge.d@tunisiaopen.com',
                      role: 'judge',
                      status: 'active',
                      password: '#Juge@D',
                      lastLogin: '',
                      createdAt: '2025-01-15',
                    },
                    {
                      id: 6,
                      name: 'Juge E',
                      username: 'juge.e',
                      email: 'juge.e@tunisiaopen.com',
                      role: 'judge',
                      status: 'active',
                      password: '#Juge@E',
                      lastLogin: '',
                      createdAt: '2025-01-15',
                    },
                    {
                      id: 7,
                      name: 'Juge F',
                      username: 'juge.f',
                      email: 'juge.f@tunisiaopen.com',
                      role: 'judge',
                      status: 'active',
                      password: '#Juge@F',
                      lastLogin: '',
                      createdAt: '2025-01-15',
                    },
                  ];
                  
                  // Always ensure these users exist
                  var existingUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
                  var needsUpdate = false;
                  
                  defaultUsers.forEach(function(defaultUser) {
                    var existingIndex = existingUsers.findIndex(function(u) { return u.username === defaultUser.username; });
                    if (existingIndex >= 0) {
                      // Update existing user to ensure correct password
                      existingUsers[existingIndex] = defaultUser;
                    } else {
                      // Add missing user
                      existingUsers.push(defaultUser);
                      needsUpdate = true;
                    }
                  });
                  
                  if (needsUpdate || existingUsers.length !== defaultUsers.length) {
                    localStorage.setItem('adminUsers', JSON.stringify(existingUsers));
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SocketProvider>
            <TranslationProvider>
              <FirebaseProvider>
                {children}
              </FirebaseProvider>
            </TranslationProvider>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}