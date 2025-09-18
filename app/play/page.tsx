'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderType } from '@prisma/client';

interface Empire {
  id: string;
  name: string;
  color: string;
  tilesOwned: number;
  isEliminated: boolean;
}

interface Resources {
  food: number;
  wood: number;
  stone: number;
  gold: number;
  army: number;
}

interface UserData {
  user: { id: string; email: string };
  empire: Empire | null;
  resources: Resources | null;
  actionsRemaining: number;
  latestTurn: number;
}

function PlayContent() {
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.EXPAND);
  const [targetX, setTargetX] = useState('');
  const [targetY, setTargetY] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserData();
    
    // Set target coordinates from URL parameters
    const urlTargetX = searchParams.get('targetX');
    const urlTargetY = searchParams.get('targetY');
    
    if (urlTargetX) {
      setTargetX(urlTargetX);
    }
    if (urlTargetY) {
      setTargetY(urlTargetY);
    }
  }, [searchParams]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/me', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async () => {
    if (!userData?.empire) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: orderType,
          targetX: targetX ? parseInt(targetX) : undefined,
          targetY: targetY ? parseInt(targetY) : undefined,
          amount: amount ? parseInt(amount) : undefined,
        }),
      });

      if (response.ok) {
        // Refresh user data
        await fetchUserData();
        // Reset form
        setTargetX('');
        setTargetY('');
        setAmount('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!userData?.empire) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to Micro Empires!</h1>
          <p className="mb-4">You need to create an empire to start playing.</p>
          <Button onClick={() => window.location.href = '/create-empire'}>
            Create Empire
          </Button>
        </Card>
      </div>
    );
  }

  const { empire, resources, actionsRemaining } = userData;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Micro Empires</h1>
        <div className="flex items-center gap-2">
          <Badge variant={empire.isEliminated ? 'destructive' : 'default'}>
            {empire.name}
          </Badge>
          <span className="text-sm text-gray-600">
            Turn {userData.latestTurn}
          </span>
        </div>
      </div>

      {empire.isEliminated && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold text-red-800">Empire Eliminated</h2>
          <p className="text-red-600">Your empire has been eliminated from the game.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resources */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resources</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span>Food:</span>
              <span className="font-mono">{resources?.food}</span>
            </div>
            <div className="flex justify-between">
              <span>Wood:</span>
              <span className="font-mono">{resources?.wood}</span>
            </div>
            <div className="flex justify-between">
              <span>Stone:</span>
              <span className="font-mono">{resources?.stone}</span>
            </div>
            <div className="flex justify-between">
              <span>Gold:</span>
              <span className="font-mono">{resources?.gold}</span>
            </div>
            <div className="flex justify-between">
              <span>Army:</span>
              <span className="font-mono">{resources?.army}</span>
            </div>
            <div className="flex justify-between">
              <span>Tiles:</span>
              <span className="font-mono">{empire.tilesOwned}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Actions Remaining:</span>
              <Badge variant="outline">{actionsRemaining}/3</Badge>
            </div>
            
            {actionsRemaining > 0 && !empire.isEliminated && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="w-full p-2 border rounded"
                  >
                    <option value={OrderType.EXPAND}>Expand</option>
                    <option value={OrderType.ATTACK}>Attack</option>
                    <option value={OrderType.BUILD}>Build</option>
                    <option value={OrderType.DEFEND}>Defend</option>
                    <option value={OrderType.TRADE}>Trade</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target X</label>
                    <input
                      type="number"
                      value={targetX}
                      onChange={(e) => setTargetX(e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                      max="19"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Y</label>
                    <input
                      type="number"
                      value={targetY}
                      onChange={(e) => setTargetY(e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                      max="19"
                    />
                  </div>
                </div>

                {(orderType === OrderType.ATTACK || orderType === OrderType.DEFEND) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2 border rounded"
                      min="1"
                    />
                  </div>
                )}

                <Button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => window.location.href = '/map'}>
          View Map
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/orders'}>
          View Orders
        </Button>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Loading...</div>}>
      <PlayContent />
    </Suspense>
  );
}
