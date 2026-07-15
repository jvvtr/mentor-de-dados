const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const curriculumSource = fs.readFileSync(path.join(root, "curriculum.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(curriculumSource, dataContext, { filename: "curriculum.js" });
const data = dataContext.window.SPARK_MENTOR_DATA;

assert(Boolean(data), "curriculum.js deve expor SPARK_MENTOR_DATA");
assert(data?.lessons.length === 20, "A trilha deve ter 20 aulas");
assert(data?.weekInfo.length === 4, "A trilha deve ter quatro semanas");
assert(data?.routine.reduce((sum, item) => sum + item.minutes, 0) === 60, "A rotina deve somar 60 minutos");
assert(new Set(data?.lessons.map((lesson) => lesson.id)).size === 20, "IDs das aulas devem ser únicos");

for (const lesson of data?.lessons || []) {
  assert(Boolean(lesson.title && lesson.objective && lesson.intro), `Aula ${lesson.id}: conteúdo principal ausente`);
  assert(lesson.concepts?.length >= 4, `Aula ${lesson.id}: menos de quatro conceitos`);
  assert(Boolean(lesson.sql && lesson.pyspark), `Aula ${lesson.id}: comparação SQL/PySpark ausente`);
  assert(Boolean(lesson.exercise && lesson.starter && lesson.solution), `Aula ${lesson.id}: prática incompleta`);
  assert(lesson.quiz?.options.length === 4, `Aula ${lesson.id}: quiz inválido`);
}

assert(!curriculumSource.includes(".rdd"), "O currículo não deve depender de APIs RDD");
assert(curriculumSource.includes("spark_partition_id"), "Aula de partições deve ser compatível com serverless");
assert(curriculumSource.includes("saveAsTable"), "Aula Delta deve usar tabela gerenciada");
assert(appSource.includes("Alterou o rascunho inicial"), "Validação deve exigir alteração do starter");
assert(appSource.includes("openSetupForLesson"), "Aula deve abrir o ambiente de execução adequado");

for (const file of [
  "index.html", "styles.css", "curriculum.js", "app.js", "README.md",
  "assets/app-icon.svg", "assets/apache-spark-logo-trademark.png",
  "assets/spark-sql-analytics-icon.svg", "assets/spark-data-scale-icon.svg",
  "starter/README.md", "starter/requirements.txt",
  "starter/verificar_ambiente.py", "starter/laboratorio_vendas.py"
]) {
  const fullPath = path.join(root, file);
  assert(fs.existsSync(fullPath), `Arquivo ausente: ${file}`);
  if (fs.existsSync(fullPath)) assert(fs.statSync(fullPath).size > 0, `Arquivo vazio: ${file}`);
}

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
    setInterval() { return 1; }, clearInterval() {}, confirm() { return true; }
  };
  const context = {
    window: windowObject, document, location: { hash: `#${view}` }, history: { replaceState() {} },
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
  assert(renderView(view).length > 100, `View ${view} não renderizou`);
}
for (let step = 0; step < 5; step += 1) {
  assert(renderView("today", { currentLesson: 1, lessonSteps: { 1: step } }).length > 100, `Etapa ${step + 1} não renderizou`);
}
assert(renderView("setup", { preferredEnvironment: "local" }).includes("JDK 17"), "Guia local não renderizou");

if (failures.length) {
  console.error(`FALHOU (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OK: currículo, arquivos e todas as views foram validados.");
