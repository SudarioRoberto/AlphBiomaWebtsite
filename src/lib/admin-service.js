// src/lib/admin-service.js
// Este serviço gerencia a comunicação entre o painel administrativo e o Supabase

import { supabase } from './supabase.js';
import CryptoJS from 'crypto-js';

/**
 * Serviço para administração avançada de projetos e amostras
 */
export const AdminService = {
  /**
   * Busca todos os projetos no banco de dados
   * @returns {Promise<Array>} Lista de projetos
   */
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, project_id, email, status, description, created_at, sample_count')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar projetos:', error);
      throw new Error('Não foi possível carregar os projetos');
    }
    
    return data || [];
  },

  /**
   * Busca um projeto específico pelo ID
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Object>} Dados do projeto
   */
  async getProjectById(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, project_id, email, status, description, created_at, sample_count')
      .eq('id', projectId)
      .single();
      
    if (error) {
      console.error('Erro ao buscar projeto:', error);
      throw new Error('Não foi possível carregar os detalhes do projeto');
    }
    
    return data;
  },

  /**
   * Cria um novo projeto
   * @param {Object} projectData - Dados do projeto
   * @returns {Promise<Object>} Projeto criado
   */
  async createProject(projectData) {
    // Gerar password hash e salt
    const password = projectData.password || this.generateRandomPassword(10);
    const { hash, salt } = this.hashPassword(password);
    
    const projectId = projectData.projectId || await this.generateUniqueProjectId();
    
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        project_id: projectId,
        email: projectData.email,
        status: 'Projeto gerado',
        description: projectData.description,
        password_hash: hash,
        password_salt: salt,
        sample_count: 0
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao criar projeto:', error);
      throw new Error('Não foi possível criar o projeto');
    }
    
    // Se número de amostras for especificado, criar as amostras
    if (projectData.sampleCount && projectData.sampleCount > 0) {
      await this.generateSamples(data.id, projectData.sampleCount);
    }
    
    // Para retornar a senha gerada ao cliente (só será exibida uma vez)
    return {
      ...data,
      generatedPassword: password
    };
  },

  /**
   * Atualiza um projeto existente
   * @param {string} projectId - ID do projeto
   * @param {Object} projectData - Dados atualizados
   * @returns {Promise<Object>} Projeto atualizado
   */
  async updateProject(projectId, projectData) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        email: projectData.email
      })
      .eq('id', projectId)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw new Error('Não foi possível atualizar o projeto');
    }
    
    // Se o status foi alterado, sincroniza o status das amostras
    if (projectData.status) {
      await this.syncSamplesWithProjectStatus(projectId, projectData.status);
    }
    
    return data;
  },

  /**
   * Sincroniza o status das amostras com o status do projeto
   * @param {string} projectId - ID do projeto
   * @param {string} projectStatus - Novo status do projeto
   */
  async syncSamplesWithProjectStatus(projectId, projectStatus) {
    // Determinar o status das amostras com base no status do projeto
    let sampleStatus = 'Pendente';
    
    if (projectStatus === 'Amostras enviadas') {
      sampleStatus = 'Enviada';
    } else if (projectStatus === 'DNA extraído') {
      sampleStatus = 'Em processamento';
    } else if (['DNA amplificado', 'DNA sequenciado'].includes(projectStatus)) {
      sampleStatus = 'Processada';
    } else if (['Analisando dados', 'Gerando relatório', 'Relatório entregue'].includes(projectStatus)) {
      sampleStatus = 'Analisada';
    }
    
    // Atualizar todas as amostras do projeto com o novo status
    const { error } = await supabase
      .from('generic_samples')
      .update({ status: sampleStatus })
      .eq('project_id', projectId);
      
    if (error) {
      console.error('Erro ao sincronizar amostras:', error);
      throw new Error('Não foi possível sincronizar o status das amostras');
    }
  },

  /**
   * Gera uma nova senha para um cliente e a retorna
   * @param {string} projectId - ID do projeto
   * @returns {Promise<string>} Nova senha gerada
   */
  async resetClientPassword(projectId) {
    // Gerar nova senha
    const newPassword = this.generateRandomPassword(10);
    const { hash, salt } = this.hashPassword(newPassword);
    
    // Atualizar a senha no banco de dados
    const { error } = await supabase
      .from('projects')
      .update({
        password_hash: hash,
        password_salt: salt
      })
      .eq('id', projectId);
      
    if (error) {
      console.error('Erro ao resetar senha:', error);
      throw new Error('Não foi possível redefinir a senha');
    }
    
    // Deve-se implementar o envio de email com a nova senha aqui
    // Em um ambiente de produção
    
    return newPassword;
  },

  /**
   * Gera novas amostras para um projeto
   * @param {string} projectId - ID do projeto
   * @param {number} count - Quantidade de amostras a serem geradas
   * @returns {Promise<Array>} Amostras geradas
   */
  async generateSamples(projectId, count) {
    // Obter o ID do projeto (formato AB-1234)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      console.error('Erro ao buscar projeto:', projectError);
      throw new Error('Não foi possível gerar amostras');
    }
    
    // Obter a contagem atual de amostras para este projeto
    const { count: currentCount, error: countError } = await supabase
      .from('generic_samples')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
      
    if (countError) {
      console.error('Erro ao contar amostras:', countError);
      throw new Error('Não foi possível gerar amostras');
    }
    
    // Gerar novas amostras com IDs sequenciais
    const samples = [];
    const startNumber = (currentCount || 0) + 1;
    
    for (let i = 0; i < count; i++) {
      const sampleNumber = (startNumber + i).toString().padStart(3, '0');
      samples.push({
        sample_id: `${project.project_id}-${sampleNumber}`,
        project_id: projectId,
        status: 'Disponível',
      });
    }
    
    // Inserir as amostras no banco de dados
    const { data, error } = await supabase
      .from('generic_samples')
      .insert(samples)
      .select();
      
    if (error) {
      console.error('Erro ao inserir amostras:', error);
      throw new Error('Não foi possível gerar amostras');
    }
    
    // Atualizar a contagem de amostras no projeto
    await supabase.rpc('increment_sample_count', {
      project_id_param: projectId,
      increment_by: count
    });
    
    return data;
  },

  /**
   * Busca todas as amostras de um projeto
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Array>} Lista de amostras
   */
  async getProjectSamples(projectId) {
    const { data, error } = await supabase
      .from('generic_samples')
      .select('*')
      .eq('project_id', projectId);
      
    if (error) {
      console.error('Erro ao buscar amostras:', error);
      throw new Error('Não foi possível carregar as amostras');
    }
    
    return data || [];
  },

  /**
   * Atualiza os dados de uma amostra
   * @param {string} sampleId - ID da amostra
   * @param {Object} sampleData - Dados atualizados
   * @returns {Promise<Object>} Amostra atualizada
   */
  async updateSample(sampleId, sampleData) {
    const { data, error } = await supabase
      .from('generic_samples')
      .update({
        animal_id: sampleData.animal,
        treatment: sampleData.treatment,
        observation: sampleData.observation,
        status: sampleData.status
      })
      .eq('sample_id', sampleId)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao atualizar amostra:', error);
      throw new Error('Não foi possível atualizar a amostra');
    }
    
    return data;
  },

  /**
   * Remove uma amostra do projeto (torna-a disponível novamente)
   * @param {string} sampleId - ID da amostra
   * @returns {Promise<void>}
   */
  async removeSampleFromProject(sampleId) {
    // Primeiro, obter o project_id atual para depois decrementar a contagem
    const { data: sample, error: fetchError } = await supabase
      .from('generic_samples')
      .select('project_id')
      .eq('sample_id', sampleId)
      .single();
      
    if (fetchError) {
      console.error('Erro ao buscar amostra:', fetchError);
      throw new Error('Não foi possível remover a amostra');
    }
    
    const projectId = sample.project_id;
    
    // Desassociar a amostra do projeto
    const { error } = await supabase
      .from('generic_samples')
      .update({
        project_id: null,
        animal_id: null,
        treatment: null,
        observation: null,
        status: 'Disponível',
        collection_date: null
      })
      .eq('sample_id', sampleId);
      
    if (error) {
      console.error('Erro ao remover amostra:', error);
      throw new Error('Não foi possível remover a amostra');
    }
    
    // Decrementar a contagem de amostras no projeto
    if (projectId) {
      await supabase.rpc('increment_sample_count', {
        project_id_param: projectId,
        increment_by: -1
      });
    }
  },

  /**
   * Gera um ID de projeto único
   * @returns {Promise<string>} ID de projeto gerado
   */
  async generateUniqueProjectId() {
    let id;
    let exists = true;

    while (exists) {
      // Gera duas letras aleatórias
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                     letters.charAt(Math.floor(Math.random() * letters.length));
      
      // Gera um número de 4 dígitos
      const number = Math.floor(1000 + Math.random() * 9000);
      
      id = `${prefix}-${number}`;

      // Verifica se o ID já existe
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('project_id', id)
        .maybeSingle();

      exists = !!data;
    }

    return id;
  },

  /**
   * Gera uma senha aleatória
   * @param {number} length - Comprimento da senha
   * @returns {string} Senha gerada
   */
  generateRandomPassword(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  },

  /**
   * Cria um hash de senha com salt
   * @param {string} password - Senha em texto plano
   * @returns {Object} Hash e salt
   */
  hashPassword(password) {
    // Gerar um salt aleatório
    const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    
    // Criar o hash
    const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 512/32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA512
      }).toString(CryptoJS.enc.Hex);
    
    return { hash, salt };
  },

  /**
   * Verifica uma senha
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash armazenado
   * @param {string} salt - Salt armazenado
   * @returns {boolean} True se a senha estiver correta
   */
  verifyPassword(password, hash, salt) {
    const generatedHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
      
    return generatedHash === hash;
  }
};