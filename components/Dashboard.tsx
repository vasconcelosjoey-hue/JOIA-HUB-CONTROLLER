
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { formatCurrency, extractDominantColor, compressImage, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { Briefcase, Building2, Plus, X, MapPin, Upload, Trash2, MessageCircle, ExternalLink, Check, Navigation, Loader2, Search } from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestore';

export const Dashboard: React.FC = () => {
  const { data: projects, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<Project>('projects');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Action Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newCNPJ, setNewCNPJ] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newVal, setNewVal] = useState(''); // String controlled for smart formatting

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProject = async () => {
    if (!newName) return;
    setIsSubmitting(true);

    try {
        const newProject: any = {
            nome: newName,
            cnpj: newCNPJ || 'NÃO INFORMADO',
            status: 'EM TREINAMENTO',
            dataStart: newStartDate || new Date().toISOString(),
            diaMensalidade: 5,
            supervisorName: newSupervisor,
            supervisorContact: newContact,
            valorContrato: parseCurrencyInput(newVal),
            brandColor: '#000000',
            address: '',
            createdAt: new Date().toISOString()
        };

        await addItem(newProject);
        setIsAdding(false);
        resetForm();
    } catch (error) {
        console.error("Error adding project", error);
        alert("Erro ao adicionar projeto.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName(''); setNewCNPJ(''); setNewSupervisor(''); setNewContact(''); setNewStartDate(''); setNewVal('');
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      const confirmDelete = window.confirm(
          "⚠️ AÇÃO IRREVERSÍVEL\n\nDeseja realmente EXCLUIR este projeto?\nClique em 'OK' para confirmar."
      );
      if (confirmDelete) {
          await deleteItem(id);
      }
  };

  const handleSaveEdit = async () => {
      if (!editingProject) return;
      setIsSaving(true);
      try {
          await updateItem(editingProject.id, editingProject);
          setEditingProject(null);
      } catch (error) {
          console.error("Error updating project", error);
          alert("Erro ao salvar alterações.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && editingProject) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const result = reader.result as string;
              // Compress before setting state to avoid "Payload too large" error in Firestore
              const compressed = await compressImage(result, 200, 0.7); 
              const autoColor = await extractDominantColor(compressed);
              setEditingProject({
                  ...editingProject,
                  logo: compressed,
                  brandColor: autoColor 
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const openGoogleMapsRoute = (address?: string) => {
      if (!address) return;
      const query = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  const openWhatsApp = (contact?: string) => {
      if (!contact) return;
      const cleanNumber = contact.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanNumber}`, '_blank');
  };

  const openWebsite = (url?: string) => {
      if (!url) return;
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(finalUrl, '_blank');
  }

  // Handle Enter Key in Edit Mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSaveEdit();
      }
  }

  // Handle Enter Key in Add Mode
  const handleAddKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newName) {
          handleAddProject();
      }
  }

  // Local state for editing value string
  const [editValStr, setEditValStr] = useState('');
  useEffect(() => {
      if (editingProject) {
          // Initial format
          setEditValStr(formatCurrency(editingProject.valorContrato).replace('R$', '').trim());
      }
  }, [editingProject?.id]);

  // Filter Logic
  const filteredProjects = projects.filter(p => 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cnpj.includes(searchTerm)
  );

  if (loading) {
      return (
          <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4 animate-in fade-in">
              <Loader2 size={32} className="animate-spin text-black" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Carregando Projetos...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center gap-2">
                <Briefcase className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5}/>
                Projetos
            </h2>
            <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base">Carteira de clientes ativa.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide text-xs hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
                {isAdding ? <><X size={16} strokeWidth={3}/> Fechar</> : <><Plus size={16} strokeWidth={3}/> Novo Projeto</>}
            </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
          </div>
          <input 
              type="text" 
              placeholder="PESQUISAR PROJETOS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black focus:outline-none uppercase placeholder:normal-case"
          />
      </div>

      {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto custom-scrollbar border-l-4" style={{ borderColor: editingProject.brandColor || '#e5e7eb' }}>
                  
                  <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
                      <h3 className="font-black text-base md:text-lg flex items-center gap-2 uppercase tracking-wide truncate">
                          <Building2 size={20} style={{ color: editingProject.brandColor }} className="shrink-0" /> 
                          <span className="truncate">Detalhes</span>
                      </h3>
                      <button onClick={() => setEditingProject(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                  </div>
                  
                  <div className="p-4 md:p-6 space-y-6" onKeyDown={handleKeyDown}>
                      <div className="flex flex-col sm:flex-row gap-5 items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                          <div 
                            className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm hover:border-black transition-colors shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                          >
                              {editingProject.logo ? (
                                  <img src={editingProject.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                  <div className="flex flex-col items-center text-gray-400">
                                      <Upload size={20} className="mb-1" />
                                      <span className="text-[9px] font-bold uppercase">Logo</span>
                                  </div>
                              )}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          
                          <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome da Empresa</label>
                                  <input type="text" value={editingProject.nome} onChange={e => setEditingProject({...editingProject, nome: e.target.value.toUpperCase()})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-black text-base focus:ring-2 focus:ring-black outline-none uppercase" />
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-4">
                                <h4 className="text-xs font-black text-black uppercase border-b border-gray-200 pb-1.5">Dados Cadastrais</h4>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">CNPJ</label>
                                    <input type="text" value={editingProject.cnpj} onChange={e => setEditingProject({...editingProject, cnpj: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm uppercase" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Website</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.website || ''} onChange={e => setEditingProject({...editingProject, website: e.target.value.toLowerCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm" />
                                        {editingProject.website && (
                                            <button onClick={() => openWebsite(editingProject.website)} className="bg-blue-50 text-blue-600 p-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors shrink-0">
                                                <ExternalLink size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin size={10}/> Endereço</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.address || ''} onChange={e => setEditingProject({...editingProject, address: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm uppercase" placeholder="Rua, Número, Cidade" />
                                        {editingProject.address && (
                                            <button onClick={() => openGoogleMapsRoute(editingProject.address)} className="bg-green-50 text-green-600 p-2 rounded-lg border border-green-100 hover:bg-green-100 transition-colors shrink-0">
                                                <Navigation size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                          </div>

                          <div className="space-y-4">
                                <h4 className="text-xs font-black text-black uppercase border-b border-gray-200 pb-1.5">Contato & Financeiro</h4>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Supervisor</label>
                                    <input type="text" value={editingProject.supervisorName} onChange={e => setEditingProject({...editingProject, supervisorName: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm uppercase" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Contato</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.supervisorContact} onChange={e => setEditingProject({...editingProject, supervisorContact: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm uppercase" />
                                        {editingProject.supervisorContact && (
                                            <button onClick={() => openWhatsApp(editingProject.supervisorContact)} className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors shrink-0">
                                                <MessageCircle size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Mensalidade</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={editValStr}
                                            onChange={e => {
                                                const formatted = formatCurrencyInput(e.target.value);
                                                setEditValStr(formatted);
                                                setEditingProject({...editingProject, valorContrato: parseCurrencyInput(formatted)})
                                            }}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-4 py-2 font-black text-base focus:outline-none focus:border-black focus:ring-1 focus:ring-black" 
                                        />
                                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">R$</span>
                                    </div>
                                </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-end gap-2 sticky bottom-0 z-20">
                      <button onClick={() => setEditingProject(null)} className="order-2 md:order-1 px-5 py-2.5 rounded-lg font-bold text-gray-500 hover:bg-gray-200 transition-colors w-full md:w-auto text-sm">Cancelar</button>
                      <button 
                        onClick={handleSaveEdit} 
                        disabled={isSaving}
                        className="order-1 md:order-2 px-6 py-2.5 rounded-lg font-bold bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto text-sm"
                      >
                          {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />} 
                          {isSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isAdding && (
         <div className="bg-white rounded-2xl p-5 shadow-float border border-gray-200 animate-in slide-in-from-top-10 fade-in duration-500 mb-6" onKeyDown={handleAddKeyDown}>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Novo Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Empresa</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value.toUpperCase())} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black outline-none transition-all text-sm uppercase" />
                </div>
                 <div className="md:col-span-2 lg:col-span-3 pt-2">
                    <button 
                        onClick={handleAddProject} 
                        disabled={isSubmitting || !newName}
                        className="w-full bg-black text-white py-3 rounded-lg font-black uppercase tracking-widest text-xs hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin"/>}
                        {isSubmitting ? 'Registrando...' : 'Confirmar Cadastro'}
                    </button>
                </div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.length === 0 ? (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl animate-in fade-in">
                <Briefcase size={32} strokeWidth={1} className="mb-2 opacity-20"/>
                <p className="font-bold text-sm">Nenhum projeto encontrado.</p>
            </div>
        ) : (
            filteredProjects.map(project => (
                <div 
                    key={project.id} 
                    onClick={() => setEditingProject(project)}
                    className="group bg-white rounded-2xl p-4 shadow-apple hover:shadow-float transition-all duration-300 border cursor-pointer relative overflow-hidden flex flex-col gap-3 animate-in fade-in active:scale-[0.98]"
                    style={{ borderColor: project.brandColor ? `${project.brandColor}30` : '#e5e7eb' }}
                >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: project.brandColor || '#000' }}></div>
                    <div className="flex justify-between items-start mt-1">
                        <div 
                            className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5 overflow-hidden"
                            style={{ boxShadow: `0 4px 10px -4px ${project.brandColor}30` }}
                        >
                            {project.logo ? (
                                <img src={project.logo} alt={project.nome} className="w-full h-full object-contain" />
                            ) : (
                                <Building2 size={20} style={{ color: project.brandColor || '#000' }} strokeWidth={2} />
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-black text-black leading-tight line-clamp-1 group-hover:text-gray-700 transition-colors uppercase">{project.nome}</h3>
                    </div>
                    <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center relative z-20">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Mensal</p>
                            <p className="text-sm font-black text-black">{formatCurrency(project.valorContrato || 0)}</p>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center shadow-sm z-30"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
