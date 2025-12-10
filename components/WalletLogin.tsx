import React, { useState, useEffect } from 'react';
import { Wallet, ArrowRight, Lock, CheckCircle2, UserPlus, LogIn, ChevronRight, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { WalletDashboard } from './WalletDashboard';

// --- Types ---
interface WalletProfile {
    id: string;
    name: string;
    pin: string; 
    balance: number;
}

type ScreenView = 'menu' | 'login-select' | 'login-input' | 'create-name' | 'create-pin' | 'success' | 'dashboard';

export const WalletLogin: React.FC = () => {
    // --- State ---
    const [view, setView] = useState<ScreenView>('menu');
    
    // Switch to Firestore Hook
    const { data: wallets, addItem: addWallet } = useFirestoreCollection<WalletProfile>('wallets');
    
    // Login State
    const [selectedWallet, setSelectedWallet] = useState<WalletProfile | null>(null);
    const [inputPin, setInputPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Creation State
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletPin, setNewWalletPin] = useState('');
    
    // UI Helpers
    const [showPin, setShowPin] = useState(false);

    // --- Actions ---

    const handleCreateWallet = async () => {
        if (newWalletPin.length < 4) {
            setErrorMsg("Mínimo 4 caracteres.");
            return;
        }

        const newId = Date.now().toString();
        const newWallet: WalletProfile = {
            id: newId,
            name: newWalletName,
            pin: newWalletPin,
            balance: 0
        };

        await addWallet(newWallet);
        setSelectedWallet(newWallet);
        setView('success');
    };

    const handleLogin = () => {
        if (!selectedWallet) return;

        if (inputPin === selectedWallet.pin) {
            setView('success');
        } else {
            setErrorMsg("Senha incorreta.");
            setInputPin('');
            setTimeout(() => setErrorMsg(''), 2000);
        }
    };

    // --- TRANSITION TO DASHBOARD ---
    useEffect(() => {
        if (view === 'success') {
            const t = setTimeout(() => {
                setView('dashboard');
            }, 1500);
            return () => clearTimeout(t);
        }
    }, [view]);

    // --- RENDERERS ---

    if (view === 'dashboard' && selectedWallet) {
        // Pass the wallet ID so Dashboard knows where to sync data
        return <WalletDashboard walletId={selectedWallet.id} walletName={selectedWallet.name} />;
    }

    if (view === 'success') {
        return (
            <div className="flex items-center justify-center h-[80vh] animate-in zoom-in-95 duration-500">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-float border border-green-100 p-10 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-black text-black tracking-tight mb-2">Acesso Liberado</h2>
                    <p className="text-gray-500 mb-6 font-medium">Carteira de <span className="text-black font-bold">{selectedWallet?.name}</span> carregada.</p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-pulse">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando Financeiro...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'menu') {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-in fade-in duration-500 max-w-md mx-auto">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Wallet size={32} strokeWidth={2} />
                    </div>
                    <h2 className="text-3xl font-black text-black tracking-tight">JoI.A. Wallet</h2>
                    <p className="text-gray-500 font-medium">Selecione uma opção de acesso.</p>
                </div>

                <div className="w-full space-y-4 px-4">
                    <button 
                        onClick={() => {
                            if (wallets.length === 0) {
                                alert("Nenhuma carteira encontrada. Crie uma nova.");
                                return;
                            }
                            setView('login-select');
                        }}
                        className="w-full bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:shadow-apple-hover transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <LogIn size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-black text-lg">Acessar Existente</p>
                                <p className="text-xs text-gray-500 font-bold uppercase">Senha Segura</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" />
                    </button>

                    <button 
                        onClick={() => setView('create-name')}
                        className="w-full bg-black text-white p-6 rounded-3xl shadow-float hover:scale-[1.02] transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <UserPlus size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-white text-lg">Criar Nova Wallet</p>
                                <p className="text-xs text-white/60 font-bold uppercase">Protegida por Senha</p>
                            </div>
                        </div>
                        <ChevronRight className="text-white/50 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'login-select') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in slide-in-from-right duration-500 max-w-md mx-auto px-6">
                <div className="w-full text-left mb-6">
                    <button onClick={() => setView('menu')} className="text-gray-400 hover:text-black mb-4 font-bold text-sm flex items-center gap-1">
                        &larr; Voltar
                    </button>
                    <h2 className="text-2xl font-black text-black">Quem é você?</h2>
                    <p className="text-gray-500">Selecione sua carteira para continuar.</p>
                </div>
                
                <div className="w-full space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {wallets.map(w => (
                        <button 
                            key={w.id}
                            onClick={() => {
                                setSelectedWallet(w);
                                setInputPin('');
                                setErrorMsg('');
                                setView('login-input');
                            }}
                            className="w-full bg-white border-2 border-gray-100 hover:border-black p-4 rounded-2xl flex items-center justify-between transition-all group"
                        >
                            <span className="font-bold text-lg text-gray-800 group-hover:text-black">{w.name}</span>
                            <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                                <ChevronRight size={16} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'login-input') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in zoom-in-95 duration-500 max-w-md mx-auto px-6">
                 <div className="w-full text-center mb-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-black">Digite sua Senha</h2>
                    <p className="text-gray-500">Acesso para <span className="font-bold text-black">{selectedWallet?.name}</span></p>
                </div>

                <div className="w-full relative mb-4">
                    <input 
                        type={showPin ? "text" : "password"}
                        value={inputPin}
                        onChange={(e) => {
                            if (e.target.value.length <= 6) setInputPin(e.target.value);
                        }}
                        placeholder="******"
                        className={`w-full text-center text-3xl font-black tracking-widest py-6 rounded-2xl border-2 focus:outline-none transition-all ${errorMsg ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 focus:border-black bg-white'}`}
                        autoFocus
                    />
                    <button 
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-2"
                    >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {errorMsg && (
                    <p className="text-red-500 font-bold text-sm mb-6 animate-pulse flex items-center gap-1">
                        <ShieldCheck size={14}/> {errorMsg}
                    </p>
                )}

                <div className="w-full grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setView('login-select')}
                        className="py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleLogin}
                        disabled={inputPin.length === 0}
                        className={`py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                            inputPin.length > 0 ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                        Entrar <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'create-name') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in slide-in-from-right duration-500 max-w-md mx-auto px-6">
                <div className="w-full text-left mb-6">
                    <button onClick={() => setView('menu')} className="text-gray-400 hover:text-black mb-4 font-bold text-sm flex items-center gap-1">
                        &larr; Voltar
                    </button>
                    <h2 className="text-2xl font-black text-black">Nome da Carteira</h2>
                    <p className="text-gray-500">Como você quer chamar esta conta?</p>
                </div>
                
                <input 
                    type="text" 
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="Ex: Carteira Principal"
                    className="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-5 text-xl font-bold focus:border-black outline-none mb-6 shadow-sm"
                    autoFocus
                />

                <button 
                    onClick={() => {
                        if (newWalletName.trim()) {
                            setNewWalletPin('');
                            setView('create-pin');
                        }
                    }}
                    disabled={!newWalletName.trim()}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        newWalletName.trim() ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-400'
                    }`}
                >
                    Continuar <ArrowRight size={18} />
                </button>
            </div>
        );
    }

    if (view === 'create-pin') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in slide-in-from-right duration-500 max-w-md mx-auto px-6">
                <div className="w-full text-left mb-6">
                    <button onClick={() => setView('create-name')} className="text-gray-400 hover:text-black mb-4 font-bold text-sm flex items-center gap-1">
                        &larr; Voltar
                    </button>
                    <h2 className="text-2xl font-black text-black">Crie uma Senha</h2>
                    <p className="text-gray-500">Escolha até 6 caracteres (letras ou números).</p>
                </div>
                
                <div className="w-full relative mb-6">
                    <input 
                        type={showPin ? "text" : "password"}
                        value={newWalletPin}
                        onChange={(e) => {
                             if (e.target.value.length <= 6) setNewWalletPin(e.target.value);
                        }}
                        placeholder="******"
                        className="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-5 text-3xl text-center font-black tracking-widest focus:border-black outline-none shadow-sm"
                        autoFocus
                    />
                     <button 
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-2"
                    >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <div className="flex items-start gap-2 mb-6 bg-blue-50 p-3 rounded-xl">
                    <KeyRound size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        Essa senha será exigida sempre que você tentar acessar a área financeira desta carteira.
                    </p>
                </div>

                <button 
                    onClick={handleCreateWallet}
                    disabled={newWalletPin.length < 4}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        newWalletPin.length >= 4 ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-400'
                    }`}
                >
                    Finalizar <CheckCircle2 size={18} />
                </button>
            </div>
        );
    }

    return null;
};