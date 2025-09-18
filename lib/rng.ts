// Deterministic RNG using mulberry32 algorithm
export class SeededRNG {
  private state: number;

  constructor(seed: string) {
    this.state = this.stringToInt(seed);
  }

  private stringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Mulberry32 algorithm
  private mulberry32(): number {
    this.state += 0x6D2B79F5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextFloat(): number {
    return this.mulberry32();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export function createRNG(seed: string, turn: number, key: string): SeededRNG {
  return new SeededRNG(`${seed}:${turn}:${key}`);
}
