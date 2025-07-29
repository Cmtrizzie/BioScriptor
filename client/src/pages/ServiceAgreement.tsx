
import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function ServiceAgreement() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/settings');
  };

  const handleTermsOfUse = () => {
    setLocation('/terms-of-use');
  };

  const handlePrivacyPolicy = () => {
    setLocation('/privacy-policy');
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
              Service agreement
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-0">
            {/* Terms of Use */}
            <div 
              className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={handleTermsOfUse}
            >
              <span className="text-gray-900 dark:text-white font-medium">
                Terms of Use
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            {/* Privacy Policy */}
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={handlePrivacyPolicy}
            >
              <span className="text-gray-900 dark:text-white font-medium">
                Privacy Policy
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
