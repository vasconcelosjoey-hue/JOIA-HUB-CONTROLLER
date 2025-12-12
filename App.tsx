
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { MeetingCreator } from './components/MeetingCreator';
import { AIToolsManager } from './components/AIToolsManager';
import { PlatformManager } from './components/PlatformManager';
import { PartnershipManager } from './components/PartnershipManager';
import { NotificationCenter } from './components/NotificationCenter';
import { LayoutGrid, CalendarPlus, Bot, Layers, CreditCard, Bell } from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useFirestoreDocument } from './hooks/useFirestore';
import { GLOBAL_SETTINGS_ID } from './constants';

// Define Views
type View = 'dashboard' | 'meetings' | 'ai-tools' | 'platforms' | 'partnership';

function App() {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const { alerts: activeAlerts } = useNotifications();

  // Persistence: Active View (Rehydrates from Firestore)
  // Shared global settings document
  const { data: settings, setDocument: updateSettings } = useFirestoreDocument(
      'settings', 
      GLOBAL_SETTINGS_ID, 
      { lastView: 'dashboard' }
  );

  const currentView = (settings as any)?.lastView || 'dashboard';

  const setCurrentView = (view: View) => {
      updateSettings({ lastView: view });
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Projetos', icon: LayoutGrid },
    { id: 'meetings', label: 'Reuniões', icon: CalendarPlus },
    { id: 'ai-tools', label: 'Tools IA', icon: Bot },
    { id: 'platforms', label: 'Mensalidades', icon: Layers },
    { id: 'partnership', label: 'Parcerias', icon: CreditCard },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'meetings': return <MeetingCreator onBack={() => {}} />;
      case 'ai-tools': return <AIToolsManager />;
      case 'platforms': return <PlatformManager />;
      case 'partnership': return <PartnershipManager onAddCard={() => {}} onDeleteCard={() => {}} cards={[]} />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
      const item = navItems.find(i => i.id === currentView);
      return item ? item.label : 'Dashboard';
  }

  return (
    <div className="flex h-screen w-screen bg-[#F5F5F7] text-black font-sans overflow-hidden">
      
      {/* GLOBAL NOTIFICATIONS (Toast/Modal) */}
      <NotificationCenter 
          isOpen={isAlertsOpen} 
          onClose={() => setIsAlertsOpen(false)} 
          alerts={activeAlerts} 
      />

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
             <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white font-black text-xs mr-3 shadow-sm">
                J.
             </div>
             <span className="font-bold text-lg tracking-tight text-black">JoI.A. HUB</span>
          </div>

          <nav className="p-4 space-y-1">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">Menu Principal</p>
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-black text-white shadow-lg' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </button>
              );
            })}

            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-6">Sistema</p>
            
            <button
                onClick={() => setIsAlertsOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
            >
                <div className="relative">
                  <Bell size={18} strokeWidth={2} />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                Alertas
                {activeAlerts.length > 0 && (
                    <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {activeAlerts.length}
                    </span>
                )}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
           <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs border border-white shadow-sm">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-black truncate">Admin User</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">Workspace Ativo</p>
              </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F5F5F7]">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight">
               {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Header Actions can go here */}
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-10">
             {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
