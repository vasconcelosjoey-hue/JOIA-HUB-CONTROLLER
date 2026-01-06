
import React, { useState, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { MeetingCreator } from './components/MeetingCreator';
import { AIToolsManager } from './components/AIToolsManager';
import { PartnershipManager } from './components/PartnershipManager';
import { BalanceManager } from './components/BalanceManager';
import { ExpensesManager } from './components/ExpensesManager';
import { NotificationCenter } from './components/NotificationCenter';
import { Target, Cpu, Handshake, Bell, Activity, Video, Receipt, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useFirestoreDocument } from './hooks/useFirestore';
import { GLOBAL_SETTINGS_ID } from './constants';
import { ToastProvider, useToast } from './context/ToastContext';
import { compressImage } from './services/utils';

type View = 'dashboard' | 'meetings' | 'ai-tools' | 'partnership' | 'balance' | 'expenses';

function AppContent() {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { alerts: activeAlerts } = useNotifications();
  const { addToast } = useToast();

  const { data: settings, setDocument: updateSettings } = useFirestoreDocument(
      'settings', 
      GLOBAL_SETTINGS_ID, 
      { lastView: 'dashboard', appLogo: '/logo.svg' }
  );

  const currentView = (settings as any)?.lastView || 'dashboard';
  const appLogo = (settings as any)?.appLogo || '/logo.svg';

  const setCurrentView = (view: View) => {
      updateSettings({ lastView: view });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            // Comprime a logo para não pesar no banco de dados
            const compressed = await compressImage(base64, 400, 0.8);
            await updateSettings({ appLogo: compressed });
            addToast('Logomarca atualizada!', 'success');
        };
        reader.readAsDataURL(file);
    } catch (error) {
        addToast('Erro ao atualizar logo.', 'error');
    } finally {
        setIsUploadingLogo(false);
    }
  };

  const mainNavItems = [
    { id: 'dashboard', label: 'PROJETOS', icon: Target },
    { id: 'ai-tools', label: 'FERRAMENTAS', icon: Cpu },
    { id: 'partnership', label: 'PARCERIAS', icon: Handshake },
    { id: 'expenses', label: 'DESPESAS', icon: Receipt },
  ];

  const systemNavItems = [
    { id: 'balance', label: 'DASHBOARDS', icon: Activity },
    { id: 'meetings', label: 'REUNIÕES', icon: Video },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'balance': return <BalanceManager />;
      case 'meetings': return <MeetingCreator onBack={() => {}} />;
      case 'ai-tools': return <AIToolsManager />;
      case 'partnership': return <PartnershipManager />;
      case 'expenses': return <ExpensesManager />;
      default: return <Dashboard />;
    }
  };

  const getPageInfo = () => {
      const allItems = [...mainNavItems, ...systemNavItems];
      return allItems.find(i => i.id === currentView) || { label: 'PROJETOS', icon: Target };
  }

  const { label: pageTitle, icon: PageIcon } = getPageInfo();

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] text-black font-sans overflow-hidden">
      <NotificationCenter isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} alerts={activeAlerts} />

      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 z-20 transition-all duration-300">
        <div className="flex flex-col h-full">
          <div className="h-24 flex flex-col items-center justify-center px-4 border-b border-gray-100 group relative">
             <div className="relative cursor-pointer group/logo" onClick={() => logoInputRef.current?.click()}>
                <img src={appLogo} alt="CarryOn" className="max-h-14 w-auto object-contain transition-all group-hover/logo:opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                    {isUploadingLogo ? <Loader2 size={20} className="animate-spin text-black" /> : <ImageIcon size={20} className="text-black" />}
                </div>
             </div>
             <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
             <p className="text-[8px] font-black text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Alterar Logomarca</p>
          </div>

          <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">Principal</p>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-black tracking-tight transition-all uppercase ${isActive ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}>
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
            <div className="my-4 border-t border-gray-100"></div>
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gestão</p>
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-black tracking-tight transition-all uppercase ${isActive ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}>
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button onClick={() => setIsAlertsOpen(true)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-black text-gray-500 hover:bg-gray-50 transition-all relative uppercase">
                <Bell size={16} /> Alertas
                {activeAlerts.length > 0 && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <PageIcon size={20} className="text-black md:w-6 md:h-6" />
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-black text-black tracking-tight leading-none uppercase">{pageTitle}</h1>
              <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">HUB CarryOn Control</p>
            </div>
          </div>
          {/* Logo mobile dinâmica */}
          <div className="md:hidden h-8 flex items-center">
             <img src={appLogo} alt="Logo" className="h-full w-auto object-contain" />
          </div>
          <button onClick={() => setIsAlertsOpen(true)} className="md:hidden relative p-2">
              <Bell size={20} className="text-gray-600" />
              {activeAlerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto h-full">
             {renderContent()}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-30 flex justify-between items-center px-1 py-1 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {[...mainNavItems, ...systemNavItems].map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all ${isActive ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-black text-white shadow-md' : 'bg-transparent'}`}>
                      <Icon size={18} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
