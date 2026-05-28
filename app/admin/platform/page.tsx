'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { mockUsers, mockCourses, mockUserProgress } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, AlertTriangle, BarChart3, Settings, Lock, Trash2, Shield } from 'lucide-react';
import { useState } from 'react';

export default function PlatformAdminPage() {
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trainees = mockUsers.filter((u) => u.role === 'trainee');
  const admins = mockUsers.filter((u) => u.role !== 'trainee');
  const totalEnrollments = mockUserProgress.length;
  const completedCourses = mockUserProgress.filter((p) => p.status === 'completed').length;

  const toggleBanUser = (userId: string) => {
    setBannedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <ProtectedRoute requiredRoles={['platform_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Administration</h1>
            <p className="text-gray-600 mt-1">Manage users, monitor platform health, and enforce policies</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: Users,
                label: 'Total Users',
                value: mockUsers.length,
                color: 'blue',
              },
              {
                icon: Shield,
                label: 'Admin Users',
                value: admins.length,
                color: 'purple',
              },
              {
                icon: BarChart3,
                label: 'Total Enrollments',
                value: totalEnrollments,
                color: 'green',
              },
              {
                icon: AlertTriangle,
                label: 'Banned Users',
                value: bannedUsers.length,
                color: 'red',
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-100 text-${stat.color}-600`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="bg-white rounded-lg border border-gray-200">
            <TabsList className="border-b border-gray-200 rounded-none w-full justify-start px-6 py-0 h-auto bg-transparent">
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                User Management
              </TabsTrigger>
              <TabsTrigger value="moderation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Moderation
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* User Management */}
            <TabsContent value="users" className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Trainees</h3>
                  <p className="text-2xl font-bold text-blue-600">{trainees.length}</p>
                  <p className="text-sm text-gray-600 mt-2">Active training participants</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Course Admins</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {mockUsers.filter((u) => u.role === 'course_admin').length}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Course creators and managers</p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">All Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              bannedUsers.includes(user.id)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {bannedUsers.includes(user.id) ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className={
                              bannedUsers.includes(user.id)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                            onClick={() => toggleBanUser(user.id)}
                          >
                            <Lock className="w-4 h-4 mr-1" />
                            {bannedUsers.includes(user.id) ? 'Unban' : 'Ban'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Moderation */}
            <TabsContent value="moderation" className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Pending Reports
                </h3>
                <p className="text-sm text-gray-600">No pending moderation reports at this time.</p>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Moderation History</h3>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center text-gray-600">
                <p>No moderation history available</p>
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Total Courses</h3>
                  <p className="text-3xl font-bold text-blue-600">{mockCourses.length}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Published: {mockCourses.filter((c) => c.status === 'published').length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Completion Rate</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {totalEnrollments > 0
                      ? Math.round((completedCourses / totalEnrollments) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {completedCourses} of {totalEnrollments} completed
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Platform Health</h3>
                  <p className="text-3xl font-bold text-purple-600">Good</p>
                  <p className="text-sm text-gray-600 mt-2">All systems operational</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center text-gray-600">
                <p>Detailed analytics dashboard coming soon</p>
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Platform Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Maintenance Mode</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Temporarily disable platform access
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Off
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Enable platform notifications
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        On
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Data Export</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Export all platform data
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
