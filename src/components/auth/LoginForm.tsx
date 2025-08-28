'use client';

import { useState } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Get users from localStorage or use default data
  const getUsers = () => {
    // Always ensure default judge accounts exist
    const ensureDefaultJudges = (existingUsers: any[]) => {
      const defaultJudges = [
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

      // Merge existing users with default judges, ensuring default judges always exist
      const mergedUsers = [...existingUsers];
      
      defaultJudges.forEach(defaultJudge => {
        const existingIndex = mergedUsers.findIndex(u => u.username === defaultJudge.username);
        if (existingIndex >= 0) {
          // Update existing judge to ensure correct password and data
          mergedUsers[existingIndex] = {
            ...mergedUsers[existingIndex],
            password: defaultJudge.password, // Always ensure correct password
            role: 'judge',
            status: 'active'
          };
        } else {
          // Add missing default judge
          mergedUsers.push(defaultJudge);
        }
      });
      
      return mergedUsers;
    };

    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('adminUsers');
      if (savedUsers) {
        const users = ensureDefaultJudges(JSON.parse(savedUsers));
        console.log('Loaded users from localStorage:', users);
        // Re-save to ensure default judges are persisted
        localStorage.setItem('adminUsers', JSON.stringify(users));
        return users;
      }
    }
    
    // Always ensure we have the latest judge data
    const defaultUsers = [
      {
        id: 1,
        name: 'Admin User',
        username: 'Black@2050',
        email: 'admin@tunisiaopen.com',
        role: 'admin',
        status: 'active',
        password: '2050@5020',
        lastLogin: '2025-01-27 15:30',
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
        lastLogin: '2025-01-27 14:45',
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
        lastLogin: '2025-01-27 14:30',
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
        lastLogin: '2025-01-27 14:15',
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
        lastLogin: '2025-01-27 14:00',
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
        lastLogin: '2025-01-27 13:45',
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
        lastLogin: '2025-01-27 13:30',
        createdAt: '2025-01-15',
      },
    ];
    
    // Store default users to ensure they're available
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminUsers', JSON.stringify(defaultUsers));
    }
    
    console.log('Using default users:', defaultUsers);
    return defaultUsers;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Get all users and check credentials
    const users = getUsers();
    console.log('Attempting login with:', { username, password });
    console.log('Available users:', users.map(u => ({ username: u.username, role: u.role, status: u.status })));
    
    const user = users.find(u => 
      u.username === username && 
      u.password === password && 
      u.status === 'active'
    );
    
    console.log('Found user:', user);
    
    if (user) {
      // Update last login time
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' ') }
          : u
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        
        // Store current user session for context-aware components
        const userSession = {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          sector: null, // Will be set for judges
          loginTime: new Date().toISOString()
        };
        
        // For judges, find their assigned sector
        if (user.role === 'judge') {
          try {
            const judges = JSON.parse(localStorage.getItem('judges') || '[]');
            const judgeData = judges.find((j: any) => j.username === user.username);
            if (judgeData && judgeData.sector) {
              userSession.sector = judgeData.sector;
            } else {
              // Fallback: extract sector from username for new judge system
              const sectorMap: { [key: string]: string } = {
                'juge.a': 'A',
                'juge.b': 'B', 
                'juge.c': 'C',
                'juge.d': 'D',
                'juge.e': 'E',
                'juge.f': 'F'
              };
              userSession.sector = sectorMap[user.username] || null;
            }
          } catch (error) {
            console.error('Error finding judge sector:', error);
          }
        }
        
        localStorage.setItem('currentUserSession', JSON.stringify(userSession));
        
        // Also backup in sessionStorage for extra safety
        sessionStorage.setItem('currentUserSessionBackup', JSON.stringify(userSession));
        
        // Mark as authenticated
        localStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('isAuthenticated', 'true');
      }
      
      // Successful login - redirect based on role
      setTimeout(() => {
        setIsLoading(false);
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'judge') {
          router.push('/judge');
        }
      }, 1000);
    } else {
      // Failed login
      setTimeout(() => {
        setIsLoading(false);
        setError(t('invalidCredentials'));
      }, 1000);
    }
  };

  const handleDemoLogin = () => {
    setUsername('Black@2050');
    setPassword('2050@5020');
  };

  const handleJudgeDemo = () => {
    setUsername('juge.a');
    setPassword('#Juge@A');
  };
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
            {t('username')}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            {t('password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t('loading') : t('loginButton')}
        </Button>
      </form>
      
    </div>
  );
}