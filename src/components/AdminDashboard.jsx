import { Tabs, Tab } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera } from "lucide-react";
import _ from 'lodash';


// Um componente React moderno para o painel administrativo da AlphaBioma
const AdminDashboard = () => {
  // Estados para gerenciar dados
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState(null);

  // Dados de exemplo (simulando chamadas da API)
  useEffect(() => {
    // Simula carregamento de dados da API
    setTimeout(() => {
      setProjects([
        { 
          id: 1, 
          projectId: "AB-1234", 
          name: "Estudo de Microbioma Suíno", 
          status: "Material entregue",
          sampleCount: 24,
          email: "cliente@exemplo.com",
          createdAt: "2025-02-15",
          description: "Análise de microbioma para avaliação de prebióticos"
        },
        { 
          id: 2, 
          projectId: "AB-5678", 
          name: "Análise Avícola Completa", 
          status: "DNA sequenciado",
          sampleCount: 36,
          email: "empresa@exemplo.com",
          createdAt: "2025-03-02",
          description: "Avaliação de diferentes tratamentos em frangos de corte"
        },
        { 
          id: 3, 
          projectId: "AB-9012", 
          name: "Estudo Bovino Comparativo", 
          status: "Relatório entregue",
          sampleCount: 18,
          email: "fazenda@exemplo.com",
          createdAt: "2025-01-10",
          description: "Avaliação completa de saúde intestinal em gado leiteiro"
        },
      ]);
      
      setSamples([
        { id: "AB-1234-001", projectId: "AB-1234", animal: "S001", treatment: "Controle", status: "Coletado" },
        { id: "AB-1234-002", projectId: "AB-1234", animal: "S002", treatment: "Tratamento A", status: "Coletado" },
        { id: "AB-1234-003", projectId: "AB-1234", animal: "S003", treatment: "Tratamento B", status: "Coletado" },
        { id: "AB-5678-001", projectId: "AB-5678", animal: "A001", treatment: "Controle", status: "Em processamento" },
        { id: "AB-5678-002", projectId: "AB-5678", animal: "A002", treatment: "Prebiótico", status: "Em processamento" },
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  // Filtragem de projetos baseada na pesquisa
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para tratar a seleção de projetos
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setActiveTab("projectDetails");
  };

  // Função para tratar a criação de novos projetos
  const handleCreateProject = (newProject) => {
    // Em produção, isso enviaria dados para a API
    setProjects([...projects, { ...newProject, id: projects.length + 1 }]);
    setShowNewProjectModal(false);
    showNotification("Projeto criado com sucesso!", "success");
  };

  // Função para gerar um novo ID de projeto
  const generateProjectId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                    letters.charAt(Math.floor(Math.random() * letters.length));
    const number = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${number}`;
  };

  // Função para gerar senha aleatória
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Função para mostrar notificações
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Função para adicionar amostras a um projeto
  const handleAddSamples = (projectId, count) => {
    const newSamples = [];
    const project = projects.find(p => p.id === projectId);
    
    for (let i = 1; i <= count; i++) {
      const sampleNumber = (samples.filter(s => s.projectId === project.projectId).length + i).toString().padStart(3, '0');
      newSamples.push({
        id: `${project.projectId}-${sampleNumber}`,
        projectId: project.projectId,
        animal: "",
        treatment: "",
        status: "Disponível"
      });
    }
    
    setSamples([...samples, ...newSamples]);
    
    // Atualizar a contagem de amostras no projeto
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, sampleCount: p.sampleCount + count };
      }
      return p;
    }));
    
    showNotification(`${count} amostras adicionadas ao projeto ${project.projectId}`, "success");
  };

  // Função para atualizar o status de um projeto
  const handleUpdateProjectStatus = (projectId, newStatus) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, status: newStatus };
      }
      return p;
    }));
    
    showNotification(`Status do projeto atualizado para: ${newStatus}`, "success");
  };

  // Função para resetar a senha de um cliente
  const handleResetPassword = (projectId) => {
    const newPassword = generatePassword();
    // Em produção, isso enviaria a nova senha para a API e notificaria o cliente
    setShowPasswordModal(false);
    showNotification("Nova senha gerada e enviada por email para o cliente", "success");
    return newPassword;
  };

  // Estados de paginação
  const projectsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Componente de paginação
  const Pagination = () => {
    return (
      <div className="flex items-center justify-center mt-4 gap-2">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {currentPage} de {totalPages}
        </span>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    );
  };

  // Pipeline de status do projeto
  const statusPipeline = [
    { id: "projeto-gerado", label: "Projeto gerado" },
    { id: "material-enviado", label: "Material enviado" },
    { id: "material-entregue", label: "Material entregue" },
    { id: "amostras-coletadas", label: "Amostras coletadas" },
    { id: "amostras-enviadas", label: "Amostras enviadas" },
    { id: "dna-extraido", label: "DNA extraído" },
    { id: "dna-amplificado", label: "DNA amplificado" },
    { id: "dna-sequenciado", label: "DNA sequenciado" },
    { id: "analisando-dados", label: "Analisando dados" },
    { id: "gerando-relatorio", label: "Gerando relatório" },
    { id: "relatorio-entregue", label: "Relatório entregue" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm p-6">
      {/* Abas de navegação */}
      <div className="mb-6">
        <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <Tab value="projects" className="py-2 px-1 border-b-2 font-medium text-sm">
                Projetos
              </Tab>
              {selectedProject && (
                <Tab value="projectDetails" className="py-2 px-1 border-b-2 font-medium text-sm">
                  Detalhes do Projeto
                </Tab>
              )}
              <Tab value="samples" className="py-2 px-1 border-b-2 font-medium text-sm">
                Amostras
              </Tab>
              <Tab value="reports" className="py-2 px-1 border-b-2 font-medium text-sm">
                Relatórios
              </Tab>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Conteúdo baseado na aba ativa */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* Tab de Projetos */}
        {activeTab === "projects" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Gestão de Projetos</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Novo Projeto
                </button>
              </div>
            </div>

            {/* Tabela de projetos */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID do Projeto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amostras</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{project.projectId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${project.status === 'Relatório entregue' ? 'bg-green-100 text-green-800' :
                            project.status === 'Material entregue' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.sampleCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleProjectSelect(project)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => setShowPasswordModal(true)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Senha
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && <Pagination />}
          </div>
        )}

        {/* Tab de Detalhes do Projeto */}
        {activeTab === "projectDetails" && selectedProject && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">ID: {selectedProject.projectId}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddSamples(selectedProject.id, 5)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Adicionar Amostras
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Editar Projeto
                </button>
              </div>
            </div>

            {/* Informações do projeto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Informações do Projeto</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="font-medium w-32">Email:</span>
                    <span>{selectedProject.email}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">Status:</span>
                    <span>{selectedProject.status}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">Amostras:</span>
                    <span>{selectedProject.sampleCount}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">Criado em:</span>
                    <span>{selectedProject.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Descrição</h3>
                <p>{selectedProject.description || "Sem descrição disponível."}</p>
              </div>
            </div>

            {/* Pipeline de status */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Status do Projeto</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="relative">
                  {/* Barra de progresso */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ 
                        width: `${((statusPipeline.findIndex(s => s.label === selectedProject.status) + 1) / statusPipeline.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Etapas do pipeline */}
                  <div className="flex justify-between mt-4">
                    {statusPipeline.map((status, index) => {
                      const isActive = statusPipeline.findIndex(s => s.label === selectedProject.status) >= index;
                      return (
                        <div 
                          key={status.id} 
                          className="flex flex-col items-center" 
                          style={{ width: `${100 / statusPipeline.length}%` }}
                        >
                          <div 
                            className={`w-4 h-4 rounded-full mb-2 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                          ></div>
                          <button
                            onClick={() => handleUpdateProjectStatus(selectedProject.id, status.label)}
                            className={`text-xs ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'} text-center whitespace-nowrap overflow-hidden text-ellipsis`}
                            style={{ maxWidth: '100%' }}
                            title={status.label}
                          >
                            {index % 2 === 0 ? status.label : ''}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Atualizar Status</label>
                  <div className="flex gap-2">
                    <select 
                      className="border border-gray-300 rounded-lg p-2 flex-grow"
                      defaultValue={selectedProject.status}
                    >
                      {statusPipeline.map(status => (
                        <option key={status.id} value={status.label}>{status.label}</option>
                      ))}
                    </select>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg"
                      onClick={() => {
                        const select = document.querySelector(`select`);
                        if (select) {
                          handleUpdateProjectStatus(selectedProject.id, select.value);
                        }
                      }}
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Amostras do projeto */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Amostras do Projeto</h3>
              <div className="overflow-x-auto bg-gray-50 p-6 rounded-lg">
                {samples.filter(s => s.projectId === selectedProject.projectId).length > 0 ? (
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID da Amostra</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tratamento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {samples
                        .filter(s => s.projectId === selectedProject.projectId)
                        .map((sample) => (
                          <tr key={sample.id} className="hover:bg-gray-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{sample.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sample.animal || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sample.treatment || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${sample.status === 'Coletado' ? 'bg-green-100 text-green-800' :
                                  sample.status === 'Disponível' ? 'bg-gray-100 text-gray-800' :
                                  sample.status === 'Em processamento' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'}`}>
                                {sample.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-3">
                                <button className="text-blue-600 hover:text-blue-900">
                                  Editar
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  Remover
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Nenhuma amostra cadastrada para este projeto.</p>
                    <button
                      onClick={() => handleAddSamples(selectedProject.id, 5)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Adicionar Amostras
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab de Amostras */}
        {activeTab === "samples" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Banco de Amostras</h2>
              <div className="flex gap-3">
                <button className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                  <Camera className="h-4 w-4 mr-2" />
                  Escanear Código
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Gerar Novas Amostras
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {samples.map((sample) => (
                <div key={sample.id} className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition flex flex-col">
                  <div className="p-4 flex items-center gap-3 flex-grow">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(sample.id)}&size=150x150&format=svg&type=datamatrix`} 
                      alt={`Data Matrix para ${sample.id}`}
                      className="w-20 h-20"
                    />
                    <div className="flex-grow">
                      <h3 className="font-semibold">{sample.id}</h3>
                      <p className="text-xs text-gray-500">Projeto: {
                        projects.find(p => p.projectId === sample.projectId)?.name || 'Sem projeto'
                      }</p>
                      <p className="text-xs mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sample.status === 'Disponível' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sample.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-t p-2 flex justify-between items-center">
                    <a 
                      href="#"
                      className="text-xs text-blue-600 hover:underline" 
                    >
                      Download SVG
                    </a>
                    <button className="text-xs text-red-600 hover:underline">
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab de Relatórios */}
        {activeTab === "reports" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Relatórios</h2>
              <div className="flex gap-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Gerar Relatório
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card de Relatório */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">Relatório de Projeto - AB-1234</h3>
                      <p className="text-sm text-gray-500">Estudo de Microbioma Suíno</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Concluído</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      Análise completa das amostras de microbioma com resultados de diversidade e abundância.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">Gerado em: 12/03/2025</span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Visualizar
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Card de Relatório */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">Relatório de Projeto - AB-5678</h3>
                      <p className="text-sm text-gray-500">Análise Avícola Completa</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">Em processamento</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      Análise parcial das amostras coletadas para avaliação de eficácia de tratamentos.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">Último update: 10/04/2025</span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Ver progresso
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de novo projeto */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Criar Novo Projeto</h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Estudo de Microbioma Suíno"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID do Projeto</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AB-1234"
                      value={generateProjectId()}
                      readOnly
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r border-t border-r border-b border-gray-300"
                      title="Gerar novo ID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ID gerado automaticamente. Clique no ícone para gerar um novo.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email do Cliente *</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cliente@exemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha para o Cliente</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senha para acesso"
                      value={generatePassword()}
                      readOnly
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r border-t border-r border-b border-gray-300"
                      title="Gerar nova senha"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Senha gerada automaticamente. Clique no ícone para gerar uma nova.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Amostras</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Quantidade inicial de amostras"
                    min="1"
                    defaultValue="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição do projeto"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Simular criação de projeto
                    const newProject = {
                      projectId: generateProjectId(),
                      name: "Novo Projeto de Teste",
                      status: "Projeto gerado",
                      sampleCount: 10,
                      email: "cliente@exemplo.com",
                      createdAt: "2025-04-13", // Data atual
                      description: "Projeto de teste criado pelo administrador"
                    };
                    handleCreateProject(newProject);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de gerenciamento de senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Gerenciar Senha do Cliente</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Projeto: <span className="font-semibold">{selectedProject?.name || "Projeto Selecionado"}</span>
                </p>
                <p className="text-gray-700">
                  ID: <span className="font-semibold">{selectedProject?.projectId || "AB-1234"}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    const newPassword = handleResetPassword(selectedProject?.id);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Gerar Nova Senha
                </button>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Ao gerar uma nova senha, a senha anterior será invalidada imediatamente. 
                    A nova senha será enviada para o email do cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificações */}
      {notification && (
        <div className={`fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border-l-4 
          ${notification.type === 'success' ? 'border-green-500' : 
            notification.type === 'error' ? 'border-red-500' : 'border-blue-500'} 
          p-4 z-50 flex items-center`}
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
            ${notification.type === 'success' ? 'bg-green-100 text-green-500' : 
              notification.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}
          >
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : notification.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;