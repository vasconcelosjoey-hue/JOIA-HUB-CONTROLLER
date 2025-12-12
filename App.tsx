
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dashboard } from './components/Dashboard';
import { MeetingCreator } from './components/MeetingCreator';
import { AIToolsManager } from './components/AIToolsManager';
import { PlatformManager } from './components/PlatformManager';
import { PartnershipManager } from './components/PartnershipManager';
import { NotificationCenter } from './components/NotificationCenter';
import { WalletLogin } from './components/WalletLogin';
import { LayoutGrid, CalendarPlus, ArrowLeft, CreditCard, Bell, Bot, Layers, Wallet } from 'lucide-react';
import { NeuralCore } from './components/ui/NeuralCore';
import { useNotifications } from './hooks/useNotifications';

type View = 'hub' | 'dashboard' | 'meetings' | 'alerts' | 'ai-tools' | 'platforms' | 'wallet' | 'partnership';

function App() {
  const [currentView, setCurrentView] = useState<View>('hub');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  // Centralized Notification Logic
  const { alerts: activeAlerts } = useNotifications();

  // --- COMPONENTS FOR HUB BUTTONS ---
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
          else setCurrentView(view as View);
      }

      return (
        <motion.button 
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`${positionClasses} bg-white/80 backdrop-blur-xl rounded-3xl shadow-apple hover:shadow-float transition-all duration-300 flex flex-col items-center justify-center group border border-white/50 z-50 cursor-pointer relative ${isWallet ? 'px-6 py-3 flex-row gap-3' : 'w-24 h-24'}`}
        >
            <div className={`
                ${isWallet ? 'w-8 h-8' : 'mb-2 p-3'} 
                rounded-2xl transition-colors flex items-center justify-center
                ${isAlert && activeAlerts.length > 0 
                    ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' 
                    : 'bg-gray-50 text-black group-hover:bg-black group-hover:text-white'
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
        </motion.button>
      );
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 1.2,
      transition: { duration: 0.5 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  const pageVariants = {
      initial: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      exit: { opacity: 0, scale: 1.1, filter: 'blur(10px)', transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-apple-bg text-black font-sans selection:bg-black selection:text-white relative overflow-hidden">
      
      <NotificationCenter 
          isOpen={isAlertsOpen} 
          onClose={() => setIsAlertsOpen(false)} 
          alerts={activeAlerts} 
      />

      <AnimatePresence mode="wait">
        {currentView === 'hub' ? (
          <motion.div 
            key="hub"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="min-h-screen flex flex-col items-center justify-center relative"
          >
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-gray-200 to-transparent rounded-full opacity-30 blur-[100px] -z-10" />

              {/* Wallet Button (Fixed Top Right) */}
              <motion.div variants={itemVariants} className="absolute top-6 right-6 z-[60]">
                  {renderHubButton('wallet', <Wallet size={16} />, 'WALLET', '', false)}
              </motion.div>

              {/* CENTRAL LAYOUT */}
              <div className="relative w-full max-w-5xl h-full min-h-[600px] flex flex-col md:flex-row items-center justify-center mt-20 md:mt-0">
                  
                  {/* --- NEURAL CORE --- */}
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "backOut", delay: 0.2 }}
                    className="relative z-30 w-48 h-48 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white/50 backdrop-blur-xl rounded-full shadow-float flex items-center justify-center border border-white/60 mb-10 md:mb-0"
                  >
                      <NeuralCore className="w-full h-full text-black opacity-90" />
                  </motion.div>

                  {/* --- SATELLITES (DESKTOP) --- */}
                  <div className="hidden md:block w-[600px] h-[600px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      {/* Orbit Rings */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-gray-300 rounded-full" 
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.3, scale: 1 }}
                        transition={{ duration: 1.5, delay: 0.7 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-dashed border-gray-300 rounded-full" 
                      />

                      {/* Satellite Buttons (Pointer events auto to allow clicking) */}
                      <div className="pointer-events-auto w-full h-full relative">
                        {/* 
                            GRID SYSTEM: 600x600 Container
                            Center: 300, 300
                            Radius: 260px
                            Positions calculated to form a perfect hexagon with Top at 0deg
                        */}

                        {/* 1. Top (Projetos) - (300, 40) */}
                        <div className="absolute left-1/2 top-[40px] -translate-x-1/2 -translate-y-1/2">
                            <motion.div variants={itemVariants}>
                                {renderHubButton('dashboard', <LayoutGrid size={24} strokeWidth={2} />, 'Projetos')}
                            </motion.div>
                        </div>
                        
                        {/* 2. Top Right (Reunião) - (525, 170) */}
                        <div className="absolute left-[525px] top-[170px] -translate-x-1/2 -translate-y-1/2">
                            <motion.div variants={itemVariants}>
                                {renderHubButton('meetings', <CalendarPlus size={24} strokeWidth={2} />, 'Reunião')}
                            </motion.div>
                        </div>

                        {/* 3. Bottom Right (Tools IA) - (525, 430) */}
                        <div className="absolute left-[525px] top-[430px] -translate-x-1/2 -translate-y-1/2">
                            <motion.div variants={itemVariants}>
                                {renderHubButton('ai-tools', <Bot size={24} strokeWidth={2} />, 'Tools IA')}
                            </motion.div>
                        </div>

                        {/* 4. Bottom (Parceria) - (300, 560) */}
                        <div className="absolute left-1/2 top-[560px] -translate-x-1/2 -translate-y-1/2">
                            <motion.div variants={itemVariants}>
                                {renderHubButton('partnership', <CreditCard size={24} strokeWidth={2} />, 'Parceria')}
                            </motion.div>
                        </div>

                         {/* 5. Bottom Left (Mensal) - (75, 430) */}
                         <div className="absolute left-[75px] top-[430px] -translate-x-1/2 -translate-y-1/2">
                            <motion.div variants={itemVariants}>
                                {renderHubButton('platforms', <Layers size={24} strokeWidth={2} />, 'Mensal')}
                            </motion.div>
                        </div>

                        {/* 6. Top Left (Alertas) - (75, 170) */}
                        <div className="absolute left-[75px] top-[170px] -translate-x-1/2 -translate-y-1/2">
                            <motion.div variants={itemVariants}>
                                {renderHubButton('alerts', <Bell size={24} strokeWidth={2} />, 'Alertas', '', true)}
                            </motion.div>
                        </div>
                      </div>
                  </div>

                  {/* --- GRID (MOBILE) --- */}
                  <motion.div 
                    variants={containerVariants}
                    className="md:hidden grid grid-cols-2 gap-4 px-6 pb-20 w-full max-w-sm"
                  >
                       <motion.div variants={itemVariants}>{renderHubButton('dashboard', <LayoutGrid size={24} strokeWidth={2} />, 'Projetos', 'w-full aspect-square')}</motion.div>
                       <motion.div variants={itemVariants}>{renderHubButton('meetings', <CalendarPlus size={24} strokeWidth={2} />, 'Reunião', 'w-full aspect-square')}</motion.div>
                       <motion.div variants={itemVariants}>{renderHubButton('ai-tools', <Bot size={24} strokeWidth={2} />, 'Tools IA', 'w-full aspect-square')}</motion.div>
                       <motion.div variants={itemVariants}>{renderHubButton('partnership', <CreditCard size={24} strokeWidth={2} />, 'Parceria', 'w-full aspect-square')}</motion.div>
                       <motion.div variants={itemVariants}>{renderHubButton('platforms', <Layers size={24} strokeWidth={2} />, 'Mensal', 'w-full aspect-square')}</motion.div>
                       <motion.div variants={itemVariants}>{renderHubButton('alerts', <Bell size={24} strokeWidth={2} />, 'Alertas', 'w-full aspect-square', true)}</motion.div>
                  </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.5 }} 
                transition={{ delay: 1 }}
                className="absolute bottom-8 text-center"
              >
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">JoI.A. Controller v2.0</p>
              </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="module"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-screen overflow-y-auto overflow-x-hidden flex flex-col bg-apple-bg"
          >
              {/* Floating Header Navigation */}
              <div className="sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
                  {/* Glassmorphic Back Button */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView('hub')}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/60 shadow-apple px-4 py-2.5 rounded-full text-sm font-bold text-gray-800 hover:text-black hover:shadow-float transition-all"
                  >
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <ArrowLeft size={14} strokeWidth={3} />
                      </div>
                      VOLTAR AO HUB
                  </motion.button>
                  
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40">
                       <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">JoI.A. SYSTEM</span>
                  </div>
              </div>

              {/* Module Content */}
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-4 pb-20">
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'meetings' && <MeetingCreator onBack={() => setCurrentView('hub')} />}
                {currentView === 'ai-tools' && <AIToolsManager />}
                {currentView === 'platforms' && <PlatformManager />}
                {currentView === 'partnership' && (
                    <PartnershipManager 
                        cards={[]} 
                        onAddCard={() => {}} 
                        onDeleteCard={() => {}} 
                    />
                )}
                {currentView === 'wallet' && <WalletLogin />}
              </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
