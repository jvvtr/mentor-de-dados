/* global self */
"use strict";

const PYODIDE_VERSION = "314.0.2";
const SQLGLOT_VERSION = "30.8.0";
const SQLFRAME_VERSION = "4.3.0";
const DUCKDB_VERSION = "1.5.1";
const DEFAULT_PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide = null;
let readyPromise = null;
let queue = Promise.resolve();

function postProgress(id, stage, message, percent, detail) {
  self.postMessage({
    type: "progress",
    id,
    progress: { stage, label: message, message, percent, detail }
  });
}

function diagnosticFromError(error) {
  return {
    status: "error",
    diagnostics: [{
      severity: "error",
      code: error?.code || "E-RUNTIME-001",
      message: error?.message || String(error),
      hint: "Reinicie o laboratório. Se o problema continuar, execute o trecho no ambiente PySpark real."
    }],
    warnings: [],
    result: { kind: "none" },
    grade: { passed: false, score: 0, checks: [] },
    passed: false,
    runtime: {
      name: "Laboratório de Semântica Spark",
      engine: "PYODIDE + SQLFRAME + DUCKDB",
      isApacheSpark: false
    }
  };
}

async function fetchText(url, label) {
  const response = await fetch(url, { credentials: "same-origin", cache: "force-cache" });
  if (!response.ok) throw new Error(`Não foi possível carregar ${label} (${response.status}).`);
  return response.text();
}

async function initialize(id, config = {}) {
  if (pyodide) return runtimeRequest({ op: "init" });
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    const baseURL = config.pyodideBaseURL || DEFAULT_PYODIDE_BASE;
    const moduleURL = config.pyodideModuleURL || `${baseURL}pyodide.mjs`;
    const runtimeBase = new URL("./", self.location.href);
    const policyURL = config.policyURL || new URL("mentor_ast_policy.py", runtimeBase).href;
    const engineURL = config.engineURL || new URL("semantic_engine.py", runtimeBase).href;
    const fixturesURL = config.fixturesURL || new URL("fixtures/sales.json", runtimeBase).href;

    postProgress(id, "loader", "Carregando o Python no navegador…", 5, "O primeiro carregamento é maior; os próximos usam o cache do navegador.");
    const [{ loadPyodide }, policySource, engineSource, fixturesSource] = await Promise.all([
      import(moduleURL),
      fetchText(policyURL, "a política do laboratório"),
      fetchText(engineURL, "o núcleo semântico"),
      fetchText(fixturesURL, "os dados de exemplo")
    ]);

    pyodide = await loadPyodide({ indexURL: baseURL });
    postProgress(id, "python", "Python pronto; carregando o motor analítico…", 35, `Pyodide ${PYODIDE_VERSION} em um Worker isolado da interface.`);
    await pyodide.loadPackage(["micropip", "duckdb", "pytz"]);

    postProgress(id, "packages", "Instalando o compilador PySpark educacional…", 60, `SQLGlot ${SQLGLOT_VERSION} e SQLFrame ${SQLFRAME_VERSION}, com versões fixadas.`);
    await pyodide.runPythonAsync(`
import micropip
await micropip.install(["sqlglot==${SQLGLOT_VERSION}", "sqlframe==${SQLFRAME_VERSION}"])
`);

    postProgress(id, "engine", "Preparando schemas e regras de segurança…", 82, `DuckDB ${DUCKDB_VERSION} executará somente fixtures pequenas em memória.`);
    pyodide.FS.writeFile("/home/pyodide/mentor_ast_policy.py", policySource, { encoding: "utf8" });
    pyodide.runPython("import sys\n'/home/pyodide' not in sys.path and sys.path.insert(0, '/home/pyodide')");
    await pyodide.runPythonAsync(engineSource);
    const setFixtures = pyodide.globals.get("mentor_set_fixtures_json");
    try {
      setFixtures(fixturesSource);
    } finally {
      setFixtures.destroy?.();
    }
    postProgress(id, "ready", "Laboratório pronto", 100, "Agora as próximas execuções serão bem mais rápidas.");
    return runtimeRequest({ op: "init" });
  })();

  try {
    return await readyPromise;
  } catch (error) {
    pyodide = null;
    readyPromise = null;
    throw error;
  }
}

function runtimeRequest(payload) {
  if (!pyodide) throw new Error("O runtime Python ainda não foi inicializado.");
  const handler = pyodide.globals.get("mentor_handle_json");
  try {
    const raw = handler(JSON.stringify(payload));
    return JSON.parse(String(raw));
  } finally {
    handler.destroy?.();
  }
}

async function dispatch(message) {
  const { id, op, payload = {}, config = {} } = message;
  try {
    let result;
    if (op === "init") {
      result = await initialize(id, config);
    } else if (op === "run") {
      await initialize(id, config);
      postProgress(id, "validate", "Validando sintaxe e segurança…", 10, "O código é analisado antes de chegar ao interpretador Python.");
      postProgress(id, "compile", "Compilando o plano relacional…", 45, "SQLFrame traduz o subconjunto PySpark e SQLGlot normaliza Spark SQL.");
      result = runtimeRequest({ ...payload, op: "run" });
      postProgress(id, "result", "Resultado calculado localmente", 100, "A execução ocorreu no DuckDB em memória, sem enviar seu código a um servidor.");
    } else if (op === "reset") {
      result = pyodide ? runtimeRequest({ op: "reset" }) : { status: "ok", reset: true };
    } else {
      throw Object.assign(new Error(`Operação desconhecida: ${op}`), { code: "E-PROTOCOL-001" });
    }
    self.postMessage({ type: "result", id, payload: result });
  } catch (error) {
    self.postMessage({ type: "result", id, payload: diagnosticFromError(error) });
  }
}

self.addEventListener("message", (event) => {
  queue = queue.then(() => dispatch(event.data)).catch((error) => {
    self.postMessage({ type: "result", id: event.data?.id, payload: diagnosticFromError(error) });
  });
});
