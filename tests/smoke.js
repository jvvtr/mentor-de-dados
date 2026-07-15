const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const readProductFile = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const curriculumSource = readProductFile("curriculum.js");
const appSource = readProductFile("app.js");
const indexSource = readProductFile("index.html");
const stylesSource = readProductFile("styles.css");

const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(curriculumSource, dataContext, { filename: "curriculum.js" });
const data = dataContext.window.SPARK_MENTOR_DATA;

assert(Boolean(data), "curriculum.js deve expor SPARK_MENTOR_DATA");
assert(data?.lessons.length === 20, "A trilha deve ter 20 aulas");
assert(data?.weekInfo.length === 4, "A trilha deve ter quatro semanas");
assert(data?.routine.length === 6, "A rotina deve ter seis blocos");
assert(
  JSON.stringify(data?.routine.map((item) => item.minutes)) === JSON.stringify([5, 10, 10, 15, 15, 5]),
  "A rotina deve seguir 5/10/10/15/15/5 minutos"
);
assert(data?.routine.reduce((sum, item) => sum + item.minutes, 0) === 60, "A rotina deve somar 60 minutos");
assert(new Set(data?.lessons.map((lesson) => lesson.id)).size === 20, "IDs das aulas devem ser únicos");

for (const lesson of data?.lessons || []) {
  const prefix = "Aula " + lesson.id + ": ";
  assert(Boolean(lesson.title && lesson.subtitle && lesson.objective && lesson.intro && lesson.analogy), prefix + "conteúdo principal ausente");
  assert(lesson.concepts?.length >= 4, prefix + "menos de quatro conceitos");
  assert(Boolean(lesson.sql && lesson.pyspark), prefix + "comparação SQL/PySpark ausente");
  assert(Boolean(lesson.exercise && lesson.starter && lesson.hint && lesson.solution), prefix + "prática incompleta");
  assert(lesson.quiz?.options.length === 4, prefix + "quiz inválido");

  assert(["pyspark", "reflection"].includes(lesson.practiceMode), prefix + "practiceMode inválido");
  assert(typeof lesson.sqlStarter === "string" && lesson.sqlStarter.trim().length > 0, prefix + "sqlStarter ausente");
  assert(typeof lesson.sqlSolution === "string" && lesson.sqlSolution.trim().length > 0, prefix + "sqlSolution ausente");
  assert(Boolean(lesson.assessment && typeof lesson.assessment === "object"), prefix + "assessment ausente");
  assert(Array.isArray(lesson.assessment?.checks) && lesson.assessment.checks.length > 0, prefix + "checks de avaliação ausentes");

  assert(Boolean(lesson.expected && typeof lesson.expected === "object"), prefix + "expected ausente");
  assert(Array.isArray(lesson.expected?.columns), prefix + "expected.columns inválido");
  assert(Array.isArray(lesson.expected?.rows), prefix + "expected.rows inválido");
  assert(typeof lesson.expected?.ordered === "boolean", prefix + "expected.ordered inválido");
  for (const [rowIndex, row] of (lesson.expected?.rows || []).entries()) {
    assert(Array.isArray(row), prefix + "linha esperada " + rowIndex + " não é uma lista");
    assert(row.length === lesson.expected.columns.length, prefix + "linha esperada " + rowIndex + " não corresponde às colunas");
  }

  assert(Array.isArray(lesson.tables), prefix + "tables deve ser uma lista");
  for (const table of lesson.tables || []) {
    assert(typeof table.name === "string" && table.name.length > 0, prefix + "tabela sem nome");
    assert(Array.isArray(table.columns) && table.columns.length > 0, prefix + "tabela " + table.name + " sem colunas");
    assert(Array.isArray(table.rows), prefix + "tabela " + table.name + " sem linhas");
    for (const [rowIndex, row] of (table.rows || []).entries()) {
      assert(Array.isArray(row) && row.length === table.columns.length, prefix + "fixture " + table.name + "/" + rowIndex + " inválida");
    }
  }

  assert(Array.isArray(lesson.sources) && lesson.sources.length >= 2, prefix + "fontes insuficientes");
  for (const source of lesson.sources || []) {
    assert(Boolean(source.label && source.type), prefix + "fonte sem rótulo ou tipo");
    assert(/^https:\/\/.+/i.test(source.url || ""), prefix + "fonte sem URL HTTPS");
  }

  if (lesson.practiceMode === "pyspark") {
    assert(/\b(?:resultado|df)\s*=/.test(lesson.starter), prefix + "starter não expõe resultado ou df");
    assert(/\b(?:resultado|df)\s*=/.test(lesson.solution), prefix + "solução não expõe resultado ou df");
    assert(lesson.expected.columns.length > 0, prefix + "prática executável sem colunas esperadas");
  }
}

const reflectionLessons = (data?.lessons || []).filter((lesson) => lesson.practiceMode === "reflection");
assert(reflectionLessons.length === 1 && reflectionLessons[0].id === 20, "Somente a aula 20 deve usar practiceMode reflection");

function collectProductTextFiles(directory, relative = "") {
  const ignoredDirectories = new Set([".git", "node_modules", "tests"]);
  const textExtensions = new Set([".js", ".html", ".css", ".md", ".py", ".json", ".txt"]);
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const childRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...collectProductTextFiles(path.join(directory, entry.name), childRelative));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(childRelative);
    }
  }
  return files;
}

const forbiddenProductReferences = [];
for (const relativePath of collectProductTextFiles(root)) {
  const contents = readProductFile(relativePath);
  if (/power\s*bi|power\s*query/i.test(contents)) forbiddenProductReferences.push(relativePath);
}
assert(
  forbiddenProductReferences.length === 0,
  "Arquivos de produto ainda mencionam Power BI/Power Query: " + forbiddenProductReferences.join(", ")
);

const requiredFiles = [
  "index.html", "styles.css", "curriculum.js", "app.js", "README.md",
  "assets/app-icon.svg", "assets/apache-spark-logo-trademark.png",
  "assets/spark-sql-analytics-icon.svg", "assets/spark-data-scale-icon.svg",
  "starter/README.md", "starter/requirements.txt",
  "starter/verificar_ambiente.py", "starter/laboratorio_vendas.py",
  "docs/LABORATORIO_SEMANTICO.md", "docs/COMPATIBILIDADE.md",
  "runtime/semantic-client.js", "runtime/semantic-worker.js",
  "runtime/semantic_engine.py", "runtime/mentor_ast_policy.py",
  "runtime/fixtures/sales.json"
];

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  assert(fs.existsSync(fullPath), "Arquivo ausente: " + file);
  if (fs.existsSync(fullPath)) assert(fs.statSync(fullPath).size > 0, "Arquivo vazio: " + file);
}

const semanticClientPath = path.join(root, "runtime", "semantic-client.js");
if (fs.existsSync(semanticClientPath)) {
  const semanticClientSource = fs.readFileSync(semanticClientPath, "utf8");
  assert(semanticClientSource.includes("new Worker"), "semantic-client deve criar o Worker sob demanda");
  assert(/20_?000/.test(semanticClientSource), "semantic-client deve declarar timeout padrão de 20 segundos");

  let workerCreations = 0;
  class WorkerStub {
    constructor() { workerCreations += 1; }
    addEventListener() {}
    removeEventListener() {}
    postMessage() {}
    terminate() {}
  }
  const clientWindow = {
    document: { currentScript: { src: "http://localhost/runtime/semantic-client.js" } },
    location: { href: "http://localhost/" },
    setTimeout,
    clearTimeout
  };
  const clientContext = { window: clientWindow, Worker: WorkerStub, URL, Map, Promise, Object, Number, Date, Math, Error, TypeError };
  vm.createContext(clientContext);
  vm.runInContext(semanticClientSource, clientContext, { filename: "semantic-client.js" });
  assert(typeof clientWindow.SemanticLab?.init === "function", "semantic-client deve expor SemanticLab.init");
  assert(typeof clientWindow.SemanticLab?.run === "function", "semantic-client deve expor SemanticLab.run");
  assert(typeof clientWindow.SemanticLab?.reset === "function", "semantic-client deve expor SemanticLab.reset");
  assert(workerCreations === 0, "semantic-client deve criar o Worker somente quando solicitado");
}

const curriculumScriptIndex = indexSource.indexOf("curriculum.js");
const semanticClientScriptIndex = indexSource.indexOf("runtime/semantic-client.js");
const appScriptIndex = indexSource.indexOf("app.js");
assert(semanticClientScriptIndex >= 0, "index.html deve carregar semantic-client.js");
assert(
  curriculumScriptIndex >= 0 && curriculumScriptIndex < semanticClientScriptIndex && semanticClientScriptIndex < appScriptIndex,
  "Scripts devem carregar na ordem curriculum, semantic-client e app"
);

assert(appSource.includes("Laboratório de Semântica Spark"), "UI deve nomear o Laboratório de Semântica Spark");
assert(appSource.includes("window.SemanticLab.run"), "UI deve chamar SemanticLab.run");
assert(appSource.includes("renderSemanticResultMarkup"), "UI deve renderizar o retorno semântico");
assert(appSource.includes('data-practice-mode="pyspark"'), "UI deve oferecer modo PySpark");
assert(appSource.includes('data-practice-mode="sql"'), "UI deve oferecer modo Spark SQL");
assert(!/de 5 blocos|Etapa \$\{stepIndex \+ 1\} de 5/.test(appSource), "UI ainda possui contagem antiga de cinco etapas");
assert(stylesSource.includes(".semantic-warnings"), "CSS dos diagnósticos semânticos ausente");
assert(stylesSource.includes(".result-table-wrap"), "CSS da tabela de resultado ausente");

function createElement(id = "") {
  return {
    id, innerHTML: "", textContent: "", value: "", hidden: false, title: "", tabIndex: 0,
    dataset: {}, style: { width: "", setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, setAttribute() {}, removeAttribute() {}, appendChild() {}, remove() {},
    focus() {}, select() {}, setSelectionRange() {}, querySelector() { return createElement(); }, querySelectorAll() { return []; }
  };
}

function renderView(view, savedState = null) {
  const elements = new Map();
  const getElement = (id) => {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  };
  const storage = new Map();
  if (savedState) storage.set("spark-mentor-state-v1", JSON.stringify(savedState));
  const document = {
    body: createElement("body"), activeElement: createElement("active"), getElementById: getElement,
    querySelectorAll() { return []; }, addEventListener() {}, createElement
  };
  const windowObject = {
    addEventListener() {}, scrollTo() {}, setTimeout() { return 1; }, clearTimeout() {},
    setInterval() { return 1; }, clearInterval() {}, confirm() { return true; },
    SemanticLab: { async run() { return {}; }, reset() {} }
  };
  const context = {
    window: windowObject, document, location: { hash: "#" + view }, history: { replaceState() {} },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    navigator: { clipboard: { writeText: async () => {} } }, console, Date, Math, JSON, String,
    Number, Object, Array, Set, Boolean, RegExp
  };
  vm.createContext(context);
  vm.runInContext(curriculumSource, context, { filename: "curriculum.js" });
  vm.runInContext(appSource, context, { filename: "app.js" });
  return getElement("view-container").innerHTML;
}

for (const view of ["today", "trail", "lab", "setup", "tutor", "glossary", "progress"]) {
  assert(renderView(view).length > 100, "View " + view + " não renderizou");
}

for (let step = 0; step < 6; step += 1) {
  const html = renderView("today", { currentLesson: 1, lessonSteps: { 1: step } });
  assert(html.length > 100, "Etapa " + (step + 1) + " não renderizou");
  assert(html.includes("Etapa " + (step + 1) + " de 6"), "Etapa " + (step + 1) + " não informa a posição correta");
  assert(html.includes("ETAPA " + (step + 1)), "Conteúdo da etapa " + (step + 1) + " ausente");
}

const semanticPracticeHtml = renderView("today", { currentLesson: 1, lessonSteps: { 1: 4 } });
assert(semanticPracticeHtml.includes("Laboratório de Semântica Spark"), "Laboratório semântico não renderizou na etapa 5");
assert(semanticPracticeHtml.includes('data-practice-mode="pyspark"'), "Seletor PySpark não renderizou");
assert(semanticPracticeHtml.includes('data-practice-mode="sql"'), "Seletor Spark SQL não renderizou");
assert(semanticPracticeHtml.includes('id="validate-code"'), "Botão de execução semântica não renderizou");
assert(semanticPracticeHtml.includes('id="validation-result"'), "Painel de resultado semântico não renderizou");
assert(semanticPracticeHtml.includes("Correção automática:"), "Contrato da correção automática não renderizou");
assert(semanticPracticeHtml.includes("Confirme também no Spark real:"), "Revisões manuais não renderizaram");

const sqlPracticeHtml = renderView("today", { currentLesson: 1, lessonSteps: { 1: 4 }, practiceModes: { 1: "sql" } });
assert(sqlPracticeHtml.includes("Uma solução possível em Spark SQL"), "Modo SQL deve mostrar a solução SQL");
assert(sqlPracticeHtml.includes("Baixar .sql"), "Modo SQL deve preparar arquivo .sql");

const staleApprovalHtml = renderView("today", {
  currentLesson: 1,
  lessonSteps: { 1: 4 },
  exerciseDrafts: { 1: "resultado = spark.range(9)" },
  practiceResults: {
    "1:pyspark": {
      practiceMode: "pyspark",
      sourceFingerprint: "stale",
      grade: { passed: true, score: 100, checks: [] },
      runtime: { engine: "TEST" }
    }
  },
  practiceApprovals: { 1: { pyspark: "stale" } },
  practiceDone: { 1: true }
});
assert(!staleApprovalHtml.includes("Resultado aprovado"), "Resultado de código antigo não pode reaparecer");
assert(!/id="practice-done" checked/.test(staleApprovalHtml), "Código alterado não pode manter aprovação automática");

const reflectionHtml = renderView("today", { currentLesson: 20, lessonSteps: { 20: 4 } });
assert(reflectionHtml.includes("Reflexão final"), "Aula 20 deve renderizar a prática reflexiva");
assert(!reflectionHtml.includes('data-practice-mode="sql"'), "A prática reflexiva não deve oferecer seletor de linguagem");

assert(renderView("setup", { preferredEnvironment: "local" }).includes("JDK 17"), "Guia local não renderizou");

if (failures.length) {
  console.error("FALHOU (" + failures.length + ")");
  failures.forEach((failure) => console.error("- " + failure));
  process.exit(1);
}

console.log("OK: currículo, contratos semânticos, runtime e todas as views foram validados.");
