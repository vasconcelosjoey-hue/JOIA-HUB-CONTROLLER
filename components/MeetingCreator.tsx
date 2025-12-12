
import React, { useState } from 'react';
import { Calendar, Check, Wand2, Copy, Sparkles, ExternalLink, MessageSquare } from 'lucide-react';
import { useFirestoreDocument } from '../hooks/useFirestore';
import { GLOBAL_SETTINGS_ID } from '../constants';

interface MeetingCreatorProps {
    onBack: () => void;
}

export const MeetingCreator: React.FC<MeetingCreatorProps> = ({ onBack }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [participants, setParticipants] = useState('');
    
    // Smart Box State
    const [smartBoxContent, setSmartBoxContent] = useState('');

    const [generatedInvite, setGeneratedInvite] = useState('');
    const [copied, setCopied] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    
    // Persist Google Calendar Integration (Global Settings)
    const { data: settings, setDocument: setSettings } = useFirestoreDocument<{ gcal_connected: boolean }>(
        'settings', 
        GLOBAL_SETTINGS_ID, 
        { gcal_connected: false }
    );
    const isGCalConnected = settings?.gcal_connected ?? false;

    const handleGenerate = () => {
        setIsThinking(true);
        setTimeout(() => {
            // Usa o conteúdo exato do Smart Box no lugar da pauta fixa
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

        // 1. Calculate Start and End DateTimes
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (parseInt(duration) * 60000));

        // 2. Format to Google Calendar ISO format (YYYYMMDDTHHmmSSZ)
        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

        const start = formatTime(startDateTime);
        const end = formatTime(endDateTime);

        // 3. Prepare Description
        let calendarDetails = generatedInvite;
        calendarDetails = calendarDetails.replace(
            'Link: Google Meet (Automático no Evento)', 
            'Link: 📹 Utilize o botão "Entrar com Google Meet" anexado a este evento.'
        );
        // Fallback
        calendarDetails = calendarDetails.replace('[Google Meet]', '📹 Link disponível no botão do evento.');

        // 4. Build URL
        const gCalUrl = new URL('https://calendar.google.com/calendar/render');
        gCalUrl.searchParams.append('action', 'TEMPLATE');
        gCalUrl.searchParams.append('text', title);
        gCalUrl.searchParams.append('dates', `${start}/${end}`);
        gCalUrl.searchParams.append('details', calendarDetails);
        gCalUrl.searchParams.append('add', participants);
        gCalUrl.searchParams.append('location', 'Google Meet'); 
        gCalUrl.searchParams.append('sprop', 'website:www.joia.com');

        // 5. Open
        window.open(gCalUrl.toString(), '_blank');
    };

    const toggleGCal = () => {
        setSettings({ gcal_connected: !isGCalConnected });
    };

    return (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
            
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                 <div className="text-center md:text-left">
                    <h2 className="text-2xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                        <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-purple-600 fill-purple-600" strokeWidth={1.5}/>
                        Smart Meeting
                    </h2>
                    <p className="text-gray-600 font-semibold mt-0.5 text-center md:text-left text-sm">Gere convites perfeitos em segundos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Form Card */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-apple border border-gray-200">
                    <div className="space-y-4">
                        
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Título da Reunião</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all placeholder:font-normal text-sm"
                                placeholder="Ex: Alinhamento Semanal..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Data</label>
                                <input 
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2 py-2.5 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-xs md:text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Hora</label>
                                <input 
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2 py-2.5 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-xs md:text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Participantes (Emails)</label>
                            <input 
                                type="text"
                                value={participants}
                                onChange={(e) => setParticipants(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm"
                                placeholder="joey@exemplo.com, spencer@exemplo.com"
                            />
                        </div>

                        {/* SMART BOX */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black text-purple-600 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles size={12} className="fill-purple-200" /> SMART BOX
                            </label>
                            <div className="relative">
                                <textarea 
                                    value={smartBoxContent}
                                    onChange={(e) => setSmartBoxContent(e.target.value)}
                                    className="w-full bg-purple-50 border border-purple-200 rounded-lg px-3 py-2.5 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all min-h-[90px] resize-none text-sm leading-relaxed"
                                    placeholder="Digite aqui a pauta, objetivos e tópicos que devem aparecer no convite..."
                                />
                                <MessageSquare size={14} className="absolute bottom-3 right-3 text-purple-300" />
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold">O convite só será gerado com o conteúdo desta caixa.</p>
                        </div>

                        {/* Moved Google Calendar Button to center above Generate Button */}
                        <div className="flex flex-col items-center justify-center pt-1">
                             <button 
                                onClick={toggleGCal}
                                className={`w-full md:w-auto px-4 py-2 rounded-full font-bold text-[10px] flex items-center justify-center gap-2 transition-all border shadow-sm ${
                                    isGCalConnected 
                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                                }`}
                            >
                                <Calendar size={12} className={isGCalConnected ? 'fill-green-200' : ''} />
                                {isGCalConnected ? 'Integração Ativa' : 'Ativar Google Agenda'}
                                {isGCalConnected && <Check size={10} strokeWidth={4} />}
                            </button>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={!title || !date || !time || !smartBoxContent || isThinking}
                            className={`w-full mt-1 py-3 rounded-lg font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg transform active:scale-[0.98] ${
                                (!title || !date || !time || !smartBoxContent) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                                'bg-black text-white hover:bg-gray-800'
                            }`}
                        >
                            {isThinking ? 'PROCESSANDO...' : <><Wand2 size={16} strokeWidth={2.5} /> GERAR CONVITE</>}
                        </button>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="relative">
                    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-float border border-gray-200 relative z-10">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Resultado</h3>
                        
                        {generatedInvite ? (
                            <>
                                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs font-medium text-black whitespace-pre-wrap border border-gray-200 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {generatedInvite}
                                </div>
                                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                    <button 
                                        onClick={copyToClipboard}
                                        className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-xs ${copied ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-white border-2 border-gray-200 text-black hover:border-black'}`}
                                    >
                                        {copied ? <Check size={16} strokeWidth={3}/> : <Copy size={16} strokeWidth={2.5}/>}
                                        {copied ? 'COPIADO!' : 'COPIAR'}
                                    </button>

                                    {isGCalConnected && (
                                        <button 
                                            onClick={handleAddToGoogleCalendar}
                                            className="flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg text-xs"
                                        >
                                            <ExternalLink size={16} strokeWidth={2.5} />
                                            AGENDA
                                        </button>
                                    )}
                                </div>
                                {!isGCalConnected && (
                                    <p className="text-center text-[9px] text-gray-400 mt-2 font-medium">Ative a integração no botão acima para salvar na agenda.</p>
                                )}
                            </>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-300">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                    <Calendar size={24} className="text-gray-300" strokeWidth={2}/>
                                </div>
                                <p className="text-sm font-bold text-gray-400">Preencha o Smart Box...</p>
                            </div>
                        )}
                    </div>
                    {/* Decoration element behind */}
                    <div className="absolute -top-3 -right-3 w-full h-full bg-gray-200 rounded-2xl -z-10 rotate-2 opacity-50 hidden md:block"></div>
                </div>
            </div>
        </div>
    );
};
