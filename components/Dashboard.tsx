import React, { useState, useRef } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import { formatCurrency, getStatusColor, formatDate, extractDominantColor } from '../services/utils';
import { Briefcase, Building2, User, Phone, Calendar, Plus, X, MapPin, FileText, Pencil, Upload, Palette, Globe, Check, Navigation, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Dashboard: React.FC = () => {
  // Projects State (Persisted)
  const [projects, setProjects] = useLocalStorage<Project[]>('joia_projects', PROJECTS);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newCNPJ, setNewCNPJ] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newVal, setNewVal] = useState('');

  // Logo Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProject = () => {
    if (!newName) return;

    const newProject: Project = {
        id: Date.now().toString(),
        nome: newName,
        cnpj: newCNPJ || 'Não informado',
        status: 'EM TREINAMENTO',
        dataStart: newStartDate || new Date().toISOString(),
        diaMensalidade: 5,
        supervisorName: newSupervisor,
        supervisorContact: newContact,
        valorContrato: parseFloat(newVal) || 0,
        brandColor: '#000000',
        address: ''
    };

    setProjects([...(projects || []), newProject]);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName(''); setNewCNPJ(''); setNewSupervisor(''); setNewContact(''); setNewStartDate(''); setNewVal('');
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
      // Impede que o clique na lixeira abra o modal do projeto
      e.stopPropagation(); 
      
      // Confirmação explícita
      const confirmDelete = window.confirm(
          "⚠️ AÇÃO IRREVERSÍVEL\n\nDeseja realmente EXCLUIR este projeto e todos os seus dados?\nClique em 'OK' para confirmar ou 'Cancelar' para voltar."
      );

      if (confirmDelete) {
          setProjects((projects || []).filter(p => p.id !== id));
      }
  };

  const handleSaveEdit = () => {
      if (!editingProject) return;
      setProjects((projects || []).map(p => p.id === editingProject.id ? editingProject : p));
      setEditingProject(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && editingProject) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const result = reader.result as string;
              // Extract color automatically
              const autoColor = await extractDominantColor(result);
              
              setEditingProject({
                  ...editingProject,
                  logo: result,
                  brandColor: autoColor // Set automatically
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
      // Remove non-numeric characters
      const cleanNumber = contact.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanNumber}`, '_blank');
  };

  const openWebsite = (url?: string) => {
      if (!url) return;
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(finalUrl, '_blank');
  }

  // Safety check for null/undefined projects
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="space-y-10 pb-20">
      
      {/* Header */}
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

      {/* DETALHES / EDIT MODAL (THE "INSIDE" VIEW) */}
      {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar border-4" style={{ borderColor: editingProject.brandColor || '#e5e7eb' }}>
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
                      <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-wide">
                          <Building2 size={24} style={{ color: editingProject.brandColor }} /> 
                          Detalhes do Contrato
                      </h3>
                      <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      {/* Branding Section */}
                      <div className="flex flex-col sm:flex-row gap-6 items-center p-6 bg-gray-50 rounded-3xl border border-gray-200">
                          <div 
                            className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm hover:border-black transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            title="Clique para alterar a logo"
                          >
                              {editingProject.logo ? (
                                  <img src={editingProject.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                  <div className="flex flex-col items-center text-gray-400">
                                      <Upload size={24} className="mb-1" />
                                      <span className="text-[10px] font-bold uppercase">Subir Logo</span>
                                  </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold uppercase tracking-widest">Alterar</div>
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          
                          <div className="flex-1 space-y-4 w-full">
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Empresa</label>
                                  <input type="text" value={editingProject.nome} onChange={e => setEditingProject({...editingProject, nome: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-black text-lg focus:ring-2 focus:ring-black outline-none" />
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                      <div className="h-full transition-all duration-500" style={{ width: '100%', backgroundColor: editingProject.brandColor || '#000' }}></div>
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Cor Detectada</span>
                              </div>
                          </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Coluna 1: Dados Cadastrais */}
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
                                            <button onClick={() => openWebsite(editingProject.website)} className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors" title="Acessar Site">
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
                                            <button onClick={() => openGoogleMapsRoute(editingProject.address)} className="bg-green-50 text-green-600 p-2.5 rounded-xl border border-green-100 hover:bg-green-100 transition-colors" title="Abrir no Maps">
                                                <Navigation size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                          </div>

                          {/* Coluna 2: Contato e Financeiro */}
                          <div className="space-y-5">
                                <h4 className="text-sm font-black text-black uppercase border-b border-gray-200 pb-2">Contato & Financeiro</h4>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Supervisor Responsável</label>
                                    <input type="text" value={editingProject.supervisorName} onChange={e => setEditingProject({...editingProject, supervisorName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Contato (WhatsApp)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={editingProject.supervisorContact} onChange={e => setEditingProject({...editingProject, supervisorContact: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium" placeholder="(00) 00000-0000" />
                                        {editingProject.supervisorContact && (
                                            <button onClick={() => openWhatsApp(editingProject.supervisorContact)} className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors" title="Chamar no WhatsApp">
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Valor Contrato Mensal</label>
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
                  
                  {/* Footer Actions */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-20">
                      <button onClick={() => setEditingProject(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
                      <button onClick={handleSaveEdit} className="px-8 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg">
                          <Check size={18} /> Salvar Alterações
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ADD NEW PROJECT FORM */}
      {isAdding && (
         <div className="bg-white rounded-3xl p-8 shadow-float border border-gray-200 animate-in slide-in-from-top-10 fade-in duration-500 mb-8">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Cadastrar Novo Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome da Empresa</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                </div>
                 <div className="md:col-span-2 lg:col-span-3 pt-4">
                    <button onClick={handleAddProject} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.01] transition-transform">
                        Confirmar Cadastro Rápido
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">Você poderá editar detalhes como endereço e logo após criar.</p>
                </div>
            </div>
         </div>
      )}

      {/* Projects GRID (COMPACT CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {safeProjects.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                <Briefcase size={48} strokeWidth={1} className="mb-3 opacity-20"/>
                <p className="font-bold">Nenhum projeto cadastrado.</p>
                <p className="text-xs">Clique em "Novo Projeto" para começar.</p>
            </div>
        ) : (
            safeProjects.map(project => (
                <div 
                    key={project.id} 
                    onClick={() => setEditingProject(project)}
                    className="group bg-white rounded-3xl p-5 shadow-apple hover:shadow-float transition-all duration-300 border-2 cursor-pointer relative overflow-hidden flex flex-col gap-4"
                    style={{ borderColor: project.brandColor ? `${project.brandColor}20` : '#e5e7eb' }}
                >
                    {/* Decorative Brand Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: project.brandColor || '#000' }}></div>

                    {/* Top Section: Logo & Status */}
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
                        {/* Conditionally hide the status badge if it is 'EM FUNCIONAMENTO' */}
                        {project.status !== 'EM FUNCIONAMENTO' && (
                            <span className={`text-[9px] px-2 py-1 rounded-full font-black border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                                {project.status.replace("EM ", "")}
                            </span>
                        )}
                    </div>

                    {/* Middle: Name */}
                    <div>
                        <h3 className="text-lg font-black text-black leading-tight line-clamp-1 group-hover:text-gray-700 transition-colors">{project.nome}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Clique para detalhes</p>
                    </div>

                    {/* Bottom: Value & Actions */}
                    <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center relative z-20">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Mensal</p>
                            <p className="text-base font-black text-black">{formatCurrency(project.valorContrato || 0)}</p>
                        </div>

                        <button 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center shadow-sm z-30"
                            title="Excluir Projeto"
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