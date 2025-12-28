
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { formatCurrency, extractDominantColor, compressImage, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { Target, Plus, X, Upload, Trash2, MessageCircle, ExternalLink, Check, Navigation, Loader2, Search } from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { useToast } from '../context/ToastContext';

export const Dashboard: React.FC = () => {
  const { data: projects, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<Project>('projects');
  const { addToast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCNPJ, setNewCNPJ] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newVal, setNewVal] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProject = async () => {
    setIsSubmitting(true);

    try {
        const newProject: any = {
            nome: newName || 'Empresa Sem Nome',
            cnpj: newCNPJ || 'Não informado',
            status: 'EM TREINAMENTO',
            dataStart: newStartDate || new Date().toISOString(),
            diaMensalidade: 5,
            supervisorName: newSupervisor || '',
            supervisorContact: newContact || '',
            valorContrato: parseCurrencyInput(newVal),
            brandColor: '#000000',
            address: '',
            createdAt: new Date().toISOString()
        };

        await addItem(newProject);
        addToast('Projeto registrado.', 'success');
        setIsAdding(false);
        resetForm();
    } catch (error) {
        console.error("Error adding project", error);
        addToast('Erro ao adicionar projeto.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName(''); setNewCNPJ(''); setNewSupervisor(''); setNewContact(''); setNewStartDate(''); setNewVal('');
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      const confirmDelete = window.confirm("⚠️ Deseja realmente excluir este projeto?");
      if (confirmDelete) {
          await deleteItem(id);
          addToast('Projeto removido.', 'info');
      }
  };

  const handleSaveEdit = async () => {
      if (!editingProject) return;
      setIsSaving(true);
      try {
          await updateItem(editingProject.id, editingProject);
          addToast('Alterações salvas.', 'success');
          setEditingProject(null);
      } catch (error) {
          console.error("Error updating project", error);
          addToast('Erro ao salvar alterações.', 'error');
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
              const compressed = await compressImage(result, 256, 0.8); 
              const autoColor = await extractDominantColor(compressed);
              setEditingProject({ ...editingProject, logo: compressed, brandColor: autoColor });
          };
          reader.readAsDataURL(file);
      }
  };

  const openGoogleMapsRoute = (address?: string) => {
      if (!address) return;
      const cleanAddress = address.trim();
      if (cleanAddress.startsWith('http') || cleanAddress.includes('maps.app.goo.gl')) {
          const url = cleanAddress.startsWith('http') ? cleanAddress : `https://${cleanAddress}`;
          window.open(url, '_blank');
      } else {
          const query = encodeURIComponent(cleanAddress);
          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }
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

  const [editValStr, setEditValStr] = useState('');
  useEffect(() => {
      if (editingProject) {
          setEditValStr(formatCurrency(editingProject.valorContrato).replace('R$', '').trim());
      }
  }, [editingProject?.id]);

  const filteredProjects = projects.filter(p => 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cnpj.includes(searchTerm)
  );

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
        action();
    }
  };

  if (loading) {
      return (
          <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4">
              <Loader2 size={32} className="animate-spin text-black" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Carregando Projetos...</p>
          </div>
      );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Pesquisar projetos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none shadow-sm" />
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-black text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wide text-[10px] hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md">
            {isAdding ? <><X size={14}/> Fechar</> : <><Plus size={14}/> Novo Projeto</>}
        </button>
      </div>

      {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-l-4" style={{ borderColor: editingProject.brandColor || '#000' }}>
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
                      <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tighter">
                          Detalhes
                      </h3>
                      <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row gap-5 items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-black transition-colors shrink-0" onClick={() => fileInputRef.current?.click()}>
                              {editingProject.logo ? <img src={editingProject.logo} className="w-full h-full object-contain p-2" /> : <Upload size={20} className="text-gray-400" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          <div className="flex-1 w-full text-center sm:text-left">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome da Empresa</label>
                              <input 
                                type="text" 
                                value={editingProject.nome} 
                                onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                onChange={e => setEditingProject({...editingProject, nome: e.target.value})} 
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 font-black text-lg focus:ring-2 focus:ring-black outline-none mt-1" 
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Dados Cadastrais</h4>
                                <input 
                                    type="text" 
                                    value={editingProject.cnpj} 
                                    onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                    onChange={e => setEditingProject({...editingProject, cnpj: e.target.value})} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" 
                                    placeholder="CNPJ" 
                                />
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editingProject.website || ''} 
                                        onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                        onChange={e => setEditingProject({...editingProject, website: e.target.value})} 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" 
                                        placeholder="Website" 
                                    />
                                    {editingProject.website && <button onClick={() => openWebsite(editingProject.website)} className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-colors"><ExternalLink size={18} /></button>}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editingProject.address || ''} 
                                        onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                        onChange={e => setEditingProject({...editingProject, address: e.target.value})} 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" 
                                        placeholder="Endereço ou Link Maps" 
                                    />
                                    {editingProject.address && <button onClick={() => openGoogleMapsRoute(editingProject.address)} className="bg-green-50 text-green-600 p-3 rounded-xl hover:bg-green-100 transition-colors"><Navigation size={18} /></button>}
                                </div>
                          </div>
                          <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Contato & Financeiro</h4>
                                <input 
                                    type="text" 
                                    value={editingProject.supervisorName} 
                                    onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                    onChange={e => setEditingProject({...editingProject, supervisorName: e.target.value})} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" 
                                    placeholder="Supervisor" 
                                />
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editingProject.supervisorContact} 
                                        onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                        onChange={e => setEditingProject({...editingProject, supervisorContact: e.target.value})} 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" 
                                        placeholder="Contato" 
                                    />
                                    {editingProject.supervisorContact && <button onClick={() => openWhatsApp(editingProject.supervisorContact)} className="bg-emerald-50 text-emerald-600 p-3 rounded-xl hover:bg-emerald-100 transition-colors"><MessageCircle size={18} /></button>}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={editValStr} 
                                        onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                        onChange={e => {
                                            const formatted = formatCurrencyInput(e.target.value);
                                            setEditValStr(formatted);
                                            setEditingProject({...editingProject, valorContrato: parseCurrencyInput(formatted)})
                                        }} 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 font-black text-base outline-none" 
                                    />
                                    <span className="absolute left-3.5 top-3 text-gray-400 text-xs font-bold">R$</span>
                                </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 sticky bottom-0 z-20">
                      <button onClick={() => setEditingProject(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 text-sm transition-colors">Cancelar</button>
                      <button onClick={handleSaveEdit} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold bg-black text-white flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm transition-all hover:bg-gray-800">
                          {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />} Salvar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isAdding && (
         <div className="bg-white rounded-[2rem] p-6 shadow-float border border-gray-200 animate-in slide-in-from-top-10 mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Novo Contrato</h3>
            <div className="flex flex-col gap-4">
                <input 
                    type="text" 
                    value={newName} 
                    onKeyDown={(e) => handleKeyDown(e, handleAddProject)}
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="Nome da Empresa" 
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none transition-all text-sm" 
                />
                <button onClick={handleAddProject} disabled={isSubmitting} className="w-full bg-black text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 transition-all">
                    {isSubmitting ? 'Registrando...' : 'Confirmar Cadastro'}
                </button>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
        {filteredProjects.map(project => (
            <div key={project.id} onClick={() => setEditingProject(project)} className="group bg-white rounded-2xl p-4 shadow-apple hover:shadow-float transition-all border cursor-pointer relative overflow-hidden flex flex-col gap-3" style={{ borderColor: project.brandColor ? `${project.brandColor}30` : '#e5e7eb' }}>
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: project.brandColor || '#000' }}></div>
                
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 flex items-center justify-center p-0 overflow-hidden bg-white rounded-xl shadow-inner border border-gray-50">
                        {project.logo ? (
                            <img src={project.logo} className="w-full h-full object-contain p-2" alt={project.nome} />
                        ) : (
                            <Target size={20} className="text-gray-200" />
                        )}
                    </div>
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                        <Trash2 size={12} />
                    </button>
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-black text-black leading-tight line-clamp-2 uppercase tracking-tight">{project.nome}</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 line-clamp-1">{project.supervisorName || 'Sem Supervisor'}</p>
                </div>

                <div className="pt-2 border-t border-gray-50 flex justify-between items-end">
                    <div>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Valor Mensal</p>
                        <p className="text-sm font-black text-black">{formatCurrency(project.valorContrato || 0)}</p>
                    </div>
                    <div className="text-right">
                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${project.status === 'EM FUNCIONAMENTO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {project.status.split(' ')[0]}
                         </span>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
