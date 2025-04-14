import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Componente para gerenciar amostras de um projeto específico
 * Inclui funcionalidades de adicionar, editar, remover e sincronizar amostras
 */
const SampleManager = ({ projectId, projectName, adminService }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedId, setScannedId] = useState(null);
  
  useEffect(() => {
    loadSamples();
  }, [projectId]);
  
  // Carrega as amostras do projeto do Supabase
  const loadSamples = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const samples = await adminService.getProjectSamples(projectId);
      setSamples(samples);
    } catch (err) {
      setError('Erro ao carregar amostras: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtra as amostras pelo termo de busca
  const filteredSamples = samples.filter(sample => 
    sample.sample_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sample.animal_id && sample.animal_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sample.treatment && sample.treatment.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Gera novas amostras para o projeto
  const handleAddSamples = async () => {
    try {
      setLoading(true);
      await adminService.generateSamples(projectId, batchCount);
      showNotification(`${batchCount} novas amostras geradas com sucesso!`, 'success');
      await loadSamples();
      setShowAddModal(false);
    } catch (err) {
      setError('Erro ao gerar amostras: ' + err.message);
      showNotification('Falha ao gerar amostras', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Atualiza os dados de uma amostra
  const handleUpdateSample = async (sampleData) => {
    try {
      setLoading(true);
      await adminService.updateSample(sampleData.id, sampleData);
      showNotification('Amostra atualizada com sucesso!', 'success');
      await loadSamples();
      setShowEditModal(false);
    } catch (err) {
      setError('Erro ao atualizar amostra: ' + err.message);
      showNotification('Falha ao atualizar amostra', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Remove uma amostra do projeto
  const handleRemoveSample = async (sampleId) => {
    if (!confirm('Tem certeza que deseja remover esta amostra?')) return;
    
    try {
      setLoading(true);
      await adminService.removeSampleFromProject(sampleId);
      showNotification('Amostra removida com sucesso!', 'success');
      await loadSamples();
    } catch (err) {
      setError('Erro ao remover amostra: ' + err.message);
      showNotification('Falha ao remover amostra', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Mostra uma notificação temporária
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Simula um scanner de código de barras
  const handleScannerActivate = () => {
    setScannerActive(true);
    
    // Simula a conclusão do escaneamento após 2 segundos
    setTimeout(() => {
      // Gera um ID de amostra aleatório
      const random = Math.floor(1000 + Math.random() * 9000);
      const projectPrefix = projectId.split('-')[0] || 'AB';
      const scannedSampleId = `${projectPrefix}-${random}`;
      
      setScannedId(scannedSampleId);
      setScannerActive(false);
      
      // Busca a amostra na lista
      const sample = samples.find(s => s.sample_id === scannedSampleId);
      if (sample) {
        setSelectedSample(sample);
        setShowEditModal(true);
      } else {
        showNotification(`Amostra ${scannedSampleId} não encontrada no sistema`, 'error');
      }
    }, 2000);
  };

  if (loading && samples.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Amostras do Projeto</h2>
          <p className="text-sm text-gray-500">{projectName || 'Projeto selecionado'}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => handleScannerActivate()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            disabled={scannerActive}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM13 12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-3zm1 2v1h1v-1h-1z" clipRule="evenodd" />
            </svg>
            {scannerActive ? 'Escaneando...' : 'Escanear Amostra'}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Gerar Novas Amostras
          </button>
        </div>
      </div>
      
      {/* Barra de pesquisa */}
      <div className="mb-6 flex">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar amostras por ID, animal ou tratamento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Exibir erro se houver */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Lista de amostras */}
      {filteredSamples.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">ID da Amostra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Animal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Tratamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Observação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Data de Coleta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSamples.map((sample) => (
                <tr key={sample.sample_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{sample.sample_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sample.animal_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sample.treatment || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${sample.status === 'Coletado' ? 'bg-green-100 text-green-800' :
                        sample.status === 'Disponível' ? 'bg-gray-100 text-gray-800' :
                        sample.status === 'Em processamento' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'}`}>
                      {sample.status || 'Não definido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                    {sample.observation || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sample.collection_date ? new Date(sample.collection_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedSample(sample);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRemoveSample(sample.sample_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 mb-4">Nenhuma amostra encontrada para este projeto.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Gerar Novas Amostras
          </button>
        </div>
      )}
      
      {/* Modal para adicionar amostras */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Gerar Novas Amostras</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de Amostras
                </label>
                <input
                  type="number"
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  Serão geradas {batchCount} novas amostras para o projeto "{projectName}".
                  Os IDs serão gerados automaticamente com base no ID do projeto.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSamples}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Gerar Amostras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para editar amostra */}
      {showEditModal && selectedSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Editar Amostra</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 font-medium">
                  ID da Amostra: {selectedSample.sample_id}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID do Animal
                  </label>
                  <input
                    type="text"
                    value={selectedSample.animal_id || ''}
                    onChange={(e) => setSelectedSample({...selectedSample, animal_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tratamento
                  </label>
                  <input
                    type="text"
                    value={selectedSample.treatment || ''}
                    onChange={(e) => setSelectedSample({...selectedSample, treatment: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedSample.status || 'Disponível'}
                    onChange={(e) => setSelectedSample({...selectedSample, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Coletado">Coletado</option>
                    <option value="Em processamento">Em processamento</option>
                    <option value="Analisada">Analisada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observação
                  </label>
                  <textarea
                    value={selectedSample.observation || ''}
                    onChange={(e) => setSelectedSample({...selectedSample, observation: e.target.value})}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleUpdateSample(selectedSample)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Exibir notificação temporária */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          <p>{notification.message}</p>
        </div>
      )}
      
      {/* Exibir modal de scanner quando ativo */}
      {scannerActive && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-center">
            <div className="w-full max-w-xs mx-auto aspect-square bg-gray-200 rounded-lg mb-4 relative overflow-hidden">
              {/* Animação de escaneamento */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 6h1m-1 6v1m-6 6h1M5 12h1m6-6h1m-6 6h1m6 6H12m6-6h1m-2-4l-5 5m0 0l-5-5m5 5V4" />
                </svg>
              </div>
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 animate-scan"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Escaneando código...</h3>
            <p className="text-gray-600 mb-4">Posicione o código de barras ou QR code no centro da câmera</p>
            <button
              onClick={() => setScannerActive(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleManager;