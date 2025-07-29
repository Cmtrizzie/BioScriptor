
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Database, Globe, Palette, Type, Info, FileText, MessageCircle, LogOut, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useTheme, useTranslations } from '@/context/theme-context';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  console.log('Settings component rendering');
  const { user, logout } = useAuth();
  const { theme, language, toggleTheme, setLanguage } = useTheme();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fontSize, setFontSize] = useState('Medium');
  const [isUpdating, setIsUpdating] = useState(false);
  const t = useTranslations();

  // Load saved settings on component mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') || 'Medium';
    setFontSize(savedFontSize);
  }, []);

  const handleBack = () => {
    setLocation('/chat');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been safely logged out.",
      });
      setLocation('/auth');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    const typedLanguage = newLanguage as 'English' | 'Spanish' | 'French' | 'German' | 'Chinese' | 'Japanese';
    setLanguage(typedLanguage);
    toast({
      title: "Language updated",
      description: `Language changed to ${newLanguage}`,
    });
  };

  const handleFontSizeChange = (newFontSize: string) => {
    setFontSize(newFontSize);
    localStorage.setItem('fontSize', newFontSize);
    
    // Apply font size to document root
    const root = document.documentElement;
    switch (newFontSize) {
      case 'Small':
        root.style.fontSize = '14px';
        break;
      case 'Large':
        root.style.fontSize = '18px';
        break;
      default: // Medium
        root.style.fontSize = '16px';
        break;
    }
    
    toast({
      title: "Font size updated",
      description: `Font size changed to ${newFontSize}`,
    });
  };

  const handleDataManagement = () => {
    setLocation('/data-controls');
  };

  const handleCheckForUpdates = async () => {
    setIsUpdating(true);
    // Simulate update check
    setTimeout(() => {
      setIsUpdating(false);
      toast({
        title: "Up to date",
        description: "You're running the latest version of BioScriptor.",
      });
    }, 2000);
  };

  const handleViewServiceAgreement = () => {
    window.open('/terms', '_blank');
  };

  const handleContactSupport = () => {
    const emailBody = encodeURIComponent(
      `Hello BioScriptor Support Team,

I need assistance with:

User Email: ${user?.email || 'Not available'}
Subscription Tier: ${user?.tier || 'free'}

Please describe your issue below:
`
    );
    window.open(`mailto:support@bioscriptor.com?subject=BioScriptor Support Request&body=${emailBody}`, '_blank');
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
              {t.settings}
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
              {t.profile}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">{t.email}</span>
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
                <span className="text-gray-900 dark:text-white">{t.dataControls}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={handleDataManagement}
              >
                <span>{t.manage}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              {t.app}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">{t.language}</span>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Español</SelectItem>
                  <SelectItem value="French">Français</SelectItem>
                  <SelectItem value="German">Deutsch</SelectItem>
                  <SelectItem value="Chinese">中文</SelectItem>
                  <SelectItem value="Japanese">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">{t.appearance}</span>
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
                <span className="text-gray-900 dark:text-white">{t.fontSize}</span>
              </div>
              <Select value={fontSize} onValueChange={handleFontSizeChange}>
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  v1.0.0
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={handleCheckForUpdates}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Download className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Service Agreement */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Service agreement</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={handleViewServiceAgreement}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={handleContactSupport}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
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
            BioScriptor v1.0.0 - AI-powered bioinformatics assistant. Please verify results independently.
          </p>
        </div>
      </div>
    </div>
  );
}
