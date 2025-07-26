import React from "react";
import { X, Plus, MessageSquare, Dna, Scissors, FlaskConical, BookOpen, ChevronDown, BarChart3, Atom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { sessions, newChat, switchToSession, sendMessage } = useChat();

  const handleQuickAction = async (message: string) => {
    onClose(); // Close sidebar first
    await sendMessage(message);
  };

  const handleSessionClick = (session: any) => {
    switchToSession(session);
    onClose();
  };

  const handleNewChat = () => {
    newChat();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">BioScriptor</h2>
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
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full bg-bio-blue hover:bg-bio-blue/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="px-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleQuickAction("Help me design CRISPR guide RNA sequences for a specific gene target. I need assistance with target selection, PAM site identification, and off-target analysis.")}
              >
                <Dna className="h-4 w-4 mr-3 text-bio-teal" />
                <div>
                  <div className="font-medium">CRISPR Design</div>
                  <div className="text-xs text-gray-500">Guide RNA sequences</div>
                </div>
              </Button>

              <Button
                variant="ghost"
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
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleQuickAction("Please help me analyze biological sequences. I need assistance with DNA/RNA/protein sequence analysis, including alignment, annotation, and functional prediction.")}
              >
                <BarChart3 className="h-4 w-4 mr-3 text-bio-purple" />
                <div>
                  <div className="font-medium">Sequence Analysis</div>
                  <div className="text-xs text-gray-500">DNA/RNA/Protein</div>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleQuickAction("I want to visualize molecular structures. Can you help me with 3D protein structure analysis, molecular modeling, and structural predictions?")}
              >
                <Atom className="h-4 w-4 mr-3 text-bio-orange" />
                <div>
                  <div className="font-medium">Molecular Visualization</div>
                  <div className="text-xs text-gray-500">3D protein structures</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Sessions</h3>
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No recent sessions
                  </p>
                ) : (
                  sessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSessionClick(session)}
                    >
                      <MessageSquare className="h-4 w-4 mr-3 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{session.title}</div>
                        <div className="text-xs text-gray-500">{session.timestamp}</div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Demo Usage</span>
                <span className="text-sm text-bio-teal font-medium">Free</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-bio-teal h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Demo mode</span>
                <span>Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}