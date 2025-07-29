
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function TermsOfUse() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/service-agreement');
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
              Terms of Use
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>BioScriptor Terms of Use</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: January 2025</p>

            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using BioScriptor, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily download one copy of BioScriptor for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained in BioScriptor</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h3>3. Disclaimer</h3>
            <p>
              The materials in BioScriptor are provided on an 'as is' basis. BioScriptor makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h3>4. Limitations</h3>
            <p>
              In no event shall BioScriptor or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use BioScriptor, even if BioScriptor or a BioScriptor authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>

            <h3>5. Privacy Policy</h3>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of BioScriptor, to understand our practices.
            </p>

            <h3>6. Governing Law</h3>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </p>

            <h3>7. Contact Information</h3>
            <p>
              If you have any questions about these Terms of Use, please contact us at support@bioscriptor.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
