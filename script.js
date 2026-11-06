// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 38,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Sessão (PIN mantido apenas em memória)
let pinSessao = null;

// Dados fictícios das 15 disciplinas do 9º Ano (fallback local)
let dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Função para normalizar qualquer valor de nota antigo para a escala 0.0 - 10.0
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let num = Number(valor);

  if (isNaN(num)) {
    return null;
  }

  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  if (num >= 0 && num <= 10) {
    return num;
  }

  return null;
}

// Função para formatar exibição da nota no HTML
function formatarExibicaoNota(nota) {
  if (nota === null || nota === undefined) {
    return "—";
  }
  return Number(nota).toFixed(1).replace(".", ",");
}

// Fazer login e abrir boletim na API
async function fazerLogin() {
  const pinInput = document.getElementById("pin-input");
  const msgStatus = document.getElementById("mensagem-status");
  const pinDigitado = pinInput.value.trim();

  if (!pinDigitado) {
    msgStatus.textContent = "Por favor, digite o PIN.";
    return;
  }

  msgStatus.textContent = "Conectando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgStatus.textContent = "Turma, chamada ou PIN inválidos.";
      return;
    }

    if (resposta.status === 429) {
      msgStatus.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      return;
    }

    if (!resposta.ok) {
      msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      return;
    }

    const resultado = await resposta.json();
    pinSessao = pinDigitado;
    pinInput.value = ""; // Limpa a senha do campo por segurança

    if (resultado && resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosBoletim = resultado.dados.disciplinas;
    }

    document.getElementById("login-container").style.display = "none";
    document.getElementById("boletim-conteudo").style.display = "block";
    carregarBoletim();
  } catch (erro) {
    msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}

// Função principal que processa os dados e preenche o HTML
function carregarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  let somaMediasValidas = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let countBomDesempenho = 0;
  let countAtencao = 0;

  dadosBoletim.forEach((item) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasValidas.length;
      somaMediasValidas += media;
      qtdDisciplinasComMedia++;
    }

    const faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = faltasArray.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    totalFaltasGeral += totalFaltasDisciplina;

    let situacaoTexto = "Nota ainda não disponível";
    let situacaoClasse = "status-pending";

    if (media !== null) {
      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        situacaoClasse = "status-good";
        countBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        situacaoClasse = "status-attention";
        countAtencao++;
      }
    }

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    const strongNome = document.createElement("strong");
    strongNome.textContent = item.disciplina;
    tdNome.appendChild(strongNome);

    const tdT1 = document.createElement("td");
    tdT1.textContent = formatarExibicaoNota(n1);

    const tdT2 = document.createElement("td");
    tdT2.textContent = formatarExibicaoNota(n2);

    const tdT3 = document.createElement("td");
    tdT3.textContent = formatarExibicaoNota(n3);

    const tdMedia = document.createElement("td");
    const strongMedia = document.createElement("strong");
    strongMedia.textContent = formatarExibicaoNota(media);
    tdMedia.appendChild(strongMedia);

    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = totalFaltasDisciplina;

    const tdSit = document.createElement("td");
    tdSit.className = situacaoClasse;
    tdSit.textContent = situacaoTexto;

    tr.appendChild(tdNome);
    tr.appendChild(tdT1);
    tr.appendChild(tdT2);
    tr.appendChild(tdT3);
    tr.appendChild(tdMedia);
    tr.appendChild(tdFaltas);
    tr.appendChild(tdSit);

    tabelaCorpo.appendChild(tr);
  });

  const mediaGeralCalculada = qtdDisciplinasComMedia > 0 ? (somaMediasValidas / qtdDisciplinasComMedia) : null;
  document.getElementById("media-geral").textContent = formatarExibicaoNota(mediaGeralCalculada);
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("bom-desempenho").textContent = countBomDesempenho;
  document.getElementById("precisa-atencao").textContent = countAtencao;
}

// Abrir painel de edição
function abrirEdicao() {
  const corpoEdicao = document.getElementById("tabela-edicao-corpo");
  corpoEdicao.innerHTML = "";
  document.getElementById("mensagem-edicao").textContent = "";

  dadosBoletim.forEach((item, index) => {
    const f = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const n1 = item.tri1 !== null && item.tri1 !== undefined ? item.tri1 : "";
    const n2 = item.tri2 !== null && item.tri2 !== undefined ? item.tri2 : "";
    const n3 = item.tri3 !== null && item.tri3 !== undefined ? item.tri3 : "";

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = item.disciplina;

    tr.appendChild(tdNome);

    const campos = [
      { id: `t1-${index}`, val: n1 },
      { id: `t2-${index}`, val: n2 },
      { id: `t3-${index}`, val: n3 },
      { id: `f1-${index}`, val: f[0] !== undefined ? f[0] : 0 },
      { id: `f2-${index}`, val: f[1] !== undefined ? f[1] : 0 },
      { id: `f3-${index}`, val: f[2] !== undefined ? f[2] : 0 }
    ];

    campos.forEach((campo) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.id = campo.id;
      input.value = campo.val;
      td.appendChild(input);
      tr.appendChild(td);
    });

    corpoEdicao.appendChild(tr);
  });

  document.getElementById("edicao-container").style.display = "block";
}

// Fechar painel de edição
function fecharEdicao() {
  document.getElementById("edicao-container").style.display = "none";
}

// Validar nota digitada no editor (0 a 10, ponto ou vírgula, ou vazio)
function validarNotaDigitada(valorStr) {
  if (valorStr === "" || valorStr === null || valorStr === undefined) {
    return { valido: true, valor: null };
  }
  const str = String(valorStr).trim().replace(",", ".");
  const num = Number(str);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Validar faltas digitadas (número inteiro >= 0)
function validarFaltaDigitada(valorStr) {
  if (valorStr === "" || valorStr === null || valorStr === undefined) {
    return { valido: false, valor: null };
  }
  const str = String(valorStr).trim();
  if (!/^\d+$/.test(str)) {
    return { valido: false, valor: null };
  }
  const num = Number(str);
  if (num < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Salvar alterações na API
async function salvarAlteracoes() {
  const msgEdicao = document.getElementById("mensagem-edicao");
  msgEdicao.textContent = "";
  let temErro = false;

  const novasDisciplinas = [];

  for (let i = 0; i < dadosBoletim.length; i++) {
    const elT1 = document.getElementById(`t1-${i}`);
    const elT2 = document.getElementById(`t2-${i}`);
    const elT3 = document.getElementById(`t3-${i}`);
    const elF1 = document.getElementById(`f1-${i}`);
    const elF2 = document.getElementById(`f2-${i}`);
    const elF3 = document.getElementById(`f3-${i}`);

    [elT1, elT2, elT3, elF1, elF2, elF3].forEach(el => el.classList.remove("campo-invalido"));

    const valT1 = validarNotaDigitada(elT1.value);
    const valT2 = validarNotaDigitada(elT2.value);
    const valT3 = validarNotaDigitada(elT3.value);

    const valF1 = validarFaltaDigitada(elF1.value);
    const valF2 = validarFaltaDigitada(elF2.value);
    const valF3 = validarFaltaDigitada(elF3.value);

    if (!valT1.valido) { elT1.classList.add("campo-invalido"); temErro = true; }
    if (!valT2.valido) { elT2.classList.add("campo-invalido"); temErro = true; }
    if (!valT3.valido) { elT3.classList.add("campo-invalido"); temErro = true; }

    if (!valF1.valido) { elF1.classList.add("campo-invalido"); temErro = true; }
    if (!valF2.valido) { elF2.classList.add("campo-invalido"); temErro = true; }
    if (!valF3.valido) { elF3.classList.add("campo-invalido"); temErro = true; }

    if (!temErro) {
      novasDisciplinas.push({
        disciplina: dadosBoletim[i].disciplina,
        tri1: valT1.valor,
        tri2: valT2.valor,
        tri3: valT3.valor,
        faltas: [valF1.valor, valF2.valor, valF3.valor]
      });
    }
  }

  if (temErro) {
    msgEdicao.textContent = "Verifique os campos destacados em vermelho. Notas devem ser entre 0 e 10 (ou vazias) e faltas devem ser números inteiros.";
    return;
  }

  msgEdicao.textContent = "Salvando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgEdicao.textContent = "Erro ao salvar alterações. Tente novamente.";
      return;
    }

    dadosBoletim = novasDisciplinas;
    carregarBoletim();
    fecharEdicao();
    msgEdicao.textContent = "Dados salvos com sucesso.";
  } catch (erro) {
    msgEdicao.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}