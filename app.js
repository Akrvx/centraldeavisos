// --- app.js (VERSÃO FINAL COM EDIÇÃO E GERENCIAMENTO DE USUÁRIOS) ---

// 1. CONEXÃO COM O SUPABASE
const SUPABASE_URL = 'https://gtcwclhvapajvigacuyp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Y3djbGh2YXBhanZpZ2FjdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc3NDcsImV4cCI6MjA3ODI4Mzc0N30.gEpyYD2LjNzS5rhm4jTSnRtGsjc0ceb6Zzv8MywOWwg';

const { createClient } = supabase;
const clienteSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNÇÕES DE AJUDA PARA MENSAGENS ---
function showMessage(elementId, message, isError = true) {
    const div = document.getElementById(elementId);
    if (!div) {
        console.warn(`Elemento de mensagem não encontrado: ${elementId}`);
        return; 
    }
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

async function recuperarSenha(email) {
    hideMessage('recuperar-message');
    // ** MUITO IMPORTANTE: TROQUE PELA SUA URL REAL DO NETLIFY **
    const suaUrlDoNetlify = 'https://seu-site.netlify.app/index.html'; // <-- TROQUE AQUI
    
    const { data, error } = await clienteSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: suaUrlDoNetlify, 
    });
    const btn = document.getElementById('btn-recuperar');
    if (error) {
        console.error('Erro ao recuperar senha:', error.message);
        showMessage('recuperar-message', 'Erro: ' + error.message);
        btn.disabled = false;
        btn.innerText = 'ENVIAR LINK';
    } else {
        console.log('Link de recuperação enviado:', data);
        showMessage('recuperar-message', 'Sucesso! Verifique sua caixa de entrada (e spam) para o link de redefinição.', false);
        btn.innerText = 'ENVIADO!';
    }
}


// 3. FUNÇÕES DO BANCO DE DADOS (AVISOS)
async function carregarAvisos() {
    const isAdmin = document.getElementById('btn-postar-aviso') !== null;
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
        let deleteButtonHTML = '';
        let editButtonHTML = '';
        if (isAdmin) {
            deleteButtonHTML = `<button class="btn-delete" onclick="deletarAviso(${aviso.id})">Deletar</button>`;
            editButtonHTML = `<a href="editar-item.html?tabela=avisos&id=${aviso.id}" class="btn-edit">Editar</a>`;
        }
        divAviso.innerHTML = `
            ${deleteButtonHTML}
            ${editButtonHTML}
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

// 4. FUNÇÕES DE PERFIL
async function carregarPerfil() {
    try {
        const { data: { user } } = await clienteSupabase.auth.getUser();
        if (!user) throw new Error("Usuário não encontrado.");
        const { data: profile, error } = await clienteSupabase
            .from('profiles')
            .select('nome_completo, matricula, curso, avatar_url')
            .eq('id', user.id)
            .maybeSingle(); 
        if (error) { throw error; }
        document.getElementById('perfil-email').value = user.email;
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
            document.getElementById('avatar-preview').style.backgroundImage = `url('https://via.placeholder.com/150')`;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showMessage('perfil-message', 'Não foi possível carregar suas informações.');
    }
}

async function atualizarPerfil(updates, file) {
    try {
        hideMessage('perfil-message');
        const { data: { user } } = await clienteSupabase.auth.getUser();
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
            updates.avatar_url = publicUrl;
        }
        const { error } = await clienteSupabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);
        if (error) { throw error; }
        showMessage('perfil-message', 'Perfil atualizado com sucesso!', false);
        if (updates.avatar_url) {
            document.getElementById('avatar-preview').style.backgroundImage = `url(${updates.avatar_url})`;
        }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error.message);
        showMessage('perfil-message', 'Erro ao atualizar: ' + error.message);
    }
}

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

async function removerAvatar() {
    try {
        hideMessage('perfil-message');
        const placeholder = 'https://via.placeholder.com/150';
        const { data: { user } } = await clienteSupabase.auth.getUser();
        const { error } = await clienteSupabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id);
        if (error) { throw error; }
        document.getElementById('avatar-preview').style.backgroundImage = `url('${placeholder}')`;
        document.getElementById('perfil-avatar').value = null; 
        showMessage('perfil-message', 'Foto de perfil removida!', false);
    } catch (error) {
        console.error('Erro ao remover avatar:', error.message);
        showMessage('perfil-message', 'Erro ao remover foto: ' + error.message);
    }
}


// 5. FUNÇÕES DO BANCO DE DADOS (ANÚNCIOS)
async function carregarAnuncios() {
    const isAdmin = document.getElementById('btn-postar-anuncio') !== null;
    const { data, error } = await clienteSupabase
        .from('anuncios')
        .select('*')
        .order('created_at', { ascending: false }); 
    if (error) {
        console.error('Erro ao carregar anúncios:', error.message);
        showMessage('anuncio-error', 'Erro ao carregar os anúncios. Tente recarregar a página.');
        return;
    }
    const listaAnuncios = document.getElementById('lista-anuncios');
    listaAnuncios.innerHTML = ''; 
    if (data.length === 0) {
        listaAnuncios.innerHTML = '<p>Nenhum anúncio postado ainda.</p>';
        return;
    }
    data.forEach(anuncio => {
        const divAnuncio = document.createElement('div');
        divAnuncio.classList.add('aviso');
        let deleteButtonHTML = '';
        let editButtonHTML = '';
        if (isAdmin) {
            deleteButtonHTML = `<button class="btn-delete" onclick="deletarAnuncio(${anuncio.id})">Deletar</button>`;
            editButtonHTML = `<a href="editar-item.html?tabela=anuncios&id=${anuncio.id}" class="btn-edit">Editar</a>`;
        }
        divAnuncio.innerHTML = `
            ${deleteButtonHTML}
            ${editButtonHTML}
            <h3>${anuncio.titulo}</h3>
            <p>${anuncio.conteudo}</p>
            <small>Postado em: ${new Date(anuncio.created_at).toLocaleString('pt-BR')}</small>
        `;
        listaAnuncios.appendChild(divAnuncio);
    });
}

async function criarAnuncio() {
    hideMessage('anuncio-error'); 
    const titulo = document.getElementById('anuncio-titulo').value;
    const conteudo = document.getElementById('anuncio-conteudo').value;
    if (!titulo || !conteudo) {
        showMessage('anuncio-error', 'Por favor, preencha o título e o conteúdo do anúncio.');
        return;
    }
    const { data: { user } } = await clienteSupabase.auth.getUser();
    const { data, error } = await clienteSupabase
        .from('anuncios')
        .insert([
            { titulo: titulo, conteudo: conteudo, user_id: user.id } 
        ]);
    if (error) {
        console.error('Erro ao criar anúncio:', error.message);
        showMessage('anuncio-error', 'Erro ao postar anúncio: ' + error.message);
    } else {
        console.log('Anúncio criado:', data);
        showMessage('anuncio-error', 'Anúncio postado com sucesso!', false);
        document.getElementById('anuncio-titulo').value = '';
        document.getElementById('anuncio-conteudo').value = '';
        carregarAnuncios();
        setTimeout(() => {
            hideMessage('anuncio-error');
        }, 3000);
    }
}

// 6. FUNÇÕES DO BANCO DE DADOS (FERIADOS)
async function carregarFeriados() {
    const isAdmin = document.getElementById('btn-postar-feriado') !== null;
    const { data, error } = await clienteSupabase
        .from('feriados') 
        .select('*') 
        .order('data_feriado', { ascending: true }); 
    if (error) {
        showMessage('feriado-error', 'Erro ao carregar os feriados. Tente recarregar a página.');
        return;
    }
    const listaFeriados = document.getElementById('lista-feriados');
    listaFeriados.innerHTML = ''; 
    if (data.length === 0) {
        listaFeriados.innerHTML = '<p>Nenhum feriado cadastrado ainda.</p>';
        return;
    }
    data.forEach(feriado => {
        const divFeriado = document.createElement('div');
        divFeriado.classList.add('aviso');
        let deleteButtonHTML = '';
        let editButtonHTML = '';
        if (isAdmin) {
            deleteButtonHTML = `<button class="btn-delete" onclick="deletarFeriado(${feriado.id})">Deletar</button>`;
            editButtonHTML = `<a href="editar-item.html?tabela=feriados&id=${feriado.id}" class="btn-edit">Editar</a>`;
        }
        const dataFormatada = new Date(feriado.data_feriado).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC' 
        });
        divFeriado.innerHTML = `
            ${deleteButtonHTML}
            ${editButtonHTML}
            <h3>${feriado.titulo}</h3>
            <p>Data: ${dataFormatada}</p> 
        `;
        listaFeriados.appendChild(divFeriado);
    });
}

async function criarFeriado() {
    hideMessage('feriado-error'); 
    const titulo = document.getElementById('feriado-titulo').value;
    const dataFeriado = document.getElementById('feriado-data').value;
    if (!titulo || !dataFeriado) {
        showMessage('feriado-error', 'Por favor, preencha o nome e a data do feriado.');
        return;
    }
    const { data: { user } } = await clienteSupabase.auth.getUser();
    const { data, error } = await clienteSupabase
        .from('feriados')
        .insert([
            { titulo: titulo, data_feriado: dataFeriado, user_id: user.id } 
        ]);
    if (error) {
        console.error('Erro ao criar feriado:', error.message);
        showMessage('feriado-error', 'Erro ao postar feriado: ' + error.message);
    } else {
        console.log('Feriado criado:', data);
        showMessage('feriado-error', 'Feriado postado com sucesso!', false);
        document.getElementById('feriado-titulo').value = '';
        document.getElementById('feriado-data').value = '';
        carregarFeriados();
        setTimeout(() => {
            hideMessage('feriado-error');
        }, 3000);
    }
}


// 7. FUNÇÕES DE DELETAR (ADMIN)
async function deletarAviso(id) {
    if (!confirm('Tem certeza que deseja deletar este aviso? Esta ação não pode ser desfeita.')) {
        return;
    }
    try {
        const { error } = await clienteSupabase
            .from('avisos')
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        carregarAvisos();
    } catch (error) {
        console.error('Erro ao deletar aviso:', error.message);
        showMessage('aviso-error', 'Erro ao deletar: ' + error.message);
    }
}

async function deletarAnuncio(id) {
    if (!confirm('Tem certeza que deseja deletar este anúncio? Esta ação não pode ser desfeita.')) {
        return;
    }
    try {
        const { error } = await clienteSupabase
            .from('anuncios')
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        carregarAnuncios(); // CORREÇÃO: Chamava carregarAvisos()
    } catch (error) {
        console.error('Erro ao deletar anúncio:', error.message);
        showMessage('anuncio-error', 'Erro ao deletar: ' + error.message);
    }
}

async function deletarFeriado(id) {
    if (!confirm('Tem certeza que deseja deletar este feriado? Esta ação não pode ser desfeita.')) {
        return;
    }
    try {
        const { error } = await clienteSupabase
            .from('feriados')
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        carregarFeriados();
    } catch (error) {
        console.error('Erro ao deletar feriado:', error.message);
        showMessage('feriado-error', 'Erro ao deletar: ' + error.message);
    }
}

// 8. FUNÇÕES DO BANCO DE DADOS (AVALIAÇÕES)
async function carregarAvaliacoes() {
    const isAdmin = document.getElementById('btn-postar-avaliacao') !== null;
    const { data, error } = await clienteSupabase
        .from('avaliacoes')
        .select('*') 
        .order('data_avaliacao', { ascending: true }); 
    if (error) {
        console.error('Erro ao carregar avaliações:', error.message);
        showMessage('avaliacao-error', 'Erro ao carregar as avaliações. Tente recarregar a página.');
        return;
    }
    const listaAvaliacoes = document.getElementById('lista-avaliacoes');
    listaAvaliacoes.innerHTML = '';
    if (data.length === 0) {
        listaAvaliacoes.innerHTML = '<p>Nenhuma avaliação cadastrada ainda.</p>';
        return;
    }
    data.forEach(avaliacao => {
        const divAvaliacao = document.createElement('div');
        divAvaliacao.classList.add('aviso'); 
        let deleteButtonHTML = '';
        let editButtonHTML = '';
        if (isAdmin) {
            deleteButtonHTML = `<button class="btn-delete" onclick="deletarAvaliacao(${avaliacao.id})">Deletar</button>`;
            editButtonHTML = `<a href="editar-item.html?tabela=avaliacoes&id=${avaliacao.id}" class="btn-edit">Editar</a>`;
        }
        const dataFormatada = new Date(avaliacao.data_avaliacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC' 
        });
        divAvaliacao.innerHTML = `
            ${deleteButtonHTML}
            ${editButtonHTML}
            <h3>${avaliacao.titulo} (${avaliacao.materia})</h3>
            <p>Data: ${dataFormatada}</p>
            <p>Detalhes: ${avaliacao.detalhes}</p> 
        `;
        listaAvaliacoes.appendChild(divAvaliacao);
    });
}

async function criarAvaliacao() {
    hideMessage('avaliacao-error');
    const titulo = document.getElementById('avaliacao-titulo').value;
    const materia = document.getElementById('avaliacao-materia').value;
    const dataAvaliacao = document.getElementById('avaliacao-data').value;
    const detalhes = document.getElementById('avaliacao-detalhes').value;
    if (!titulo || !materia || !dataAvaliacao) {
        showMessage('avaliacao-error', 'Por favor, preencha o título, a matéria e a data.');
        return;
    }
    const { data: { user } } = await clienteSupabase.auth.getUser();
    const { data, error } = await clienteSupabase
        .from('avaliacoes')
        .insert([
            { 
                titulo: titulo, 
                materia: materia,
                data_avaliacao: dataAvaliacao,
                detalhes: detalhes, 
                user_id: user.id 
            } 
        ]);
    if (error) {
        console.error('Erro ao criar avaliação:', error.message);
        showMessage('avaliacao-error', 'Erro ao postar avaliação: ' + error.message);
    } else {
        console.log('Avaliação criada:', data);
        showMessage('avaliacao-error', 'Avaliação postada com sucesso!', false);
        document.getElementById('avaliacao-titulo').value = '';
        document.getElementById('avaliacao-materia').value = '';
        document.getElementById('avaliacao-data').value = '';
        document.getElementById('avaliacao-detalhes').value = '';
        carregarAvaliacoes(); 
        setTimeout(() => { hideMessage('avaliacao-error'); }, 3000);
    }
}

async function deletarAvaliacao(id) {
    if (!confirm('Tem certeza que deseja deletar esta avaliação? Esta ação não pode ser desfeita.')) {
        return;
    }
    try {
        const { error } = await clienteSupabase
            .from('avaliacoes')
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        carregarAvaliacoes();
    } catch (error) {
        console.error('Erro ao deletar avaliação:', error.message);
        showMessage('avaliacao-error', 'Erro ao deletar: ' + error.message);
    }
}


// --- 9. FUNÇÕES DE EDIÇÃO (ADMIN) ---
async function carregarItemParaEdicao() {
    const params = new URLSearchParams(window.location.search);
    const tabela = params.get('tabela');
    const id = params.get('id');
    if (!tabela || !id) {
        showMessage('edit-error', 'Erro: Tabela ou ID não especificado.');
        return;
    }
    const { data, error } = await clienteSupabase
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single(); 
    if (error) {
        console.error('Erro ao carregar item:', error);
        showMessage('edit-error', 'Erro ao carregar item: ' + error.message);
        return;
    }
    const formContainer = document.getElementById('form-container');
    let formHTML = '';
    document.getElementById('edit-title').innerText = `Editando ${tabela.slice(0, -1)}`; 
    if (tabela === 'avisos' || tabela === 'anuncios') {
        formHTML = `
            <label for="edit-titulo">Título</label>
            <input type="text" id="edit-titulo" value="${data.titulo || ''}">
            <label for="edit-conteudo">Conteúdo</label>
            <textarea id="edit-conteudo">${data.conteudo || ''}</textarea>
        `;
    } else if (tabela === 'feriados') {
        formHTML = `
            <label for="edit-titulo">Nome do Feriado</label>
            <input type="text" id="edit-titulo" value="${data.titulo || ''}">
            <label for="edit-data">Data do Feriado</label>
            <input type="date" id="edit-data" value="${data.data_feriado || ''}">
        `;
    } else if (tabela === 'avaliacoes') {
        formHTML = `
            <label for="edit-titulo">Título da Avaliação</label>
            <input type="text" id="edit-titulo" value="${data.titulo || ''}">
            <label for="edit-materia">Matéria</label>
            <input type="text" id="edit-materia" value="${data.materia || ''}">
            <label for="edit-data">Data da Avaliação</label>
            <input type="date" id="edit-data" value="${data.data_avaliacao || ''}">
            <label for="edit-detalhes">Detalhes</label>
            <textarea id="edit-detalhes">${data.detalhes || ''}</textarea>
        `;
    }
    formContainer.innerHTML = formHTML;
}

async function salvarEdicao() {
    const params = new URLSearchParams(window.location.search);
    const tabela = params.get('tabela');
    const id = params.get('id');
    if (!tabela || !id) {
        showMessage('edit-error', 'ERRO: Tabela ou ID não encontrado. Não é possível salvar.');
        return;
    }
    let updates = {}; 
    try {
        if (tabela === 'avisos' || tabela === 'anuncios') {
            updates = {
                titulo: document.getElementById('edit-titulo').value,
                conteudo: document.getElementById('edit-conteudo').value
            };
        } else if (tabela === 'feriados') {
            updates = {
                titulo: document.getElementById('edit-titulo').value,
                data_feriado: document.getElementById('edit-data').value
            };
        } else if (tabela === 'avaliacoes') {
            updates = {
                titulo: document.getElementById('edit-titulo').value,
                materia: document.getElementById('edit-materia').value,
                data_avaliacao: document.getElementById('edit-data').value,
                detalhes: document.getElementById('edit-detalhes').value
            };
        }
    } catch (e) {
        console.error('Erro ao ler campos do formulário:', e);
        showMessage('edit-error', 'Erro interno ao ler formulário.');
        return;
    }
    const { error } = await clienteSupabase
        .from(tabela)
        .update(updates)
        .eq('id', id);
    if (error) {
        console.error('Erro ao salvar:', error.message);
        showMessage('edit-error', 'Erro ao salvar: ' + error.message);
    } else {
        console.log('Item salvo com sucesso!');
        showMessage('edit-error', 'Salvo com sucesso!', false); 
        document.getElementById('btn-salvar-edicao').disabled = true;
        setTimeout(() => {
            if (tabela === 'avisos') window.location.href = 'admin-avisos.html';
            else if (tabela === 'anuncios') window.location.href = 'admin-anuncios.html';
            else if (tabela === 'feriados') window.location.href = 'admin-feriados.html';
            else if (tabela === 'avaliacoes') window.location.href = 'admin-avaliacoes.html';
            else window.location.href = 'admin-panel.html';
        }, 2000);
    }
}

// --- 10. FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS (ADMIN) ---
async function carregarUsuarios() {
    try {
        // CORREÇÃO: Removido o '_' extra
        const { data: profiles, error } = await clienteSupabase
            .from('profiles')
            .select('*') 
            .order('created_at', { ascending: true });

        if (error) { throw error; }

        const listaUsuarios = document.getElementById('lista-usuarios');
        listaUsuarios.innerHTML = ''; 

        if (profiles.length === 0) {
            listaUsuarios.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        const { data: { user } } = await clienteSupabase.auth.getUser();

        profiles.forEach(profile_ => {
            const tr = document.createElement('tr');
            
            const isStudent = profile_.role === 'student';
            const isAdmin = profile_.role === 'admin';
            const isSelf = profile_.id === user.id; 

            let dropdownHTML = `
                <select class="role-select" 
                        onchange="atualizarRoleUsuario('${profile_.id}', this.value)" 
                        ${isSelf ? 'disabled' : ''}>
                    <option value="student" ${isStudent ? 'selected' : ''}>
                        Aluno
                    </option>
                    <option value="admin" ${isAdmin ? 'selected' : ''}>
                        Admin
                    </option>
                </select>
            `;
            
            if (isSelf) {
                dropdownHTML = '<span>(Você Mesmo)</span>';
            }

            // CORREÇÃO: O email não está na tabela 'profiles',
            // teríamos que fazer um join complexo ou buscar o usuário.
            // Por enquanto, vamos deixar N/A.
            tr.innerHTML = `
                <td>${profile_.nome_completo || 'N/A'}</td>
                <td>(N/A - Auth)</td> 
                <td>${profile_.matricula || 'N/A'}</td>
                <td>${profile_.role}</td>
                <td>${dropdownHTML}</td>
            `;
            listaUsuarios.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar usuários:', error.message);
        showMessage('admin-message', 'Erro ao carregar lista de usuários.');
    }
}

async function atualizarRoleUsuario(userId, newRole) {
    if (!confirm(`Tem certeza que deseja mudar o cargo deste usuário para "${newRole}"?`)) {
        location.reload(); 
        return;
    }

    try {
        const { error } = await clienteSupabase
            .from('profiles')
            .update({ role: newRole }) 
            .eq('id', userId);

        if (error) { throw error; }

        showMessage('admin-message', 'Cargo do usuário atualizado com sucesso!', false); 
        carregarUsuarios();

    } catch (error) {
        console.error('Erro ao atualizar cargo:', error.message);
        showMessage('admin-message', 'Erro ao atualizar o cargo: ' + error.message);
    }
}

// --- 11. FUNÇÕES DO CALENDÁRIO ---

/**
 * Busca os dados de avaliações e feriados e renderiza o FullCalendar.
 */
async function renderizarCalendario() {
    try {
        // 1. Busca os dois tipos de eventos ao mesmo tempo
        let [ { data: avaliacoes, error: errAval }, { data: feriados, error: errFer } ] = await Promise.all([
            clienteSupabase.from('avaliacoes').select('titulo, data_avaliacao'),
            clienteSupabase.from('feriados').select('titulo, data_feriado')
        ]);

        if (errAval || errFer) {
            throw new Error(errAval.message || errFer.message);
        }

        // 2. Formata os eventos para o FullCalendar
        
        // Formata as avaliações
        const eventosAvaliacoes = avaliacoes.map(item => ({
            title: `Avaliação: ${item.titulo}`,
            date: item.data_avaliacao,
            className: 'fc-event-avaliacao' // Classe CSS para cor
        }));
        
        // Formata os feriados
        const eventosFeriados = feriados.map(item => ({
            title: item.titulo,
            date: item.data_feriado,
            className: 'fc-event-feriado', // Classe CSS para cor
            display: 'background' // Faz o feriado pintar o dia todo
        }));

        // Junta as duas listas em uma só
        const todosEventos = [...eventosAvaliacoes, ...eventosFeriados];

        // 3. Renderiza o Calendário
        const calendarEl = document.getElementById('calendario');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // Visão mensal
            locale: 'pt-br', // Traduz para Português
            buttonText: {
                today: 'Hoje' // Traduz o botão 'today'
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek' // Opções de visão
            },
            events: todosEventos, // Nossa lista de eventos
            eventClick: function(info) {
                // (Opcional) Mostra um alerta com os detalhes
                alert(`Evento: ${info.event.title}\nData: ${info.event.start.toLocaleDateString('pt-BR')}`);
            }
        });
        calendar.render();

    } catch (error) {
        console.error('Erro ao renderizar calendário:', error);
        document.getElementById('calendario').innerHTML = `<p style="color: red;">Erro ao carregar eventos: ${error.message}</p>`;
    }
}