import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { formatCurrency, extractDominantColor, compressImage, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { Building2, Plus, X, Upload, Trash2, MessageCircle, ExternalLink, Check, Navigation, Loader2, Search } from 'lucide-react';
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
    if (!newName) {
        addToast('Preencha o nome do projeto.', 'warning');
        return;
    }
    setIsSubmitting(true);

    try {
        const newProject: any = {
            nome: newName,
            cnpj: newCNPJ || 'Não informado',
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
        addToast('Projeto criado com sucesso!', 'success');
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
              const compressed = await compressImage(result, 200, 0.7); 
              const autoColor = await extractDominantColor(compressed);
              setEditingProject({ ...editingProject, logo: compressed, brandColor: autoColor });
          };
          reader.readAsDataURL(file);
      }
  };

  const openGoogleMapsRoute = (address?: string) => {
      if (!address) return;
      const cleanAddress = address.trim();
      // If the address is a direct link, open it. Otherwise search for it.
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
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Pesquisar projetos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none shadow-sm" />
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-black text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-wide text-[10px] hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md">
            {isAdding ? <><X size={14}/> Fechar</> : <><Plus size={14}/> Novo Projeto</>}
        </button>
      </div>

      {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-l-4" style={{ borderColor: editingProject.brandColor || '#000' }}>
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
                      <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-wide">
                          <Building2 size={20} style={{ color: editingProject.brandColor }} /> Detalhes
                      </h3>
                      <button onClick={() => setEditingProject(null)} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row gap-5 items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                          <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              {editingProject.logo ? <img src={editingProject.logo} className="w-full h-full object-contain p-2" /> : <Upload size={20} className="text-gray-400" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          <div className="flex-1 w-full">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Nome da Empresa</label>
                              <input type="text" value={editingProject.nome} onChange={e => setEditingProject({...editingProject, nome: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-black text-base focus:ring-2 focus:ring-black outline-none" />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-4">
                                <h4 className="text-xs font-black text-black uppercase border-b border-gray-200 pb-1.5">Dados Cadastrais</h4>
                                <input type="text" value={editingProject.cnpj} onChange={e => setEditingProject({...editingProject, cnpj: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="CNPJ" />
                                <div className="flex gap-2">
                                    <input type="text" value={editingProject.website || ''} onChange={e => setEditingProject({...editingProject, website: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Website" />
                                    {editingProject.website && <button onClick={() => openWebsite(editingProject.website)} className="bg-blue-50 text-blue-600 p-2 rounded-lg"><ExternalLink size={16} /></button>}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={editingProject.address || ''} onChange={e => setEditingProject({...editingProject, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Endereço ou Link Maps" />
                                    {editingProject.address && <button onClick={() => openGoogleMapsRoute(editingProject.address)} className="bg-green-50 text-green-600 p-2 rounded-lg"><Navigation size={16} /></button>}
                                </div>
                          </div>
                          <div className="space-y-4">
                                <h4 className="text-xs font-black text-black uppercase border-b border-gray-200 pb-1.5">Contato & Financeiro</h4>
                                <input type="text" value={editingProject.supervisorName} onChange={e => setEditingProject({...editingProject, supervisorName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Supervisor" />
                                <div className="flex gap-2">
                                    <input type="text" value={editingProject.supervisorContact} onChange={e => setEditingProject({...editingProject, supervisorContact: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Contato" />
                                    {editingProject.supervisorContact && <button onClick={() => openWhatsApp(editingProject.supervisorContact)} className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><MessageCircle size={16} /></button>}
                                </div>
                                <div className="relative">
                                    <input type="text" value={editValStr} onChange={e => {
                                        const formatted = formatCurrencyInput(e.target.value);
                                        setEditValStr(formatted);
                                        setEditingProject({...editingProject, valorContrato: parseCurrencyInput(formatted)})
                                    }} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-4 py-2 font-black text-base outline-none" />
                                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">R$</span>
                                </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 sticky bottom-0 z-20">
                      <button onClick={() => setEditingProject(null)} className="px-5 py-2.5 rounded-lg font-bold text-gray-500 hover:bg-gray-200 text-sm">Cancelar</button>
                      <button onClick={handleSaveEdit} disabled={isSaving} className="px-6 py-2.5 rounded-lg font-bold bg-black text-white flex items-center gap-2 shadow-md disabled:opacity-50 text-sm">
                          {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />} Salvar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isAdding && (
         <div className="bg-white rounded-2xl p-5 shadow-float border border-gray-200 animate-in slide-in-from-top-10 mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Novo Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="NOME DA EMPRESA" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black outline-none transition-all text-sm" />
                <div className="md:col-span-2 lg:col-span-3 pt-2">
                    <button onClick={handleAddProject} disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded-lg font-black uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? 'Registrando...' : 'Confirmar Cadastro'}
                    </button>
                </div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
        {filteredProjects.map(project => (
            <div key={project.id} onClick={() => setEditingProject(project)} className="group bg-white rounded-xl p-3 shadow-apple hover:shadow-float transition-all border cursor-pointer relative overflow-hidden flex flex-col gap-2.5" style={{ borderColor: project.brandColor ? `${project.brandColor}30` : '#e5e7eb' }}>
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: project.brandColor || '#000' }}></div>
                <div className="flex justify-between items-start mt-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 overflow-hidden shadow-sm">
                        {project.logo ? <img src={project.logo} className="w-full h-full object-contain" /> : <Building2 size={18} style={{ color: project.brandColor || '#000' }} />}
                    </div>
                </div>
                <h3 className="text-sm font-black text-black leading-tight line-clamp-1">{project.nome}</h3>
                <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Mensal</p>
                        <p className="text-xs font-black text-black">{formatCurrency(project.valorContrato || 0)}</p>
                    </div>
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="w-6 h-6 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center shadow-sm">
                        <Trash2 size={10} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};