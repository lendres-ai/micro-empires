import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col gap-20 items-center">
      <div className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl font-bold">Welcome to Micro Empires</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Build your empire, expand your territory, and conquer the world in this strategic multiplayer game.
        </p>
      </div>
        
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <h1 className="text-6xl font-bold tracking-tight">
              Micro Empires
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              An asynchronous, turn-based strategy game where empires compete for territory 
              in a deterministic world. One turn per day, strategic decisions, and epic conquests await.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/play">Start Playing</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/map">View Map</Link>
              </Button>
            </div>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Daily Turns</h3>
              <p className="text-muted-foreground">
                Submit 1-3 orders per day. Turns process at 21:00 Europe/Berlin time.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Strategic Depth</h3>
              <p className="text-muted-foreground">
                Expand territory, build improvements, wage war, and manage resources.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Deterministic</h3>
              <p className="text-muted-foreground">
                Fair, predictable gameplay with seeded random events and combat.
              </p>
            </Card>
          </div>

          {/* How to Play */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">How to Play</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">1. Create Your Empire</h3>
                <p className="text-muted-foreground">
                  Sign up and choose your empire name and color. Start with basic resources 
                  and a small army.
                </p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">2. Submit Orders</h3>
                <p className="text-muted-foreground">
                  Each day, submit up to 3 orders: expand to new territories, attack enemies, 
                  build improvements, or defend your lands.
                </p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">3. Watch Results</h3>
                <p className="text-muted-foreground">
                  At 21:00 Berlin time, all orders are processed. Check the turn logs to see 
                  what happened to your empire.
                </p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">4. Dominate</h3>
                <p className="text-muted-foreground">
                  Build the largest empire, control valuable resources, and eliminate your 
                  rivals to become the ultimate ruler.
                </p>
              </Card>
            </div>
          </div>
        </div>

    </div>
  );
}