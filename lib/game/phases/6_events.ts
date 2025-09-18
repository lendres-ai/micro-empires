import type { Prisma } from '@prisma/client';
import { createRNG } from '@/lib/rng';

const GLOBAL_EVENTS = [
  "A meteor shower brings rare minerals to the world!",
  "A great storm sweeps across the lands, affecting all empires.",
  "Merchants arrive with exotic goods and tales from distant lands.",
  "Ancient ruins are discovered, sparking interest among scholars.",
  "A solar eclipse casts an eerie shadow over the world.",
  "Wild animals migrate in great numbers, changing the landscape.",
  "A comet streaks across the sky, bringing good fortune to some.",
  "The seasons change dramatically, affecting all territories.",
];

export async function processEventsPhase(tx: Prisma.TransactionClient, turn: number, seed: string): Promise<void> {
  console.log(`Processing events phase for turn ${turn}`);

  const rng = createRNG(seed, turn, 'events');
  
  // 30% chance of a global event
  if (rng.nextFloat() < 0.3) {
    const eventMessage = rng.pick(GLOBAL_EVENTS);
    
    await tx.log.create({
      data: {
        turn,
        scope: 'GLOBAL',
        message: eventMessage,
      },
    });

    // For MVP, events are just flavor text
    // In future versions, they could affect resources, army, etc.
  }
}
