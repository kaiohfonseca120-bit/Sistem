// 1. CONFIGURAÇÃO DA CONEXÃO COM O SUPABASE
const SUPABASE_URL = 'https://oswalksfrvfzrbaaeqny.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mHTsk9czuBqQz6t6Wznfhg_igxQq6FN';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let produtosLista = [];
let colunasBanco = [];

// 2. BUSCAR DADOS DO SUPABASE
async function carregarBancoDeDados() {
    try {
        document.getElementById('status-conexao').innerText = "● A ligar ao Supabase...";
        document.getElementById('status-conexao').className = "text-xs text-amber-400 font-medium mt-1";

        let { data: estoque, error } = await _supabase
            .from('Estoque')
            .select('*');

        if (error) throw error;

        if (!estoque || estoque.length === 0) {
            document.getElementById('status-conexao').innerText = "● Ligado (Tabela vazia)";
            return;
        }

        colunasBanco = Object.keys(estoque[0]);

        produtosLista = estoque.map(item => ({
            id: item.id || item.ID || Math.random(),
            raw: item 
        }));

        document.getElementById('status-conexao').innerText = `● Ligado ao Supabase (${produtosLista.length} itens)`;
        document.getElementById('status-conexao').className = "text-xs text-emerald-400 font-medium mt-1";

        renderizarTabelaDinamica(produtosLista);
        carregarReceitasFicha();

    } catch (erro) {
        console.error("Erro de Conexão:", erro);
        document.getElementById('status-conexao').innerText = "● Erro: " + erro.message;
        document.getElementById('status-conexao').className = "text-xs text-rose-400 font-medium mt-1";
    }
}

// 3. RENDERIZAR TABELA DINAMICAMENTE
function renderizarTabelaDinamica(dados) {
    const theadTr = document.querySelector('table thead tr');
    const tbody = document.getElementById('tabela-produtos');
    if (!tbody || !theadTr) return;

    theadTr.innerHTML = '';
    colunasBanco.forEach(coluna => {
        if (coluna.toLowerCase() === 'foto') return;
        const th = document.createElement('th');
        th.className = "pb-3 pl-2 text-left text-xs uppercase text-[#71717a] font-semibold tracking-wider cursor-pointer hover:text-white";
        th.innerText = coluna;
        th.onclick = () => ordenarPorColuna(coluna);
        theadTr.appendChild(th);
    });

    const thAcoes = document.createElement('th');
    thAcoes.className = "pb-3 text-center text-xs uppercase text-[#71717a]";
    thAcoes.innerText = "AÇÕES";
    theadTr.appendChild(thAcoes);

    tbody.innerHTML = '';
    dados.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-[#18181b] transition-colors group cursor-pointer';
        
        tr.onclick = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            abrirModalCadastro(p);
        };

        let htmlCelulas = '';
        colunasBanco.forEach(coluna => {
            if (coluna.toLowerCase() === 'foto') return;
            let valor = p.raw[coluna];
            if (valor === null || valor === undefined) valor = '';
            
            if (typeof valor === 'number') {
                valor = valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
            } else if (typeof valor === 'boolean') {
                valor = valor ? 'Sim' : 'Não';
            }

            htmlCelulas += `<td class="py-3 pl-2 text-sm text-gray-200">${valor}</td>`;
        });

        htmlCelulas += `
            <td class="py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="excluirProduto('${p.id}')" title="Excluir" class="p-1 hover:text-red-400 text-gray-400 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        `;

        tr.innerHTML = htmlCelulas;
        tbody.appendChild(tr);
    });

    if (window.lucide) window.lucide.createIcons();
}

// 4. ORDENAR POR COLUNA
let ordemAsc = true;
function ordenarPorColuna(coluna) {
    ordemAsc = !ordemAsc;
    produtosLista.sort((a, b) => {
        let valA = a.raw[coluna];
        let valB = b.raw[coluna];
        if (valA === null) valA = '';
        if (valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return ordemAsc ? valA - valB : valB - valA;
        }
        return ordemAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
    renderizarTabelaDinamica(produtosLista);
}

// 5. ABRIR MODAL DE CADASTRO / EDIÇÃO
function abrirModalCadastro(produtoExistente = null) {
    const container = document.getElementById('form-inputs-dinamicos');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalElement = document.getElementById('modal-produto');
    
    if (!container || !modalElement) return;

    container.innerHTML = '';
    const idAtual = produtoExistente ? produtoExistente.id : '';
    document.getElementById('prod-id').value = idAtual;
    
    if (modalTitulo) {
        modalTitulo.innerText = produtoExistente ? "Editar Item" : "Cadastrar Novo Item";
    }

    let htmlConteudo = '';
    let htmlInputsNormais = '';
    let htmlToggles = '';

    colunasBanco.forEach(col => {
        if (col.toLowerCase() === 'id' || col.toLowerCase() === 'foto') return;

        let valorAtual = produtoExistente ? (produtoExistente.raw[col] !== undefined && produtoExistente.raw[col] !== null ? produtoExistente.raw[col] : '') : '';
        let colLower = col.toLowerCase();

        let ehBoolean = (colLower.includes('vendavel') || colLower.includes('receita')) && !colLower.includes('rende') && typeof valorAtual !== 'number';
        let ehNome = colLower.includes('nome');
        let ehMontante = colLower.includes('montante');
        let ehNumero = colLower.includes('qtd') || colLower.includes('quantidade') || colLower.includes('custo') || colLower.includes('preco') || colLower.includes('valor') || colLower.includes('rende') || (!isNaN(valorAtual) && valorAtual !== '');

        if (ehNome) {
            htmlConteudo += `
                <div class="col-span-2 mb-3">
                    <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase">${col}</label>
                    <input type="text" data-coluna-real="${col}" data-tipo="text" value="${valorAtual}" class="w-full bg-[#18181b] text-white p-2.5 rounded-lg border border-zinc-700 focus:border-[#d946ef] focus:outline-none text-sm">
                </div>`;
        } else if (ehMontante) {
            htmlConteudo += `
                <div class="col-span-2 mb-3">
                    <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase">${col}</label>
                    <select data-coluna-real="${col}" data-tipo="text" class="w-full bg-[#18181b] text-white p-2.5 rounded-lg border border-zinc-700 focus:border-[#d946ef] focus:outline-none text-sm">
                        <option value="">Selecione...</option>
                        <option value="Unidade" ${valorAtual === 'Unidade' ? 'selected' : ''}>Unidade</option>
                        <option value="Kg" ${valorAtual === 'Kg' ? 'selected' : ''}>Kg</option>
                        <option value="Litro" ${valorAtual === 'Litro' ? 'selected' : ''}>Litro</option>
                        <option value="Caixa" ${valorAtual === 'Caixa' ? 'selected' : ''}>Caixa</option>
                        <option value="Pacote" ${valorAtual === 'Pacote' ? 'selected' : ''}>Pacote</option>
                    </select>
                </div>`;
        } else if (ehBoolean) {
            let isChecked = (valorAtual === true || valorAtual === 'true' || valorAtual === 1) ? 'checked' : '';
            htmlToggles += `
                <div class="flex items-center justify-between bg-[#18181b] px-3.5 py-2.5 rounded-lg border border-zinc-700">
                    <span class="text-xs font-semibold text-gray-300 uppercase">${col}</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-coluna-real="${col}" data-tipo="boolean" ${isChecked} class="sr-only peer">
                        <div class="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d946ef]"></div>
                    </label>
                </div>`;
        } else {
            let tipoInput = ehNumero ? 'number' : 'text';
            let stepAttr = ehNumero ? 'step="any"' : '';
            htmlInputsNormais += `
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase">${col}</label>
                    <input type="${tipoInput}" ${stepAttr} data-coluna-real="${col}" data-tipo="${tipoInput}" value="${valorAtual}" class="w-full bg-[#27272a] text-white p-2.5 rounded-lg border border-transparent focus:border-[#d946ef] focus:outline-none text-sm">
                </div>`;
        }
    });

    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${htmlConteudo}${htmlInputsNormais}${htmlToggles}</div>`;
    modalElement.classList.remove('hidden');
}

window.salvarProduto = async function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('prod-id').value;
    let produtoData = {};

    document.querySelectorAll('#form-inputs-dinamicos [data-coluna-real]').forEach(input => {
        let coluna = input.getAttribute('data-coluna-real');
        let tipo = input.getAttribute('data-tipo');
        let valor = input.value.trim();
        if (valor === '') valor = null;
        else if (tipo === 'number' && !isNaN(valor)) valor = Number(valor);
        produtoData[coluna] = valor;
    });

    document.querySelectorAll('#form-inputs-dinamicos input[type="checkbox"]').forEach(chk => {
        let coluna = chk.getAttribute('data-coluna-real');
        if (coluna) produtoData[coluna] = chk.checked;
    });

    try {
        if (id && id !== '') {
            let idFormatado = !isNaN(id) ? Number(id) : id;
            let { error } = await _supabase.from('Estoque').update(produtoData).eq('id', idFormatado);
            if (error) throw error;
        } else {
            let { error } = await _supabase.from('Estoque').insert([produtoData]);
            if (error) throw error;
        }

        fecharModalCadastro();
        await carregarBancoDeDados();
        alert("Operação realizada com sucesso!");
    } catch (err) {
        alert("Erro ao salvar no Supabase: " + err.message);
    }
};

// CONTROLE DO MENU MOBILE (ABRIR / FECHAR COM BACKDROP)
function toggleMenuMobile() {
    const sidebar = document.getElementById('sidebar-mobile');
    const backdrop = document.getElementById('backdrop-mobile');
    
    if (sidebar && backdrop) {
        sidebar.classList.toggle('-translate-x-full');
        backdrop.classList.toggle('hidden');
    }
}

// 6. ALTERNAR ABAS
function alternarVisualizacao(rota) {
    const viewEstoque = document.getElementById('view-estoque');
    const viewFicha = document.getElementById('view-ficha-tecnica');
    
    const btnEstoque = document.getElementById('btn-nav-estoque');
    const btnFicha = document.getElementById('btn-nav-ficha');

    const estiloInativo = "w-full flex items-center gap-3 p-2.5 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded-xl transition-colors";
    const estiloAtivo = "w-full flex items-center gap-3 p-2.5 text-[#d946ef] bg-[#27272a] rounded-xl transition-colors";

    if (btnEstoque) btnEstoque.className = estiloInativo;
    if (btnFicha) btnFicha.className = estiloInativo;

    if (rota === 'estoque') {
        if (viewEstoque) viewEstoque.classList.remove('hidden');
        if (viewFicha) viewFicha.classList.add('hidden');
        if (btnEstoque) btnEstoque.className = estiloAtivo;
    } else if (rota === 'ficha') {
        if (viewEstoque) viewEstoque.classList.add('hidden');
        if (viewFicha) viewFicha.classList.remove('hidden');
        if (btnFicha) btnFicha.className = estiloAtivo;
        carregarReceitasFicha();
    } else {
        alert(`A aba "${rota}" será aberta em breve!`);
    }

    // Fecha a sidebar e esconde o backdrop automaticamente no telemóvel
    const sidebar = document.getElementById('sidebar-mobile');
    const backdrop = document.getElementById('backdrop-mobile');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
    }
}

// 7. CARREGAR RECEITAS NO SELETOR
async function carregarReceitasFicha() {
    const selectReceita = document.getElementById('select-receita-ficha');
    if (!selectReceita) return;

    if (!produtosLista || produtosLista.length === 0) {
        await carregarBancoDeDados();
    }

    const receitasDisponiveis = produtosLista.filter(p => {
        const dados = p.raw ? p.raw : p;
        const isTrue = (val) => val === true || val === 'true' || val === 1 || val === 'True';
        return isTrue(dados.RECEITA) || isTrue(dados.Receita) || isTrue(dados.receita);
    });

    if (receitasDisponiveis.length === 0) {
        selectReceita.innerHTML = '<option value="">Nenhuma receita encontrada (RECEITA = true)</option>';
        return;
    }

    selectReceita.innerHTML = `
        <option value="">Selecione uma receita...</option>
        ${receitasDisponiveis.map(r => {
            const dados = r.raw ? r.raw : r;
            const idVal = r.id || dados.id || dados.ID;
            const nomeVal = dados.NOME || dados.Nome || dados.nome || 'Receita sem nome';
            return `<option value="${idVal}">${nomeVal}</option>`;
        }).join('')}
    `;
}

// 8. MUDAR RECEITA E CALCULAR CUSTOS + SALVAR NO ESTOQUE
async function mudarReceitaFicha(receitaId) {
    const containerIngredientes = document.getElementById('lista-ingredientes-container');
    const elRendimento = document.getElementById('ft-rendimento-destaque');
    const elNomeReceita = document.getElementById('ft-nome-receita');
    const elCustoTotal = document.getElementById('ft-custo-total');
    const elCustoPorKg = document.getElementById('ft-custo-por-kg');

    if (!receitaId) {
        if (elNomeReceita) elNomeReceita.innerText = "Selecione uma Receita";
        if (elRendimento) elRendimento.innerText = "Rendimento 0,00";
        if (elCustoTotal) elCustoTotal.innerText = "R$ 0,00";
        if (elCustoPorKg) elCustoPorKg.innerText = "R$ 0,00 / Kg";
        if (containerIngredientes) containerIngredientes.innerHTML = '<p class="text-sm text-zinc-500">Selecione uma receita para ver os ingredientes.</p>';
        return;
    }

    const lista = window.produtosLista || produtosLista || [];
    const receitaObj = lista.find(p => (p.id || (p.raw && p.raw.id)) == receitaId);
    if (!receitaObj) return;

    const dadosReceita = receitaObj.raw || receitaObj;
    const nomeReceita = dadosReceita.NOME || dadosReceita.Nome || dadosReceita.nome || 'Receita';
    const rendimentoValor = Number(dadosReceita.RENDE_P_RECEITA || dadosReceita.Rende_p_Receita || dadosReceita.rendimento || 1);
    const tipoMontante = dadosReceita.MONTANTE || dadosReceita.Montante || dadosReceita.montante || 'Kg';

    if (elNomeReceita) elNomeReceita.innerText = nomeReceita;
    if (elRendimento) elRendimento.innerText = `Rendimento ${rendimentoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (containerIngredientes) containerIngredientes.innerHTML = '<p class="text-sm text-zinc-400">A carregar ingredientes...</p>';

    try {
        const { data: itensFicha, error } = await _supabase.from('Ficha_Tecnica').select('*').eq('ReceitaID', receitaId);
        if (error) throw error;

        const ingredientes = itensFicha || [];
        let custoTotalCalculado = 0;

        const ingredientesProcessados = ingredientes.map(item => {
            const produtoEstoque = lista.find(p => (p.id || (p.raw && p.raw.id)) == item.ProdutoID);
            const dadosEstoque = produtoEstoque ? (produtoEstoque.raw || produtoEstoque) : {};
            const nomeIngrediente = dadosEstoque.NOME || dadosEstoque.Nome || dadosEstoque.nome || `Produto #${item.ProdutoID}`;
            
            const custoUnitario = Number(dadosEstoque.CUSTO_MEDIO_COMPRA || dadosEstoque.Custo_Medio_Compra || dadosEstoque.custo_medio || 0);
            const qtdUsada = Number(item.QTD || item.qtd || 0);

            const custoItem = custoUnitario * qtdUsada;
            custoTotalCalculado += custoItem;

            return { idFicha: item.id, nome: nomeIngrediente, qtd: qtdUsada, custoCalculado: custoItem };
        });

        const custoPorKgCalculado = rendimentoValor > 0 ? (custoTotalCalculado / rendimentoValor) : 0;

        if (elCustoTotal) elCustoTotal.innerText = `R$ ${custoTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (elCustoPorKg) elCustoPorKg.innerText = `R$ ${custoPorKgCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${tipoMontante}`;

        // Salva automaticamente o custo total atualizado na tabela Estoque do item da receita
        let colunaCusto = 'Custo_Medio_Compra';
        for (let chave in dadosReceita) {
            if (chave.toLowerCase().includes('custo')) {
                colunaCusto = chave;
                break;
            }
        }
        
        await _supabase.from('Estoque').update({ [colunaCusto]: custoTotalCalculado }).eq('id', receitaId);
        if (receitaObj.raw) receitaObj.raw[colunaCusto] = custoTotalCalculado;

        if (containerIngredientes) {
            if (ingredientesProcessados.length === 0) {
                containerIngredientes.innerHTML = '<div class="p-6 text-center bg-[#18181b] rounded-xl border border-zinc-800 text-zinc-500 text-sm">Nenhum ingrediente vinculado. Clique em "Adicionar Ingredientes".</div>';
            } else {
                containerIngredientes.innerHTML = ingredientesProcessados.map(ing => `
                    <div class="flex items-center justify-between p-3.5 bg-[#18181b] hover:bg-[#27272a] rounded-xl border border-zinc-800/80 transition-colors group">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 shrink-0 border border-zinc-700/50">
                                <i data-lucide="package" class="w-6 h-6 text-zinc-400"></i>
                            </div>
                            <div>
                                <span class="text-xs font-bold text-[#d946ef] block">R$ ${ing.custoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <h4 class="text-sm font-bold text-white leading-tight mt-0.5">${ing.nome}</h4>
                                <span class="text-xs text-zinc-400 font-medium">${ing.qtd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</span>
                            </div>
                        </div>
                        <button onclick="removerIngredienteFicha('${ing.idFicha}')" title="Remover" class="p-2 text-zinc-400 hover:text-red-400 rounded-lg transition-colors">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>`).join('');
            }
        }

        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        console.error("Erro ao carregar ingredientes:", err);
    }
}

// 9. MODAL DE ADICIONAR INGREDIENTE
function abrirModalAdicionarIngrediente() {
    const selectReceita = document.getElementById('select-receita-ficha');
    if (!selectReceita || !selectReceita.value) {
        alert("Por favor, selecione uma receita primeiro!");
        return;
    }

    const modal = document.getElementById('modal-adicionar-ingrediente');
    const selectProduto = document.getElementById('select-produto-estoque');
    const inputQtd = document.getElementById('input-qtd-ingrediente');

    if (inputQtd) inputQtd.value = '';

    const lista = window.produtosLista || produtosLista || [];
    if (selectProduto) {
        selectProduto.innerHTML = `
            <option value="">Selecione um produto do estoque...</option>
            ${lista.map(p => {
                const dados = p.raw ? p.raw : p;
                const idVal = p.id || dados.id || dados.ID;
                const nomeVal = dados.NOME || dados.Nome || dados.nome || 'Produto sem nome';
                return `<option value="${idVal}">${nomeVal}</option>`;
            }).join('')}
        `;
    }

    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
}

function fecharModalAdicionarIngrediente() {
    const modal = document.getElementById('modal-adicionar-ingrediente');
    if (modal) modal.classList.add('hidden');
}

// 10. SALVAR E REMOVER INGREDIENTE DA FICHA
async function salvarIngredienteFicha(event) {
    event.preventDefault();
    const receitaId = document.getElementById('select-receita-ficha').value;
    const produtoId = document.getElementById('select-produto-estoque').value;
    const qtd = Number(document.getElementById('input-qtd-ingrediente').value);

    if (!receitaId || !produtoId) return;

    try {
        const { error } = await _supabase.from('Ficha_Tecnica').insert([{ ReceitaID: receitaId, ProdutoID: produtoId, QTD: qtd }]);
        if (error) throw error;

        fecharModalAdicionarIngrediente();
        await mudarReceitaFicha(receitaId);
    } catch (err) {
        alert(`Erro ao salvar ingrediente: ${err.message}`);
    }
}

async function removerIngredienteFicha(idFicha) {
    if (!confirm("Tens a certeza que queres remover este ingrediente?")) return;

    try {
        const { error } = await _supabase.from('Ficha_Tecnica').delete().eq('id', idFicha);
        if (error) throw error;

        const selectReceita = document.getElementById('select-receita-ficha');
        if (selectReceita && selectReceita.value) {
            await mudarReceitaFicha(selectReceita.value);
        }
    } catch (err) {
        alert(`Erro ao remover: ${err.message}`);
    }
}

// 11. FECHAR MODAL DE ESTOQUE E EXCLUIR
function fecharModalCadastro() {
    const modal = document.getElementById('modal-produto');
    if (modal) modal.classList.add('hidden');
}

async function excluirProduto(id) {
    if (!confirm("Desejas excluir este item?")) return;
    try {
        let { error } = await _supabase.from('Estoque').delete().eq('id', id);
        if (error) throw error;
        await carregarBancoDeDados();
    } catch (err) {
        alert("Erro ao excluir: " + err.message);
    }
}

function filtrarProdutos() {
    const termo = document.getElementById('input-busca').value.toLowerCase();
    const filtrados = produtosLista.filter(p => Object.values(p.raw).some(val => String(val).toLowerCase().includes(termo)));
    renderizarTabelaDinamica(filtrados);
}

window.addEventListener('DOMContentLoaded', () => {
    carregarBancoDeDados();
});