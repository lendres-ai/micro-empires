'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EMPIRE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#A569BD', '#D7BDE2'
];

export default function CreateEmpirePage() {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createEmpire = async () => {
    if (!name.trim()) {
      setError('Empire name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/empire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color: selectedColor,
        }),
      });

      if (response.ok) {
        // Redirect to game
        window.location.href = '/play';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create empire');
      }
    } catch (error) {
      console.error('Error creating empire:', error);
      setError('Failed to create empire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Create Your Empire</h1>
          <p className="text-muted-foreground">
            Choose a name and color for your empire. This will be how other players see you on the map.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Empire Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your empire name"
              maxLength={20}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Choose a unique name that represents your empire
            </p>
          </div>

          <div>
            <Label>Empire Color</Label>
            <div className="grid grid-cols-5 gap-3 mt-2">
              {EMPIRE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-lg border-2 ${
                    selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                  } hover:border-gray-600 transition-colors`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This color will represent your empire on the world map
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={createEmpire}
              disabled={loading || !name.trim()}
              className="flex-1"
            >
              {loading ? 'Creating Empire...' : 'Create Empire'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Starting Resources</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• 5 Food, 5 Wood, 5 Stone, 5 Gold</div>
            <div>• 1 Army unit</div>
            <div>• 1 Starting territory (randomly assigned)</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
