
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { MeetingCreator } from './components/MeetingCreator';
import { AIToolsManager } from './components/AIToolsManager';
import { PartnershipManager } from './components/PartnershipManager';
import { BalanceManager } from './components/BalanceManager';
import { NotificationCenter } from './components/NotificationCenter';
import { LayoutGrid, CalendarPlus, Bot, CreditCard, Bell, PieChart } from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useFirestoreDocument } from './hooks/useFirestore';
import { GLOBAL_SETTINGS_ID } from './constants';
import { ToastProvider } from './context/ToastContext';

// Define Views
type View = 'dashboard' | 'meetings' | 'ai-tools' | 'partnership' | 'balance';

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
      // Scroll to top on mobile when changing views
      window.scrollTo(0,0);
  };

  // Primary Navigation Items (Top)
  const mainNavItems = [
    { id: 'dashboard', label: 'Projetos', icon: LayoutGrid },
    { id: 'ai-tools', label: 'Ferramentas & Custos', icon: Bot }, // Merged Tools + Platforms
    { id: 'partnership', label: 'Parcerias', icon: CreditCard },
  ];

  // System/Management Navigation Items (Bottom)
  const systemNavItems = [
    { id: 'balance', label: 'Balance', icon: PieChart },
    { id: 'meetings', label: 'Reuniões', icon: CalendarPlus },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'balance': return <BalanceManager />;
      case 'meetings': return <MeetingCreator onBack={() => {}} />;
      case 'ai-tools': return <AIToolsManager />; // Handles both Tools & Platforms now
      case 'partnership': return <PartnershipManager onAddCard={() => {}} onDeleteCard={() => {}} cards={[]} />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
      const allItems = [...mainNavItems, ...systemNavItems];
      const item = allItems.find(i => i.id === currentView);
      return item ? item.label : 'Dashboard';
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[#F5F5F7] text-black font-sans overflow-hidden">
        
        {/* GLOBAL NOTIFICATIONS (Toast/Modal) */}
        <NotificationCenter 
            isOpen={isAlertsOpen} 
            onClose={() => setIsAlertsOpen(false)} 
            alerts={activeAlerts} 
        />

        {/* --- DESKTOP/TABLET SIDEBAR (Hidden on Mobile) --- */}
        <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col justify-between shrink-0 z-20 transition-all">
          <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center px-4 border-b border-gray-100 shrink-0">
               <img 
                  src="/logo.png" 
                  alt="CarryOn Consultoria" 
                  className="max-h-12 w-auto object-contain"
                  onError={(e) => {
                      // Fallback to text if image is missing
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
               />
               <span className="hidden font-black text-xl tracking-tight text-black">CarryOn</span>
            </div>

            <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">Principal</p>
              
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </button>
                );
              })}

              <div className="my-4 border-t border-gray-100"></div>

              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gestão</p>

              {systemNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-100 shrink-0">
              <button
                  onClick={() => setIsAlertsOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-black transition-all mb-1"
              >
                  <div className="relative">
                    <Bell size={16} strokeWidth={2} />
                    {activeAlerts.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  Alertas
                  {activeAlerts.length > 0 && (
                      <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          {activeAlerts.length}
                      </span>
                  )}
              </button>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT WRAPPER --- */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F5F5F7]">
          
          {/* --- MOBILE TOP HEADER (Visible only on Mobile) --- */}
          <header className="md:hidden h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10 sticky top-0">
               <div className="flex items-center">
                   <img 
                      src="/logo.png" 
                      alt="CarryOn" 
                      className="h-8 w-auto object-contain"
                   />
               </div>
               <button
                  onClick={() => setIsAlertsOpen(true)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                  <Bell size={18} strokeWidth={2} />
                  {activeAlerts.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
              </button>
          </header>

          {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
          <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 items-center justify-between px-6 shrink-0 z-10 sticky top-0">
            <div>
              <h1 className="text-xl font-bold text-black tracking-tight">
                 {getPageTitle()}
              </h1>
            </div>
            <div className="flex items-center gap-4">
               {/* Header Actions */}
            </div>
          </header>

          {/* --- CONTENT AREA --- */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar pb-24 md:pb-8">
            <div className="max-w-6xl mx-auto">
               {/* Mobile Page Title */}
               <div className="md:hidden mb-4 mt-1">
                  <h1 className="text-xl font-bold text-black tracking-tight">{getPageTitle()}</h1>
               </div>
               {renderContent()}
            </div>
          </main>

          {/* --- MOBILE BOTTOM NAVIGATION (Visible only on Mobile) --- */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-30 flex justify-around items-center px-1 py-2 pb-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              {[...mainNavItems, ...systemNavItems].map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                // Limit mobile nav items if too many
                if (item.id === 'partnership') return null; // Hide Partnership on mobile bar to fit 4 items nicely if needed, or keep all. Let's keep 4 main ones.

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`flex flex-col items-center justify-center gap-0.5 w-full p-1.5 rounded-lg transition-all duration-300 ${
                      isActive ? 'text-black' : 'text-gray-400'
                    }`}
                  >
                    <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-black text-white shadow-md translate-y-[-2px]' : ''}`}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[9px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 scale-0'} transition-all duration-200`}>
                        {item.label}
                    </span>
                  </button>
                );
              })}
          </nav>

        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
