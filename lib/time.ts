import { DateTime } from 'luxon';

export function isCutoffWindow(now: Date = new Date()): boolean {
  const cutoffTime = process.env.GAME_CUTOFF_LOCAL || '21:00';
  const timezone = 'Europe/Berlin';
  
  const berlinTime = DateTime.fromJSDate(now, { zone: timezone });
  const cutoffDateTime = DateTime.fromFormat(`${berlinTime.toISODate()} ${cutoffTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone });
  
  // 5-minute window after cutoff
  const windowStart = cutoffDateTime;
  const windowEnd = cutoffDateTime.plus({ minutes: 5 });
  
  return berlinTime >= windowStart && berlinTime <= windowEnd;
}

export function getCurrentTurnNumber(): number {
  // Simple implementation: days since epoch
  const epoch = new Date('2025-09-18T00:00:00Z');
  const now = new Date();
  const daysSinceEpoch = Math.floor((now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, daysSinceEpoch + 1); // Ensure turn starts at 1
}

export function getCutoffTimeForTurn(turnNumber: number): Date {
  const cutoffTime = process.env.GAME_CUTOFF_LOCAL || '21:00';
  const timezone = 'Europe/Berlin';
  
  const epoch = new Date('2025-09-18T00:00:00Z');
  const turnDate = new Date(epoch.getTime() + (turnNumber - 1) * 24 * 60 * 60 * 1000);
  
  const cutoffDateTime = DateTime.fromJSDate(turnDate, { zone: timezone })
    .set({ hour: parseInt(cutoffTime.split(':')[0]), minute: parseInt(cutoffTime.split(':')[1]) });
  
  return cutoffDateTime.toJSDate();
}
