import test from 'node:test';
import assert from 'node:assert/strict';
import { findMazePath, isGoalAt, isWallAt, MAZE_SIZE, START_POSITION, stepBall } from '../src/games/gyro-maze/physics.ts';

test('maze has a reachable finish', () => {
  assert.equal(findMazePath(), true);
});

test('maze boundaries and walls block movement', () => {
  assert.equal(isWallAt(-1, 0), true);
  assert.equal(isWallAt(0.5, 0.5), true);
  assert.equal(isWallAt(1.5, 1.5), false);
  assert.equal(isGoalAt(9.5, 9.5), true);
  assert.equal(MAZE_SIZE, 11);
});

test('ball accelerates in the direction of tilt', () => {
  const next = stepBall(START_POSITION, { x: 1, y: 0 }, 1 / 60);
  assert.ok(next.x > START_POSITION.x);
  assert.equal(next.y, START_POSITION.y);
});

test('ball remains inside the maze and does not cross a wall', () => {
  let ball = { ...START_POSITION };
  for (let i = 0; i < 120; i++) ball = stepBall(ball, { x: -1, y: -1 }, 1 / 60);
  assert.ok(ball.x >= 0 && ball.x < MAZE_SIZE);
  assert.ok(ball.y >= 0 && ball.y < MAZE_SIZE);
  assert.equal(isWallAt(ball.x, ball.y), false);
});

test('large frame gaps are clamped to keep physics stable', () => {
  const a = stepBall(START_POSITION, { x: 1, y: 0 }, 1);
  const b = stepBall(START_POSITION, { x: 1, y: 0 }, 0.04);
  assert.deepEqual(a, b);
});
