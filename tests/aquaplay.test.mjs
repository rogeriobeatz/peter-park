import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialRings, pumpRings, stepRings } from '../src/games/aquaplay/physics.ts';

test('starts with eight loose rings split between the two targets', () => {
  const rings = createInitialRings();
  assert.equal(rings.length, 8);
  assert.equal(rings.filter((ring) => ring.target === 0).length, 4);
  assert.equal(rings.filter((ring) => ring.target === 1).length, 4);
  assert.ok(rings.every((ring) => !ring.caught));
});

test('either pump sends the rings upward and adds horizontal movement', () => {
  const rings = createInitialRings();
  const left = pumpRings(rings, -1);
  const right = pumpRings(rings, 1);
  assert.ok(left.every((ring, index) => ring.vy < rings[index].vy));
  assert.ok(left.every((ring, index) => ring.vx < rings[index].vx));
  assert.ok(right.every((ring, index) => ring.vx > rings[index].vx));
});

test('rings snap onto their target when a rising ring reaches the hoop', () => {
  const ring = { ...createInitialRings()[0], x: 28, y: 28, vy: -80 };
  const result = stepRings([ring], 0.016);
  assert.equal(result.rings[0].caught, true);
  assert.deepEqual(result.caughtIds, [ring.id]);
});

test('caught rings stay in place and are not counted twice', () => {
  const ring = { ...createInitialRings()[0], x: 28, y: 22, caught: true };
  const result = stepRings([ring], 0.05);
  assert.deepEqual(result.rings[0], ring);
  assert.deepEqual(result.caughtIds, []);
});

test('large frame gaps are clamped for stable motion', () => {
  const rings = createInitialRings();
  assert.deepEqual(stepRings(rings, 1), stepRings(rings, 0.05));
});
