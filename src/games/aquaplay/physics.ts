export type PumpDirection = -1 | 1;

export type AquaRing = {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tilt: number;
  spin: number;
  target: 0 | 1;
  color: string;
  caught: boolean;
  missed: boolean;
};

export type RingStep = {
  rings: AquaRing[];
  caughtIds: number[];
  missedIds: number[];
};

export const TARGET_X: Record<0 | 1, number> = { 0: 28, 1: 72 };
export const TARGET_Y = 25;
export const TARGET_DEPTH = 0.5;

const COLORS = [
  '#ff6683', '#ffd34e', '#55d2f2', '#a88af7',
  '#65d89a', '#ff9858', '#f07ed0', '#58cbb9',
];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createInitialRings(): AquaRing[] {
  const starts = [
    { x: 39, y: 70, z: 0.40 },
    { x: 61, y: 73, z: 0.61 },
    { x: 44, y: 79, z: 0.54 },
    { x: 57, y: 68, z: 0.35 },
    { x: 34, y: 82, z: 0.48 },
    { x: 66, y: 80, z: 0.56 },
    { x: 48, y: 74, z: 0.69 },
    { x: 53, y: 84, z: 0.44 },
  ];

  return starts.map((start, id) => ({
    id,
    ...start,
    vx: 0,
    vy: 0,
    vz: 0,
    tilt: (id % 2 ? -1 : 1) * (4 + (id % 3) * 3),
    spin: id % 2 ? 12 : -12,
    target: start.x < 50 ? 0 : 1,
    color: COLORS[id],
    caught: false,
    missed: false,
  }));
}

/**
 * A pump creates a local water jet. It only pushes rings near that nozzle;
 * there is no steering force pulling a ring toward a target.
 */
export function pumpRings(rings: AquaRing[], direction: PumpDirection, pulse = 0): AquaRing[] {
  const nozzleX = direction < 0 ? 29 : 71;

  return rings.map((ring) => {
    if (ring.caught) return ring;

    const distance = Math.abs(ring.x - nozzleX);
    const reach = clamp(1 - distance / 38, 0, 1);
    const depthFocus = clamp(1 - Math.abs(ring.z - TARGET_DEPTH) / 0.6, 0.28, 1);
    const pressure = reach * depthFocus;
    if (pressure < 0.08) return ring;

    const waterKick = 0.76 + (pulse % 3) * 0.12;
    const horizontalKick = direction * (9 + pressure * 18) * waterKick;
    const verticalKick = (34 + pressure * 58) * waterKick;
    const depthKick = (TARGET_DEPTH - ring.z) * pressure * 0.5;

    return {
      ...ring,
      vx: clamp(ring.vx + horizontalKick, -88, 88),
      vy: clamp(ring.vy - verticalKick, -170, 115),
      vz: clamp(ring.vz + depthKick, -0.42, 0.42),
      tilt: clamp(ring.tilt + direction * pressure * (8 + (pulse % 2) * 3), -48, 48),
      spin: clamp(ring.spin + direction * pressure * 85, -280, 280),
    };
  });
}

/**
 * Water drag slows the rings, buoyancy gently changes their depth,
 * and gravity brings them back down. A point is awarded only on an
 * upward crossing of the target plane with a narrow 3D alignment window.
 */
export function stepRings(rings: AquaRing[], deltaSeconds: number): RingStep {
  const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
  const caughtIds: number[] = [];
  const missedIds: number[] = [];

  const nextRings = rings.map((ring) => {
    if (ring.caught) return ring;

    const previousY = ring.y;
    let vx = ring.vx * Math.exp(-0.72 * dt);
    let vy = (ring.vy + 76 * dt) * Math.exp(-0.06 * dt);
    let vz = (ring.vz + (TARGET_DEPTH - ring.z) * 0.52 * dt) * Math.exp(-1.15 * dt);
    let x = ring.x + vx * dt;
    let y = ring.y + vy * dt;
    let z = ring.z + vz * dt;
    let tilt = ring.tilt * Math.exp(-1.05 * dt);
    let spin = ring.spin * Math.exp(-0.9 * dt);
    let missed = ring.missed;

    if (x < 7 || x > 93) {
      x = clamp(x, 7, 93);
      vx *= -0.48;
    }
    if (z < 0.08 || z > 0.92) {
      z = clamp(z, 0.08, 0.92);
      vz *= -0.38;
    }

    const crossedTargetPlane = previousY > TARGET_Y && y <= TARGET_Y && vy < 0;
    if (crossedTargetPlane && !missed) {
      const targetX = TARGET_X[ring.target];
      const alignedX = Math.abs(x - targetX) <= 4.8;
      const alignedDepth = Math.abs(z - TARGET_DEPTH) <= 0.13;
      const alignedTilt = Math.abs(tilt) <= 15;
      const controlledSpeed = vy >= -138 && Math.abs(vx) <= 62;

      if (alignedX && alignedDepth && alignedTilt && controlledSpeed) {
        caughtIds.push(ring.id);
        return {
          ...ring,
          x: targetX,
          y: TARGET_Y,
          z: TARGET_DEPTH,
          vx: 0,
          vy: 0,
          vz: 0,
          tilt: 0,
          spin: 0,
          caught: true,
          missed: false,
        };
      }

      missed = true;
      missedIds.push(ring.id);
    }

    if (missed && y > TARGET_Y + 13 && vy > 0) missed = false;

    if (y < 5) {
      y = 5;
      vy = Math.max(34, Math.abs(vy) * 0.5);
      tilt *= 0.7;
    } else if (y > 89) {
      y = 89;
      vy = 0;
      vx *= 0.78;
      spin *= 0.8;
    }

    return { ...ring, x, y, z, vx, vy, vz, tilt, spin, missed };
  });

  return { rings: nextRings, caughtIds, missedIds };
}
