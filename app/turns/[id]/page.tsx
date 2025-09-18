'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Turn {
  id: number;
  processedAt: string | null;
  seed: string;
  eventNote: string | null;
}

interface Log {
  id: string;
  turn: number;
  empireId: string | null;
  scope: string;
  message: string;
  data: unknown;
  createdAt: string;
}

export default function TurnDetailsPage() {
  const [turn, setTurn] = useState<Turn | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  const fetchTurnDetails = useCallback(async () => {
    try {
      // Fetch turn details
      const turnResponse = await fetch('/api/turns');
      if (turnResponse.ok) {
        const turns = await turnResponse.json();
        const currentTurn = turns.find((t: Turn) => t.id === parseInt(id));
        setTurn(currentTurn || null);
      }

      // Fetch logs for this turn
      const logsResponse = await fetch(`/api/turns/${id}/logs`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching turn details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTurnDetails();
  }, [fetchTurnDetails]);

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'GLOBAL':
        return 'bg-blue-100 text-blue-800';
      case 'EMPIRE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading turn details...</div>;
  }

  if (!turn) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Turn Not Found</h1>
          <p className="mb-4">The requested turn could not be found.</p>
          <Button onClick={() => window.location.href = '/play'}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Turn {turn.id}</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/play'}>
            Back to Dashboard
          </Button>
          <Button onClick={() => window.location.href = '/orders'}>
            View Orders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turn Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Turn Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Turn Number:</span>
              <span className="ml-2">{turn.id}</span>
            </div>
            <div>
              <span className="font-medium">Processed:</span>
              <span className="ml-2">
                {turn.processedAt 
                  ? new Date(turn.processedAt).toLocaleString()
                  : 'Not processed'
                }
              </span>
            </div>
            <div>
              <span className="font-medium">Seed:</span>
              <span className="ml-2 font-mono text-sm">{turn.seed}</span>
            </div>
            {turn.eventNote && (
              <div>
                <span className="font-medium">Event:</span>
                <p className="mt-1 text-sm text-gray-600">{turn.eventNote}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Global Events */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Global Events</h2>
          <div className="space-y-3">
            {logs.filter(log => log.scope === 'GLOBAL').map((log) => (
              <div key={log.id} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getScopeColor(log.scope)}>
                    {log.scope}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{log.message}</p>
              </div>
            ))}
            {logs.filter(log => log.scope === 'GLOBAL').length === 0 && (
              <p className="text-gray-500 text-sm">No global events this turn.</p>
            )}
          </div>
        </Card>

        {/* Empire Events */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Empire Events</h2>
          <div className="space-y-3">
            {logs.filter(log => log.scope === 'EMPIRE').map((log) => (
              <div key={log.id} className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getScopeColor(log.scope)}>
                    {log.scope}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{log.message}</p>
              </div>
            ))}
            {logs.filter(log => log.scope === 'EMPIRE').length === 0 && (
              <p className="text-gray-500 text-sm">No empire events this turn.</p>
            )}
          </div>
        </Card>
      </div>

      {/* All Logs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Events</h2>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className={getScopeColor(log.scope)}>
                {log.scope}
              </Badge>
              <div className="flex-1">
                <p className="text-sm">{log.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-500 text-center py-8">No events recorded for this turn.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
