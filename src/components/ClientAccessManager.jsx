import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Componente para gerenciar o acesso de clientes ao sistema
 * Inclui gerenciamento de senhas, emails e permissões
 */
const ClientAccessManager = ({ project, adminService }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [emailHistory, setEmailHistory] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  
  // Dados de exemplo para simulação
  useEffect(() => {
    if (project) {
      // Simular histórico de login
      setLoginHistory([
        { date: '2025-04-10T14:32:10', ip: '192.168.1.45', device: 'iPhone 15 Pro', success: true },
        { date: '2025-04-09T09:15:22', ip: '187.45.123.78', device: 'Chrome em Windows', success: true },
        { date: '2025-04-05T18:47:33', ip: '201.56.87.32', device: 'App AlphaBioma (Android)', success: false },
      ]);
      
      // Simular histórico de emails
      setEmailHistory([
        { date: '2025-04-11T10:00:15', type: 'Relatório Parcial', status: 'Entregue' },
        { date: '2025-04-05T08:30:42', type: 'Acesso Ativado', status: 'Entregue' },
        { date: '2025-04-01T14:22:58', type: 'Boas-vindas', status: 'Entregue' },
      ]);
    }
  }, [project]);
  
  // Simula a geração de uma nova senha
  const handleResetPassword = async () => {
    try {
      setLoading(true);
      
      // Em produção, isso chamaria o serviço adminService
      // const newGeneratedPassword = await adminService.resetClientPassword(project.id);
      
      // Para simulação, vamos gerar uma senha aleatória
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
      let password = "";
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      setNewPassword(password);
      showNotification('Nova senha gerada com sucesso!', 'success');
    } catch (err) {
      setError('Erro ao gerar nova senha: ' + err.message);
      showNotification('Falha ao gerar nova senha', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Simula o envio de email com a nova senha
  const handleSendPasswordEmail = async () => {
    try {
      setLoading(true);
      
      // Simular envio de email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar histórico de emails
      setEmailHistory([
        { date: new Date().toISOString(), type: 'Nova Senha', status: 'Entregue' },
        ...emailHistory
      ]);
      
      showNotification('Email com a nova senha enviado com sucesso!', 'success');
      setShowPasswordModal(false);
    } catch (err) {
      setError('Erro ao enviar email: ' + err.message);
      showNotification('Falha ao enviar email', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Atualiza as informações de contato do cliente
  const handleUpdateContactInfo = async (newEmail) => {
    try {
      setLoading(true);
      
      // Simular atualização no banco de dados
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showNotification('Informações de contato atualizadas com sucesso!', 'success');
    } catch (err) {
      setError('Erro ao atualizar informações: ' + err.message);
      showNotification('Falha ao atualizar informações', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Mostra uma notificação temporária
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  if (!project) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-gray-500 italic">Selecione um projeto para gerenciar o acesso do cliente.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Gerenciamento de Acesso</h2>
      
      {/* Informações do cliente */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
        <div className="space-y-3">
          <div className="flex">
            <span className="font-medium w-32">Projeto:</span>
            <span>{project.name}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-32">ID do Projeto:</span>
            <span>{project.projectId}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-32">Email:</span>
            <span>{project.email}</span>
            <button
              onClick={() => {
                const newEmail = prompt('Digite o novo email:', project.email);
                if (newEmail && newEmail !== project.email) {
                  handleUpdateContactInfo(newEmail);
                }
              }}
              className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Editar
            </button>
          </div>
          <div className="flex">
            <span className="font-medium w-32">Status:</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              project.status === 'Relatório entregue' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {project.status}
            </span>
          </div>
        </div>
      </div>
      
      {/* Credenciais de acesso */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Credenciais de Acesso</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="font-medium w-32">ID de Login:</span>
            <span className="bg-gray-100 px-3 py-1 rounded">{project.projectId}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(project.projectId);
                showNotification('ID copiado para a área de transferência!', 'success');
              }}
              className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Copiar
            </button>
          </div>
          
          <div>
            <span className="font-medium">Senha:</span>
            <div className="mt-2">
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  handleResetPassword();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Gerar Nova Senha
              </button>
              <p className="text-sm text-gray-500 mt-2">
                A senha atual nunca é exibida por razões de segurança. Ao gerar uma nova senha, 
                a anterior será invalidada e o cliente será notificado por email.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Histórico de acessos */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Histórico de Acessos</h3>
        {loginHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispositivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loginHistory.map((login, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(login.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{login.ip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{login.device}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${login.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {login.success ? 'Sucesso' : 'Falha'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">Nenhum registro de acesso encontrado.</p>
        )}
      </div>
      
      {/* Histórico de comunicações */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Histórico de Comunicações</h3>
        {emailHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emailHistory.map((email, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(email.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{email.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${email.status === 'Entregue' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">Nenhum registro de comunicação encontrado.</p>
        )}
      </div>
      
      {/* Modal de nova senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Nova Senha Gerada</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="mb-2 text-gray-700">
                  Uma nova senha foi gerada para o projeto:
                </p>
                <p className="font-semibold">{project.name} ({project.projectId})</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={newPassword}
                    className="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword);
                      showNotification('Senha copiada para a área de transferência!', 'success');
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r border-t border-r border-b border-gray-300"
                    title="Copiar senha"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Importante!</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Esta senha só será exibida uma vez. Certifique-se de copiá-la antes de fechar esta janela.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={handleSendPasswordEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enviar por Email
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
    </div>
  );
};

export default ClientAccessManager;