import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { MeetingCreator } from './components/MeetingCreator';
import { AIToolsManager } from './components/AIToolsManager';
import { PlatformManager } from './components/PlatformManager';
import { PartnershipManager } from './components/PartnershipManager';
import { NotificationCenter, AlertItem } from './components/NotificationCenter';
import { WalletLogin } from './components/WalletLogin';
import { LayoutGrid, CalendarPlus, ArrowLeft, Hexagon, CreditCard, Bell, Bot, Layers, Wallet } from 'lucide-react';
import { PartnershipCard } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getAlertLevel } from './services/utils';
import { NeuralCore } from './components/ui/NeuralCore';

// Initial Empty Data for Partnerships (Clean Slate)
const INITIAL_PARTNERSHIPS: PartnershipCard[] = [];

type View = 'hub' | 'dashboard' | 'meetings' | 'alerts' | 'ai-tools' | 'platforms' | 'wallet' | 'partnership';

function App() {
  const [currentView, setCurrentView] = useState<View>('hub');
  
  // Controls the Notification List Modal
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  
  // Data Fetching for Alerts (Reading from LocalStorage to generate centralized alerts)
  // Partnerships
  const [partnershipCards, setPartnershipCards] = useLocalStorage<PartnershipCard[]>('joia_partnerships', INITIAL_PARTNERSHIPS);
  // AI Tools (Need to match key used in AIToolsManager)
  const [aiTools] = useLocalStorage<any[]>('joia_aitools', []);
  // Platforms (Need to match key used in PlatformManager)
  const [platforms] = useLocalStorage<any[]>('joia_platforms', []);

  // Animation state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- Alert Calculation Logic ---
  useEffect(() => {
      const generatedAlerts: AlertItem[] = [];

      // 1. Check Partnerships
      if (partnershipCards && partnershipCards.length > 0) {
        partnershipCards.forEach(card => {
            const level = getAlertLevel(card.dueDay);
            if (level) {
                generatedAlerts.push({
                    id: `partner-${card.id}`,
                    title: card.companyName,
                    message: 'Pagamento de parceria pendente.',
                    value: card.totalValue,
                    level: level,
                    source: 'Parceria'
                });
            }
        });
      }

      // 2. Check AI Tools
      if (aiTools && aiTools.length > 0) {
        aiTools.forEach(tool => {
            // Assuming tool has { id, name, value, dueDate }
            if (tool.dueDate) {
              const level = getAlertLevel(tool.dueDate);
              if (level) {
                  generatedAlerts.push({
                      id: `tool-${tool.id}`,
                      title: tool.name,
                      message: 'Renovação de ferramenta.',
                      value: tool.value,
                      level: level,
                      source: 'Tools IA'
                  });
              }
            }
        });
      }

      // 3. Check Platforms
      if (platforms && platforms.length > 0) {
        platforms.forEach(plat => {
            // Assuming plat has { id, name, value, dueDate, client }
            if (plat.dueDate) {
                const level = getAlertLevel(plat.dueDate);
                if (level) {
                    generatedAlerts.push({
                        id: `plat-${plat.id}`,
                        title: plat.name,
                        message: `Mensalidade Cliente: ${plat.client || 'N/A'}`,
                        value: plat.value,
                        level: level,
                        source: 'Plataforma'
                    });
                }
            }
        });
      }

      // Sort: Red first, then by value desc
      generatedAlerts.sort((a, b) => {
          if (a.level === 'red' && b.level !== 'red') return -1;
          if (a.level !== 'red' && b.level === 'red') return 1;
          return b.value - a.value;
      });

      setActiveAlerts(generatedAlerts);

  }, [partnershipCards, aiTools, platforms]);


  const handleViewChange = (view: View) => {
      if (view === currentView) return;
      setIsTransitioning(true);
      setCurrentView(view);
      setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleAddPartnership = (newCard: PartnershipCard) => {
      setPartnershipCards([...partnershipCards, newCard]);
  };

  const handleDeletePartnership = (id: string) => {
      setPartnershipCards(partnershipCards.filter(c => c.id !== id));
  };

  // --- COMPONENTS FOR HUB BUTTONS (Reused for Mobile/Desktop) ---
  const renderHubButton = (
      view: View | 'alerts', 
      icon: React.ReactNode, 
      label: string, 
      positionClasses: string = '',
      isAlert: boolean = false
  ) => {
      const isWallet = view === 'wallet';
      
      const handleClick = () => {
          if (view === 'alerts') setIsAlertsOpen(true);
          else handleViewChange(view as View);
      }

      // Z-INDEX INCREASED TO 50 TO ENSURE CLICKABILITY OVER ORBITS/CORES
      return (
        <button 
            onClick={handleClick}
            className={`${positionClasses} bg-white rounded-2xl shadow-apple hover:shadow-apple-hover transition-all duration-300 flex flex-col items-center justify-center group border border-gray-100 z-50 cursor-pointer ${isWallet ? 'px-6 py-3 flex-row gap-3' : 'w-24 h-24 hover:scale-110'}`}
        >
            <div className={`
                ${isWallet ? 'w-8 h-8' : 'mb-1 p-2'} 
                rounded-full transition-colors flex items-center justify-center
                ${isAlert && activeAlerts.length > 0 
                    ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' 
                    : 'bg-gray-100 group-hover:bg-black group-hover:text-white text-black'
                }
                ${isWallet ? 'bg-black text-white' : ''}
            `}>
                {icon}
                {isAlert && activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>
            <span className={`font-bold text-gray-800 group-hover:text-black uppercase tracking-wide ${isWallet ? 'text-sm' : 'text-[10px]'}`}>
                {label}
            </span>
        </button>
      );
  }

  // Function to render the central circular menu
  const renderHub = () => (
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${isTransitioning ? 'scale-150 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gray-200 rounded-full opacity-40 blur-3xl -z-10 animate-pulse"></div>
        
        {/* --- HEADER (Wallet) --- */}
        {/* Mobile: Sticky Top, Desktop: Absolute Top Right */}
        <div className="absolute top-0 right-0 p-6 z-[60] w-full flex justify-end pointer-events-none">
            {/* Wrapper to re-enable pointer events for the button specifically */}
            <div className="pointer-events-auto">
                {renderHubButton('wallet', <Wallet size={16} />, 'WALLET', '')}
            </div>
        </div>

        {/* --- CENTRAL CORE & LAYOUT --- */}
        <div className="relative w-full max-w-lg h-full flex flex-col md:block items-center justify-center mt-24 md:mt-0">
            
            {/* 1. MOBILE NEURAL CORE (Visible only on Mobile) */}
            <div className="md:hidden relative z-30 w-40 h-40 bg-white rounded-full shadow-float flex flex-col items-center justify-center cursor-default border-4 border-gray-50 overflow-hidden mb-8 shrink-0">
                 <NeuralCore className="w-full h-full text-black opacity-80" />
            </div>

            {/* 2. DESKTOP ORBITAL LAYOUT (Visible only on Desktop) */}
            <div className="hidden md:block w-[500px] h-[500px] relative mx-auto">
                {/* 
                   DESKTOP CORE - NOW INSIDE THE ORBIT CONTAINER 
                   Z-Index set to 30, Buttons are 50, so Buttons are always on top.
                */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-40 h-40 bg-white rounded-full shadow-float flex flex-col items-center justify-center cursor-default hover:scale-105 transition-transform duration-700 border-4 border-gray-50 overflow-hidden group">
                     <NeuralCore className="w-full h-full text-black opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Satellites positioned absolutely relative to this same 500x500 box */}
                {renderHubButton('dashboard', <LayoutGrid size={22} strokeWidth={2.5} />, 'Projetos', 'absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/4')}
                {renderHubButton('meetings', <CalendarPlus size={22} strokeWidth={2.5} />, 'Reunião', 'absolute top-1/4 right-[12%]')}
                {renderHubButton('ai-tools', <Bot size={22} strokeWidth={2.5} />, 'Tools IA', 'absolute bottom-1/4 right-[12%]')}
                {renderHubButton('partnership', <CreditCard size={22} strokeWidth={2.5} />, 'Parceria', 'absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/4')}
                {renderHubButton('platforms', <Layers size={22} strokeWidth={2.5} />, 'Mensal', 'absolute bottom-1/4 left-[12%]')}
                {renderHubButton('alerts', <Bell size={22} strokeWidth={2.5} />, 'Alertas', 'absolute top-1/4 left-[12%]', true)}

                 {/* Orbit Rings (Desktop Only) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-gray-200 rounded-full -z-10 opacity-60 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] border border-gray-100 rounded-full -z-10 opacity-40 pointer-events-none dashed-border"></div>
            </div>

            {/* 3. MOBILE GRID LAYOUT (Hidden on Desktop) */}
            <div className="md:hidden grid grid-cols-2 gap-4 px-6 pb-12 w-full max-w-sm z-40 relative">
                 {renderHubButton('dashboard', <LayoutGrid size={24} strokeWidth={2.5} />, 'Projetos', 'w-full aspect-square')}
                 {renderHubButton('meetings', <CalendarPlus size={24} strokeWidth={2.5} />, 'Reunião', 'w-full aspect-square')}
                 {renderHubButton('ai-tools', <Bot size={24} strokeWidth={2.5} />, 'Tools IA', 'w-full aspect-square')}
                 {renderHubButton('partnership', <CreditCard size={24} strokeWidth={2.5} />, 'Parceria', 'w-full aspect-square')}
                 {renderHubButton('platforms', <Layers size={24} strokeWidth={2.5} />, 'Mensal', 'w-full aspect-square')}
                 {renderHubButton('alerts', <Bell size={24} strokeWidth={2.5} />, 'Alertas', 'w-full aspect-square', true)}
            </div>

        </div>
        
        {/* Footer Text */}
        <div className="absolute bottom-4 w-full text-center md:bottom-8 md:right-8 md:text-right md:w-auto">
            <p className="text-gray-400 font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">
                Pressione um módulo para iniciar
            </p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text font-sans selection:bg-black selection:text-white relative perspective-container">
      
      {/* Central Notification Handler (Toast & Modal) */}
      <NotificationCenter 
          isOpen={isAlertsOpen} 
          onClose={() => setIsAlertsOpen(false)} 
          alerts={activeAlerts} 
      />

      {/* Main Content View Switcher */}
      {currentView === 'hub' && renderHub()}

      {/* Detail Views with 3D Transition */}
      {currentView !== 'hub' && (
          <div className="view-container animate-enter-3d flex flex-col">
              
              {/* Back Navigation Floating Button */}
              <div className="sticky top-0 z-40 bg-apple-bg/95 backdrop-blur-md px-6 py-4 border-b border-gray-300 flex justify-between items-center shadow-sm">
                  <button 
                    onClick={() => setCurrentView('hub')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black transition-colors"
                  >
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm">
                        <ArrowLeft size={18} strokeWidth={3} />
                      </div>
                      VOLTAR AO HUB
                  </button>
                  <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-gray-400 tracking-widest uppercase">JoI.A. SYSTEM</span>
                  </div>
              </div>

              {/* Content Container */}
              <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'meetings' && <MeetingCreator onBack={() => setCurrentView('hub')} />}
                {currentView === 'ai-tools' && <AIToolsManager />}
                {currentView === 'platforms' && <PlatformManager />}
                {currentView === 'partnership' && (
                    <PartnershipManager 
                        cards={partnershipCards} 
                        onAddCard={handleAddPartnership} 
                        onDeleteCard={handleDeletePartnership} 
                    />
                )}
                {currentView === 'wallet' && <WalletLogin />}
              </main>
          </div>
      )}

    </div>
  );
}

export default App;