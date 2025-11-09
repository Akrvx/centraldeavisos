// --- app.js (VERSÃO COM CORREÇÃO DE TIMING DO PERFIL) ---

// 1. CONEXÃO COM O SUPABASE
const SUPABASE_URL = 'https://gtcwclhvapajvigacuyp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Y3djbGh2YXBhanZpZ2FjdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc3NDcsImV4cCI6MjA3ODI4Mzc0N30.gEpyYD2LjNzS5rhm4jTSnRtGsjc0ceb6Zzv8MywOWwg';

const { createClient } = supabase;
const clienteSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNÇÕES DE AJUDA PARA MENSAGENS ---
function showMessage(elementId, message, isError = true) {
    const div = document.getElementById(elementId);
    div.innerText = message;
    div.classList.remove('success-message');
    div.classList.add('error-message');
    if (!isError) {
        div.style.color = '#155724';
        div.style.borderColor = '#c3e6cb';
        div.style.backgroundColor = '#d4edda';
    } else {
        div.style.color = '';
        div.style.borderColor = '';
        div.style.backgroundColor = '';
    }
    div.style.display = 'block';
}

function hideMessage(elementId) {
    const div = document.getElementById(elementId);
    if (div) {
        div.style.display = 'none';
        div.innerText = '';
    }
}

// 2. FUNÇÕES DE AUTENTICAÇÃO
async function cadastrarUsuario(email, senha) {
    hideMessage('cadastro-error');
    const { data, error } = await clienteSupabase.auth.signUp({
        email: email,
        password: senha,
    });
    if (error) {
        console.error('Erro no cadastro:', error.message);
        showMessage('cadastro-error', error.message);
    } else {
        console.log('Usuário cadastrado:', data.user);
        showMessage('cadastro-error', 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.', false);
    }
}

async function loginUsuario(email, senha) {
    hideMessage('login-error');
    const { data, error } = await clienteSupabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });
    if (error) {
        console.error('Erro no login:', error.message);
        let userMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
            userMessage = 'E-mail ou senha inválidos. Tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
            userMessage = 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
        }
        showMessage('login-error', userMessage);
    } else {
        console.log('Login com sucesso!', data.user);
        window.location.href = 'portal-home.html';
    }
}

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

async function criarAviso() {
    hideMessage('aviso-error'); 
    const titulo = document.getElementById('aviso-titulo').value;
    const conteudo = document.getElementById('aviso-conteudo').value;
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
        showMessage('aviso-error', 'Aviso postado com sucesso!', false);
        document.getElementById('aviso-titulo').value = '';
        document.getElementById('aviso-conteudo').value = '';
        carregarAvisos();
        setTimeout(() => {
            hideMessage('aviso-error');
        }, 3000);
    }
}

// --- 4. FUNÇÕES DE PERFIL (COM A CORREÇÃO DE TIMING) ---

/**
 * Carrega os dados do usuário logado da tabela 'profiles' e preenche o formulário.
 */
async function carregarPerfil() {
    try {
        // 1. Pega o usuário logado (da Auth)
        const { data: { user } } = await clienteSupabase.auth.getUser();
        if (!user) throw new Error("Usuário não encontrado.");

        // --- CORREÇÃO AQUI ---
        // Trocamos .single() por .maybeSingle()
        // .single() gera um ERRO se não achar nada (o que causa o bug)
        // .maybeSingle() retorna NULO se não achar nada (o que é perfeito)
        const { data: profile, error } = await clienteSupabase
            .from('profiles')
            .select('nome_completo, matricula, curso, avatar_url')
            .eq('id', user.id)
            .maybeSingle(); // <-- A MUDANÇA ESTÁ AQUI

        // Se houver um erro REAL (ex: sem conexão), nós paramos
        if (error) { throw error; }

        // 3. Preenche o formulário
        document.getElementById('perfil-email').value = user.email;
        
        // Se o perfil foi encontrado (NÃO é nulo), preenche os campos
        if (profile) {
            document.getElementById('perfil-nome').value = profile.nome_completo || '';
            document.getElementById('perfil-matricula').value = profile.matricula || '';
            document.getElementById('perfil-curso').value = profile.curso || '';
            
            if (profile.avatar_url) {
                document.getElementById('avatar-preview').style.backgroundImage = `url(${profile.avatar_url})`;
            } else {
                document.getElementById('avatar-preview').style.backgroundImage = `url('https://via.placeholder.com/150')`;
            }
        } else {
            // Se o perfil for nulo (usuário muito novo), apenas mostra os campos vazios
            // e o placeholder.
            document.getElementById('avatar-preview').style.backgroundImage = `url('https://via.placeholder.com/150')`;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showMessage('perfil-message', 'Não foi possível carregar suas informações.');
    }
}

/**
 * Atualiza os dados (nome, matricula, curso) e/ou a foto de perfil do usuário.
 * @param {object} updates - Objeto com os campos a atualizar (nome_completo, matricula, curso)
 * @param {File} file - O arquivo de imagem (opcional)
 */
async function atualizarPerfil(updates, file) {
    try {
        hideMessage('perfil-message');
        const { data: { user } } = await clienteSupabase.auth.getUser();

        // 1. Se o usuário enviou um ARQUIVO (foto)
        if (file) {
            const filePath = `${user.id}-${new Date().getTime()}-${file.name}`;
            const { error: uploadError } = await clienteSupabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true 
                });

            if (uploadError) { throw uploadError; }

            const { data: { publicUrl } } = clienteSupabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            // Adiciona a nova URL da foto ao objeto 'updates'
            updates.avatar_url = publicUrl;
        }
        
        // 2. Atualiza a tabela 'profiles' com todos os dados
        const { error } = await clienteSupabase
            .from('profiles')
            .update(updates) // 'updates' é {nome_completo, matricula, curso, avatar_url?}
            .eq('id', user.id); // Onde o 'id' do perfil é o 'id' do usuário

        if (error) { throw error; }

        // Sucesso!
        showMessage('perfil-message', 'Perfil atualizado com sucesso!', false);
        // Atualiza a imagem de preview na hora, se ela foi mudada
        if (updates.avatar_url) {
            document.getElementById('avatar-preview').style.backgroundImage = `url(${updates.avatar_url})`;
        }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error.message);
        showMessage('perfil-message', 'Erro ao atualizar: ' + error.message);
    }
}

/**
 * Atualiza a senha do usuário logado (Não muda, pois lida só com Auth).
 */
async function atualizarSenha(novaSenha) {
    try {
        hideMessage('senha-message');
        if (novaSenha.length < 6) {
            showMessage('senha-message', 'A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        const { data, error } = await clienteSupabase.auth.updateUser({
            password: novaSenha
        });
        if (error) { throw error; }
        showMessage('senha-message', 'Senha alterada com sucesso!', false);
        document.getElementById('perfil-senha-nova').value = '';
    } catch (error) {
        console.error('Erro ao alterar senha:', error.message);
        showMessage('senha-message', 'Erro ao alterar senha: ' + error.message);
    }
}

/**
 * Remove a foto de perfil do usuário da tabela 'profiles'.
 */
async function removerAvatar() {
    try {
        hideMessage('perfil-message');
        const placeholder = 'https://via.placeholder.com/150';
        const { data: { user } } = await clienteSupabase.auth.getUser();

        // Atualiza a coluna 'avatar_url' na tabela 'profiles' para null
        const { error } = await clienteSupabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id); // Onde o 'id' do perfil é o 'id' do usuário

        if (error) { throw error; }

        // Atualiza a UI
        document.getElementById('avatar-preview').style.backgroundImage = `url('${placeholder}')`;
        document.getElementById('perfil-avatar').value = null; 
        showMessage('perfil-message', 'Foto de perfil removida!', false);

    } catch (error) {
        console.error('Erro ao remover avatar:', error.message);
        showMessage('perfil-message', 'Erro ao remover foto: ' + error.message);
    }
}