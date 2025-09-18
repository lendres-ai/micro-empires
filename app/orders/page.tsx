'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Order {
  id: string;
  type: string;
  targetX: number | null;
  targetY: number | null;
  amount: number | null;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(0);

  useEffect(() => {
    fetchOrders();
    fetchCurrentTurn();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTurn = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentTurn(data.latestTurn);
      }
    } catch (error) {
      console.error('Error fetching current turn:', error);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Error canceling order');
    }
  };

  const getOrderTypeName = (type: string) => {
    const names = {
      EXPAND: 'Expand',
      ATTACK: 'Attack',
      BUILD: 'Build',
      DEFEND: 'Defend',
      TRADE: 'Trade',
    };
    return names[type as keyof typeof names] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPLIED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/play'}>
            Back to Dashboard
          </Button>
          <Button onClick={() => window.location.href = '/map'}>
            View Map
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Turn: {currentTurn}</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No orders submitted for this turn.</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.href = '/play'}
            >
              Submit Orders
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">
                      {getOrderTypeName(order.type)}
                    </h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {order.targetX !== null && order.targetY !== null && (
                      <span>Target: ({order.targetX}, {order.targetY})</span>
                    )}
                    {order.amount !== null && (
                      <span className="ml-4">Amount: {order.amount}</span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Submitted: {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                {order.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Order Types</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div><strong>Expand:</strong> Claim adjacent neutral tiles (costs 1 wood, 1 stone)</div>
          <div><strong>Attack:</strong> Attack adjacent enemy tiles (commits army)</div>
          <div><strong>Build:</strong> Upgrade owned tiles to increase production</div>
          <div><strong>Defend:</strong> Increase defense on owned tiles</div>
          <div><strong>Trade:</strong> Place trade offers (MVP: placeholder)</div>
        </div>
      </Card>
    </div>
  );
}
