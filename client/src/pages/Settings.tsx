
import React, { useState } from 'react';
import { ArrowLeft, Mail, Database, Globe, Palette, Type, Info, FileText, MessageCircle, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/context/theme-context';
import { useLocation } from 'wouter';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState('English');
  const [fontSize, setFontSize] = useState('Medium');

  const handleBack = () => {
    setLocation('/chat');
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/auth');
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'system': return 'System';
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Email</span>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {user?.email || 'Not available'}
              </span>
            </div>

            <Separator />

            {/* Data Controls */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Data controls</span>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <span>Manage</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Language</span>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Appearance</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {getThemeLabel()}
              </Button>
            </div>

            <Separator />

            {/* Font Size */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Font size</span>
              </div>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Check for updates */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Check for updates</span>
              </div>
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
            </div>

            <Separator />

            {/* Service Agreement */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Service agreement</span>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                View
              </Button>
            </div>

            <Separator />

            {/* Contact Us */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Contact us</span>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log Out */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="py-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Log out
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI-generated, for reference only. Use legally.
          </p>
        </div>
      </div>
    </div>
  );
}
