// Dados fictícios das 15 disciplinas do 9º Ano
const dadosBoletim = [
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

// Frequência geral demonstrativa (fictícia para esta versão do projeto)
// Nota: este percentual é fixo/demonstrativo e será calculado via regras específicas no futuro.

// Função para normalizar qualquer valor de nota para a escala 0.0 - 10.0
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte vírgula para ponto se for string
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let num = Number(valor);

  if (isNaN(num)) {
    return null; // Valor inválido
  }

  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  if (num >= 0 && num <= 10) {
    return num;
  }

  return null; // Fora do intervalo válido
}

// Função para formatar exibição da nota no HTML
function formatarExibicaoNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
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

  // Percorre cada disciplina da nossa lista (Array)
  dadosBoletim.forEach((item) => {
    // Normalização das notas dos trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Cálculo da média ignorando notas não lançadas (null)
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasValidas.length;
      somaMediasValidas += media;
      qtdDisciplinasComMedia++;
    }

    // Soma do total de faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Definição da situação da disciplina
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

    // Criação da linha da tabela no DOM
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td><strong>${formatarExibicaoNota(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${situacaoClasse}">${situacaoTexto}</td>
    `;
    tabelaCorpo.appendChild(tr);
  });

  // Atualiza os Cards de Resumo no topo da página
  const mediaGeralCalculada = qtdDisciplinasComMedia > 0 ? (somaMediasValidas / qtdDisciplinasComMedia) : null;
  document.getElementById("media-geral").innerText = formatarExibicaoNota(mediaGeralCalculada);
  document.getElementById("total-faltas").innerText = totalFaltasGeral;
  document.getElementById("bom-desempenho").innerText = countBomDesempenho;
  document.getElementById("precisa-atencao").innerText = countAtencao;
}

// Executa a função assim que a página é carregada
document.addEventListener("DOMContentLoaded", carregarBoletim);