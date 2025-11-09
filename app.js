// --- app.js (VERSÃO COM FUNÇÃO DE REMOVER AVATAR) ---

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
} // <-- FIM DA FUNÇÃO criarAviso


// 4. FUNÇÕES DE PERFIL

/**
 * Carrega os dados do usuário logado e preenche o formulário de perfil.
 */
async function carregarPerfil(user) {
    try {
        // Pega os metadados (nome, avatar_url) do usuário
        const metadata = user.user_metadata;
        
        // Preenche o campo de e-mail (desabilitado)
        document.getElementById('perfil-email').value = user.email;
        
        // Preenche o nome (se existir)
        if (metadata && metadata.nome_completo) {
            document.getElementById('perfil-nome').value = metadata.nome_completo;
        }
        
        // Preenche a imagem de avatar (se existir)
        if (metadata && metadata.avatar_url) {
            document.getElementById('avatar-preview').style.backgroundImage = `url(${metadata.avatar_url})`;
        } else {
            // --- AJUSTE AQUI ---
            // Garante que o placeholder apareça se não houver foto
            document.getElementById('avatar-preview').style.backgroundImage = `url('https://via.placeholder.com/150')`;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showMessage('perfil-message', 'Não foi possível carregar suas informações.');
    }
}

/**
 * Atualiza o nome e/ou a foto de perfil do usuário.
 */
async function atualizarPerfil(nome, file) {
    try {
        hideMessage('perfil-message');
        const { data: { user } } = await clienteSupabase.auth.getUser();
        
        // Pega a URL antiga, ou define como null se não existir
        let avatar_url = (user.user_metadata && user.user_metadata.avatar_url) ? user.user_metadata.avatar_url : null;
        
        // 1. Se o usuário enviou um ARQUIVO (foto)
        if (file) {
            // Remove o 'public/' do caminho do arquivo
            const filePath = `${user.id}-${new Date().getTime()}-${file.name}`;
            
            // Faz o upload para o bucket 'avatars'
            const { error: uploadError } = await clienteSupabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Permite sobrescrever se o arquivo já existir (útil)
                });

            if (uploadError) {
                throw uploadError; // Joga o erro para o 'catch'
            }
            
            // Pega a URL pública do arquivo que acabamos de enviar
            const { data: { publicUrl } } = clienteSupabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            avatar_url = publicUrl; // Atualiza a variável da URL do avatar
        }
        
        // 2. Atualiza os metadados do usuário (Auth)
        const { data, error: updateError } = await clienteSupabase.auth.updateUser({
            data: { 
                nome_completo: nome,
                avatar_url: avatar_url 
            }
        });

        if (updateError) {
            throw updateError;
        }

        // Sucesso!
        showMessage('perfil-message', 'Perfil atualizado com sucesso!', false);
        // Atualiza a imagem de preview na hora
        if (avatar_url) {
            document.getElementById('avatar-preview').style.backgroundImage = `url(${avatar_url})`;
        }

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error.message);
        showMessage('perfil-message', 'Erro ao atualizar: ' + error.message);
    }
}

/**
 * Atualiza a senha do usuário logado.
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

        if (error) {
            throw error;
        }

        showMessage('senha-message', 'Senha alterada com sucesso!', false);
        document.getElementById('perfil-senha-nova').value = ''; // Limpa o campo

    } catch (error) {
        console.error('Erro ao alterar senha:', error.message);
        showMessage('senha-message', 'Erro ao alterar senha: ' + error.message);
    }
}


// --- NOVA FUNÇÃO ADICIONADA AQUI ---
/**
 * Remove a foto de perfil do usuário.
 */
async function removerAvatar() {
    try {
        hideMessage('perfil-message');
        
        // URL do placeholder
        const placeholder = 'https://via.placeholder.com/150';

        // Atualiza os metadados do usuário para null
        const { error } = await clienteSupabase.auth.updateUser({
            data: { 
                avatar_url: null 
            }
        });

        if (error) { throw error; }

        // Atualiza a imagem de preview na hora
        document.getElementById('avatar-preview').style.backgroundImage = `url('${placeholder}')`;
        // Limpa o campo de "Escolher arquivo"
        document.getElementById('perfil-avatar').value = null; 
        
        showMessage('perfil-message', 'Foto de perfil removida!', false);

    } catch (error) {
        console.error('Erro ao remover avatar:', error.message);
        showMessage('perfil-message', 'Erro ao remover foto: ' + error.message);
    }
}