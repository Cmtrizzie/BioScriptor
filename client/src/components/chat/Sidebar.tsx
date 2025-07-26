import React from "react";
import { X, Plus, MessageSquare, Dna, Scissors, FlaskConical, BookOpen, ChevronDown, BarChart3, Atom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: any[];
  onNewChat: () => void;
  onSwitchSession: (session: any) => void;
  onSendMessage: (message: string) => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  sessions, 
  onNewChat, 
  onSwitchSession,
  onSendMessage 
}: SidebarProps) {

  const handleQuickAction = (message: string) => {
    onSendMessage(message);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">BioScriptor</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={onNewChat}
            className="w-full justify-start bg-bio-blue hover:bg-bio-blue/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => handleQuickAction("Help me design CRISPR guide RNA sequences for a specific gene target. I need assistance with target selection, PAM site identification, and off-target analysis.")}
            >
              <Scissors className="h-4 w-4 mr-3 text-bio-green" />
              <div>
                <div className="font-medium">CRISPR Design</div>
                <div className="text-xs text-gray-500">Guide RNA & off-targets</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => handleQuickAction("I need help with PCR simulation and primer design. Can you assist with primer optimization, melting temperature calculation, and virtual gel electrophoresis?")}
            >
              <FlaskConical className="h-4 w-4 mr-3 text-bio-green" />
              <div>
                <div className="font-medium">PCR Simulation</div>
                <div className="text-xs text-gray-500">Virtual gel electrophoresis</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => handleQuickAction("Please help me analyze biological sequences. I need assistance with DNA/RNA/protein sequence analysis, including alignment, annotation, and functional prediction.")}
            >
              <Dna className="h-4 w-4 mr-3 text-bio-green" />
              <div>
                <div className="font-medium">Sequence Analysis</div>
                <div className="text-xs text-gray-500">DNA/RNA/Protein tools</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => handleQuickAction("I need help with research literature review and finding relevant bioinformatics papers. Can you assist with literature search and summarizing key findings?")}
            >
              <BookOpen className="h-4 w-4 mr-3 text-bio-green" />
              <div>
                <div className="font-medium">Literature Review</div>
                <div className="text-xs text-gray-500">Research & papers</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-gray-700">Recent Sessions</h3>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent sessions
                </p>
              ) : (
                sessions.map((session) => (
                  <Button
                    key={session.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 text-xs"
                    onClick={() => onSwitchSession(session)}
                  >
                    <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-gray-500 truncate">{session.timestamp}</div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}