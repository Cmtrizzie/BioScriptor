
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>BioScriptor Privacy Policy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: January 2025</p>

            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
            </p>

            <h4>Personal Information:</h4>
            <ul>
              <li>Email address</li>
              <li>Display name</li>
              <li>Profile picture (if provided)</li>
              <li>Subscription and billing information</li>
            </ul>

            <h4>Usage Information:</h4>
            <ul>
              <li>Chat messages and interactions</li>
              <li>Files uploaded for analysis</li>
              <li>Service usage patterns</li>
              <li>Technical information (IP address, browser type, device information)</li>
            </ul>

            <h3>2. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Improve our AI models (only with your explicit consent)</li>
            </ul>

            <h3>3. Data Training and Model Improvement</h3>
            <p>
              We only use your data to train and improve our AI models if you explicitly opt-in through the "Improve the model for everyone" setting in Data Controls. You can change this setting at any time.
            </p>

            <h3>4. Information Sharing</h3>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties. We may share information in the following circumstances:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in our operations</li>
            </ul>

            <h3>5. Data Security</h3>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3>6. Data Retention</h3>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. You can delete your account and data at any time through the Data Controls page.
            </p>

            <h3>7. Your Rights</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Opt-out of data training</li>
            </ul>

            <h3>8. Changes to This Policy</h3>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h3>9. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@bioscriptor.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
