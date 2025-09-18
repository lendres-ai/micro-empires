import { processTurn } from '@/lib/game/processor';
import { db } from '@/lib/db';

async function testTurnProcessing() {
  console.log('Testing turn processing...');
  
  try {
    // Test processing turn 1
    await processTurn(1);
    console.log('Turn 1 processed successfully!');
    
    // Check if turn was created
    const turn = await db.turn.findUnique({
      where: { id: 1 },
    });
    
    if (turn?.processedAt) {
      console.log('Turn record created and marked as processed');
    } else {
      console.log('Turn record not found or not processed');
    }
    
    // Check for logs
    const logs = await db.log.findMany({
      where: { turn: 1 },
    });
    
    console.log(`Found ${logs.length} log entries for turn 1`);
    
  } catch (error) {
    console.error('Error testing turn processing:', error);
  }
}

testTurnProcessing();
