
import React, { useState } from 'react';
import { ArrowLeft, Shield, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function DataControls() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [improveModel, setImproveModel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBack = () => {
    setLocation('/settings');
  };

  const handleLogoutAllDevices = async () => {
    setIsProcessing(true);
    try {
      // Simulate logout from all devices
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Success",
        description: "You have been logged out of all devices.",
      });
      setLocation('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out of all devices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAllChats = async () => {
    setIsProcessing(true);
    try {
      // Simulate delete all chats
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Success",
        description: "All chats have been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      setLocation('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModelTrainingToggle = (enabled: boolean) => {
    setImproveModel(enabled);
    toast({
      title: enabled ? "Model training enabled" : "Model training disabled",
      description: enabled 
        ? "Your content will be used to improve our models." 
        : "Your content will not be used for model training.",
    });
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
              Data controls
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Model Training Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Improve the model for everyone
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Allow your content to be used to train our models and improve our services. We secure your data privacy.
                </p>
              </div>
              <Switch
                checked={improveModel}
                onCheckedChange={handleModelTrainingToggle}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management Actions */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6 space-y-4">
            {/* Log out of all devices */}
            <Button
              onClick={handleLogoutAllDevices}
              disabled={isProcessing}
              variant="ghost"
              className="w-full justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-4 h-auto"
            >
              <Shield className="h-5 w-5 mr-3 text-gray-500" />
              <span className="text-base">Log out of all devices</span>
            </Button>

            {/* Delete all chats */}
            <Button
              onClick={handleDeleteAllChats}
              disabled={isProcessing}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-4 h-auto"
            >
              <Trash2 className="h-5 w-5 mr-3" />
              <span className="text-base">Delete all chats</span>
            </Button>

            {/* Delete account */}
            <Button
              onClick={handleDeleteAccount}
              disabled={isProcessing}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-4 h-auto"
            >
              <Trash2 className="h-5 w-5 mr-3" />
              <span className="text-base">Delete account</span>
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Information */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your privacy is important to us. All data operations are secure and reversible where possible.
          </p>
        </div>
      </div>
    </div>
  );
}
