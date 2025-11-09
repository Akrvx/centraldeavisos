// --- app.js (VERSÃO FINAL CORRIGIDA) ---

// 1. CONEXÃO COM O SUPABASE
const SUPABASE_URL = 'https://gtcwclhvapajvigacuyp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Y3djbGh2YXBhanZpZ2FjdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc3NDcsImV4cCI6MjA3ODI4Mzc0N30.gEpyYD2LjNzS5rhm4jTSnRtGsjc0ceb6Zzv8MywOWwg';

// --- CORREÇÃO AQUI ---
// Em vez de usar a variável 'supabase' global, nós pegamos a função
// da biblioteca e inicializamos o cliente com segurança aqui dentro.
// Isso garante que 'clienteSupabase' sempre existirá.
const { createClient } = supabase;
const clienteSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. FUNÇÕES DE AUTENTICAÇÃO

// Função para CADASTRAR um novo usuário
async function cadastrarUsuario(email, senha) {
    const { data, error } = await clienteSupabase.auth.signUp({
        email: email,
        password: senha,
    });
    
    if (error) {
        console.error('Erro no cadastro:', error.message);
        alert('Erro ao cadastrar: ' + error.message);
    } else {
        console.log('Usuário cadastrado:', data.user);
        alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
    }
}

// Função para LOGAR um usuário existente
async function loginUsuario(email, senha) {
    const { data, error } = await clienteSupabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        console.error('Erro no login:', error.message);
        alert('Erro ao logar: ' + error.message);
    } else {
        console.log('Login com sucesso!', data.user);
        window.location.href = 'dashboard.html';
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
        return;
    }

    const listaAvisos = document.getElementById('lista-avisos');
    listaAvisos.innerHTML = ''; 

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
    const titulo = document.getElementById('aviso-titulo').value;
    const conteudo = document.getElementById('aviso-conteudo').value;

    const { data: { user } } = await clienteSupabase.auth.getUser();

    const { data, error } = await clienteSupabase
        .from('avisos')
        .insert([
            { titulo: titulo, conteudo: conteudo, user_id: user.id } 
        ]);

    if (error) {
        console.error('Erro ao criar aviso:', error.message);
        alert('Erro ao postar aviso!');
    } else {
        console.log('Aviso criado:', data);
        alert('Aviso postado com sucesso!');
        
        document.getElementById('aviso-titulo').value = '';
        document.getElementById('aviso-conteudo').value = '';
        carregarAvisos(); 
    }
}