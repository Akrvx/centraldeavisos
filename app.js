// --- app.js (VERSÃO ATUALIZADA COM MENSAGENS DE ERRO E ROTA DO PORTAL) ---

// 1. CONEXÃO COM O SUPABASE
const SUPABASE_URL = 'https://gtcwclhvapajvigacuyp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Y3djbGh2YXBhanZpZ2FjdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc3NDcsImV4cCI6MjA3ODI4Mzc0N30.gEpyYD2LjNzS5rhm4jTSnRtGsjc0ceb6Zzv8MywOWwg';

const { createClient } = supabase;
const clienteSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNÇÕES DE AJUDA PARA MENSAGENS ---
/**
 * Exibe uma mensagem na div de erro/sucesso.
 * @param {string} elementId - O ID da div (ex: 'login-error')
 * @param {string} message - A mensagem a ser exibida
 * @param {boolean} isError - É uma mensagem de erro (vermelha) ou sucesso (verde)?
 */
function showMessage(elementId, message, isError = true) {
    const div = document.getElementById(elementId);
    div.innerText = message;

    // Remove estilos antigos
    div.classList.remove('success-message');
    div.classList.add('error-message'); // Garante que o padrão é erro

    if (!isError) {
        // Remove a classe de erro e adiciona a de sucesso
        // Precisamos adicionar 'success-message' ao seu style.css se quisermos verde
        // Por enquanto, vamos apenas mudar a cor com JS:
        div.style.color = '#155724'; // Verde
        div.style.borderColor = '#c3e6cb';
        div.style.backgroundColor = '#d4edda';
    } else {
        // Reseta para cores de erro (caso tenha sido sucesso antes)
        div.style.color = '';
        div.style.borderColor = '';
        div.style.backgroundColor = '';
    }
    div.style.display = 'block';
}

/**
 * Esconde uma div de mensagem.
 * @param {string} elementId - O ID da div (ex: 'login-error')
 */
function hideMessage(elementId) {
    const div = document.getElementById(elementId);
    if (div) {
        div.style.display = 'none';
        div.innerText = '';
    }
}

// 2. FUNÇÕES DE AUTENTICAÇÃO

// Função para CADASTRAR um novo usuário
async function cadastrarUsuario(email, senha) {
    hideMessage('cadastro-error'); // Esconde erro antigo
    
    const { data, error } = await clienteSupabase.auth.signUp({
        email: email,
        password: senha,
    });
    
    if (error) {
        console.error('Erro no cadastro:', error.message);
        showMessage('cadastro-error', error.message); // Mostra erro na div
    } else {
        console.log('Usuário cadastrado:', data.user);
        // Mostra mensagem de sucesso!
        showMessage('cadastro-error', 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.', false);
    }
}

// Função para LOGAR um usuário existente
async function loginUsuario(email, senha) {
    hideMessage('login-error'); // Esconde erro antigo

    const { data, error } = await clienteSupabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        console.error('Erro no login:', error.message);
        // Deixa a mensagem mais amigável
        let userMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
            userMessage = 'E-mail ou senha inválidos. Tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
            userMessage = 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
        }
        showMessage('login-error', userMessage);
    } else {
        console.log('Login com sucesso!', data.user);
        
        // --- MUDANÇA PRINCIPAL AQUI ---
        // Redireciona para a nova home do portal
        window.location.href = 'portal-home.html';
    }
}

// Função para DESLOGAR
async function logoutUsuario() {
    const { error } = await clienteSupabase.auth.signOut();
    if (error) {
        console.error('Erro ao deslogar:', error.message);
    } else {
        console.log('Usuário deslogado.');
        window.location.href = 'index.html';
    }
}

// 3. FUNÇÕES DO BANCO DE DADOS (AVISOS)

// Função para CARREGAR os avisos do banco
async function carregarAvisos() {
    const { data, error } = await clienteSupabase
        .from('avisos')      
        .select('*')         
        .order('created_at', { ascending: false }); 

    if (error) {
        console.error('Erro ao carregar avisos:', error.message);
        showMessage('aviso-error', 'Erro ao carregar os avisos. Tente recarregar a página.');
        return;
    }

    const listaAvisos = document.getElementById('lista-avisos');
    listaAvisos.innerHTML = ''; 

    if (data.length === 0) {
        listaAvisos.innerHTML = '<p>Nenhum aviso postado ainda.</p>';
        return;
    }

    data.forEach(aviso => {
        const divAviso = document.createElement('div');
        divAviso.classList.add('aviso'); 
        divAviso.innerHTML = `
            <h3>${aviso.titulo}</h3>
            <p>${aviso.conteudo}</p>
            <small>Postado em: ${new Date(aviso.created_at).toLocaleString('pt-BR')}</small>
        `;
        listaAvisos.appendChild(divAviso);
    });
}

// Função para CRIAR um novo aviso
async function criarAviso() {
    hideMessage('aviso-error'); // Esconde erro antigo
    
    const titulo = document.getElementById('aviso-titulo').value;
    const conteudo = document.getElementById('aviso-conteudo').value;

    // Validação simples
    if (!titulo || !conteudo) {
        showMessage('aviso-error', 'Por favor, preencha o título e o conteúdo do aviso.');
        return;
    }

    const { data: { user } } = await clienteSupabase.auth.getUser();

    const { data, error } = await clienteSupabase
        .from('avisos')
        .insert([
            { titulo: titulo, conteudo: conteudo, user_id: user.id } 
        ]);

    if (error) {
        console.error('Erro ao criar aviso:', error.message);
        showMessage('aviso-error', 'Erro ao postar aviso: ' + error.message);
    } else {
        console.log('Aviso criado:', data);
        showMessage('aviso-error', 'Aviso postado com sucesso!', false); // Mostra sucesso
        
        document.getElementById('aviso-titulo').value = '';
        document.getElementById('aviso-conteudo').value = '';
        carregarAvisos(); // Recarrega a lista

        // Esconde a mensagem de sucesso depois de 3 segundos
        setTimeout(() => {
            hideMessage('aviso-error');
        }, 3000);
    }
}