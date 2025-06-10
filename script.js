// script.js
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = 0;
let startTime;
let timerInterval;
let userName = '';
let simulatedStarted = false; // Novo para controlar o estado do simulado

// Variáveis globais para os dados das questões e o mapa de matérias/conteúdos
let allQuestionsData = []; // Para armazenar todas as questões carregadas
let materiaConteudoMap = {}; // Para mapear matérias para conteúdos

// Elementos do DOM
const welcomeScreen = document.getElementById('welcomeScreen');
const iniciarSimuladoBtn = document.getElementById('iniciarSimuladoBtn');
const quizSection = document.getElementById('quizSection');
const questionEnunciado = document.getElementById('questionEnunciado');
const questionImageContainer = document.getElementById('questionImageContainer');
const questionImage = document.getElementById('questionImage');
const alternativasContainer = document.getElementById('alternativasContainer');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const enviarSimuladoBtn = document.getElementById('enviarSimuladoBtn');
const questionCounter = document.getElementById('questionCounter');
const timer = document.getElementById('timer');
const resultModal = document.getElementById('resultModal');
const scoreDisplay = document.getElementById('scoreDisplay');
const totalQuestionsDisplay = document.getElementById('totalQuestionsDisplay');
const timeTakenDisplay = document.getElementById('timeTakenDisplay');
const userNameDisplay = document.getElementById('userNameDisplay');
const materiaSummaryList = document.getElementById('materiaSummaryList');
const novoSimuladoBtn = document.getElementById('novoSimuladoBtn');
const fecharModalBtn = document.getElementById('fecharModalBtn'); // Novo botão para fechar o modal de resultados
const revisarGabaritoBtn = document.getElementById('revisarGabaritoBtn');
const gabaritoModal = document.getElementById('gabaritoModal');
const gabaritoContent = document.getElementById('gabaritoContent');
const fecharGabaritoModalBtn = document.getElementById('fecharGabaritoModalBtn');
const voltarResultadosBtn = document.getElementById('voltarResultadosBtn');

// Configuração Modal
const abrirConfigBtn = document.getElementById('abrirConfigBtn');
const configModal = document.getElementById('configModal');
const fecharConfigModalBtn = document.getElementById('fecharConfigModalBtn');
const salvarConfigBtn = document.getElementById('salvarConfigBtn');
const numQuestoesInput = document.getElementById('numQuestoesInput');
const materiaSelect = document.getElementById('materiaSelect');
const conteudoSelect = document.getElementById('conteudoSelect'); // Adicionado
const dificuldadeSelect = document.getElementById('dificuldadeSelect');
const serieSelect = document.getElementById('serieSelect');
const materiaDisplay = document.getElementById('materiaDisplay');


// --- Funções de Carregamento e Inicialização ---

// Função para carregar os dados das questões
async function loadQuestionsData() {
    try {
        const response = await fetch('questoes.json');
        allQuestionsData = await response.json();

        // Popular o mapa de matérias e conteúdos
        allQuestionsData.forEach(q => {
            if (!materiaConteudoMap[q.materia]) {
                materiaConteudoMap[q.materia] = new Set(); // Usar Set para garantir unicidade
            }
            materiaConteudoMap[q.materia].add(q.conteudo);
        });

        console.log("Questões carregadas e mapa de conteúdos criado:", materiaConteudoMap);
    } catch (error) {
        console.error("Erro ao carregar questoes.json:", error);
        alert("Erro ao carregar as questões. Por favor, tente novamente mais tarde.");
    }
}

// --- Funções de Lógica do Simulado ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startSimulado() {
    userName = prompt("Qual é o seu nome para registrar os resultados?");
    if (!userName) {
        userName = "Anônimo"; // Nome padrão se o usuário não digitar
    }

    const numQuestoes = parseInt(numQuestoesInput.value);
    const selectedMateria = materiaSelect.value;
    const selectedConteudo = conteudoSelect.value; // Pega o conteúdo selecionado
    const selectedDificuldade = dificuldadeSelect.value;
    const selectedSerie = serieSelect.value;

    let filteredQuestions = allQuestionsData.filter(q => {
        const matchMateria = selectedMateria ? q.materia === selectedMateria : true;
        const matchConteudo = selectedConteudo ? q.conteudo === selectedConteudo : true; // Filtra por conteúdo
        const matchDificuldade = selectedDificuldade ? q.dificuldade === parseInt(selectedDificuldade) : true;
        const matchSerie = selectedSerie ? q.serie === selectedSerie : true;
        return matchMateria && matchConteudo && matchDificuldade && matchSerie;
    });

    if (filteredQuestions.length === 0) {
        alert("Não há questões com os filtros selecionados. Por favor, ajuste as configurações.");
        return;
    }

    questions = shuffleArray(filteredQuestions).slice(0, numQuestoes);

    if (questions.length === 0) {
        alert("Não foi possível gerar questões com as configurações selecionadas. Tente novamente com menos restrições.");
        return;
    }

    currentQuestionIndex = 0;
    userAnswers = {};
    score = 0;
    startTime = new Date().getTime();
    startTimer();
    simulatedStarted = true;

    welcomeScreen.classList.add('hidden');
    configModal.style.display = 'none';
    quizSection.classList.remove('hidden');
    abrirConfigBtn.style.display = 'block'; // Mostra o botão de configurações durante o simulado
    document.body.style.alignItems = 'flex-start'; // Altera o alinhamento para o simulado
    displayQuestion();
}

function displayQuestion() {
    if (questions.length === 0) {
        questionEnunciado.textContent = "Nenhuma questão disponível.";
        alternativasContainer.innerHTML = '';
        return;
    }

    const question = questions[currentQuestionIndex];
    questionEnunciado.innerHTML = `<span>(${question.materia} - ${question.conteudo})</span><br>${question.enunciado}`;
    materiaDisplay.textContent = `Matéria: ${question.materia}`;
    questionCounter.textContent = `Questão ${currentQuestionIndex + 1}/${questions.length}`;

    if (question.imagem) {
        questionImage.src = question.imagem;
        questionImageContainer.classList.remove('hidden');
    } else {
        questionImage.src = '';
        questionImageContainer.classList.add('hidden');
    }

    alternativasContainer.innerHTML = '';
    const alternativasPrefix = ['a', 'b', 'c', 'd', 'e'];
    alternativasPrefix.forEach(prefix => {
        if (question.alternativas[prefix]) {
            const div = document.createElement('div');
            div.classList.add('alternativa-item');
            div.dataset.prefix = prefix;
            div.innerHTML = `<span class="prefix">${prefix.toUpperCase()})</span> ${question.alternativas[prefix]}`;
            div.addEventListener('click', () => selectAnswer(prefix));
            alternativasContainer.appendChild(div);
        }
    });

    // Restaurar seleção do usuário se houver
    const savedAnswer = userAnswers[question.id];
    if (savedAnswer) {
        const selectedDiv = alternativasContainer.querySelector(`[data-prefix="${savedAnswer.userAnswerKey}"]`);
        if (selectedDiv) {
            selectedDiv.classList.add('selected');
        }
    }

    // Gerenciar visibilidade dos botões
    prevQuestionBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    nextQuestionBtn.style.display = currentQuestionIndex < questions.length - 1 ? 'inline-block' : 'none';
    enviarSimuladoBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';
}

function selectAnswer(prefix) {
    const question = questions[currentQuestionIndex];
    userAnswers[question.id] = {
        questionEnunciado: question.enunciado,
        userAnswerKey: prefix,
        userAnswerText: question.alternativas[prefix],
        correctAnswerKey: question.resposta,
        correctAnswerText: question.alternativas[question.resposta],
        isCorrect: prefix === question.resposta
    };

    // Atualizar a UI para mostrar a alternativa selecionada
    document.querySelectorAll('.alternativa-item').forEach(item => {
        item.classList.remove('selected');
    });
    const selectedDiv = alternativasContainer.querySelector(`[data-prefix="${prefix}"]`);
    if (selectedDiv) {
        selectedDiv.classList.add('selected');
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsedTime = new Date().getTime() - startTime;
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        timer.textContent =
            `${String(hours).padStart(2, '0')}:` +
            `${String(minutes).padStart(2, '0')}:` +
            `${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

async function enviarSimulado() {
    stopTimer();
    score = 0;
    const timeTakenSeconds = Math.floor((new Date().getTime() - startTime) / 1000);

    // Calcular score e organizar por matéria
    const materiaScores = {}; // { materia: { correct: X, total: Y } }
    const materiaNames = {}; // { materia: nome } para garantir nome completo
    
    questions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer && userAnswer.isCorrect) {
            score++;
        }

        // Inicializa a matéria se ainda não existir
        if (!materiaScores[question.materia]) {
            materiaScores[question.materia] = { correct: 0, total: 0 };
            materiaNames[question.materia] = question.materia;
        }
        materiaScores[question.materia].total++;
        if (userAnswer && userAnswer.isCorrect) {
            materiaScores[question.materia].correct++;
        }
    });

    // Exibir resultados no modal
    userNameDisplay.textContent = userName;
    scoreDisplay.textContent = score;
    totalQuestionsDisplay.textContent = questions.length;

    const hours = Math.floor(timeTakenSeconds / 3600);
    const minutes = Math.floor((timeTakenSeconds % 3600) / 60);
    const seconds = timeTakenSeconds % 60;
    timeTakenDisplay.textContent =
        `${String(hours).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')}:` +
        `${String(seconds).padStart(2, '0')}`;

    // Popula o resumo por matéria
    materiaSummaryList.innerHTML = '';
    for (const materia in materiaScores) {
        const item = document.createElement('li');
        item.classList.add('materia-summary-item');
        item.textContent = `${materiaNames[materia]}: ${materiaScores[materia].correct}/${materiaScores[materia].total} acertos`;
        materiaSummaryList.appendChild(item);
    }

    quizSection.classList.add('hidden');
    resultModal.style.display = 'flex';
    document.body.style.alignItems = 'center'; // Centraliza o modal de resultados
    abrirConfigBtn.style.display = 'none'; // Esconde o botão de config na tela de resultados

    // Salvar resultados no servidor
    const newResult = {
        timestamp: new Date().toISOString(),
        userName: userName,
        score: score,
        totalQuestions: questions.length,
        timeTakenSeconds: timeTakenSeconds,
        answers: userAnswers // Salva todas as respostas do usuário para revisão
    };

    try {
        const response = await fetch('/save-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newResult)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Resultados salvos com sucesso no servidor!');
    } catch (error) {
        console.error('Erro ao salvar resultados:', error);
        alert('Houve um erro ao salvar seus resultados. Por favor, verifique a conexão.');
    }
}

function revisarGabarito() {
    resultModal.style.display = 'none';
    gabaritoModal.style.display = 'flex';
    gabaritoContent.innerHTML = ''; // Limpa o conteúdo anterior

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[question.id];
        const gabaritoItem = document.createElement('div');
        gabaritoItem.classList.add('gabarito-questao');

        gabaritoItem.innerHTML = `
            <h4>Questão ${index + 1}: ${question.enunciado}</h4>
            ${question.imagem ? `<div class="question-image-container"><img src="${question.imagem}" alt="Imagem da Questão" class="question-image"></div>` : ''}
            <div class="alternativas-container"></div>
            <p class="explanation"><strong>Explicação:</strong> ${question.explicacao || 'Nenhuma explicação disponível.'}</p>
        `;

        const alternativasDiv = gabaritoItem.querySelector('.alternativas-container');
        const alternativasPrefix = ['a', 'b', 'c', 'd', 'e'];

        alternativasPrefix.forEach(prefix => {
            if (question.alternativas[prefix]) {
                const altDiv = document.createElement('div');
                altDiv.classList.add('gabarito-alternativa');
                altDiv.innerHTML = `<span class="prefix">${prefix.toUpperCase()})</span> ${question.alternativas[prefix]}`;

                if (prefix === question.resposta) {
                    altDiv.classList.add('correct');
                } else if (userAnswer && prefix === userAnswer.userAnswerKey && !userAnswer.isCorrect) {
                    altDiv.classList.add('incorrect');
                }
                alternativasDiv.appendChild(altDiv);
            }
        });
        gabaritoContent.appendChild(gabaritoItem);
    });
}

function novoSimulado() {
    questions = [];
    currentQuestionIndex = 0;
    userAnswers = {};
    score = 0;
    stopTimer();
    timer.textContent = '00:00:00';
    simulatedStarted = false; // Reseta o estado do simulado

    resultModal.style.display = 'none';
    gabaritoModal.style.display = 'none';
    welcomeScreen.classList.remove('hidden');
    quizSection.classList.add('hidden'); // Certifica que a seção do quiz está escondida
    abrirConfigBtn.style.display = 'none'; // Esconde o botão de config na tela inicial
    document.body.style.alignItems = 'center'; // Alinha a tela de boas-vindas ao centro
}

// --- Funções de Configuração ---

// Modifique sua função populateFiltros existente para incluir a lógica
function populateFiltros() {
    // Limpa as opções atuais
    materiaSelect.innerHTML = '<option value="">Todas as Matérias</option>';
    conteudoSelect.innerHTML = '<option value="">Todos os Conteúdos</option>';

    // Popula o select de matérias
    // Garante que as matérias estejam ordenadas alfabeticamente
    const sortedMaterias = Object.keys(materiaConteudoMap).sort();
    sortedMaterias.forEach(materia => {
        const option = document.createElement('option');
        option.value = materia;
        option.textContent = materia;
        materiaSelect.appendChild(option);
    });

    // Adiciona o event listener para a mudança da matéria
    // Remove o listener anterior para evitar duplicação em reaberturas do modal
    materiaSelect.removeEventListener('change', handleMateriaChange); 
    materiaSelect.addEventListener('change', handleMateriaChange);

    // Chama a atualização inicial caso uma matéria já esteja selecionada (em caso de reabertura do modal)
    // Isso garante que o select de conteúdo seja preenchido corretamente se o modal for reaberto e uma matéria já estiver selecionada
    updateConteudoSelect(materiaSelect.value);
}

// Nova função para lidar com a mudança da matéria
function handleMateriaChange() {
    updateConteudoSelect(materiaSelect.value);
}

// Nova função para atualizar o select de conteúdos
function updateConteudoSelect(selectedMateria) {
    conteudoSelect.innerHTML = '<option value="">Todos os Conteúdos</option>'; // Sempre reseta

    if (selectedMateria && materiaConteudoMap[selectedMateria]) {
        // Converte o Set para Array para iterar e ordenar se desejar
        const conteudos = Array.from(materiaConteudoMap[selectedMateria]).sort(); 
        conteudos.forEach(conteudo => {
            const option = document.createElement('option');
            option.value = conteudo;
            option.textContent = conteudo;
            conteudoSelect.appendChild(option);
        });
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega as questões antes de qualquer operação de filtro ou início do simulado
    await loadQuestionsData();

    iniciarSimuladoBtn.addEventListener('click', () => {
        // Ao clicar em iniciar, abrimos o modal de configuração para o usuário filtrar
        configModal.style.display = 'flex';
        welcomeScreen.classList.add('hidden');
        document.body.style.alignItems = 'center';
        populateFiltros(); // Popula os filtros ao abrir o modal
    });

    salvarConfigBtn.addEventListener('click', startSimulado);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    prevQuestionBtn.addEventListener('click', prevQuestion);
    enviarSimuladoBtn.addEventListener('click', enviarSimulado);

    revisarGabaritoBtn.addEventListener('click', revisarGabarito);
    novoSimuladoBtn.addEventListener('click', novoSimulado);
    fecharModalBtn.addEventListener('click', novoSimulado); // Fechar modal de resultados leva para o novo simulado

    abrirConfigBtn.addEventListener('click', () => {
        if (simulatedStarted && timerInterval) {
            clearInterval(timerInterval); // Pausa o timer se o simulado estiver em andamento
        }
        configModal.style.display = 'flex';
        quizSection.classList.add('hidden');
        resultModal.style.display = 'none';
        welcomeScreen.classList.add('hidden');
        populateFiltros(); // Popula os filtros ao abrir o modal
        document.body.style.alignItems = 'center';
    });

    fecharConfigModalBtn.addEventListener('click', () => {
        configModal.style.display = 'none';
        if (simulatedStarted) { // Se o simulado já havia começado, retorna para ele
            quizSection.classList.remove('hidden');
            abrirConfigBtn.style.display = 'block';
            startTimer(); // Reinicia o timer
            document.body.style.alignItems = 'flex-start';
        } else { // Se o simulado não havia começado, retorna para a tela inicial
            welcomeScreen.classList.remove('hidden');
            abrirConfigBtn.style.display = 'none';
            document.body.style.alignItems = 'center';
        }
    });

    fecharGabaritoModalBtn.addEventListener('click', () => {
        gabaritoModal.style.display = 'none';
        resultModal.style.display = 'flex'; // Volta para o modal de resultados
    });

    voltarResultadosBtn.addEventListener('click', () => {
        gabaritoModal.style.display = 'none';
        resultModal.style.display = 'flex'; // Volta para o modal de resultados
    });
});