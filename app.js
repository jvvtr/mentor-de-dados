(function () {
  "use strict";

  const DATA = window.SPARK_MENTOR_DATA;
  const STORAGE_KEY = "spark-mentor-state-v1";
  const TOTAL_SECONDS = 60 * 60;
  const VIEW_META = {
    today: ["TRILHA GUIADA", "Estudo de hoje"],
    trail: ["PLANO DE ESTUDOS", "Trilha de 4 semanas"],
    lab: ["REFERÊNCIA PRÁTICA", "SQL ↔ PySpark"],
    setup: ["COMECE POR AQUI", "Primeiros passos"],
    tutor: ["APOIO AO ESTUDO", "Tutor local"],
    glossary: ["CONSULTA RÁPIDA", "Glossário"],
    progress: ["SEU HISTÓRICO", "Meu progresso"]
  };

  const SESSION_STEPS = [
    { label: "Retomada", short: "Retomada", minutes: 5 },
    { label: "Conceito", short: "Conceito", minutes: 15 },
    { label: "SQL ↔ PySpark", short: "Comparar", minutes: 15 },
    { label: "Prática", short: "Prática", minutes: 20 },
    { label: "Quiz e registro", short: "Quiz", minutes: 5 }
  ];

  const PRACTICE_RUBRICS = {
    1: [["Cria ou obtém um DataFrame", ["spark.range", "createDataFrame"]], ["Exibe o resultado", ".show("]],
    2: [["Cria o DataFrame", "createDataFrame"], ["Mostra as linhas", ".show("], ["Inspeciona o schema", ".printSchema("]],
    3: [["Filtra os clientes", [".filter(", ".where("]], ["Seleciona as colunas", ".select("], ["Ordena o resultado", ".orderBy("]],
    4: [["Trata valores nulos", [".fillna(", "coalesce("]], ["Cria uma nova coluna", ".withColumn("], ["Calcula o valor", "quantidade", "preco_unitario"]],
    5: [["Aplica transformações", ".filter(", ".select("], ["Ordena os dados", ".orderBy("], ["Dispara uma action", ".count("]],
    6: [["Usa o DataFrameReader", "spark.read"], ["Configura a leitura", ".option("], ["Lê o CSV", ".csv("], ["Seleciona colunas", ".select("]],
    7: [["Registra uma view", "createOrReplaceTempView"], ["Executa Spark SQL", "spark.sql("]],
    8: [["Cria o valor do pedido", ".withColumn("], ["Agrupa por status", ".groupBy("], ["Calcula as métricas", ".agg(", "sum("]],
    9: [["Combina os DataFrames", ".join("], ["Mantém pedidos sem correspondência", "left"], ["Encontra nulos", ".isNull("]],
    10: [["Define uma janela", "Window.partitionBy"], ["Ordena a janela", ".orderBy("], ["Cria o ranking", ["dense_rank", "row_number"]]],
    11: [["Redistribui os dados", ".repartition("], ["Identifica a partição", "spark_partition_id"], ["Exibe a distribuição", ".groupBy(", ".show("]],
    12: [["Filtra antes de agregar", ".filter("], ["Reduz as colunas", ".select("], ["Agrupa e agrega", ".groupBy(", ".agg("]],
    13: [["Persiste o DataFrame", [".cache(", ".persist("]], ["Materializa o cache", ".count("], ["Libera os recursos", ".unpersist("]],
    14: [["Importa ou usa broadcast", "broadcast("], ["Executa o join", ".join("], ["Inspeciona o plano", ".explain("]],
    15: [["Monta a consulta", ".join("], ["Pede o plano formatado", ".explain(", "formatted"]],
    16: [["Define a regra inválida", "regra_invalida"], ["Separa rejeitados", ".filter("], ["Mantém os válidos", "~regra_invalida"]],
    17: [["Particiona pela chave", "Window.partitionBy"], ["Numera as versões", "row_number"], ["Mantém a posição 1", ".filter("], ["Remove a coluna auxiliar", ".drop("]],
    18: [["Configura a escrita", ".write"], ["Usa Delta", ".format(", "delta"], ["Escolhe o modo", ".mode("], ["Grava uma tabela gerenciada", ".saveAsTable("]],
    19: [["Filtra os aprovados", ".filter("], ["Cria o mês", "date_trunc"], ["Define a granularidade", ".groupBy("], ["Calcula as métricas", ".agg("]],
    20: [["Explica Apache Spark", "spark"], ["Explica DataFrame", "dataframe"], ["Diferencia partition e shuffle", "partition", "shuffle"], ["Compara SQL e PySpark", "sql", "pyspark"]]
  };

  const LESSON_RUNTIME_NOTES = {
    13: { environment: "local", label: "PySpark local", note: "cache e persist não são suportados no compute serverless do Databricks Free Edition. Execute esta prática no ambiente local." },
    18: { environment: "databricks", label: "Databricks recomendado", note: "Use saveAsTable em um schema do Unity Catalog. O starter local mínimo não inclui Delta Lake." },
    20: { environment: "reflection", label: "Reflexão escrita", note: "Esta atividade consolida conceitos em suas palavras e não precisa ser executada como código." }
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
    lessonSteps: {},
    preferredEnvironment: "databricks",
    environmentReady: false,
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
  let pendingSaveTimer = null;

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
      updateShell();
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
      case "setup": renderSetup(); break;
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
    const stepIndex = getLessonStep(lesson.id);
    const firstName = getFirstName();
    const greeting = getGreeting();

    els.container.innerHTML = `
      <div class="guided-session view-stack route-enter">
        <section class="card session-hero">
          <div class="session-hero-copy">
            <span class="eyebrow">${greeting.toUpperCase()}, ${escapeHtml(firstName.toUpperCase())} · AULA ${lesson.id} DE ${DATA.lessons.length}</span>
            <h2>${escapeHtml(lesson.title)}</h2>
            <p>${escapeHtml(lesson.objective)}</p>
            <div class="hero-meta">
              <span class="hero-chip"><strong>Semana ${lesson.week}</strong> de 4</span>
              <span class="hero-chip"><strong>60 minutos</strong> com pausas possíveis</span>
              <span class="hero-chip ${completed ? "is-complete" : ""}">${completed ? "✓ Aula concluída" : `Etapa ${stepIndex + 1} de 5`}</span>
            </div>
          </div>
          <a class="technology-mark" href="https://spark.apache.org/" target="_blank" rel="noreferrer" aria-label="Conheça o Apache Spark no site oficial">
            <span>TECNOLOGIA ESTUDADA</span>
            <img src="assets/apache-spark-logo-trademark.png" width="240" height="121" alt="Apache Spark" />
            <small>Marca oficial, usada sem alterações</small>
          </a>
        </section>

        <section class="card session-control" aria-label="Controles da sessão">
          <div class="session-control-head">
            <div>
              <span class="eyebrow">ROTEIRO DE HOJE</span>
              <strong>${checks.filter(Boolean).length} de 5 blocos registrados</strong>
            </div>
            <span class="status-badge ${timer.remaining === 0 ? "done" : ""}" id="timer-status">${timer.remaining === 0 ? "Finalizada" : timer.running ? "Em andamento" : "Pronta"}</span>
          </div>
          <div class="session-control-body">
            <div class="session-progress" aria-label="Etapas da aula">
              ${SESSION_STEPS.map((step, index) => `
                <button class="session-step ${index === stepIndex ? "active" : ""} ${checks[index] ? "complete" : ""}" ${index === stepIndex ? 'aria-current="step"' : ""} data-session-step="${index}">
                  <span class="session-step-index">${checks[index] ? "✓" : index + 1}</span>
                  <span><strong>${escapeHtml(step.short)}</strong><small>${step.minutes} min</small></span>
                </button>
              `).join("")}
            </div>
            <div class="compact-timer" id="timer-face">
              <div class="compact-timer-value">
                <strong id="timer-value" role="timer" aria-label="Tempo restante">${formatTime(timer.remaining)}</strong>
                <span id="timer-phase">${getTimerPhase(timer.remaining).label}</span>
              </div>
              <div class="timer-actions">
                <button class="primary-button" id="timer-toggle">${timer.running ? "Pausar" : timer.remaining === 0 ? "Recomeçar" : "Iniciar"}</button>
                <button class="secondary-button icon-only" id="timer-reset" aria-label="Reiniciar cronômetro" title="Reiniciar cronômetro">↻</button>
              </div>
            </div>
          </div>
          <ol class="visually-hidden" id="routine-steps">${renderRoutineSteps(timer.remaining)}</ol>
        </section>

        <section class="card session-stage">
          ${renderSessionStage(lesson, stepIndex, quizState, completed)}
        </section>

        <nav class="session-footer" aria-label="Navegação entre etapas">
          <button class="secondary-button" data-step-direction="-1" ${stepIndex === 0 ? "disabled" : ""}>← Etapa anterior</button>
          <span>Etapa ${stepIndex + 1} de ${SESSION_STEPS.length}</span>
          ${stepIndex < SESSION_STEPS.length - 1
            ? '<button class="primary-button" data-step-direction="1">Salvar e continuar →</button>'
            : '<button class="secondary-button" data-session-step="0">Rever desde o início</button>'}
        </nav>
      </div>
    `;

    bindTodayEvents(lesson, stepIndex);
    updateTimerUI(lesson.id);
    if (timer.running) startTimerInterval(lesson.id);
  }

  function renderSessionStage(lesson, stepIndex, quizState, completed) {
    if (stepIndex === 0) {
      const previous = lesson.id > 1 ? getLesson(lesson.id - 1) : null;
      return `
        <div class="stage-layout stage-recap">
          <div class="stage-main">
            <div class="section-heading">
              <div><span class="eyebrow">ETAPA 1 · RETOMADA</span><h3>Prepare o contexto antes do código</h3></div>
              <span class="time-badge">5 min</span>
            </div>
            <div class="recap-grid">
              <article class="recap-card"><span>OBJETIVO DE HOJE</span><p>${escapeHtml(lesson.objective)}</p></article>
              <article class="recap-card"><span>PONTO DE PARTIDA</span><p>${previous ? `Na aula anterior, você estudou “${escapeHtml(previous.title)}”. Tente explicar em uma frase antes de seguir.` : "Você já conhece SQL: use esse repertório para perceber que o Spark oferece outra forma de descrever transformações."}</p></article>
            </div>
            <div class="warmup-prompt"><strong>Pergunta de aquecimento:</strong> onde uma transformação semelhante apareceria em um relatório do Power BI ou em uma consulta SQL?</div>
          </div>
          <aside class="environment-nudge ${state.environmentReady ? "ready" : ""}">
            <img src="assets/spark-data-scale-icon.svg" width="88" height="88" alt="" aria-hidden="true" />
            <span class="eyebrow">AMBIENTE DE PRÁTICA</span>
            <h4>${state.environmentReady ? "Ambiente marcado como pronto" : "Ainda não configurou?"}</h4>
            <p>${state.environmentReady ? `Você escolheu ${state.preferredEnvironment === "databricks" ? "Databricks Free Edition" : "PySpark local"}. É possível trocar a qualquer momento.` : "Leva poucos minutos para começar pelo navegador ou preparar o PySpark no Windows."}</p>
            <button class="secondary-button" data-open-setup>${state.environmentReady ? "Revisar configuração" : "Configurar ambiente"}</button>
          </aside>
        </div>`;
    }

    if (stepIndex === 1) {
      return `
        <div class="stage-main readable-stage">
          <div class="section-heading">
            <div><span class="eyebrow">ETAPA 2 · CONCEITO</span><h3>${escapeHtml(lesson.subtitle)}</h3><p>${escapeHtml(lesson.intro)}</p></div>
            <span class="time-badge">15 min</span>
          </div>
          <div class="concept-list">
            ${lesson.concepts.map((concept, index) => `<article class="concept-item"><span class="concept-number">${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(concept.title)}</strong><p>${escapeHtml(concept.text)}</p></div></article>`).join("")}
          </div>
          <div class="analogy-box"><strong>Conexão com o que você já conhece:</strong> ${escapeHtml(lesson.analogy)}</div>
        </div>`;
    }

    if (stepIndex === 2) {
      return `
        <div class="stage-main">
          <div class="section-heading">
            <div><span class="eyebrow">ETAPA 3 · TRADUÇÃO MENTAL</span><h3>SQL ↔ PySpark</h3><p>Compare as duas formas de expressar a mesma intenção. O Spark otimiza o plano; você escolhe a interface mais clara para o problema.</p></div>
            <span class="time-badge">15 min</span>
          </div>
          ${renderCodeTabs(lesson)}
          <div class="comparison-tip"><strong>Faça agora:</strong> identifique no PySpark onde estão o <code>SELECT</code>, o <code>WHERE</code> e o <code>GROUP BY</code> da versão SQL.</div>
        </div>`;
    }

    if (stepIndex === 3) return renderPracticeWorkspace(lesson);

    return `
      <div class="stage-main completion-stage">
        <div class="section-heading">
          <div><span class="eyebrow">ETAPA 5 · QUIZ E REGISTRO</span><h3>${escapeHtml(lesson.quiz.question)}</h3><p>Você pode tentar novamente. O objetivo é compreender, não acertar de primeira.</p></div>
          <span class="time-badge">5 min</span>
        </div>
        <div class="quiz-options" id="quiz-options" role="group" aria-label="Alternativas do quiz">
          ${lesson.quiz.options.map((option, index) => renderQuizOption(lesson, quizState, option, index)).join("")}
        </div>
        <div class="quiz-feedback" id="quiz-feedback" role="status" aria-live="polite" ${quizState.selected === undefined ? "hidden" : ""}>
          ${quizState.selected === undefined ? "" : renderQuizFeedback(lesson, quizState.selected)}
        </div>
        <div class="completion-panel ${completed ? "is-complete" : ""}">
          <div class="completion-icon">${completed ? "✓" : "→"}</div>
          <div><h3>${completed ? "Aula concluída" : "Feche o ciclo de hoje"}</h3><p>${completed ? "Você pode revisar esta aula quando quiser ou seguir para a próxima." : "Confirme a prática e responda ao quiz para registrar a conclusão."}</p></div>
          <button class="${completed ? "secondary-button" : "primary-button"}" id="complete-lesson">${completed ? (lesson.id < DATA.lessons.length ? "Próxima aula" : "Revisar trilha") : "Concluir aula"}</button>
        </div>
      </div>`;
  }

  function renderPracticeWorkspace(lesson) {
    const draft = state.exerciseDrafts[lesson.id] ?? lesson.starter;
    const lineCount = Math.max(1, draft.split("\n").length);
    const runtime = getLessonRuntime(lesson.id);
    const draftMeta = getDraftMetadata(lesson);
    const isReflection = runtime.environment === "reflection";
    const executionTarget = runtime.environment === "local" ? "seu ambiente PySpark local" : "um notebook do Databricks Free Edition";
    return `
      <div class="stage-main practice-workspace">
        <div class="section-heading">
          <div><span class="eyebrow">ETAPA 4 · PRÁTICA</span><h3>${isReflection ? "Reflexão final" : "Laboratório da aula"}</h3><p>${isReflection ? "Consolide os conceitos com suas palavras e revise a clareza das explicações." : "Planeje aqui, verifique a estrutura e execute em um ambiente Spark real."}</p></div>
          <span class="time-badge">20 min</span>
        </div>
        <div class="runtime-notice ${runtime.environment === "local" ? "local-only" : ""}">
          <div><span class="runtime-dot"></span><strong>${escapeHtml(runtime.label)}</strong><p>${escapeHtml(runtime.note)}</p></div>
          <button class="ghost-button" data-open-setup>${isReflection ? "Revisar ambientes" : "Ver como executar"}</button>
        </div>
        <div class="exercise-prompt"><span>DESAFIO</span>${escapeHtml(lesson.exercise)}</div>
        <div class="editor-shell">
          <header class="editor-header">
            <div><span class="editor-dot red"></span><span class="editor-dot amber"></span><span class="editor-dot green"></span><strong>${escapeHtml(draftMeta.filename)}</strong></div>
            <span class="editor-mode">${escapeHtml(draftMeta.modeLabel)}</span>
          </header>
          <div class="editor-body">
            <pre class="editor-line-numbers" id="editor-lines" aria-hidden="true">${Array.from({ length: lineCount }, (_, index) => index + 1).join("\n")}</pre>
            <textarea id="exercise-draft" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Rascunho da solução do exercício">${escapeHtml(draft)}</textarea>
          </div>
          <footer class="editor-statusbar"><span id="draft-status">Salvo neste navegador</span><span id="code-stats">${lineCount} linhas · ${draft.length} caracteres</span></footer>
        </div>
        <div class="editor-toolbar" role="toolbar" aria-label="Ações do rascunho">
          <button class="primary-button" id="validate-code">Verificar estrutura</button>
          <button class="secondary-button" id="copy-draft">Copiar</button>
          <button class="secondary-button" id="download-draft">Baixar ${escapeHtml(draftMeta.extension)}</button>
          <button class="ghost-button" id="reset-draft">Restaurar início</button>
        </div>
        <div class="validation-result" id="validation-result" role="status" aria-live="polite" hidden></div>
        <div class="execution-lane">
          <div><strong>${isReflection ? "Registrar sua reflexão" : "Executar de verdade"}</strong><p>${isReflection ? "Complete os cinco tópicos com suas palavras. A verificação procura os conceitos esperados, mas a qualidade da explicação depende da sua revisão." : `Copie o código para ${executionTarget}. A verificação acima analisa elementos esperados, mas não processa dados.`}</p></div>
          <button class="secondary-button" data-open-setup>${isReflection ? "Revisar ambientes" : "Abrir primeiros passos →"}</button>
        </div>
        <div class="practice-support">
          <button class="ghost-button" id="show-hint" aria-expanded="false" aria-controls="hint-panel">Mostrar dica</button>
          <button class="ghost-button" id="show-solution" aria-expanded="false" aria-controls="solution-panel">Ver uma solução possível</button>
        </div>
        <div class="hint-panel" id="hint-panel" hidden>${escapeHtml(lesson.hint)}</div>
        <div class="solution-panel" id="solution-panel" hidden><div class="solution-head"><strong>Uma solução possível</strong><button class="code-copy" data-copy-target="solution-code">Copiar</button></div><pre><code id="solution-code">${escapeHtml(lesson.solution)}</code></pre></div>
        <label class="practice-confirmation">
          <input type="checkbox" id="practice-done" ${state.practiceDone[lesson.id] ? "checked" : ""} />
          <span><strong>Confirmação honesta</strong> Executei em um ambiente Spark real ou revisei minha tentativa com a verificação estrutural.</span>
        </label>
      </div>`;
  }

  function renderCodeTabs(lesson) {
    return `
      <div class="code-tabs">
        <div class="tab-list" role="tablist" aria-label="Comparação de código">
          <button class="code-tab active" id="tab-sql" role="tab" tabindex="0" aria-selected="true" aria-controls="code-sql" data-code-tab="sql">Spark SQL</button>
          <button class="code-tab" id="tab-pyspark" role="tab" tabindex="-1" aria-selected="false" aria-controls="code-pyspark" data-code-tab="pyspark">PySpark</button>
        </div>
        <div class="code-panel" id="code-sql" role="tabpanel" aria-labelledby="tab-sql">
          <button class="code-copy" data-copy-target="sql-code">Copiar</button>
          <pre><code id="sql-code">${escapeHtml(lesson.sql)}</code></pre>
        </div>
        <div class="code-panel" id="code-pyspark" role="tabpanel" aria-labelledby="tab-pyspark" hidden>
          <button class="code-copy" data-copy-target="pyspark-code">Copiar</button>
          <pre><code id="pyspark-code">${escapeHtml(lesson.pyspark)}</code></pre>
        </div>
      </div>
    `;
  }

  function bindTodayEvents(lesson, stepIndex) {
    document.querySelectorAll("[data-session-step]").forEach((button) => {
      button.addEventListener("click", () => goToLessonStep(lesson.id, Number(button.dataset.sessionStep), stepIndex));
    });
    document.querySelectorAll("[data-step-direction]").forEach((button) => {
      button.addEventListener("click", () => goToLessonStep(lesson.id, stepIndex + Number(button.dataset.stepDirection), stepIndex));
    });
    document.querySelectorAll("[data-open-setup]").forEach((button) => button.addEventListener("click", () => openSetupForLesson(lesson)));

    document.querySelectorAll("[data-code-tab]").forEach((tab) => {
      tab.addEventListener("click", () => switchCodeTab(tab.dataset.codeTab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const target = tab.dataset.codeTab === "sql" ? "pyspark" : "sql";
        switchCodeTab(target, true);
      });
    });
    bindCopyButtons();

    const draft = document.getElementById("exercise-draft");
    if (draft) bindPracticeEvents(lesson, draft);

    document.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => answerQuiz(lesson, Number(button.dataset.option)));
    });

    document.getElementById("timer-toggle")?.addEventListener("click", () => toggleTimer(lesson.id));
    document.getElementById("timer-reset")?.addEventListener("click", () => resetTimer(lesson.id));
    document.getElementById("complete-lesson")?.addEventListener("click", () => completeLesson(lesson));
  }

  function bindPracticeEvents(lesson, draft) {
    syncEditorChrome(draft);
    draft.addEventListener("input", () => {
      state.exerciseDrafts[lesson.id] = draft.value;
      syncEditorChrome(draft);
      const status = document.getElementById("draft-status");
      if (status) status.textContent = "Salvando…";
      scheduleStateSave(() => { if (status) status.textContent = "Salvo neste navegador"; });
    });
    draft.addEventListener("scroll", () => {
      const lines = document.getElementById("editor-lines");
      if (lines) lines.scrollTop = draft.scrollTop;
    });
    draft.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      const start = draft.selectionStart;
      const end = draft.selectionEnd;
      draft.setRangeText("    ", start, end, "end");
      draft.dispatchEvent(new Event("input", { bubbles: true }));
    });

    document.getElementById("practice-done")?.addEventListener("change", (event) => {
      state.practiceDone[lesson.id] = event.target.checked;
      markActivity(0);
      saveState();
    });
    document.getElementById("validate-code")?.addEventListener("click", () => showPracticeValidation(lesson, draft.value));
    document.getElementById("copy-draft")?.addEventListener("click", async (event) => {
      const ok = await copyText(draft.value);
      event.currentTarget.textContent = ok ? "Copiado ✓" : "Selecione e copie";
      if (ok) toast("Rascunho copiado.");
      window.setTimeout(() => { event.currentTarget.textContent = "Copiar"; }, 1600);
    });
    document.getElementById("download-draft")?.addEventListener("click", () => downloadDraft(lesson, draft.value));
    document.getElementById("reset-draft")?.addEventListener("click", () => {
      if (!window.confirm("Restaurar o código inicial desta aula? Seu rascunho atual será substituído.")) return;
      draft.value = lesson.starter;
      state.exerciseDrafts[lesson.id] = lesson.starter;
      state.practiceDone[lesson.id] = false;
      document.getElementById("practice-done").checked = false;
      document.getElementById("validation-result").hidden = true;
      syncEditorChrome(draft);
      saveState();
      toast("Código inicial restaurado.");
    });

    bindDisclosureButton("show-hint", "hint-panel", "Mostrar dica", "Ocultar dica");
    bindDisclosureButton("show-solution", "solution-panel", "Ver uma solução possível", "Ocultar solução");
  }

  function bindDisclosureButton(buttonId, panelId, closedLabel, openLabel) {
    const button = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);
    if (!button || !panel) return;
    button.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
      button.textContent = panel.hidden ? closedLabel : openLabel;
    });
  }

  function syncEditorChrome(editor) {
    const count = Math.max(1, editor.value.split("\n").length);
    const lines = document.getElementById("editor-lines");
    const stats = document.getElementById("code-stats");
    if (lines) lines.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
    if (stats) stats.textContent = `${count} ${count === 1 ? "linha" : "linhas"} · ${editor.value.length} caracteres`;
  }

  function showPracticeValidation(lesson, code) {
    state.exerciseDrafts[lesson.id] = code;
    const rubric = PRACTICE_RUBRICS[lesson.id] || [];
    const normalizedCode = normalize(code);
    const changed = code.trim() !== lesson.starter.trim();
    const hasPlaceholders = /(?:\.\.\.|_{4,}|#\s*complete\s+aqui)/i.test(code);
    const results = rubric.map(([label, ...tokens]) => ({
      label,
      passed: tokens.every((requirement) => {
        const alternatives = Array.isArray(requirement) ? requirement : [requirement];
        return alternatives.some((token) => normalizedCode.includes(normalize(token)));
      })
    }));
    results.unshift(
      { label: "Alterou o rascunho inicial", passed: changed },
      { label: "Removeu os placeholders", passed: !hasPlaceholders }
    );
    results.push(...getLessonSpecificChecks(lesson.id, code));
    const passed = results.filter((item) => item.passed).length;
    const enough = results.length > 0 && passed === results.length;
    const panel = document.getElementById("validation-result");
    panel.hidden = false;
    panel.className = `validation-result ${enough ? "success" : "needs-work"}`;
    panel.innerHTML = `
      <div class="validation-head"><div><span>VERIFICAÇÃO ESTRUTURAL</span><strong>${enough ? "Boa base para executar" : "Revise alguns elementos"}</strong></div><b>${passed}/${results.length}</b></div>
      <ul>${results.map((item) => `<li class="${item.passed ? "passed" : ""}"><span>${item.passed ? "✓" : "○"}</span>${escapeHtml(item.label)}</li>`).join("")}</ul>
      <p>Esta análise procura padrões no texto; ela não compila, não executa o código e não substitui um teste no Spark.</p>`;
    saveState();
  }

  function getLessonSpecificChecks(lessonId, code) {
    const normalizedCode = normalize(code);
    if (lessonId === 1) {
      return [
        { label: "Explica o papel do driver", passed: normalizedCode.includes("driver") },
        { label: "Explica o papel dos executors", passed: normalizedCode.includes("executor") }
      ];
    }
    if (lessonId === 2) {
      const tuples = code.match(/\([^()\n]+,[^()\n]+,[^()\n]+\)/g) || [];
      return [{ label: "Inclui pelo menos três produtos", passed: tuples.length >= 3 }];
    }
    if (lessonId === 5) {
      const transformations = normalizedCode.match(/transformation/g) || [];
      const actions = normalizedCode.match(/\baction\b/g) || [];
      return [
        { label: "Marca as três transformations", passed: transformations.length >= 3 },
        { label: "Marca a action", passed: actions.length >= 1 }
      ];
    }
    return [];
  }

  function downloadDraft(lesson, code) {
    const meta = getDraftMetadata(lesson);
    const blob = new Blob([code], { type: `${meta.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = meta.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast(`Arquivo ${meta.extension} preparado.`);
  }

  function getDraftMetadata(lesson) {
    if (lesson.id === 20) {
      return { filename: "aula_20_reflexao.md", extension: ".md", mime: "text/markdown", modeLabel: "REFLEXÃO LOCAL · NÃO É CÓDIGO EXECUTÁVEL" };
    }
    return { filename: `aula_${String(lesson.id).padStart(2, "0")}.py`, extension: ".py", mime: "text/x-python", modeLabel: "RASCUNHO LOCAL · NÃO EXECUTA SPARK" };
  }

  function goToLessonStep(lessonId, target, current) {
    const next = Math.max(0, Math.min(SESSION_STEPS.length - 1, target));
    const editor = document.getElementById("exercise-draft");
    if (editor && current === 3) state.exerciseDrafts[lessonId] = editor.value;
    if (next > current) getChecklist(lessonId)[current] = true;
    state.lessonSteps[lessonId] = next;
    markActivity(0);
    saveState();
    renderToday();
    focusRenderedHeading(".session-stage h3");
  }

  function getLessonStep(lessonId) {
    const value = Number(state.lessonSteps[lessonId]);
    return Number.isInteger(value) ? Math.max(0, Math.min(SESSION_STEPS.length - 1, value)) : 0;
  }

  function getLessonRuntime(lessonId) {
    if (LESSON_RUNTIME_NOTES[lessonId]) return LESSON_RUNTIME_NOTES[lessonId];
    if (state.preferredEnvironment === "local") {
      return { environment: "local", label: "PySpark local", note: "Execute com o ambiente virtual e o JDK 17 configurados conforme os Primeiros passos." };
    }
    return { environment: "databricks", label: "Databricks Free Edition", note: "Cole em um notebook Python conectado ao compute Serverless; a variável spark já estará disponível." };
  }

  function openSetupForLesson(lesson) {
    const required = LESSON_RUNTIME_NOTES[lesson.id]?.environment;
    if (["databricks", "local"].includes(required) && state.preferredEnvironment !== required) {
      state.preferredEnvironment = required;
      state.environmentReady = false;
      saveState();
    }
    setView("setup");
  }

  function focusRenderedHeading(selector) {
    window.setTimeout(() => {
      const heading = els.container.querySelector(selector);
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }, 0);
  }

  function renderSetup() {
    const environment = state.preferredEnvironment;
    els.container.innerHTML = `
      <div class="setup-page view-stack route-enter">
        <section class="card setup-hero">
          <div>
            <span class="eyebrow">SPARK REAL, SEM ATALHOS ENGANOSOS</span>
            <h2>Escolha onde executar seus exercícios</h2>
            <p>Este app organiza o estudo e valida a estrutura do rascunho. A execução acontece no Databricks Free Edition ou numa instalação local do PySpark.</p>
            <div class="setup-version"><span>Conteúdo verificado em 15/07/2026</span><strong>PySpark 4.2.0 · Python 3.10+ · Java 17 recomendado</strong></div>
          </div>
          <img src="assets/apache-spark-logo-trademark.png" width="280" height="141" alt="Apache Spark" />
        </section>

        <section class="card execution-explainer">
          <div class="execution-flow" aria-label="Fluxo da prática">
            <div><span>1</span><strong>Mentor de Dados</strong><small>explica e prepara</small></div><b aria-hidden="true">→</b>
            <div><span>2</span><strong>Databricks ou PC</strong><small>executa o código</small></div><b aria-hidden="true">→</b>
            <div><span>3</span><strong>Apache Spark</strong><small>processa os dados</small></div>
          </div>
          <p><strong>Por que não há um “compilador Spark” embutido?</strong> Um executor Python leve no navegador não reproduz a JVM, o planejamento e o runtime distribuído do Spark. Mantemos o app rápido e ensinamos a usar um ambiente verdadeiro.</p>
        </section>

        <section class="setup-choice" aria-labelledby="environment-title">
          <div class="section-heading"><div><span class="eyebrow">PASSO 1</span><h3 id="environment-title">Como você quer começar?</h3></div></div>
          <div class="environment-cards">
            <button class="card environment-card ${environment === "databricks" ? "selected" : ""}" data-environment="databricks" aria-pressed="${environment === "databricks"}">
              <span class="recommendation-badge">RECOMENDADO</span><span class="environment-icon" aria-hidden="true">☁</span><strong>Databricks Free Edition</strong><span class="environment-description">Funciona no navegador, sem instalar Java ou Python. Ideal para seguir a trilha.</span><span class="environment-meta">Gratuito para aprendizado · sujeito a cotas</span>
            </button>
            <button class="card environment-card ${environment === "local" ? "selected" : ""}" data-environment="local" aria-pressed="${environment === "local"}">
              <span class="environment-icon" aria-hidden="true">⌘</span><strong>PySpark local no Windows</strong><span class="environment-description">Bom para estudar offline e controlar seus arquivos. Exige Python e JDK.</span><span class="environment-meta">Open source · usa os recursos do seu PC</span>
            </button>
          </div>
        </section>

        ${environment === "databricks" ? renderDatabricksSetup() : renderLocalSetup()}

        <section class="card setup-ready ${state.environmentReady ? "is-ready" : ""}">
          <div><span class="setup-ready-icon">${state.environmentReady ? "✓" : "→"}</span><div><h3>${state.environmentReady ? "Ambiente marcado como pronto" : "Terminou o teste?"}</h3><p>Essa confirmação fica apenas neste navegador e pode ser alterada depois.</p></div></div>
          <div class="setup-ready-actions"><button class="secondary-button" id="environment-ready">${state.environmentReady ? "Marcar como não pronto" : "Marcar ambiente como pronto"}</button><button class="primary-button" id="start-first-lesson">Ir para a aula atual →</button></div>
        </section>

        <p class="trademark-note">Apache Spark, Spark e o logotipo Apache Spark são marcas da Apache Software Foundation. Este projeto educacional é independente e não é endossado pela ASF.</p>
      </div>`;

    document.querySelectorAll("[data-environment]").forEach((button) => {
      button.addEventListener("click", () => {
        state.preferredEnvironment = button.dataset.environment;
        state.environmentReady = false;
        saveState();
        renderSetup();
        focusRenderedHeading(".setup-guide h3");
      });
    });
    document.getElementById("environment-ready").addEventListener("click", () => {
      state.environmentReady = !state.environmentReady;
      saveState();
      toast(state.environmentReady ? "Ambiente registrado como pronto." : "Status do ambiente atualizado.");
      renderSetup();
      focusRenderedHeading(".setup-ready h3");
    });
    document.getElementById("start-first-lesson").addEventListener("click", () => setView("today"));
    bindCopyButtons();
  }

  function renderDatabricksSetup() {
    return `
      <section class="card setup-guide">
        <div class="setup-guide-head"><div><span class="eyebrow">PASSO 2 · OPÇÃO RECOMENDADA</span><h3>Seu primeiro notebook no Databricks</h3><p>Não instale nada. Use somente dados sintéticos, públicos ou não sensíveis.</p></div><a class="secondary-button link-button" href="https://docs.databricks.com/aws/en/getting-started/free-edition" target="_blank" rel="noreferrer">Abrir guia oficial ↗</a></div>
        <ol class="numbered-setup">
          <li><span>1</span><div><strong>Crie uma conta Free Edition</strong><p>Use um e-mail pessoal e conclua a criação do workspace gratuito.</p></div></li>
          <li><span>2</span><div><strong>Abra New → Notebook</strong><p>Escolha Python. O notebook deve se conectar automaticamente ao compute Serverless.</p></div></li>
          <li><span>3</span><div><strong>Execute a primeira célula</strong><p>A variável <code>spark</code> já existe; não crie outra SparkSession.</p></div></li>
        </ol>
        <div class="setup-code-grid">
          ${renderSetupCode("CÉLULA PYTHON", `vendas = spark.createDataFrame(\n    [(1, "Sul", 100.0), (2, "Sudeste", 250.0), (3, "Sul", 150.0)],\n    ["id", "regiao", "valor"],\n)\n\nvendas.show()\nvendas.createOrReplaceTempView("vendas")`, "setup-dbx-python")}
          ${renderSetupCode("CÉLULA SQL", `%sql\nSELECT regiao, SUM(valor) AS faturamento\nFROM vendas\nGROUP BY regiao\nORDER BY faturamento DESC`, "setup-dbx-sql")}
        </div>
        <div class="setup-success"><strong>Resultado esperado:</strong> uma tabela com <em>Sudeste = 250</em> e <em>Sul = 250</em>. Se apareceu, seu ambiente está pronto.</div>
        <div class="limitations-grid"><article><strong>O que funciona bem</strong><p>DataFrames, Spark SQL, Delta gerenciado e notebooks Python.</p></article><article><strong>Limites da conta gratuita</strong><p>Cotas diárias, uso não comercial, somente serverless, sem APIs RDD e sem cache de DataFrame.</p></article></div>
      </section>`;
  }

  function renderLocalSetup() {
    return `
      <section class="card setup-guide">
        <div class="setup-guide-head"><div><span class="eyebrow">PASSO 2 · WINDOWS LOCAL</span><h3>Python + JDK 17 + PySpark</h3><p>O pacote PySpark já traz o necessário para DataFrames e Spark SQL; não use tutoriais antigos com winutils.</p></div><a class="secondary-button link-button" href="https://spark.apache.org/docs/latest/api/python/getting_started/install.html" target="_blank" rel="noreferrer">Instalação oficial ↗</a></div>
        <ol class="numbered-setup">
          <li><span>1</span><div><strong>Instale Python 3.10 ou superior</strong><p>Marque a opção de adicionar o Python ao PATH. Depois, abra um novo PowerShell.</p><a href="https://www.python.org/downloads/windows/" target="_blank" rel="noreferrer">Downloads oficiais do Python ↗</a></div></li>
          <li><span>2</span><div><strong>Instale um JDK 17</strong><p>O Spark 4.2 aceita Java 17, 21 ou 25; o JDK 17 é a escolha conservadora para a trilha.</p><a href="https://adoptium.net/temurin/releases/?version=17" target="_blank" rel="noreferrer">Eclipse Temurin 17 ↗</a></div></li>
          <li><span>3</span><div><strong>Baixe e extraia o kit inicial</strong><p>Abra a pasta <code>starter</code> extraída e inicie o PowerShell dentro dela. Assim, os comandos encontrarão todos os arquivos.</p></div></li>
        </ol>
        <div class="starter-kit">
          <div><span class="eyebrow">KIT INICIAL INCLUÍDO</span><h4>Baixe tudo na mesma pasta</h4><p>O ZIP contém o projeto completo. Depois de extrair, entre em <strong>mentor-de-dados-main\starter</strong>. Nos downloads individuais, salve ou mova os três arquivos para uma única pasta.</p></div>
          <div class="starter-links"><a class="primary-button link-button" href="https://github.com/jvvtr/mentor-de-dados/archive/refs/heads/main.zip">Baixar kit completo .zip</a><a class="secondary-button link-button" href="starter/verificar_ambiente.py" download>Verificador .py</a><a class="secondary-button link-button" href="starter/laboratorio_vendas.py" download>Laboratório .py</a><a class="secondary-button link-button" href="starter/requirements.txt" download>requirements.txt</a><a class="ghost-button link-button" href="https://github.com/jvvtr/mentor-de-dados/blob/main/starter/README.md" target="_blank" rel="noreferrer">Ler instruções</a></div>
        </div>
        ${renderSetupCode("POWERSHELL · DENTRO DA PASTA starter", `py --version\njava -version\n\npy -m venv .venv\n.\\.venv\\Scripts\\python.exe -m pip install --upgrade pip\n.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt\n.\\.venv\\Scripts\\python.exe verificar_ambiente.py\n.\\.venv\\Scripts\\python.exe laboratorio_vendas.py`, "setup-local-powershell")}
        <details class="troubleshooting"><summary>Java foi instalado, mas o comando não foi encontrado</summary><p>Confirme o caminho real do JDK e ajuste somente a sessão atual:</p><pre><code>$env:JAVA_HOME = "C:\\caminho\\para\\jdk-17"\n$env:Path = "$env:JAVA_HOME\\bin;$env:Path"\njava -version</code></pre></details>
      </section>`;
  }

  function renderSetupCode(label, code, id) {
    return `<div class="setup-code"><header><span>${escapeHtml(label)}</span><button class="code-copy" data-copy-target="${id}">Copiar</button></header><pre><code id="${id}">${escapeHtml(code)}</code></pre></div>`;
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
        text: `Olá, ${getFirstName()}! Sou o tutor local do Mentor de Dados. Posso explicar os conceitos centrais da trilha e sempre tento relacioná-los a SQL, Power BI e Databricks.\n\nExperimente uma das perguntas rápidas ou escreva algo como “o que é shuffle?”.`
      }];
      saveState();
    }

    els.container.innerHTML = `
      <section class="card tutor-shell">
        <header class="tutor-header">
          <div class="tutor-avatar" aria-hidden="true">✦</div>
          <div>
            <h3>Tutor de Dados</h3>
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
    return `<div class="message ${message.role === "user" ? "user" : "tutor"}">${message.role === "tutor" ? '<span class="message-meta">Tutor de Dados</span>' : ""}${escapeHtml(message.text)}</div>`;
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
      scheduleStateSave();
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
    const selected = answered && index === quizState.selected;
    let className = "";
    if (selected) className = index === lesson.quiz.correct ? "correct" : "wrong";
    if (answered && index === lesson.quiz.correct && quizState.selected !== lesson.quiz.correct) className = "correct";
    const resultLabel = answered ? (index === lesson.quiz.correct ? " Resposta correta." : selected ? " Resposta selecionada, incorreta." : "") : "";
    return `
      <button class="quiz-option ${className}" aria-pressed="${selected}" aria-label="${escapeAttr(`${String.fromCharCode(65 + index)}: ${option}.${resultLabel}`)}" data-option="${index}">
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
      button.setAttribute("aria-pressed", String(index === selected));
      const resultLabel = index === lesson.quiz.correct ? " Resposta correta." : index === selected ? " Resposta selecionada, incorreta." : "";
      button.setAttribute("aria-label", `${String.fromCharCode(65 + index)}: ${lesson.quiz.options[index]}.${resultLabel}`);
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

  function switchCodeTab(name, focus = false) {
    document.querySelectorAll("[data-code-tab]").forEach((tab) => {
      const active = tab.dataset.codeTab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    const sqlPanel = document.getElementById("code-sql");
    const pysparkPanel = document.getElementById("code-pyspark");
    if (sqlPanel) sqlPanel.hidden = name !== "sql";
    if (pysparkPanel) pysparkPanel.hidden = name !== "pyspark";
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

      const now = Date.now();
      const elapsed = Math.floor((now - timer.updatedAt) / 1000);
      if (elapsed < 1) return;
      const studied = Math.min(elapsed, timer.remaining);
      timer.remaining = Math.max(0, timer.remaining - elapsed);
      timer.updatedAt = now;
      state.totalStudySeconds += studied;
      const key = dateKey(new Date());
      state.studySeconds[key] = (state.studySeconds[key] || 0) + studied;

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
    const lessonId = activeTimerLessonId;
    if (lessonId !== null) {
      const timer = getTimer(lessonId);
      timer.running = false;
      state.timers[lessonId] = timer;
    }
    stopTimerInterval();
    if (updateUi && lessonId !== null) updateTimerUI(lessonId);
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
    if (face) face.style.setProperty("--timer-progress", `${progress}%`);
    if (toggle) toggle.textContent = timer.running ? "Pausar" : timer.remaining === 0 ? "Recomeçar" : "Iniciar";
    if (status) {
      status.textContent = timer.remaining === 0 ? "Finalizada" : timer.running ? "Em andamento" : timer.remaining === TOTAL_SECONDS ? "Pronta" : "Pausada";
      status.classList.toggle("done", timer.remaining === 0);
    }
    if (steps) steps.innerHTML = renderRoutineSteps(timer.remaining);
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
    timer.updatedAt = Number.isFinite(timer.updatedAt) ? timer.updatedAt : Date.now();
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
    const collapseLabel = state.sidebarCollapsed ? "Expandir menu" : "Recolher menu";
    els.sidebarCollapse.setAttribute("aria-label", collapseLabel);
    els.sidebarCollapse.title = collapseLabel;
    els.sidebarCollapse.textContent = state.sidebarCollapsed ? "›" : "‹";
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
    safe.lessonSteps = input.lessonSteps && typeof input.lessonSteps === "object" ? input.lessonSteps : {};
    Object.keys(safe.lessonSteps).forEach((lessonId) => {
      const step = Number(safe.lessonSteps[lessonId]);
      safe.lessonSteps[lessonId] = Number.isInteger(step) ? Math.max(0, Math.min(SESSION_STEPS.length - 1, step)) : 0;
    });
    safe.preferredEnvironment = ["databricks", "local"].includes(input.preferredEnvironment) ? input.preferredEnvironment : "databricks";
    safe.environmentReady = Boolean(input.environmentReady);
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

  function scheduleStateSave(afterSave, delay = 450) {
    if (pendingSaveTimer) window.clearTimeout(pendingSaveTimer);
    pendingSaveTimer = window.setTimeout(() => {
      saveState();
      pendingSaveTimer = null;
      if (typeof afterSave === "function") afterSave();
    }, delay);
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }
})();
