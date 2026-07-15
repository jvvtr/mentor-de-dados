(function () {
  "use strict";

  const DATA = window.SPARK_MENTOR_DATA;
  const STORAGE_KEY = "spark-mentor-state-v1";
  const TOTAL_SECONDS = 60 * 60;
  const VIEW_META = {
    today: ["TRILHA GUIADA", "Estudo de hoje"],
    trail: ["PLANO DE ESTUDOS", "Trilha de 4 semanas"],
    lab: ["REFERÊNCIA PRÁTICA", "SQL ↔ PySpark"],
    tutor: ["APOIO AO ESTUDO", "Tutor Spark"],
    glossary: ["CONSULTA RÁPIDA", "Glossário"],
    progress: ["SEU HISTÓRICO", "Meu progresso"]
  };

  const defaultState = {
    version: 1,
    profile: { name: "Estudante" },
    currentLesson: 1,
    completedLessons: [],
    checklist: {},
    quizAnswers: {},
    exerciseDrafts: {},
    practiceDone: {},
    timers: {},
    notes: "",
    studySeconds: {},
    totalStudySeconds: 0,
    chat: [],
    sidebarCollapsed: false
  };

  let state = loadState();
  let activeView = validView(location.hash.slice(1)) ? location.hash.slice(1) : "today";
  let timerInterval = null;
  let activeTimerLessonId = null;
  let lastFocusedElement = null;
  let activeLabOperation = DATA.labOperations[0].id;

  const els = {
    container: document.getElementById("view-container"),
    viewKicker: document.getElementById("view-kicker"),
    viewTitle: document.getElementById("view-title"),
    streak: document.getElementById("streak-value"),
    xp: document.getElementById("xp-value"),
    avatar: document.getElementById("profile-button"),
    sidebarProgressLabel: document.getElementById("sidebar-progress-label"),
    sidebarProgressBar: document.getElementById("sidebar-progress-bar"),
    sidebarProgressDetail: document.getElementById("sidebar-progress-detail"),
    sidebarCollapse: document.getElementById("sidebar-collapse"),
    menuButton: document.getElementById("menu-button"),
    mobileOverlay: document.getElementById("mobile-overlay"),
    profileModal: document.getElementById("profile-modal"),
    profileName: document.getElementById("profile-name"),
    saveProfile: document.getElementById("save-profile"),
    toastRegion: document.getElementById("toast-region")
  };

  init();

  function init() {
    document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    bindShellEvents();
    updateShell();
    setView(activeView, false);

    window.addEventListener("hashchange", () => {
      const next = location.hash.slice(1);
      if (validView(next) && next !== activeView) setView(next, false);
    });

    window.addEventListener("beforeunload", () => {
      pauseTimer(false);
      saveState();
    });
  }

  function bindShellEvents() {
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    els.sidebarCollapse.addEventListener("click", () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
      saveState();
    });

    els.menuButton.addEventListener("click", openMobileMenu);
    els.mobileOverlay.addEventListener("click", closeMobileMenu);
    els.avatar.addEventListener("click", openProfileModal);
    els.saveProfile.addEventListener("click", saveProfile);
    els.profileName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveProfile();
    });
    els.profileModal.querySelector("[data-close-modal]").addEventListener("click", closeProfileModal);
    els.profileModal.addEventListener("click", (event) => {
      if (event.target === els.profileModal) closeProfileModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.profileModal.hidden) closeProfileModal();
    });
  }

  function setView(view, updateHash = true) {
    if (!validView(view)) view = "today";
    activeView = view;
    if (updateHash) history.replaceState(null, "", `#${view}`);

    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const [kicker, title] = VIEW_META[view];
    els.viewKicker.textContent = kicker;
    els.viewTitle.textContent = title;
    closeMobileMenu();
    renderView();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderView() {
    switch (activeView) {
      case "today": renderToday(); break;
      case "trail": renderTrail(); break;
      case "lab": renderLab(); break;
      case "tutor": renderTutor(); break;
      case "glossary": renderGlossary(); break;
      case "progress": renderProgress(); break;
      default: renderToday();
    }
  }

  function renderToday() {
    const lesson = getLesson(state.currentLesson);
    const checks = getChecklist(lesson.id);
    const quizState = state.quizAnswers[lesson.id] || {};
    const timer = getTimer(lesson.id);
    const completed = state.completedLessons.includes(lesson.id);
    const firstName = getFirstName();
    const greeting = getGreeting();

    els.container.innerHTML = `
      <div class="view-stack">
        <section class="lesson-hero card">
          <span class="eyebrow">${greeting.toUpperCase()}, ${escapeHtml(firstName.toUpperCase())} · DIA ${lesson.id} DE ${DATA.lessons.length}</span>
          <h2>${escapeHtml(lesson.title)}</h2>
          <p>${escapeHtml(lesson.objective)}</p>
          <div class="hero-meta">
            <span class="hero-chip"><strong>Semana ${lesson.week}</strong> de 4</span>
            <span class="hero-chip"><strong>60 minutos</strong> de estudo guiado</span>
            <span class="hero-chip">${completed ? "✓ Aula concluída" : "Em andamento"}</span>
          </div>
        </section>

        <div class="today-grid">
          <div class="lesson-column">
            <section class="card section-card">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">MICROAULA</span>
                  <h3>${escapeHtml(lesson.subtitle)}</h3>
                  <p>${escapeHtml(lesson.intro)}</p>
                </div>
                <span class="time-badge">15 min</span>
              </div>
              <div class="concept-list">
                ${lesson.concepts.map((concept) => `
                  <article class="concept-item">
                    <strong>${escapeHtml(concept.title)}</strong>
                    <p>${escapeHtml(concept.text)}</p>
                  </article>
                `).join("")}
              </div>
              <div class="analogy-box"><strong>Conexão com o que você já conhece:</strong> ${escapeHtml(lesson.analogy)}</div>
            </section>

            <section class="card section-card">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">MESMA LÓGICA, DUAS SINTAXES</span>
                  <h3>SQL ↔ PySpark</h3>
                  <p>Alterne as abas e compare o plano que você já conhece com a DataFrame API.</p>
                </div>
                <span class="time-badge">15 min</span>
              </div>
              ${renderCodeTabs(lesson)}
            </section>

            <section class="card section-card">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">MÃO NA MASSA</span>
                  <h3>Prática guiada</h3>
                  <p>Copie o exercício para um notebook Databricks ou rascunhe sua solução aqui.</p>
                </div>
                <span class="time-badge">20 min</span>
              </div>
              <div class="exercise-prompt">${escapeHtml(lesson.exercise)}</div>
              <textarea class="exercise-area" id="exercise-draft" spellcheck="false" aria-label="Sua solução para o exercício" placeholder="Escreva sua tentativa aqui...">${escapeHtml(state.exerciseDrafts[lesson.id] || lesson.starter)}</textarea>
              <div class="exercise-actions">
                <button class="ghost-button" id="show-hint">Mostrar dica</button>
                <button class="secondary-button" id="show-solution">Comparar com a solução</button>
              </div>
              <label class="check-row practice-confirmation">
                <input type="checkbox" id="practice-done" ${state.practiceDone[lesson.id] ? "checked" : ""} />
                <span>Pratiquei no Databricks ou escrevi minha própria tentativa acima.</span>
              </label>
              <div class="hint-panel" id="hint-panel" hidden>${escapeHtml(lesson.hint)}</div>
              <div class="solution-panel" id="solution-panel" hidden>
                <button class="code-copy" data-copy-target="solution-code">Copiar</button>
                <pre><code id="solution-code">${escapeHtml(lesson.solution)}</code></pre>
              </div>
            </section>

            <section class="card section-card">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">CHECAGEM RÁPIDA</span>
                  <h3>${escapeHtml(lesson.quiz.question)}</h3>
                  <p>Você pode tentar novamente. O objetivo é compreender, não acertar de primeira.</p>
                </div>
                <span class="time-badge">5 min</span>
              </div>
              <div class="quiz-options" id="quiz-options">
                ${lesson.quiz.options.map((option, index) => renderQuizOption(lesson, quizState, option, index)).join("")}
              </div>
              <div class="quiz-feedback" id="quiz-feedback" role="status" aria-live="polite" ${quizState.selected === undefined ? "hidden" : ""}>
                ${quizState.selected === undefined ? "" : renderQuizFeedback(lesson, quizState.selected)}
              </div>
            </section>
          </div>

          <aside class="side-column" aria-label="Rotina da aula">
            <section class="card routine-card">
              <div class="routine-header">
                <h3>Sua sessão de 1 hora</h3>
                <span class="status-badge ${timer.remaining === 0 ? "done" : ""}" id="timer-status">${timer.remaining === 0 ? "Finalizada" : timer.running ? "Em andamento" : "Pronta"}</span>
              </div>
              <div class="timer-face" id="timer-face">
                <div class="timer-inner">
                  <strong id="timer-value" role="timer" aria-label="Tempo restante">${formatTime(timer.remaining)}</strong>
                  <span id="timer-phase">${getTimerPhase(timer.remaining).label}</span>
                </div>
              </div>
              <div class="timer-actions">
                <button class="primary-button" id="timer-toggle">${timer.running ? "Pausar" : timer.remaining === 0 ? "Recomeçar" : "Iniciar sessão"}</button>
                <button class="secondary-button" id="timer-reset" aria-label="Reiniciar cronômetro" title="Reiniciar cronômetro">↻</button>
              </div>
              <ol class="routine-steps" id="routine-steps">
                ${renderRoutineSteps(timer.remaining)}
              </ol>
            </section>

            <section class="card section-card">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">CHECKLIST</span>
                  <h3>Blocos de hoje</h3>
                </div>
                <span class="status-badge">${checks.filter(Boolean).length}/5</span>
              </div>
              <div class="checklist">
                ${DATA.routine.map((step, index) => `
                  <label class="check-row">
                    <input type="checkbox" data-check-index="${index}" ${checks[index] ? "checked" : ""} />
                    <span>${escapeHtml(step.label)} · ${step.minutes} min</span>
                  </label>
                `).join("")}
              </div>
            </section>

            <section class="card completion-card">
              <div class="completion-icon">${completed ? "✓" : "→"}</div>
              <h3>${completed ? "Aula concluída" : "Feche o ciclo de hoje"}</h3>
              <p>${completed ? "Você pode revisar esta aula quando quiser ou seguir para a próxima." : "Registre uma tentativa na prática e responda ao quiz para concluir."}</p>
              <button class="${completed ? "secondary-button" : "primary-button"} full-width" id="complete-lesson">
                ${completed ? (lesson.id < DATA.lessons.length ? "Ir para a próxima aula" : "Revisar a trilha") : "Concluir aula"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    `;

    bindTodayEvents(lesson);
    updateTimerUI(lesson.id);
    if (timer.running) startTimerInterval(lesson.id);
  }

  function renderCodeTabs(lesson) {
    return `
      <div class="code-tabs">
        <div class="tab-list" role="tablist" aria-label="Comparação de código">
          <button class="code-tab active" role="tab" aria-selected="true" aria-controls="code-sql" data-code-tab="sql">Spark SQL</button>
          <button class="code-tab" role="tab" aria-selected="false" aria-controls="code-pyspark" data-code-tab="pyspark">PySpark</button>
        </div>
        <div class="code-panel" id="code-sql" role="tabpanel">
          <button class="code-copy" data-copy-target="sql-code">Copiar</button>
          <pre><code id="sql-code">${escapeHtml(lesson.sql)}</code></pre>
        </div>
        <div class="code-panel" id="code-pyspark" role="tabpanel" hidden>
          <button class="code-copy" data-copy-target="pyspark-code">Copiar</button>
          <pre><code id="pyspark-code">${escapeHtml(lesson.pyspark)}</code></pre>
        </div>
      </div>
    `;
  }

  function bindTodayEvents(lesson) {
    document.querySelectorAll("[data-code-tab]").forEach((tab) => {
      tab.addEventListener("click", () => switchCodeTab(tab.dataset.codeTab));
    });
    bindCopyButtons();

    const draft = document.getElementById("exercise-draft");
    draft.addEventListener("input", () => {
      state.exerciseDrafts[lesson.id] = draft.value;
      state.practiceDone[lesson.id] = true;
      markActivity(0);
      saveState();
      const practiceDone = document.getElementById("practice-done");
      if (practiceDone) practiceDone.checked = true;
    });

    document.getElementById("practice-done").addEventListener("change", (event) => {
      state.practiceDone[lesson.id] = event.target.checked;
      markActivity(0);
      saveState();
    });

    document.getElementById("show-hint").addEventListener("click", (event) => {
      const panel = document.getElementById("hint-panel");
      panel.hidden = !panel.hidden;
      event.currentTarget.textContent = panel.hidden ? "Mostrar dica" : "Ocultar dica";
    });

    document.getElementById("show-solution").addEventListener("click", (event) => {
      const panel = document.getElementById("solution-panel");
      panel.hidden = !panel.hidden;
      event.currentTarget.textContent = panel.hidden ? "Comparar com a solução" : "Ocultar solução";
    });

    document.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => answerQuiz(lesson, Number(button.dataset.option)));
    });

    document.querySelectorAll("[data-check-index]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const checks = getChecklist(lesson.id);
        checks[Number(checkbox.dataset.checkIndex)] = checkbox.checked;
        state.checklist[lesson.id] = checks;
        markActivity(0);
        saveState();
        renderToday();
      });
    });

    document.getElementById("timer-toggle").addEventListener("click", () => toggleTimer(lesson.id));
    document.getElementById("timer-reset").addEventListener("click", () => resetTimer(lesson.id));
    document.getElementById("complete-lesson").addEventListener("click", () => completeLesson(lesson));
  }

  function renderTrail() {
    const completedCount = state.completedLessons.length;
    els.container.innerHTML = `
      <div class="view-stack">
        <section class="page-intro">
          <div>
            <span class="eyebrow">20 AULAS · 1 HORA POR DIA</span>
            <h2>Do primeiro DataFrame ao pipeline</h2>
            <p>Uma trilha de quatro semanas úteis. Nos fins de semana, revise o glossário ou descanse — consistência vale mais do que pressa.</p>
          </div>
          <span class="status-badge ${completedCount === DATA.lessons.length ? "done" : ""}">${completedCount} de ${DATA.lessons.length} concluídas</span>
        </section>

        <div class="week-grid">
          ${DATA.weekInfo.map((week) => renderWeek(week)).join("")}
        </div>
      </div>
    `;

    document.querySelectorAll("[data-open-lesson]").forEach((button) => {
      button.addEventListener("click", () => openLesson(Number(button.dataset.openLesson)));
    });
  }

  function renderWeek(week) {
    const lessons = DATA.lessons.filter((lesson) => lesson.week === week.week);
    const done = lessons.filter((lesson) => state.completedLessons.includes(lesson.id)).length;
    return `
      <section class="card week-section">
        <header class="week-header">
          <div class="week-title">
            <span class="week-number">${week.week}</span>
            <div>
              <h3>${escapeHtml(week.title)}</h3>
              <p>${escapeHtml(week.description)}</p>
            </div>
          </div>
          <span class="status-badge ${done === lessons.length ? "done" : ""}">${done}/${lessons.length}</span>
        </header>
        <div class="lesson-list">
          ${lessons.map((lesson) => {
            const completed = state.completedLessons.includes(lesson.id);
            const current = state.currentLesson === lesson.id;
            return `
              <button class="lesson-row ${completed ? "completed" : ""} ${current ? "current" : ""}" data-open-lesson="${lesson.id}">
                <span class="lesson-day">${completed ? "✓" : lesson.id}</span>
                <span class="lesson-copy">
                  <strong>${escapeHtml(lesson.title)}</strong>
                  <span>${escapeHtml(lesson.subtitle)} · 60 min</span>
                </span>
                <span class="lesson-state">${completed ? "Concluída" : current ? "Continuar →" : "Abrir →"}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderLab() {
    const operation = DATA.labOperations.find((item) => item.id === activeLabOperation) || DATA.labOperations[0];
    els.container.innerHTML = `
      <div class="view-stack">
        <section class="page-intro">
          <div>
            <span class="eyebrow">PONTE PARA QUEM JÁ SABE SQL</span>
            <h2>A mesma lógica em duas linguagens</h2>
            <p>Use esta referência para traduzir padrões conhecidos. Os exemplos são copiáveis para o Databricks, mas não são executados neste app.</p>
          </div>
        </section>

        <div class="lab-layout">
          <aside class="card operation-list" aria-label="Operações disponíveis">
            ${DATA.labOperations.map((item) => `
              <button class="operation-button ${item.id === operation.id ? "active" : ""}" data-operation="${item.id}">${escapeHtml(item.label)}</button>
            `).join("")}
          </aside>

          <section class="card lab-panel">
            <span class="eyebrow">PADRÃO SELECIONADO</span>
            <h3>${escapeHtml(operation.title)}</h3>
            <p>${escapeHtml(operation.description)}</p>
            <div class="compare-grid">
              ${renderLabCode("Spark SQL", operation.sql, "lab-sql")}
              ${renderLabCode("PySpark", operation.pyspark, "lab-pyspark")}
            </div>
            <div class="lab-note"><strong>O que observar:</strong> ${escapeHtml(operation.note)}</div>
          </section>
        </div>
      </div>
    `;

    document.querySelectorAll("[data-operation]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLabOperation = button.dataset.operation;
        renderLab();
      });
    });
    bindCopyButtons();
  }

  function renderLabCode(label, code, id) {
    return `
      <div class="lab-code">
        <header><span>${escapeHtml(label)}</span><button class="code-copy" data-copy-target="${id}">Copiar</button></header>
        <pre><code id="${id}">${escapeHtml(code)}</code></pre>
      </div>
    `;
  }

  function renderTutor() {
    if (!state.chat.length) {
      state.chat = [{
        role: "tutor",
        text: `Olá, ${getFirstName()}! Sou o tutor local do Spark Mentor. Posso explicar os conceitos centrais da trilha e sempre tento relacioná-los a SQL, Power BI e Databricks.\n\nExperimente uma das perguntas rápidas ou escreva algo como “o que é shuffle?”.`
      }];
      saveState();
    }

    els.container.innerHTML = `
      <section class="card tutor-shell">
        <header class="tutor-header">
          <div class="tutor-avatar" aria-hidden="true">✦</div>
          <div>
            <h3>Tutor Spark</h3>
            <p>Assistente local de conceitos · funciona offline</p>
          </div>
          <span class="local-badge" title="Sem conexão com uma IA online">LOCAL · OFFLINE</span>
        </header>
        <div class="quick-prompts" aria-label="Perguntas sugeridas">
          ${["O que é PySpark?", "Explique partition", "Por que shuffle é caro?", "Spark SQL ou PySpark?", "Como praticar no Databricks?"].map((prompt) => `<button class="quick-prompt" data-prompt="${escapeAttr(prompt)}">${escapeHtml(prompt)}</button>`).join("")}
        </div>
        <div class="chat-messages" id="chat-messages" aria-live="polite">
          ${state.chat.slice(-30).map(renderMessage).join("")}
        </div>
        <form class="chat-form" id="chat-form">
          <input class="chat-input" id="chat-input" maxlength="280" autocomplete="off" placeholder="Pergunte sobre Spark, PySpark ou Spark SQL..." aria-label="Pergunta para o tutor" />
          <button class="primary-button" type="submit">Enviar</button>
        </form>
      </section>
    `;

    const messages = document.getElementById("chat-messages");
    messages.scrollTop = messages.scrollHeight;
    document.querySelectorAll("[data-prompt]").forEach((button) => {
      button.addEventListener("click", () => sendTutorMessage(button.dataset.prompt));
    });
    document.getElementById("chat-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("chat-input");
      const value = input.value.trim();
      if (value) sendTutorMessage(value);
    });
  }

  function renderMessage(message) {
    return `<div class="message ${message.role === "user" ? "user" : "tutor"}">${message.role === "tutor" ? '<span class="message-meta">Tutor Spark</span>' : ""}${escapeHtml(message.text)}</div>`;
  }

  function sendTutorMessage(text) {
    state.chat.push({ role: "user", text });
    state.chat.push({ role: "tutor", text: getTutorResponse(text) });
    state.chat = state.chat.slice(-30);
    markActivity(0);
    saveState();
    renderTutor();
  }

  function getTutorResponse(question) {
    const q = normalize(question);
    const lesson = getLesson(state.currentLesson);

    if (q.includes("spark sql") || (q.includes("sql") && q.includes("pyspark"))) {
      return "Spark SQL é a interface SQL da mesma engine usada pelos DataFrames PySpark. Use SQL quando a transformação for naturalmente declarativa e facilitar a colaboração. Use PySpark quando precisar compor funções, parâmetros, testes ou um fluxo programático. Não existe obrigação de escolher apenas um: um DataFrame pode virar temp view e voltar a ser DataFrame.";
    }
    if (q.includes("pyspark")) {
      return "PySpark é a API Python do Apache Spark. Você escreve transformações em Python, como df.filter(...) e df.groupBy(...), e a engine Spark transforma isso em um plano distribuído.\n\nPense assim: SQL e PySpark são duas formas de descrever o que fazer; em operações equivalentes, ambas podem chegar ao mesmo plano otimizado. No Databricks, a variável spark costuma ser sua SparkSession.";
    }
    if (q.includes("partition") || q.includes("particao")) {
      return "Partition é uma fração dos dados. Em geral, uma task processa uma partição por vez. Mais partições podem aumentar o paralelismo, mas partições pequenas demais criam overhead; poucas partições enormes deixam recursos ociosos.\n\nAnalogia: divida uma tabela em lotes. Cada executor recebe lotes para processar. repartition redistribui os dados; coalesce costuma ser usado para reduzir a quantidade com menos movimentação.";
    }
    if (q.includes("shuffle")) {
      return "Shuffle é a redistribuição de registros entre partições, geralmente pela rede. Acontece em operações como groupBy, join, distinct e orderBy porque dados relacionados precisam se encontrar.\n\nEle é caro por envolver rede, serialização e possivelmente disco. Uma regra prática: filtre linhas e selecione apenas as colunas necessárias antes de joins e agregações.";
    }
    if (q.includes("driver")) {
      return "O driver coordena a aplicação: interpreta seu código, cria o plano e agenda tasks. Os executors fazem o trabalho sobre as partições. Por isso collect() é perigoso em dados grandes: ele tenta trazer tudo de volta para a memória do driver.";
    }
    if (q.includes("executor")) {
      return "Executors são os processos trabalhadores do Spark. Eles executam tasks, processam partições e podem guardar blocos em cache. O driver coordena; os executors processam. Um cluster pode ter vários executors trabalhando em paralelo.";
    }
    if (q.includes("lazy") || q.includes("preguicos") || q.includes("action") || q.includes("transformation")) {
      return "Lazy evaluation significa que o Spark adia o processamento. select, filter e join são transformations: montam o plano. show, count e write são actions: exigem um resultado e disparam a execução.\n\nIsso lembra o Power Query: você encadeia etapas e o mecanismo avalia o fluxo quando ocorre a atualização.";
    }
    if (q.includes("dataframe")) {
      return "Um DataFrame é uma coleção distribuída de dados em linhas e colunas, com schema. Ele lembra uma tabela SQL, mas é imutável: filter ou select devolvem outro DataFrame. Também é lazy — representa um plano até que uma action peça um resultado.";
    }
    if (q.includes("parquet")) {
      return "Parquet é um formato colunar, comprimido e tipado. Para análise, ele costuma ser melhor que CSV porque o Spark pode ler apenas as colunas necessárias e preservar o schema. Delta Lake usa arquivos Parquet e acrescenta um log transacional.";
    }
    if (q.includes("delta")) {
      return "Delta Lake acrescenta transações ACID, histórico de versões, schema enforcement e operações como MERGE sobre dados armazenados em Parquet. No Databricks, é uma escolha comum para tabelas Bronze, Silver e Gold.";
    }
    if (q.includes("join")) {
      return "A sintaxe do join é simples; o cuidado está na cardinalidade. Antes do join, verifique se a chave da dimensão é única. Depois, reconcilie contagem de linhas e totais. Uma chave duplicada pode multiplicar o faturamento sem gerar erro técnico.";
    }
    if (q.includes("cache") || q.includes("persist")) {
      return "Cache ajuda quando um resultado caro será reutilizado várias vezes. Ele não é gratuito: ocupa memória e precisa ser materializado por uma action. Depois do uso, chame unpersist(). Aplicar cache em todas as etapas normalmente piora o uso de recursos.";
    }
    if (q.includes("databricks") || q.includes("pratic")) {
      return "No Databricks, crie um notebook e comece com um DataFrame pequeno. Para cada aula: execute o exemplo, altere uma condição, tente o exercício sem olhar a solução e finalize com explain(). Você pode copiar os exemplos da área SQL ↔ PySpark deste app. O app orienta, mas não executa Spark localmente.";
    }
    if (q.includes("power bi")) {
      return "A conexão mais útil é esta: Spark prepara e transforma grandes volumes antes do consumo; Power BI modela, calcula e apresenta. Uma tabela Gold no Databricks costuma ser desenhada para ser simples e eficiente para o Power BI.";
    }
    if (q.includes("spark") || q.includes("o que e")) {
      return "Apache Spark é uma engine de processamento de dados. Ela cria um plano, divide os dados em partições e distribui tasks aos executors. Não é um banco de dados nem uma linguagem: pode ler diversas fontes e oferece interfaces como Spark SQL e PySpark.";
    }
    if (q.includes("aula") || q.includes("hoje")) {
      return `Você está na aula ${lesson.id}: “${lesson.title}”. O objetivo é ${lesson.objective.toLowerCase()} Comece o cronômetro, faça a microaula e só depois compare SQL com PySpark. Se travar, pergunte pelo nome de um conceito específico.`;
    }

    return "Ainda não consigo interpretar qualquer pergunta como um tutor conectado a uma IA. Sou um assistente local focado nos conceitos desta trilha. Tente perguntar por: DataFrame, driver, executor, partition, shuffle, lazy evaluation, join, cache, Parquet, Delta, Spark SQL ou PySpark.";
  }

  function renderGlossary(filter = "") {
    const normalizedFilter = normalize(filter);
    const terms = DATA.glossary.filter((item) => {
      const haystack = normalize(`${item.term} ${item.category} ${item.definition}`);
      return haystack.includes(normalizedFilter);
    });

    els.container.innerHTML = `
      <div class="view-stack">
        <section class="page-intro">
          <div>
            <span class="eyebrow">SEM DECORAR JARGÃO</span>
            <h2>Conceitos em linguagem direta</h2>
            <p>Pesquise um termo quando ele aparecer numa aula, notebook ou conversa sobre Spark.</p>
          </div>
        </section>
        <section class="card glossary-tools">
          <input class="search-input" id="glossary-search" type="search" value="${escapeAttr(filter)}" placeholder="Buscar por driver, partition, shuffle..." aria-label="Buscar no glossário" />
        </section>
        <div class="glossary-grid" id="glossary-results">
          ${terms.length ? terms.map((item) => `
            <article class="card term-card">
              <h3>${escapeHtml(item.term)}</h3>
              <p>${escapeHtml(item.definition)}</p>
              <span class="term-tag">${escapeHtml(item.category)}</span>
            </article>
          `).join("") : '<div class="card empty-state">Nenhum termo encontrado. Tente uma palavra mais curta.</div>'}
        </div>
      </div>
    `;

    const input = document.getElementById("glossary-search");
    input.addEventListener("input", () => {
      const position = input.selectionStart;
      renderGlossary(input.value);
      const next = document.getElementById("glossary-search");
      next.focus();
      next.setSelectionRange(position, position);
    });
  }

  function renderProgress() {
    const completed = state.completedLessons.length;
    const percentage = Math.round((completed / DATA.lessons.length) * 100);
    const correctAnswers = Object.entries(state.quizAnswers).filter(([lessonId, answer]) => answer.selected === getLesson(Number(lessonId)).quiz.correct).length;
    const quizAttempts = Object.keys(state.quizAnswers).length;
    const accuracy = quizAttempts ? Math.round((correctAnswers / quizAttempts) * 100) : 0;
    const studiedHours = state.totalStudySeconds / 3600;

    els.container.innerHTML = `
      <div class="view-stack">
        <section class="page-intro">
          <div>
            <span class="eyebrow">EVOLUÇÃO CONSISTENTE</span>
            <h2>${percentage ? `Você já percorreu ${percentage}% da trilha` : "Sua jornada começa na primeira aula"}</h2>
            <p>O objetivo não é correr: é conseguir explicar os conceitos e aplicá-los num notebook.</p>
          </div>
          <button class="danger-button" id="reset-progress">Reiniciar progresso</button>
        </section>

        <div class="stats-grid">
          ${renderMetric("Aulas concluídas", `${completed}/${DATA.lessons.length}`, "Meta: 20 aulas")}
          ${renderMetric("Tempo focado", `${formatHours(studiedHours)}h`, "Cronômetro do app")}
          ${renderMetric("Acerto atual", `${accuracy}%`, `${quizAttempts} quizzes respondidos`)}
          ${renderMetric("Sequência", `${calculateStreak()} dias`, "Dias consecutivos")}
        </div>

        <div class="progress-layout">
          <section class="card chart-card">
            <h3>Progresso por semana</h3>
            <div class="week-bars">
              ${DATA.weekInfo.map((week) => {
                const lessons = DATA.lessons.filter((lesson) => lesson.week === week.week);
                const done = lessons.filter((lesson) => state.completedLessons.includes(lesson.id)).length;
                const pct = Math.round((done / lessons.length) * 100);
                return `
                  <div class="week-bar-group">
                    <span>${pct}%</span>
                    <div class="week-bar-wrap"><div class="week-bar-value" style="height:${Math.max(pct, 2)}%"></div></div>
                    <strong>Semana ${week.week}</strong>
                  </div>
                `;
              }).join("")}
            </div>
          </section>

          <section class="card notes-card">
            <h3>Meu caderno de bordo</h3>
            <textarea class="notes-area" id="study-notes" placeholder="O que aprendi? Onde travei? O que quero revisar?">${escapeHtml(state.notes)}</textarea>
            <div class="notes-hint">As anotações são salvas automaticamente neste navegador.</div>
          </section>
        </div>

        <section class="card chart-card">
          <h3>Atividade nos últimos 42 dias</h3>
          <div class="heatmap" aria-label="Mapa de dias estudados">
            ${renderHeatmap()}
          </div>
        </section>
      </div>
    `;

    document.getElementById("study-notes").addEventListener("input", (event) => {
      state.notes = event.target.value;
      saveState();
    });
    document.getElementById("reset-progress").addEventListener("click", resetProgress);
  }

  function renderMetric(label, value, detail) {
    return `<article class="card metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
  }

  function renderHeatmap() {
    const cells = [];
    for (let offset = 41; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = dateKey(date);
      const seconds = state.studySeconds[key] || 0;
      const level = seconds >= 2700 ? 3 : seconds >= 900 ? 2 : seconds > 0 ? 1 : 0;
      const title = `${date.toLocaleDateString("pt-BR")}: ${Math.round(seconds / 60)} min`;
      cells.push(`<span class="heat-cell ${level ? `level-${level}` : ""}" title="${escapeAttr(title)}"></span>`);
    }
    return cells.join("");
  }

  function renderQuizOption(lesson, quizState, option, index) {
    const answered = quizState.selected !== undefined;
    let className = "";
    if (answered && index === quizState.selected) className = index === lesson.quiz.correct ? "correct" : "wrong";
    if (answered && index === lesson.quiz.correct && quizState.selected !== lesson.quiz.correct) className = "correct";
    return `
      <button class="quiz-option ${className}" data-option="${index}">
        <span class="option-letter">${String.fromCharCode(65 + index)}</span>
        <span>${escapeHtml(option)}</span>
      </button>
    `;
  }

  function renderQuizFeedback(lesson, selected) {
    const correct = selected === lesson.quiz.correct;
    return `<strong>${correct ? "✓ Isso mesmo." : "Ainda não — revise a explicação."}</strong> ${escapeHtml(lesson.quiz.explanation)}`;
  }

  function answerQuiz(lesson, selected) {
    state.quizAnswers[lesson.id] = { selected, answeredAt: new Date().toISOString() };
    markActivity(0);
    saveState();
    const feedback = document.getElementById("quiz-feedback");
    feedback.hidden = false;
    feedback.innerHTML = renderQuizFeedback(lesson, selected);
    document.querySelectorAll(".quiz-option").forEach((button) => {
      const index = Number(button.dataset.option);
      button.classList.remove("selected", "correct", "wrong");
      if (index === selected) button.classList.add(index === lesson.quiz.correct ? "correct" : "wrong");
      if (index === lesson.quiz.correct && selected !== lesson.quiz.correct) button.classList.add("correct");
    });
    updateShell();
  }

  function completeLesson(lesson) {
    const completed = state.completedLessons.includes(lesson.id);
    if (completed) {
      if (lesson.id < DATA.lessons.length) openLesson(lesson.id + 1);
      else setView("trail");
      return;
    }

    const draft = (state.exerciseDrafts[lesson.id] || document.getElementById("exercise-draft")?.value || "").trim();
    const practiced = Boolean(state.practiceDone[lesson.id]);
    const quizAttempted = state.quizAnswers[lesson.id]?.selected !== undefined;
    if (!draft || !practiced || !quizAttempted) {
      toast("Faça uma tentativa na prática e responda ao quiz antes de concluir.");
      return;
    }

    state.exerciseDrafts[lesson.id] = draft;
    state.completedLessons.push(lesson.id);
    state.completedLessons = [...new Set(state.completedLessons)].sort((a, b) => a - b);
    state.checklist[lesson.id] = [true, true, true, true, true];
    markActivity(0);
    if (lesson.id < DATA.lessons.length) state.currentLesson = lesson.id + 1;
    pauseTimer(false);
    saveState();
    updateShell();
    toast(`Aula ${lesson.id} concluída. +100 XP`);
    renderToday();
  }

  function openLesson(id) {
    pauseTimer(false);
    state.currentLesson = Math.max(1, Math.min(DATA.lessons.length, id));
    saveState();
    updateShell();
    setView("today");
  }

  function switchCodeTab(name) {
    document.querySelectorAll("[data-code-tab]").forEach((tab) => {
      const active = tab.dataset.codeTab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    document.getElementById("code-sql").hidden = name !== "sql";
    document.getElementById("code-pyspark").hidden = name !== "pyspark";
  }

  function bindCopyButtons() {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget);
        if (!target) return;
        const ok = await copyText(target.textContent);
        button.textContent = ok ? "Copiado ✓" : "Selecione e copie";
        if (ok) toast("Código copiado.");
        setTimeout(() => { button.textContent = "Copiar"; }, 1600);
      });
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
      textarea.remove();
      return ok;
    }
  }

  function toggleTimer(lessonId) {
    const timer = getTimer(lessonId);
    if (timer.remaining === 0) timer.remaining = TOTAL_SECONDS;
    timer.running = !timer.running;
    timer.updatedAt = Date.now();
    state.timers[lessonId] = timer;

    if (timer.running) {
      markActivity(0);
      startTimerInterval(lessonId);
    } else {
      stopTimerInterval();
    }
    saveState();
    updateTimerUI(lessonId);
  }

  function resetTimer(lessonId) {
    const timer = getTimer(lessonId);
    if (timer.remaining < TOTAL_SECONDS && !window.confirm("Reiniciar o cronômetro desta aula para 60 minutos?")) return;
    stopTimerInterval();
    state.timers[lessonId] = { remaining: TOTAL_SECONDS, running: false, updatedAt: Date.now() };
    saveState();
    updateTimerUI(lessonId);
  }

  function startTimerInterval(lessonId) {
    stopTimerInterval();
    activeTimerLessonId = lessonId;
    timerInterval = window.setInterval(() => {
      const timer = getTimer(lessonId);
      if (!timer.running) {
        stopTimerInterval();
        return;
      }

      timer.remaining = Math.max(0, timer.remaining - 1);
      timer.updatedAt = Date.now();
      state.totalStudySeconds += 1;
      const key = dateKey(new Date());
      state.studySeconds[key] = (state.studySeconds[key] || 0) + 1;

      if (timer.remaining === 0) {
        timer.running = false;
        stopTimerInterval();
        toast("Sessão de 1 hora finalizada. Feche com o quiz e seu registro.");
      }

      state.timers[lessonId] = timer;
      if (timer.remaining % 5 === 0 || timer.remaining === 0) saveState();
      updateTimerUI(lessonId);
      if (timer.remaining % 60 === 0) updateShell();
    }, 1000);
  }

  function pauseTimer(updateUi = true) {
    if (activeTimerLessonId !== null) {
      const timer = getTimer(activeTimerLessonId);
      timer.running = false;
      state.timers[activeTimerLessonId] = timer;
    }
    stopTimerInterval();
    if (updateUi && activeTimerLessonId !== null) updateTimerUI(activeTimerLessonId);
  }

  function stopTimerInterval() {
    if (timerInterval) window.clearInterval(timerInterval);
    timerInterval = null;
    activeTimerLessonId = null;
  }

  function updateTimerUI(lessonId) {
    const timer = getTimer(lessonId);
    const value = document.getElementById("timer-value");
    const phase = document.getElementById("timer-phase");
    const face = document.getElementById("timer-face");
    const toggle = document.getElementById("timer-toggle");
    const status = document.getElementById("timer-status");
    const steps = document.getElementById("routine-steps");
    if (!value || state.currentLesson !== lessonId) return;

    const progress = ((TOTAL_SECONDS - timer.remaining) / TOTAL_SECONDS) * 100;
    value.textContent = formatTime(timer.remaining);
    phase.textContent = getTimerPhase(timer.remaining).label;
    face.style.setProperty("--timer-progress", `${progress}%`);
    toggle.textContent = timer.running ? "Pausar" : timer.remaining === 0 ? "Recomeçar" : "Iniciar sessão";
    status.textContent = timer.remaining === 0 ? "Finalizada" : timer.running ? "Em andamento" : "Pausada";
    status.classList.toggle("done", timer.remaining === 0);
    steps.innerHTML = renderRoutineSteps(timer.remaining);
  }

  function renderRoutineSteps(remaining) {
    const activeIndex = getTimerPhase(remaining).index;
    return DATA.routine.map((step, index) => `
      <li class="routine-step ${index === activeIndex && remaining > 0 ? "active" : ""}">
        <span>${escapeHtml(step.label)}</span>
        <span>${step.minutes} min</span>
      </li>
    `).join("");
  }

  function getTimerPhase(remaining) {
    const elapsedMinutes = (TOTAL_SECONDS - remaining) / 60;
    let cumulative = 0;
    for (let index = 0; index < DATA.routine.length; index += 1) {
      cumulative += DATA.routine[index].minutes;
      if (elapsedMinutes < cumulative) return { ...DATA.routine[index], index };
    }
    return { label: "Concluída", minutes: 0, index: DATA.routine.length - 1 };
  }

  function getTimer(lessonId) {
    if (!state.timers[lessonId]) {
      state.timers[lessonId] = { remaining: TOTAL_SECONDS, running: false, updatedAt: Date.now() };
    }
    const timer = state.timers[lessonId];
    timer.remaining = Number.isFinite(timer.remaining) ? Math.max(0, Math.min(TOTAL_SECONDS, timer.remaining)) : TOTAL_SECONDS;
    timer.running = Boolean(timer.running);
    return timer;
  }

  function resetProgress() {
    if (!window.confirm("Isso apagará aulas, respostas, cronômetros e anotações salvas neste navegador. Deseja continuar?")) return;
    const name = state.profile.name;
    stopTimerInterval();
    state = structuredCloneSafe(defaultState);
    state.profile.name = name;
    saveState();
    updateShell();
    toast("Progresso reiniciado.");
    renderProgress();
  }

  function updateShell() {
    const completed = state.completedLessons.length;
    const percentage = Math.round((completed / DATA.lessons.length) * 100);
    els.sidebarProgressLabel.textContent = `${percentage}%`;
    els.sidebarProgressBar.style.width = `${percentage}%`;
    els.sidebarProgressDetail.textContent = `${completed} de ${DATA.lessons.length} aulas`;
    els.streak.textContent = calculateStreak();
    els.xp.textContent = calculateXp();
    els.avatar.textContent = initials(state.profile.name);
    els.avatar.title = `Perfil de ${state.profile.name}`;
  }

  function calculateXp() {
    const completedXp = state.completedLessons.length * 100;
    const correctXp = Object.entries(state.quizAnswers).reduce((total, [lessonId, answer]) => {
      const lesson = getLesson(Number(lessonId));
      return total + (lesson && answer.selected === lesson.quiz.correct ? 20 : 0);
    }, 0);
    return completedXp + correctXp;
  }

  function calculateStreak() {
    const activeDates = new Set(Object.keys(state.studySeconds).filter((key) => state.studySeconds[key] > 0));
    if (!activeDates.size) return 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!activeDates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (activeDates.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function markActivity(seconds) {
    const key = dateKey(new Date());
    const increment = Math.max(1, seconds || 1);
    state.studySeconds[key] = (state.studySeconds[key] || 0) + increment;
    if (seconds > 0) state.totalStudySeconds += seconds;
  }

  function openProfileModal() {
    lastFocusedElement = document.activeElement;
    els.profileName.value = state.profile.name === "Estudante" ? "" : state.profile.name;
    els.profileModal.hidden = false;
    window.setTimeout(() => els.profileName.focus(), 0);
  }

  function closeProfileModal() {
    els.profileModal.hidden = true;
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function saveProfile() {
    const name = els.profileName.value.trim();
    if (!name) {
      toast("Digite um nome ou feche para continuar como Estudante.");
      els.profileName.focus();
      return;
    }
    state.profile.name = name;
    saveState();
    closeProfileModal();
    updateShell();
    if (activeView === "today" || activeView === "tutor") renderView();
    toast(`Tudo certo, ${getFirstName()}!`);
  }

  function openMobileMenu() {
    document.body.classList.add("mobile-menu-open");
    els.mobileOverlay.hidden = false;
  }

  function closeMobileMenu() {
    document.body.classList.remove("mobile-menu-open");
    els.mobileOverlay.hidden = true;
  }

  function toast(message) {
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    els.toastRegion.appendChild(element);
    window.setTimeout(() => element.remove(), 2800);
  }

  function getChecklist(lessonId) {
    const checks = state.checklist[lessonId];
    if (!Array.isArray(checks) || checks.length !== DATA.routine.length) {
      state.checklist[lessonId] = Array(DATA.routine.length).fill(false);
    }
    return state.checklist[lessonId];
  }

  function getLesson(id) {
    return DATA.lessons.find((lesson) => lesson.id === Number(id)) || DATA.lessons[0];
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  function getFirstName() {
    return (state.profile.name || "Estudante").trim().split(/\s+/)[0] || "Estudante";
  }

  function initials(name) {
    const parts = (name || "Estudante").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "E";
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function formatHours(hours) {
    if (hours < 0.1) return "0";
    return hours < 10 ? hours.toFixed(1).replace(".", ",") : String(Math.round(hours));
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function validView(view) {
    return Object.prototype.hasOwnProperty.call(VIEW_META, view);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredCloneSafe(defaultState);
      const parsed = JSON.parse(raw);
      return sanitizeState(parsed);
    } catch (error) {
      console.warn("Não foi possível ler o progresso salvo.", error);
      return structuredCloneSafe(defaultState);
    }
  }

  function sanitizeState(input) {
    const safe = structuredCloneSafe(defaultState);
    if (!input || typeof input !== "object") return safe;
    safe.profile.name = typeof input.profile?.name === "string" ? input.profile.name.slice(0, 32) : safe.profile.name;
    safe.currentLesson = Number.isInteger(input.currentLesson) ? Math.max(1, Math.min(DATA.lessons.length, input.currentLesson)) : 1;
    safe.completedLessons = Array.isArray(input.completedLessons)
      ? [...new Set(input.completedLessons.filter((id) => Number.isInteger(id) && id >= 1 && id <= DATA.lessons.length))]
      : [];
    safe.checklist = input.checklist && typeof input.checklist === "object" ? input.checklist : {};
    safe.quizAnswers = input.quizAnswers && typeof input.quizAnswers === "object" ? input.quizAnswers : {};
    safe.exerciseDrafts = input.exerciseDrafts && typeof input.exerciseDrafts === "object" ? input.exerciseDrafts : {};
    safe.practiceDone = input.practiceDone && typeof input.practiceDone === "object" ? input.practiceDone : {};
    safe.timers = input.timers && typeof input.timers === "object" ? input.timers : {};
    Object.values(safe.timers).forEach((timer) => { if (timer && typeof timer === "object") timer.running = false; });
    safe.notes = typeof input.notes === "string" ? input.notes : "";
    safe.studySeconds = input.studySeconds && typeof input.studySeconds === "object" ? input.studySeconds : {};
    safe.totalStudySeconds = Number.isFinite(input.totalStudySeconds) ? Math.max(0, input.totalStudySeconds) : 0;
    safe.chat = Array.isArray(input.chat)
      ? input.chat.filter((message) => message && ["user", "tutor"].includes(message.role) && typeof message.text === "string").slice(-30)
      : [];
    safe.sidebarCollapsed = Boolean(input.sidebarCollapsed);
    return safe;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Não foi possível salvar o progresso.", error);
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }
})();
