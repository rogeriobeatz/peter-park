export type MazeVector = { x: number; y: number; vx: number; vy: number };

export const MAZE_LAYOUT = [
  "###########",
  "#S#...#...#",
  "#.#.#.#.#.#",
  "#...#...#.#",
  "###.###.#.#",
  "#...#...#.#",
  "#.###.#.#.#",
  "#.....#...#",
  "#.#####...#",
  "#.......#G#",
  "###########",
] as const;

export const MAZE_SIZE = MAZE_LAYOUT.length;
export const START_POSITION: MazeVector = { x: 1.5, y: 1.5, vx: 0, vy: 0 };

export function isWallAt(x: number, y: number): boolean {
  const column = Math.floor(x);
  const row = Math.floor(y);
  return row < 0 || column < 0 || row >= MAZE_SIZE || column >= MAZE_SIZE || MAZE_LAYOUT[row][column] === "#";
}

export function isGoalAt(x: number, y: number): boolean {
  const column = Math.floor(x);
  const row = Math.floor(y);
  return row >= 0 && column >= 0 && row < MAZE_SIZE && column < MAZE_SIZE && MAZE_LAYOUT[row][column] === "G";
}

function collides(x: number, y: number, radius: number): boolean {
  const samples = [
    [x - radius, y - radius], [x + radius, y - radius],
    [x - radius, y + radius], [x + radius, y + radius],
    [x, y - radius], [x, y + radius], [x - radius, y], [x + radius, y],
  ];
  return samples.some(([sampleX, sampleY]) => isWallAt(sampleX, sampleY));
}

export function stepBall(
  current: MazeVector,
  tilt: { x: number; y: number },
  deltaSeconds: number,
): MazeVector {
  const dt = Math.min(Math.max(deltaSeconds, 0), 0.04);
  const radius = 0.22;
  const acceleration = 5.2;
  const friction = Math.pow(0.91, dt * 60);
  const maxSpeed = 3.0;

  let vx = (current.vx + tilt.x * acceleration * dt) * friction;
  let vy = (current.vy + tilt.y * acceleration * dt) * friction;
  const speed = Math.hypot(vx, vy);
  if (speed > maxSpeed) {
    vx = (vx / speed) * maxSpeed;
    vy = (vy / speed) * maxSpeed;
  }

  let x = current.x + vx * dt;
  if (collides(x, current.y, radius)) {
    x = current.x;
    vx = 0;
  }

  let y = current.y + vy * dt;
  if (collides(x, y, radius)) {
    y = current.y;
    vy = 0;
  }

  return { x, y, vx, vy };
}

export function findMazePath(): boolean {
  const start = { x: 1, y: 1 };
  const queue = [start];
  const visited = new Set([start.x + "," + start.y]);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length) {
    const current = queue.shift()!;
    if (MAZE_LAYOUT[current.y][current.x] === "G") return true;
    for (const [dx, dy] of directions) {
      const x = current.x + dx;
      const y = current.y + dy;
      const key = x + "," + y;
      if (x < 0 || y < 0 || x >= MAZE_SIZE || y >= MAZE_SIZE || visited.has(key) || MAZE_LAYOUT[y][x] === "#") continue;
      visited.add(key);
      queue.push({ x, y });
    }
  }
  return false;
}
