'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Save, 
  Trash2,
  Edit,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface Judge {
  id: string;
  fullName: string;
  sector: string | null;
  username: string;
  password: string;
  lastLogin?: Date;
  status: 'active' | 'inactive';
}

export default function AdminJuges() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  
  // Editor state
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    sector: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [reassignmentBanner, setReassignmentBanner] = useState<{
    show: boolean;
    sector: string;
    newJudge: string;
    oldJudge: string;
  }>({ show: false, sector: '', newJudge: '', oldJudge: '' });

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Initial judges data - moved to component scope
  const initialJudgesData: Judge[] = [
    {
      id: 'judge-a',
      fullName: 'Juge A',
      sector: 'A',
      username: 'juge.a',
      password: '#Juge@A',
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'judge-b',
      fullName: 'Juge B',
      sector: 'B',
      username: 'juge.b',
      password: '#Juge@B',
      lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'judge-c',
      fullName: 'Juge C',
      sector: 'C',
      username: 'juge.c',
      password: '#Juge@C',
      lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'judge-d',
      fullName: 'Juge D',
      sector: 'D',
      username: 'juge.d',
      password: '#Juge@D',
      lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'judge-e',
      fullName: 'Juge E',
      sector: 'E',
      username: 'juge.e',
      password: '#Juge@E',
      lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'judge-f',
      fullName: 'Juge F',
      sector: 'F',
      username: 'juge.f',
      password: '#Juge@F',
      lastLogin: new Date(Date.now() - 7 * 60 * 60 * 1000),
      status: 'active'
    }
  ];

  // Initialize with some mock data
  useEffect(() => {
    // Load judges from localStorage or use initial data
    const loadJudges = () => {
      if (typeof window !== 'undefined') {
        try {
          const savedJudges = localStorage.getItem('judges');
          if (savedJudges) {
            const parsedJudges = JSON.parse(savedJudges);
            // Convert lastLogin strings back to Date objects
            const judgesWithDates = parsedJudges.map((judge: any) => ({
              ...judge,
              lastLogin: judge.lastLogin ? new Date(judge.lastLogin) : undefined
            }));
            setJudges(judgesWithDates);
            return judgesWithDates;
          }
        } catch (error) {
          console.error('Error loading judges from localStorage:', error);
        }
      }
      
      // Fallback to initial data
      
      setJudges(initialJudgesData);
      
      // Save initial data to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('judges', JSON.stringify(initialJudgesData));
      }
      
      return initialJudgesData;
    };

    const loadedJudges = loadJudges();

    // Store in localStorage for login system
    if (typeof window !== 'undefined') {
      const adminUsers = [
        {
          id: 1,
          name: 'Admin User',
          username: 'Black@2050',
          email: 'admin@titanium-f7b50.com',
          role: 'admin',
          status: 'active',
          password: '2050@5020',
          lastLogin: '2025-01-27 15:30',
          createdAt: '2025-01-01',
        },
        ...loadedJudges.map((judge, index) => ({
          id: index + 2,
          name: judge.fullName,
          username: judge.username,
          email: `${judge.username}@tunisiaopen.com`,
          role: 'judge',
          status: judge.status,
          password: judge.password,
          lastLogin: judge.lastLogin ? judge.lastLogin.toISOString().slice(0, 16).replace('T', ' ') : '',
          createdAt: '2025-01-15',
        }))
      ];
      localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
    }
  }, []);

  // Filter judges
  const filteredJudges = useMemo(() => {
    let filtered = judges;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(judge => 
        judge.fullName.toLowerCase().includes(query) ||
        judge.username.toLowerCase().includes(query)
      );
    }
    
    if (sectorFilter !== 'all') {
      if (sectorFilter === 'unassigned') {
        filtered = filtered.filter(judge => !judge.sector);
      } else {
        filtered = filtered.filter(judge => judge.sector === sectorFilter);
      }
    }
    
    return filtered;
  }, [judges, searchQuery, sectorFilter]);

  // Get selected judge
  const selectedJudge = selectedJudgeId 
    ? judges.find(j => j.id === selectedJudgeId)
    : null;

  // Get available sectors for form
  const availableSectors = useMemo(() => {
    const assignedSectors = judges
      .filter(j => j.sector && j.id !== selectedJudgeId)
      .map(j => j.sector);
    
    return sectors.filter(sector => !assignedSectors.includes(sector));
  }, [judges, selectedJudgeId]);

  const handleRowSelect = (judgeId: string) => {
    setSelectedJudgeId(judgeId);
    setIsEditorCollapsed(false);
    
    const judge = judges.find(j => j.id === judgeId);
    if (judge) {
      setIsEditing(true);
      setFormData({
        fullName: judge.fullName,
        sector: judge.sector || '',
        username: judge.username,
        password: judge.password
      });
    }
    setErrors({});
    setShowPassword(false);
  };

  const handleAddNew = () => {
    setSelectedJudgeId(null);
    setIsEditing(false);
    setFormData({
      fullName: '',
      sector: availableSectors[0] || '',
      username: '',
      password: ''
    });
    setErrors({});
    setShowPassword(false);
    setIsEditorCollapsed(false);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nom et prénom requis';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Nom d\'utilisateur requis';
    } else {
      // Check for duplicate username
      const existingJudge = judges.find(j => 
        j.username === formData.username && j.id !== selectedJudgeId
      );
      if (existingJudge) {
        newErrors.username = 'Ce nom d\'utilisateur existe déjà';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    // Check for sector reassignment
    let reassignmentInfo = null;
    if (formData.sector) {
      const currentJudgeInSector = judges.find(j => j.sector === formData.sector && j.id !== selectedJudgeId);
      if (currentJudgeInSector) {
        reassignmentInfo = {
          sector: formData.sector,
          newJudge: formData.fullName,
          oldJudge: currentJudgeInSector.fullName
        };
      }
    }

    const judgeData: Judge = {
      id: selectedJudgeId || `judge-${Date.now()}`,
      fullName: formData.fullName,
      sector: formData.sector || null,
      username: formData.username,
      password: formData.password,
      lastLogin: selectedJudge?.lastLogin,
      status: 'active'
    };

    // Simulate save
    setTimeout(() => {
      setJudges(prev => {
        let updated = [...prev];
        
        // Handle sector reassignment
        if (reassignmentInfo) {
          updated = updated.map(j => 
            j.sector === formData.sector && j.id !== selectedJudgeId
              ? { ...j, sector: null }
              : j
          );
        }
        
        if (isEditing) {
          const index = updated.findIndex(j => j.id === selectedJudgeId);
          if (index >= 0) {
            updated[index] = judgeData;
          }
        } else {
          updated.push(judgeData);
        }
        
        return updated;
      });

      // Update localStorage for persistence
      if (typeof window !== 'undefined') {
        const updatedJudges = [...judges];
        
        // Handle sector reassignment
        if (reassignmentInfo) {
          for (let i = 0; i < updatedJudges.length; i++) {
            if (updatedJudges[i].sector === formData.sector && updatedJudges[i].id !== selectedJudgeId) {
              updatedJudges[i] = { ...updatedJudges[i], sector: null };
            }
          }
        }
        
        if (isEditing) {
          const index = updatedJudges.findIndex(j => j.id === selectedJudgeId);
          if (index >= 0) {
            updatedJudges[index] = judgeData;
          }
        } else {
          updatedJudges.push(judgeData);
        }

        localStorage.setItem('judges', JSON.stringify(updatedJudges));

        // Always ensure default judge logins exist and cannot be overwritten
        const ensureDefaultJudgeLogins = () => {
          const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
          const defaultJudgeLogins = [
            {
              id: 2,
              name: 'Juge A',
              username: 'juge.a',
              email: 'juge.a@titanium-f7b50.com',
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
              email: 'juge.b@titanium-f7b50.com',
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
              email: 'juge.c@titanium-f7b50.com',
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
              email: 'juge.d@titanium-f7b50.com',
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
              email: 'juge.e@titanium-f7b50.com',
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
              email: 'juge.f@titanium-f7b50.com',
              role: 'judge',
              status: 'active',
              password: '#Juge@F',
              lastLogin: '',
              createdAt: '2025-01-15',
            },
          ];

          // Ensure admin user exists
          const adminUser = {
            id: 1,
            name: 'Admin User',
            username: 'Black@2050',
            email: 'admin@tunisiaopen.com',
            role: 'admin',
            status: 'active',
            password: '2050@5020',
            lastLogin: '',
            createdAt: '2025-01-01',
          };

          // Always start with admin + default judges
          const permanentUsers = [adminUser, ...defaultJudgeLogins];
          
          // Add any additional custom users (but never overwrite defaults)
          adminUsers.forEach((user: any) => {
            const isDefaultUser = permanentUsers.find(u => u.username === user.username);
            if (!isDefaultUser && user.role !== 'judge') {
              // Only add non-judge custom users
              permanentUsers.push(user);
            }
          });

          localStorage.setItem('adminUsers', JSON.stringify(permanentUsers));
          return permanentUsers;
        };

        ensureDefaultJudgeLogins();
      }

      // Show reassignment banner if needed
      if (reassignmentInfo) {
        setReassignmentBanner({
          show: true,
          ...reassignmentInfo
        });
        setTimeout(() => {
          setReassignmentBanner(prev => ({ ...prev, show: false }));
        }, 5000);
      }

      setIsSaving(false);
      setSelectedJudgeId(null);
      setIsEditing(false);
      setFormData({
        fullName: '',
        sector: '',
        username: '',
        
        password: ''
      });
      setErrors({});
    }, 800);
  };

  const handleDelete = async () => {
    if (!selectedJudge) return;

    setIsSaving(true);

    setTimeout(() => {
      const updatedJudges = judges.filter(j => j.id !== selectedJudgeId);
      setJudges(updatedJudges);

      // Update localStorage
      if (typeof window !== 'undefined') {
        const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        const updatedUsers = adminUsers.filter((user: any) => 
          !(user.role === 'judge' && user.username === selectedJudge.username)
        );
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        
        // Also store the judges list separately for persistence
        localStorage.setItem('judges', JSON.stringify(updatedJudges));
        
        // Create backup in sessionStorage for extra safety
        sessionStorage.setItem('judgesBackup', JSON.stringify(updatedJudges));
      }

      setIsSaving(false);
      setSelectedJudgeId(null);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setFormData({
        fullName: '',
        sector: '',
        username: '',
        password: ''
      });
    }, 500);
  };

  const handleCancel = () => {
    setSelectedJudgeId(null);
    setIsEditing(false);
    setFormData({
      fullName: '',
      sector: '',
      username: '',
      password: ''
    });
    setErrors({});
    setShowDeleteConfirm(false);
    setShowPassword(false);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Reassignment Banner */}
      {reassignmentBanner.show && (
        <div className="bg-red-600 text-white px-6 py-3 text-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Le Secteur {reassignmentBanner.sector} a été réassigné à {reassignmentBanner.newJudge}. 
              Veuillez réaffecter l'ancien juge ({reassignmentBanner.oldJudge}) à un autre secteur.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Juges</h1>
            <p className="text-gray-600 dark:text-gray-300">Gestion des juges et de leurs identifiants</p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou nom d'utilisateur..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous les secteurs</option>
              <option value="unassigned">Non affecté</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>Secteur {sector}</option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un juge
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom et Prénom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Secteur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom d'utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJudges.map(judge => {
                  const isSelected = selectedJudgeId === judge.id;
                  
                  return (
                    <tr 
                      key={judge.id}
                      className={`${isSelected ? 'ring-2 ring-ocean-500 bg-ocean-50 dark:bg-ocean-900/20' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                      onClick={() => handleRowSelect(judge.id)}
                    >
                      <td className="sticky left-0 bg-white dark:bg-gray-900 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ocean-600 hover:bg-ocean-100 dark:hover:bg-ocean-900/20">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {judge.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {judge.sector ? (
                          <Badge className={`bg-sectors-${judge.sector} text-white`}>
                            Secteur {judge.sector}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Non affecté
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {judge.username}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {judge.lastLogin ? (
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                            {formatTime(judge.lastLogin)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Jamais</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary" 
                          className={judge.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {judge.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className={`bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isEditorCollapsed ? 'w-12' : 'w-96'
        }`}>
          {isEditorCollapsed ? (
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorCollapsed(false)}
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Modifier Juge' : 'Nouveau Juge'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorCollapsed(true)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom et Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Nom et prénom du juge"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secteur
                    </label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Non affecté</option>
                      {(isEditing ? sectors : availableSectors).map(sector => (
                        <option key={sector} value={sector}>Secteur {sector}</option>
                      ))}
                    </select>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Nom d'utilisateur unique"
                    />
                    {errors.username && (
                      <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                    
                    {isEditing && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full"
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      className="w-full"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirmer la suppression</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{selectedJudge?.fullName}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}