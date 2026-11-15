import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const domain of ['work', 'life']) {
  const path = `knowledge/product/scenario-bases/${domain}.json`;
  const base = JSON.parse(readFileSync(path, 'utf8'));
  const nodes = new Map(base.nodes.map((node) => [node.id, node]));
  assert.equal(nodes.size, base.nodes.length, `${domain}: duplicate node IDs`);
  const scenarios = base.nodes.filter((node) => node.type === 'scenario_result');
  const roots = scenarios.filter((node) => node.level === 1);
  const children = scenarios.filter((node) => node.level === 2);
  assert.equal(roots.length, 20);
  assert.equal(children.length, domain === 'work' ? 103 : 106);
  assert.equal(base.nodes.filter((node) => node.type === 'need').length, 5);
  assert.equal(base.executionInstances.length, 0);
  assert.equal(base.alliances.length, 0);
  const prefix = domain === 'work' ? 'SC-W-' : 'SC-L-';
  const adjacency = new Map();
  const edgeKeys = new Set();
  for (const edge of base.edges) {
    assert.ok(nodes.has(edge.from) && nodes.has(edge.to), `${domain}: dangling edge`);
    const key = `${edge.type}:${edge.from}:${edge.to}`;
    assert.ok(!edgeKeys.has(key), `${domain}: duplicate edge ${key}`);
    edgeKeys.add(key);
    assert.notEqual(edge.from, edge.to);
    if (edge.type === 'decomposes_to') {
      const parent = nodes.get(edge.from);
      const child = nodes.get(edge.to);
      assert.equal(parent.type, 'scenario_result');
      assert.equal(child.type, 'scenario_result');
      assert.equal(child.level, parent.level + 1);
      assert.equal(child.parentId, parent.id);
      assert.ok(parent.children.includes(child.id));
      adjacency.set(parent.id, [...(adjacency.get(parent.id) ?? []), child.id]);
    }
    if (['supports', 'optional_support', 'candidate_reuse'].includes(edge.type)) {
      assert.equal(edge.status, 'proposed');
      assert.equal(edge.autoCreateAlliance, false);
      assert.equal(edge.causalityProven, false);
      assert.ok(edge.conditions.length > 0);
      assert.ok(edge.from.startsWith(prefix) && edge.to.startsWith(prefix));
    }
  }
  const active = new Set();
  const visited = new Set();
  function visit(id) {
    assert.ok(!active.has(id), `${domain}: decomposition cycle`);
    if (visited.has(id)) return;
    active.add(id);
    for (const child of adjacency.get(id) ?? []) visit(child);
    active.delete(id);
    visited.add(id);
  }
  for (const node of scenarios) {
    assert.ok(node.id.startsWith(prefix));
    assert.equal(node.status, 'draft');
    visit(node.id);
  }
  for (const root of roots) {
    assert.ok(root.acceptanceCriteria && root.expectedResult && root.situationAndInputs);
    assert.ok(root.children.length > 0 && root.children.every((id) => nodes.get(id)?.parentId === root.id));
  }
  for (const child of children) {
    assert.equal(child.acceptanceStatus, 'needs_explicit_review');
    assert.equal(child.acceptanceCriteria, null);
    assert.ok(edgeKeys.has(`decomposes_to:${child.parentId}:${child.id}`));
  }
  const markdown = readFileSync(`knowledge/product/cifedra-${domain}-scenario-library-2026-11-15.md`, 'utf8');
  for (const node of scenarios) {
    if (node.level === 1) {
      assert.ok(markdown.includes(`## ${node.id}\n\n**${node.title}**`), `${domain}: stale root ${node.id}`);
    } else {
      assert.ok(markdown.includes(`| ${node.id} | ${node.title} |`), `${domain}: stale child ${node.id}`);
    }
  }
  console.log(`${domain.toUpperCase()}: ${roots.length} L1, ${children.length} L2, ${base.edges.length} edges; valid draft`);
}
