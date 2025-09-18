# Micro Empires

An asynchronous, turn-based strategy game where empires compete for territory in a deterministic world. Built with Next.js 14, Supabase, and Prisma.

## Features

- **Daily Turns**: Submit 1-3 orders per day, processed at 21:00 Europe/Berlin time
- **Strategic Gameplay**: Expand territory, build improvements, wage war, manage resources
- **Deterministic**: Fair, predictable gameplay with seeded random events
- **Real-time Map**: View the 20x20 world grid with color-coded ownership
- **Turn Logs**: Detailed logs of all actions and events

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Supabase (Postgres + Auth)
- **ORM**: Prisma
- **Deployment**: Vercel
- **Scheduling**: Vercel Cron Jobs
- **Time Handling**: Luxon

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-postgres-connection-string

# Game Configuration
GAME_WORLD_SEED=micro-empires-001
GAME_CUTOFF_LOCAL=21:00
CRON_SECRET=your_random_cron_secret_here

# Optional: Email notifications
RESEND_API_KEY=your_resend_api_key_here
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the map (optional)
npx tsx scripts/seed.ts
```

### 3. Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the game.

## Game Rules

### Resources
- **Food**: Required for army upkeep (1 per army per turn)
- **Wood**: Used for expansion and building
- **Stone**: Used for expansion and building  
- **Gold**: Earned from harbors and combat victories
- **Army**: Abstracted military power

### Order Types
- **Expand**: Claim adjacent neutral tiles (costs 1 wood, 1 stone)
- **Attack**: Attack adjacent enemy tiles (commits army)
- **Build**: Upgrade owned tiles to increase production
- **Defend**: Increase defense on owned tiles
- **Trade**: Place trade offers (MVP: placeholder)

### Turn Processing
Turns are processed daily at 21:00 Europe/Berlin time in this order:
1. **Upkeep**: Army consumes food, reduce army if insufficient
2. **Production**: Generate resources from owned tiles
3. **Expansion**: Process expansion orders, resolve conflicts
4. **Conflict**: Process attack orders with deterministic combat
5. **Build**: Process building orders to upgrade tiles
6. **Events**: Random global events (30% chance)

## Deployment

### Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy - cron jobs will be automatically configured

### Manual Cron Testing
```bash
# Test turn processing locally (either header works)
curl -X POST http://localhost:3000/api/cron/process-turn \
  -H "X-CRON-KEY: your_random_cron_secret_here"

curl -X GET http://localhost:3000/api/cron/process-turn \
  -H "Authorization: Bearer your_random_cron_secret_here"
```

## API Endpoints

- `GET /api/me` - Get current user and empire data
- `GET /api/map` - Get world map state
- `POST /api/orders` - Submit new order
- `DELETE /api/orders?id=...` - Cancel pending order
- `GET /api/turns` - Get latest processed turns
- `POST /api/cron/process-turn` - Process turn (cron only)

## Project Structure

```
├─ prisma/schema.prisma          # Database schema
├─ lib/
│  ├─ db.ts                     # Prisma client
│  ├─ auth.ts                   # Supabase auth helpers
│  ├─ rng.ts                    # Deterministic RNG
│  ├─ time.ts                   # Time utilities
│  └─ game/
│     ├─ constants.ts           # Game balance constants
│     ├─ map.ts                # Map generation
│     ├─ rules.ts              # Order validation
│     ├─ processor.ts          # Turn processing orchestrator
│     └─ phases/               # Individual turn phases
├─ app/
│  ├─ api/                     # API routes
│  ├─ play/page.tsx           # Main game dashboard
│  ├─ map/page.tsx            # World map view
│  ├─ orders/page.tsx         # Order management
│  └─ turns/[id]/page.tsx     # Turn details
└─ scripts/seed.ts            # Database seeding
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.