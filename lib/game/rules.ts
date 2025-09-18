import { OrderType } from '@prisma/client';
import { COSTS, WORLD, MAX_DAILY_ORDERS } from '@/lib/game/constants';
import { db } from '@/lib/db';

interface EmpireForValidation {
  id: string;
  isEliminated: boolean;
  army: number;
  wood: number;
  stone: number;
  tiles: { x: number; y: number }[];
  orders: unknown[];
}

export interface OrderValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateOrder(
  empireId: string,
  turn: number,
  type: OrderType,
  targetX?: number,
  targetY?: number,
  amount?: number
): Promise<OrderValidationResult> {
  // Check if empire exists and get current state
  const empire = await db.empire.findUnique({
    where: { id: empireId },
    include: {
      tiles: true,
      orders: {
        where: {
          turn,
          status: 'PENDING',
        },
      },
    },
  });

  if (!empire) {
    return { valid: false, error: 'Empire not found' };
  }

  if (empire.isEliminated) {
    return { valid: false, error: 'Empire is eliminated' };
  }

  // Check order limit
  if (empire.orders.length >= MAX_DAILY_ORDERS) {
    return { valid: false, error: `Maximum ${MAX_DAILY_ORDERS} orders per turn` };
  }

  // Validate based on order type
  switch (type) {
    case OrderType.EXPAND:
      return await validateExpandOrder(empire, targetX, targetY);
    
    case OrderType.ATTACK:
      return await validateAttackOrder(empire, targetX, targetY, amount);
    
    case OrderType.BUILD:
      return await validateBuildOrder(empire, targetX, targetY);
    
    case OrderType.DEFEND:
      return await validateDefendOrder(empire, targetX, targetY);
    
    case OrderType.TRADE:
      return { valid: true }; // MVP: always valid
    
    default:
      return { valid: false, error: 'Invalid order type' };
  }
}

async function validateExpandOrder(empire: EmpireForValidation, targetX?: number, targetY?: number): Promise<OrderValidationResult> {
  if (targetX === undefined || targetY === undefined) {
    return { valid: false, error: 'Target coordinates required for expansion' };
  }

  // Check bounds
  if (targetX < 0 || targetX >= WORLD.width || targetY < 0 || targetY >= WORLD.height) {
    return { valid: false, error: 'Target coordinates out of bounds' };
  }

  // Check if tile is already owned
  const targetTile = await db.tile.findUnique({
    where: { x_y: { x: targetX, y: targetY } },
  });

  if (!targetTile) {
    return { valid: false, error: 'Target tile not found' };
  }

  if (targetTile.ownerId) {
    return { valid: false, error: 'Target tile is already owned' };
  }

  // Check if adjacent to owned tile
  const isAdjacent = empire.tiles.some((tile) => 
    Math.abs(tile.x - targetX) <= 1 && Math.abs(tile.y - targetY) <= 1 &&
    !(tile.x === targetX && tile.y === targetY)
  );

  if (!isAdjacent) {
    return { valid: false, error: 'Target tile must be adjacent to owned territory' };
  }

  // Check resources
  if (empire.wood < COSTS.EXPAND.wood || empire.stone < COSTS.EXPAND.stone) {
    return { valid: false, error: 'Insufficient resources for expansion' };
  }

  return { valid: true };
}

async function validateAttackOrder(empire: EmpireForValidation, targetX?: number, targetY?: number, amount?: number): Promise<OrderValidationResult> {
  if (targetX === undefined || targetY === undefined) {
    return { valid: false, error: 'Target coordinates required for attack' };
  }

  if (amount === undefined || amount < COSTS.ATTACK_COMMIT_MIN) {
    return { valid: false, error: `Must commit at least ${COSTS.ATTACK_COMMIT_MIN} army for attack` };
  }

  if (amount > empire.army) {
    return { valid: false, error: 'Cannot commit more army than available' };
  }

  // Check bounds
  if (targetX < 0 || targetX >= WORLD.width || targetY < 0 || targetY >= WORLD.height) {
    return { valid: false, error: 'Target coordinates out of bounds' };
  }

  // Check if tile is owned by someone else
  const targetTile = await db.tile.findUnique({
    where: { x_y: { x: targetX, y: targetY } },
    include: { owner: true },
  });

  if (!targetTile) {
    return { valid: false, error: 'Target tile not found' };
  }

  if (!targetTile.ownerId || targetTile.ownerId === empire.id) {
    return { valid: false, error: 'Target tile must be owned by another empire' };
  }

  // Check if adjacent to owned tile
  const isAdjacent = empire.tiles.some((tile) => 
    Math.abs(tile.x - targetX) <= 1 && Math.abs(tile.y - targetY) <= 1 &&
    !(tile.x === targetX && tile.y === targetY)
  );

  if (!isAdjacent) {
    return { valid: false, error: 'Target tile must be adjacent to owned territory' };
  }

  return { valid: true };
}

async function validateBuildOrder(empire: EmpireForValidation, targetX?: number, targetY?: number): Promise<OrderValidationResult> {
  if (targetX === undefined || targetY === undefined) {
    return { valid: false, error: 'Target coordinates required for building' };
  }

  // Check if tile is owned by this empire
  const targetTile = await db.tile.findUnique({
    where: { x_y: { x: targetX, y: targetY } },
  });

  if (!targetTile) {
    return { valid: false, error: 'Target tile not found' };
  }

  if (targetTile.ownerId !== empire.id) {
    return { valid: false, error: 'Can only build on owned tiles' };
  }

  // Check if tile can be upgraded
  if (targetTile.level >= 3) {
    return { valid: false, error: 'Tile is already at maximum level' };
  }

  // Check resources for upgrade
  const nextLevel = targetTile.level + 1;
  const costKey = nextLevel === 2 ? 'level2' : 'level3';
  const cost = COSTS.BUILD[costKey as keyof typeof COSTS.BUILD] as { wood: number; stone: number };

  if (empire.wood < cost.wood || empire.stone < cost.stone) {
    return { valid: false, error: 'Insufficient resources for building' };
  }

  return { valid: true };
}

async function validateDefendOrder(empire: EmpireForValidation, targetX?: number, targetY?: number): Promise<OrderValidationResult> {
  if (targetX === undefined || targetY === undefined) {
    return { valid: false, error: 'Target coordinates required for defense' };
  }

  // Check if tile is owned by this empire
  const targetTile = await db.tile.findUnique({
    where: { x_y: { x: targetX, y: targetY } },
  });

  if (!targetTile) {
    return { valid: false, error: 'Target tile not found' };
  }

  if (targetTile.ownerId !== empire.id) {
    return { valid: false, error: 'Can only defend owned tiles' };
  }

  return { valid: true };
}
