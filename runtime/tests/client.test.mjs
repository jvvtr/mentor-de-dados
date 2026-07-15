import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const clientSource = await readFile(new URL("../semantic-client.js", import.meta.url), "utf8");

function createHarness({ ignoreRun = false } = {}) {
  const workers = [];
  class MockWorker {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.listeners = new Map();
      this.messages = [];
      this.terminated = false;
      workers.push(this);
    }
    addEventListener(type, listener) {
      const list = this.listeners.get(type) || [];
      list.push(listener);
      this.listeners.set(type, list);
    }
    removeEventListener(type, listener) {
      this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item !== listener));
    }
    emit(type, data) {
      for (const listener of this.listeners.get(type) || []) listener({ data });
    }
    postMessage(message) {
      this.messages.push(message);
      if (message.op === "run" && ignoreRun) return;
      queueMicrotask(() => {
        this.emit("message", {
          type: "progress",
          id: message.id,
          progress: { stage: message.op, message: `progress-${message.op}` }
        });
        this.emit("message", {
          type: "result",
          id: message.id,
          payload: message.op === "run"
            ? { status: "ok", grade: { passed: true, score: 100 }, result: { kind: "table", rows: [] } }
            : { status: "ok", reset: message.op === "reset" }
        });
      });
    }
    terminate() {
      this.terminated = true;
    }
  }

  const window = {
    document: { currentScript: { src: "https://example.test/runtime/semantic-client.js" } },
    location: { href: "https://example.test/" },
    setTimeout,
    clearTimeout
  };
  const context = vm.createContext({
    window,
    Worker: MockWorker,
    URL,
    Error,
    TypeError,
    Object,
    Promise,
    Date,
    Number,
    Math,
    setTimeout,
    clearTimeout,
    queueMicrotask
  });
  vm.runInContext(clientSource, context, { filename: "semantic-client.js" });
  return { lab: window.SemanticLab, workers };
}

test("cria o Worker de forma lazy, correlaciona mensagens e encerra no reset", async () => {
  const { lab, workers } = createHarness();
  assert.equal(workers.length, 0);
  const progress = [];
  const result = await lab.run(
    { mode: "sql", code: "SELECT 1" },
    { onProgress: (item) => progress.push(item.stage) }
  );
  assert.equal(result.grade.passed, true);
  assert.equal(workers.length, 1);
  assert.deepEqual(workers[0].messages.map((message) => message.op), ["init", "run"]);
  assert.deepEqual(progress, ["init", "run"]);
  await lab.reset();
  assert.equal(workers[0].terminated, true);
});

test("interrompe e recria o Worker quando a execução ultrapassa o timeout", async () => {
  const { lab, workers } = createHarness({ ignoreRun: true });
  await assert.rejects(
    lab.run({ mode: "sql", code: "SELECT 1" }, { timeoutMs: 5 }),
    (error) => error.code === "E-TIMEOUT-001"
  );
  assert.equal(workers[0].terminated, true);
});

test("valida o payload antes de inicializar o runtime", async () => {
  const { lab, workers } = createHarness();
  await assert.rejects(lab.run({ mode: "sql" }), (error) => error.code === "E-PROTOCOL-002");
  assert.equal(workers.length, 0);
});
