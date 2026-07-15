import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const fixture = JSON.parse(await readFile(new URL("../fixtures/sales.json", import.meta.url), "utf8"));

test("fixture padrão possui schemas consistentes e arquivos virtuais válidos", () => {
  assert.equal(fixture.version, "sales-v1");
  assert.ok(Object.keys(fixture.tables).length >= 8);
  for (const [name, table] of Object.entries(fixture.tables)) {
    const width = Object.keys(table.schema).length;
    assert.ok(width > 0, `${name} precisa de colunas`);
    for (const row of table.rows) assert.equal(row.length, width, `${name} possui linha incompatível`);
  }
  for (const tableName of Object.values(fixture.virtualFiles)) {
    assert.ok(fixture.tables[tableName], `arquivo virtual aponta para ${tableName}, que não existe`);
  }
});
