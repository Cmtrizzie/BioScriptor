import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { newChat, sessions, sendMessage, switchToSession } = useChat();

  const quickActions = [
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 0v1a1 1 0 102 0V3a2 2 0 012 2v6.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 11.5V5zM7 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" />
        </svg>
      ),
      title: "CRISPR Design",
      subtitle: "Guide RNA sequences",
      color: "bg-bio-teal/10 text-bio-teal",
      prompt: "Design CRISPR guide RNAs for the BRCA1 gene. I need high-specificity guides with minimal off-target effects."
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      title: "PCR Simulation",
      subtitle: "Virtual gel electrophoresis",
      color: "bg-blue-100 text-blue-600",
      prompt: "Simulate a PCR reaction with these primers: Forward: 5'-ATGCGATCGATCG-3', Reverse: 5'-CGATCGATCGCAT-3'. Show expected product size and gel visualization."
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      title: "Sequence Analysis",
      subtitle: "DNA/RNA/Protein",
      color: "bg-purple-100 text-purple-600",
      prompt: "Analyze this DNA sequence for ORFs, restriction sites, and GC content: ATGCGATCGATCGCTAGCTAGCTAGC"
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
      title: "Molecular Visualization",
      subtitle: "3D protein structures",
      color: "bg-green-100 text-green-600",
      prompt: "Load and visualize the 3D structure of hemoglobin (PDB: 1HHO). Show me the heme groups and highlight the alpha and beta chains."
    }
  ];

  const handleQuickAction = async (action: typeof quickActions[0]) => {
    onClose(); // Close sidebar on mobile
    await sendMessage(action.prompt);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-40",
        "fixed lg:relative inset-y-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:block"
      )}>
        <div className="p-4 h-full flex flex-col">
          {/* Close button for mobile */}
          <div className="flex justify-between items-center lg:hidden mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* New Chat Button */}
          <Button 
            onClick={() => { newChat(); onClose(); }}
            className="w-full bg-bio-blue hover:bg-bio-blue/90 text-white px-4 py-3 rounded-lg font-medium transition-colors mb-4 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </Button>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <button 
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105", action.color)}>
                      {action.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{action.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Sessions</h3>
            <div className="space-y-2 scrollbar-hide overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent sessions</p>
              ) : (
                sessions.map((session, index) => (
                  <button
                    key={session.id || index}
                    onClick={() => {
                      switchToSession(session);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group border-l-2 border-transparent hover:border-bio-blue"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-bio-blue">{session.title || 'New Chat'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.timestamp}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {session.messages.length} messages
                        </p>
                      </div>
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-bio-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Usage</span>
              <span className="text-sm text-bio-teal font-medium">Pro</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div className="bg-bio-teal h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>247 queries</span>
              <span>Unlimited</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
