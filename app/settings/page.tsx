'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Lock, User, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <Input value={user?.name || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <Input value={user?.role.replace('_', ' ').charAt(0).toUpperCase() + user?.role.replace('_', ' ').slice(1) || ''} disabled />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h2>
            <div className="space-y-4">
              {[
                { title: 'Email Notifications', description: 'Receive updates about courses' },
                { title: 'Course Reminders', description: 'Get reminded about courses you enrolled' },
                { title: 'Quiz Alerts', description: 'Be notified when new quizzes are available' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    On
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900 mb-2">Change Password</p>
                <p className="text-sm text-gray-600 mb-4">
                  Update your password to keep your account secure
                </p>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900 mb-2">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600 mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-lg border border-red-200 p-6">
            <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Danger Zone
            </h2>
            <div className="space-y-4">
              <Button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </main>

        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
