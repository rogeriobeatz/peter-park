import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SWING_STATE, starHeight, starWorldPosition, stepSwing } from '../src/games/teia-turbo/physics.ts';

test('the hero moves toward the direction of the phone tilt', () => {
  const next = stepSwing(INITIAL_SWING_STATE, { x: 1, y: 0 }, 1 / 30);
  assert.ok(next.offset > 0);
  assert.ok(next.distance > INITIAL_SWING_STATE.distance);
});

test('forward and backward tilt changes flight height and travel speed', () => {
  const forward = stepSwing(INITIAL_SWING_STATE, { x: 0, y: 1 }, 1 / 30);
  const backward = stepSwing(INITIAL_SWING_STATE, { x: 0, y: -1 }, 1 / 30);
  assert.ok(forward.distance > backward.distance);
  assert.ok(forward.heroY < backward.heroY);
});

test('star positions are spaced along the route', () => {
  assert.equal(starWorldPosition(0), 350);
  assert.equal(starWorldPosition(1) - starWorldPosition(0), 540);
  assert.ok(starHeight(0) > 0 && starHeight(0) < 1);
});

test('the first star is collected automatically when the hero reaches it', () => {
  let state = { ...INITIAL_SWING_STATE };
  for (let frame = 0; frame < 60; frame += 1) {
    state = stepSwing(state, { x: 0, y: 0 }, 1 / 30);
  }
  assert.equal(state.stars, 1);
  assert.equal(state.lastStar, 0);
});

test('large frame gaps are clamped for stable motion', () => {
  const a = stepSwing(INITIAL_SWING_STATE, { x: 1, y: 1 }, 1);
  const b = stepSwing(INITIAL_SWING_STATE, { x: 1, y: 1 }, 0.05);
  assert.deepEqual(a, b);
});
