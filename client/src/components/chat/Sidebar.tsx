import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { newChat, sessions } = useChat();

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
    },
  ];

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
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", action.color)}>
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
                  <div key={index} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <p className="font-medium text-sm truncate">{session.title || 'New Chat'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{session.timestamp}</p>
                  </div>
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
