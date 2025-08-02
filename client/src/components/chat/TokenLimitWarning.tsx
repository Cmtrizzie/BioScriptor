
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Info, Zap } from "lucide-react";

interface TokenLimitWarningProps {
  conversationLimits?: {
    status: 'ok' | 'warning' | 'critical' | 'exceeded';
    tokensUsed: number;
    tokensRemaining: number;
    percentageUsed: number;
    shouldWarn: boolean;
    message?: string;
  };
  onNewChat: () => void;
}

export default function TokenLimitWarning({ conversationLimits, onNewChat }: TokenLimitWarningProps) {
  if (!conversationLimits?.shouldWarn || conversationLimits.status === 'ok') {
    return null;
  }

  const getAlertVariant = () => {
    switch (conversationLimits.status) {
      case 'critical':
      case 'exceeded':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (conversationLimits.status) {
      case 'critical':
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Info className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getProgressColor = () => {
    if (conversationLimits.percentageUsed >= 75) return 'bg-red-500';
    if (conversationLimits.percentageUsed >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="mb-4 mx-4">
      <Alert variant={getAlertVariant()}>
        {getIcon()}
        <AlertDescription className="flex flex-col gap-3">
          <div>
            <p className="font-medium mb-2">
              {conversationLimits.status === 'exceeded' 
                ? 'Token Limit Exceeded' 
                : 'Conversation Length Notice'}
            </p>
            <p className="text-sm mb-3">{conversationLimits.message}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Token Usage</span>
                <span>
                  {conversationLimits.tokensUsed.toLocaleString()} / 128,000 
                  ({conversationLimits.percentageUsed.toFixed(1)}%)
                </span>
              </div>
              <Progress 
                value={conversationLimits.percentageUsed} 
                className="h-2"
                style={{
                  '--progress-foreground': getProgressColor()
                } as React.CSSProperties}
              />
            </div>
          </div>
          
          {conversationLimits.status !== 'ok' && (
            <div className="flex gap-2">
              <Button 
                onClick={onNewChat}
                size="sm"
                variant={conversationLimits.status === 'exceeded' ? 'default' : 'outline'}
              >
                <Zap className="h-3 w-3 mr-1" />
                Start Fresh Chat
              </Button>
              {conversationLimits.status === 'warning' && (
                <p className="text-xs text-muted-foreground self-center">
                  Or continue - system will auto-optimize context
                </p>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
