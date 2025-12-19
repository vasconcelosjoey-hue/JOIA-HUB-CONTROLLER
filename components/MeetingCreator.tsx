import React, { useState } from 'react';
import { Calendar, Check, Wand2, Copy, Sparkles, ExternalLink, MessageSquare, Loader2 } from 'lucide-react';
import { useFirestoreDocument } from '../hooks/useFirestore';
import { GLOBAL_SETTINGS_ID } from '../constants';

interface MeetingCreatorProps {
    onBack: () => void;
}

export const MeetingCreator: React.FC<MeetingCreatorProps> = () => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [participants, setParticipants] = useState('');
    const [smartBoxContent, setSmartBoxContent] = useState('');
    const [generatedInvite, setGeneratedInvite] = useState('');
    const [copied, setCopied] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    
    const { data: settings, setDocument: setSettings } = useFirestoreDocument<{ gcal_connected: boolean }>(
        'settings', 
        GLOBAL_SETTINGS_ID, 
        { gcal_connected: false }
    );
    const isGCalConnected = settings?.gcal_connected ?? false;

    const handleGenerate = () => {
        if (!title || !date || !time || !smartBoxContent) return;
        setIsThinking(true);
        setTimeout(() => {
            const text = `🗓 **CONVITE: ${title}**\n\nOlá time,\n\nGostaria de agendar a seguinte reunião: **${title}**.\n\n**Pauta / Assuntos:**\n${smartBoxContent}\n\n📍 **Detalhes:**\nData: ${date.split('-').reverse().join('/')}\nHorário: ${time}\nDuração: ${duration} min\nLink: Google Meet (Automático no Evento)\n\nConto com a presença de todos.`;
            setGeneratedInvite(text.trim());
            setIsThinking(false);
        }, 1000);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedInvite);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddToGoogleCalendar = () => {
        if (!date || !time || !title) return;
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (parseInt(duration) * 60000));
        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
        const start = formatTime(startDateTime);
        const end = formatTime(endDateTime);
        const gCalUrl = new URL('https://calendar.google.com/calendar/render');
        gCalUrl.searchParams.append('action', 'TEMPLATE');
        gCalUrl.searchParams.append('text', title);
        gCalUrl.searchParams.append('dates', `${start}/${end}`);
        gCalUrl.searchParams.append('details', generatedInvite);
        gCalUrl.searchParams.append('add', participants);
        gCalUrl.searchParams.append('location', 'Google Meet'); 
        window.open(gCalUrl.toString(), '_blank');
    };

    const toggleGCal = () => {
        setSettings({ gcal_connected: !isGCalConnected });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleGenerate();
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-apple border border-gray-200">
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Título da Reunião</label>
                            <input 
                                type="text"
                                value={title}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                placeholder="Pauta da conversa..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</label>
                                <input 
                                    type="date"
                                    value={date}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hora</label>
                                <input 
                                    type="time"
                                    value={time}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles size={12} className="fill-purple-600" /> SMART BOX PAUTA
                            </label>
                            <div className="relative">
                                <textarea 
                                    value={smartBoxContent}
                                    onChange={(e) => setSmartBoxContent(e.target.value)}
                                    className="w-full bg-purple-50/50 border border-purple-200 rounded-2xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all min-h-[120px] resize-none text-sm leading-relaxed"
                                    placeholder="Descreva o que será discutido para gerar o convite..."
                                />
                                <MessageSquare size={16} className="absolute bottom-4 right-4 text-purple-300" />
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center pt-2">
                             <button 
                                onClick={toggleGCal}
                                className={`w-full px-4 py-3 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 transition-all border shadow-sm ${
                                    isGCalConnected 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-black hover:text-black'
                                }`}
                            >
                                <Calendar size={14} className={isGCalConnected ? 'fill-emerald-200' : ''} />
                                {isGCalConnected ? 'Integração Google Agenda Ativa' : 'Ativar Integração Google Agenda'}
                                {isGCalConnected && <Check size={12} strokeWidth={4} />}
                            </button>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={!title || !date || !time || !smartBoxContent || isThinking}
                            className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 transition-all shadow-xl ${
                                (!title || !date || !time || !smartBoxContent) ? 'bg-gray-100 text-gray-400' :
                                'bg-black text-white hover:bg-gray-800'
                            }`}
                        >
                            {isThinking ? <Loader2 size={18} className="animate-spin" /> : <><Wand2 size={18} /> GERAR CONVITE SMART</>}
                        </button>
                    </div>
                </div>

                <div className="relative h-full">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-float border border-gray-200 h-full flex flex-col">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">Preview do Convite</h3>
                        
                        {generatedInvite ? (
                            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                                <div className="bg-gray-50 rounded-2xl p-5 font-mono text-xs font-medium text-gray-800 whitespace-pre-wrap border border-gray-200 leading-relaxed flex-1 overflow-y-auto custom-scrollbar shadow-inner">
                                    {generatedInvite}
                                </div>
                                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                    <button 
                                        onClick={copyToClipboard}
                                        className={`flex-1 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-[11px] uppercase tracking-widest ${copied ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white border-2 border-gray-200 text-black hover:border-black'} shadow-lg`}
                                    >
                                        {copied ? <Check size={18} strokeWidth={3}/> : <Copy size={18} />}
                                        {copied ? 'COPIADO COM SUCESSO' : 'COPIAR TEXTO'}
                                    </button>

                                    {isGCalConnected && (
                                        <button 
                                            onClick={handleAddToGoogleCalendar}
                                            className="flex-1 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-xl text-[11px] uppercase tracking-widest"
                                        >
                                            <ExternalLink size={18} />
                                            SALVAR NA AGENDA
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-10 text-center">
                                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-5 border border-gray-100 shadow-sm">
                                    <Sparkles size={32} className="text-gray-200" />
                                </div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Aguardando inputs...</p>
                                <p className="text-xs text-gray-300 mt-2">O preview aparecerá aqui após o processamento.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};