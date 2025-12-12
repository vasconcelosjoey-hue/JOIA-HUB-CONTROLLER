
import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { formatCurrency, getStatusColor, extractDominantColor } from '../services/utils';
import { Briefcase, Building2, Plus, X, MapPin, Upload, Trash2, MessageCircle, ExternalLink, Check, Navigation, Loader2 } from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestore';

export const Dashboard: React.FC = () => {
  const { data: projects, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<Project>('projects');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Action Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newCNPJ, setNewCNPJ] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newVal, setNewVal] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProject = async () => {
    if (!newName) return;
    setIsSubmitting(true);

    try {
        // Remove 'id' to let Firestore generate a unique one via addDoc
        const newProject: any = {
            nome: newName,
            cnpj: newCNPJ || 'Não informado',
            status: 'EM TREINAMENTO',
            dataStart: newStartDate || new Date().toISOString(),
            diaMensalidade: 5,
            supervisorName: newSupervisor,
            supervisorContact: newContact,
            valorContrato: parseFloat(newVal) || 0,
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
              const autoColor = await extractDominantColor(result);
              setEditingProject({
                  ...editingProject,
                  logo: result,
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

  if (loading) {
      return (
          <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4 animate-in fade-in">
              <Loader2 size={40} className="animate-spin text-black" />
              <p className="text-xs font-bold uppercase tracking-widest">Carregando Projetos...</p>
          </div>
      );
  }

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h2 className="text-4xl font-black text-black tracking-tight flex items-center gap-3">
                <Briefcase size={32} strokeWidth={2.5}/>
                Projetos & Empresas
            </h2>
            <p className="text-gray-600 font-medium mt-1 text-lg">Carteira de clientes ativa.</p>
        </div>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-black text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
        >
            {isAdding ? <><X size={20} strokeWidth={3}/> Fechar</> : <><Plus size={20} strokeWidth={3}/> Novo Projeto</>}
        </button>
      </div>

      {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar border-4" style={{ borderColor: editingProject.brandColor || '#e5e7eb' }}>
                  
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
                      <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-wide">
                          <Building2 size={24} style={{ color: editingProject.brandColor }} /> 
                          Detalhes do Contrato
                      </h3>
                      <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      <div className="flex flex-col sm:flex-row gap-6 items-center p-6 bg-gray-50 rounded-3xl border border-gray-200">
                          <div 
                            className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm hover:border-black transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                              {editingProject.logo ? (
                                  <img src={editingProject.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                  <div className="flex flex-col items-center text-gray-400">
                                      <Upload size={24} className="mb-1" />
                                      <span className="text-[10px] font-bold uppercase">Subir Logo</span>
                                  </div>
                              )}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          
                          <div className="flex-1 space-y-4 w-full">
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Empresa</label>
                                  <input type="text" value={editingProject.nome} onChange={e => setEditingProject({...editingProject, nome: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-black text-lg focus:ring-2 focus:ring-black outline-none" />
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-5">
                                <h4 className="text-sm font-black text-black uppercase border-b border-gray-200 pb-2">Dados Cadastrais</h4>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">CNPJ</label>
                                    <input type="text" value={editingProject.cnpj} onChange={e => setEditingProject({...editingProject, cnpj: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Website</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.website || ''} onChange={e => setEditingProject({...editingProject, website: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" />
                                        {editingProject.website && (
                                            <button onClick={() => openWebsite(editingProject.website)} className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                                                <ExternalLink size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin size={12}/> Endereço</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.address || ''} onChange={e => setEditingProject({...editingProject, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" placeholder="Rua, Número, Cidade" />
                                        {editingProject.address && (
                                            <button onClick={() => openGoogleMapsRoute(editingProject.address)} className="bg-green-50 text-green-600 p-2.5 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                                                <Navigation size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                          </div>

                          <div className="space-y-5">
                                <h4 className="text-sm font-black text-black uppercase border-b border-gray-200 pb-2">Contato & Financeiro</h4>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Supervisor</label>
                                    <input type="text" value={editingProject.supervisorName} onChange={e => setEditingProject({...editingProject, supervisorName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Contato</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.supervisorContact} onChange={e => setEditingProject({...editingProject, supervisorContact: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" />
                                        {editingProject.supervisorContact && (
                                            <button onClick={() => openWhatsApp(editingProject.supervisorContact)} className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Mensalidade</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={editingProject.valorContrato} 
                                            onChange={e => setEditingProject({...editingProject, valorContrato: parseFloat(e.target.value)})} 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-black text-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black" 
                                        />
                                        <span className="absolute left-3 top-4 text-gray-400 text-xs font-bold">R$</span>
                                    </div>
                                </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-20">
                      <button onClick={() => setEditingProject(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
                      <button 
                        onClick={handleSaveEdit} 
                        disabled={isSaving}
                        className="px-8 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18} />} 
                          {isSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isAdding && (
         <div className="bg-white rounded-3xl p-8 shadow-float border border-gray-200 animate-in slide-in-from-top-10 fade-in duration-500 mb-8">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Novo Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome da Empresa</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                </div>
                 <div className="md:col-span-2 lg:col-span-3 pt-4">
                    <button 
                        onClick={handleAddProject} 
                        disabled={isSubmitting || !newName}
                        className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 size={18} className="animate-spin"/>}
                        {isSubmitting ? 'Registrando...' : 'Confirmar Cadastro'}
                    </button>
                </div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl animate-in fade-in">
                <Briefcase size={48} strokeWidth={1} className="mb-3 opacity-20"/>
                <p className="font-bold">Nenhum projeto cadastrado.</p>
            </div>
        ) : (
            projects.map(project => (
                <div 
                    key={project.id} 
                    onClick={() => setEditingProject(project)}
                    className="group bg-white rounded-3xl p-5 shadow-apple hover:shadow-float transition-all duration-300 border-2 cursor-pointer relative overflow-hidden flex flex-col gap-4 animate-in fade-in"
                    style={{ borderColor: project.brandColor ? `${project.brandColor}20` : '#e5e7eb' }}
                >
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: project.brandColor || '#000' }}></div>
                    <div className="flex justify-between items-start mt-2">
                        <div 
                            className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden"
                            style={{ boxShadow: `0 4px 15px -5px ${project.brandColor}30` }}
                        >
                            {project.logo ? (
                                <img src={project.logo} alt={project.nome} className="w-full h-full object-contain" />
                            ) : (
                                <Building2 size={24} style={{ color: project.brandColor || '#000' }} strokeWidth={2} />
                            )}
                        </div>
                        {project.status !== 'EM FUNCIONAMENTO' && (
                            <span className={`text-[9px] px-2 py-1 rounded-full font-black border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                                {project.status.replace("EM ", "")}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-black leading-tight line-clamp-1 group-hover:text-gray-700 transition-colors">{project.nome}</h3>
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center relative z-20">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Mensal</p>
                            <p className="text-base font-black text-black">{formatCurrency(project.valorContrato || 0)}</p>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center shadow-sm z-30"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
