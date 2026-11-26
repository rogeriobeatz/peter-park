import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialRings, pumpRings, stepRings, TARGET_X, TARGET_Y } from '../src/games/aquaplay/physics.ts';

test('starts with eight loose three-dimensional rings split across the two sides', () => {
  const rings = createInitialRings();
  assert.equal(rings.length, 8);
  assert.equal(rings.filter((ring) => ring.target === 0).length, 4);
  assert.equal(rings.filter((ring) => ring.target === 1).length, 4);
  assert.ok(rings.every((ring) => !ring.caught && ring.z > 0 && ring.z < 1));
});

test('a pump creates a local jet instead of pulling every ring toward a peg', () => {
  const rings = createInitialRings();
  const left = pumpRings(rings, -1);
  assert.ok(left.some((ring, index) => ring.vy < rings[index].vy));
  assert.ok(left.some((ring, index) => ring.vx < rings[index].vx));
  assert.ok(left.some((ring, index) => ring.vy === rings[index].vy));
});

test('a ring scores only when it crosses upward through a correctly aligned 3D target', () => {
  const ring = {
    ...createInitialRings()[0],
    x: TARGET_X[0],
    y: TARGET_Y + 1,
    z: 0.5,
    vy: -80,
    tilt: 0,
    vx: 0,
  };
  const result = stepRings([ring], 0.02);
  assert.equal(result.rings[0].caught, true);
  assert.deepEqual(result.caughtIds, [ring.id]);
});

test('being near the peg while falling does not score', () => {
  const ring = {
    ...createInitialRings()[0],
    x: TARGET_X[0],
    y: TARGET_Y - 1,
    z: 0.5,
    vy: 70,
    tilt: 0,
  };
  const result = stepRings([ring], 0.02);
  assert.equal(result.rings[0].caught, false);
  assert.deepEqual(result.caughtIds, []);
});

test('a ring that crosses beside the peg misses instead of snapping into place', () => {
  const ring = {
    ...createInitialRings()[0],
    x: TARGET_X[0] + 9,
    y: TARGET_Y + 1,
    z: 0.5,
    vy: -80,
    tilt: 0,
  };
  const result = stepRings([ring], 0.02);
  assert.equal(result.rings[0].caught, false);
  assert.equal(result.rings[0].missed, true);
  assert.deepEqual(result.missedIds, [ring.id]);
});

test('wrong depth or a tilted ring cannot score even when its center lines up', () => {
  const rings = [
    { ...createInitialRings()[0], x: TARGET_X[0], y: TARGET_Y + 1, z: 0.8, vy: -80, tilt: 0 },
    { ...createInitialRings()[1], x: TARGET_X[1], y: TARGET_Y + 1, z: 0.5, vy: -80, tilt: 30 },
  ];
  const result = stepRings(rings, 0.02);
  assert.ok(result.rings.every((ring) => !ring.caught));
  assert.equal(result.caughtIds.length, 0);
});

test('caught rings stay fixed and cannot score twice', () => {
  const ring = { ...createInitialRings()[0], x: TARGET_X[0], y: TARGET_Y, caught: true };
  const result = stepRings([ring], 0.05);
  assert.deepEqual(result.rings[0], ring);
  assert.deepEqual(result.caughtIds, []);
});

test('large frame gaps are clamped for stable motion', () => {
  const rings = createInitialRings();
  assert.deepEqual(stepRings(rings, 1), stepRings(rings, 0.05));
});
