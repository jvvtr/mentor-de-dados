(function semanticLabClient(global) {
  "use strict";

  const DEFAULT_TIMEOUT_MS = 20_000;
  const INIT_TIMEOUT_MS = 120_000;
  const scriptURL = global.document?.currentScript?.src || global.location?.href || "http://localhost/runtime/semantic-client.js";
  const defaultWorkerURL = new URL("semantic-worker.js", scriptURL).href;
  const pending = new Map();
  let worker = null;
  let initPromise = null;
  let initialized = false;
  let sequence = 0;
  let configuration = {};

  function nextId(prefix) {
    sequence += 1;
    return `${prefix}-${Date.now().toString(36)}-${sequence}`;
  }

  function createWorker() {
    if (worker) return worker;
    const workerURL = configuration.workerURL || defaultWorkerURL;
    worker = new Worker(workerURL, { type: "module", name: "mentor-semantic-lab" });
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleWorkerError);
    worker.addEventListener("messageerror", handleWorkerError);
    return worker;
  }

  function handleMessage(event) {
    const message = event.data || {};
    const request = pending.get(message.id);
    if (!request) return;
    if (message.type === "progress") {
      try {
        request.onProgress?.(message.progress);
      } catch (_) {
        // Erros da camada visual não podem interromper o runtime.
      }
      return;
    }
    if (message.type !== "result") return;
    clearTimeout(request.timer);
    pending.delete(message.id);
    request.resolve(message.payload);
  }

  function handleWorkerError(event) {
    const error = Object.assign(
      new Error(event?.message || "O Worker do laboratório foi interrompido."),
      { code: "E-WORKER-001" }
    );
    terminateWorker(error);
  }

  function terminateWorker(error) {
    if (worker) {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleWorkerError);
      worker.removeEventListener("messageerror", handleWorkerError);
      worker.terminate();
    }
    worker = null;
    initialized = false;
    initPromise = null;
    pending.forEach((request) => {
      clearTimeout(request.timer);
      if (error) request.reject(error);
      else request.resolve({ status: "ok", reset: true });
    });
    pending.clear();
  }

  function request(op, payload, options = {}) {
    const activeWorker = createWorker();
    const id = nextId(op);
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
      const timer = global.setTimeout(() => {
        const error = Object.assign(
          new Error(`O laboratório excedeu o limite de ${Math.round(timeoutMs / 1000)} segundos e foi reiniciado.`),
          { code: "E-TIMEOUT-001" }
        );
        terminateWorker(error);
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer, onProgress: options.onProgress });
      activeWorker.postMessage({ id, op, payload, config: configuration });
    });
  }

  function ensureInitialized(onProgress) {
    if (initialized) return Promise.resolve();
    if (!initPromise) {
      initPromise = request("init", {}, { timeoutMs: INIT_TIMEOUT_MS, onProgress })
        .then((result) => {
          if (result?.status !== "ok") {
            const diagnostic = result?.diagnostics?.[0];
            throw Object.assign(
              new Error(diagnostic?.message || "Não foi possível inicializar o laboratório."),
              { code: diagnostic?.code || "E-INIT-001" }
            );
          }
          initialized = true;
          return result;
        })
        .catch((error) => {
          initPromise = null;
          throw error;
        });
    }
    return initPromise;
  }

  async function run(payload, options = {}) {
    if (!payload || typeof payload.code !== "string") {
      throw Object.assign(new TypeError("SemanticLab.run exige um payload com o campo code."), { code: "E-PROTOCOL-002" });
    }
    await ensureInitialized(options.onProgress);
    return request("run", payload, {
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      onProgress: options.onProgress
    });
  }

  async function reset() {
    if (!worker) {
      terminateWorker();
      return { status: "ok", reset: true };
    }
    // Um Worker ocupado com Python síncrono não consegue receber cancelamento
    // a tempo. O encerramento é o mecanismo confiável; a mensagem reset fica
    // como melhor esforço para Workers ociosos e para testes de protocolo.
    try {
      worker.postMessage({ id: nextId("reset"), op: "reset", payload: {}, config: configuration });
    } catch (_) {
      // O Worker será encerrado logo abaixo de qualquer forma.
    }
    const cancellation = Object.assign(new Error("Execução interrompida pelo usuário."), { code: "E-CANCEL-001" });
    terminateWorker(cancellation);
    return { status: "ok", reset: true };
  }

  function configure(options = {}) {
    if (worker) throw new Error("Configure o laboratório antes da primeira execução.");
    configuration = { ...configuration, ...options };
  }

  global.SemanticLab = Object.freeze({
    version: "0.1.0",
    init(options = {}) {
      const { onProgress, ...runtimeOptions } = options;
      configure(runtimeOptions);
      return ensureInitialized(options.onProgress);
    },
    run,
    reset,
    configure
  });
})(window);
