export type PumpDirection = -1 | 1;

export type AquaRing = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  target: 0 | 1;
  color: string;
  caught: boolean;
};

export const TARGET_X: Record<0 | 1, number> = { 0: 28, 1: 72 };

const COLORS = ['#ff6b8a', '#ffd34e', '#6cceef', '#a88af7', '#65d89a', '#ff9b55', '#f07ed0', '#58cbb9'];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createInitialRings(): AquaRing[] {
  const starts = [
    { x: 39, y: 67 }, { x: 62, y: 72 }, { x: 33, y: 77 }, { x: 67, y: 80 },
    { x: 46, y: 83 }, { x: 56, y: 68 }, { x: 28, y: 74 }, { x: 73, y: 77 },
  ];

  return starts.map((start, id) => ({
    id,
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    angle: (id % 4) * 9 - 13,
    target: (id % 2) as 0 | 1,
    color: COLORS[id],
    caught: false,
  }));
}

export function pumpRings(rings: AquaRing[], direction: PumpDirection): AquaRing[] {
  return rings.map((ring) => {
    if (ring.caught) return ring;
    const targetDirection = ring.target === 0 ? -1 : 1;
    const guidedPush = direction === targetDirection ? 25 : 11;
    return {
      ...ring,
      vx: clamp(ring.vx + direction * guidedPush, -76, 76),
      vy: Math.max(-178, ring.vy - 112),
      angle: ring.angle + direction * 7,
    };
  });
}

export function stepRings(rings: AquaRing[], deltaSeconds: number): { rings: AquaRing[]; caughtIds: number[] } {
  const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
  const caughtIds: number[] = [];

  const nextRings = rings.map((ring) => {
    if (ring.caught) return ring;

    const targetX = TARGET_X[ring.target];
    const steering = (targetX - ring.x) * 1.05;
    let vx = (ring.vx + steering * dt) * Math.exp(-1.15 * dt);
    let vy = ring.vy + 82 * dt;
    let x = ring.x + vx * dt;
    let y = ring.y + vy * dt;
    const angle = ring.angle + vx * dt * 0.42;

    if (x < 9 || x > 91) {
      x = clamp(x, 9, 91);
      vx *= -0.42;
    }

    const targetY = 22 + (ring.id % 2) * 2;
    if (y <= 28 && vy < 0 && Math.abs(x - targetX) <= 15) {
      caughtIds.push(ring.id);
      return { ...ring, x: targetX, y: targetY, vx: 0, vy: 0, caught: true };
    }

    if (y < 5) {
      y = 76;
      vy = 0;
      vx *= 0.35;
    } else if (y > 87) {
      y = 87;
      vy = 0;
      vx *= 0.9;
    }

    return { ...ring, x, y, vx, vy, angle };
  });

  return { rings: nextRings, caughtIds };
}
