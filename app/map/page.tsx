'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MapTile {
  x: number;
  y: number;
  type: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerColor: string | null;
  level: number;
}

const TILE_COLORS = {
  PLAIN: 'bg-gray-200',
  FARM: 'bg-green-200',
  FOREST: 'bg-green-400',
  MINE: 'bg-gray-400',
  HARBOR: 'bg-blue-200',
  RUIN: 'bg-purple-200',
};

const TILE_NAMES = {
  PLAIN: 'Plain',
  FARM: 'Farm',
  FOREST: 'Forest',
  MINE: 'Mine',
  HARBOR: 'Harbor',
  RUIN: 'Ruin',
};

export default function MapPage() {
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);

  useEffect(() => {
    fetchMap();
  }, []);

  const fetchMap = async () => {
    try {
      const response = await fetch('/api/map', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setTiles(data);
      }
    } catch (error) {
      console.error('Error fetching map:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTileStyle = (tile: MapTile) => {
    const baseColor = TILE_COLORS[tile.type as keyof typeof TILE_COLORS] || 'bg-gray-200';
    
    // If tile is owned, use the owner's color as background with a darker border
    if (tile.ownerId) {
      return `w-6 h-6 border-2 border-gray-800 cursor-pointer hover:opacity-80`;
    }
    
    return `${baseColor} w-6 h-6 border border-gray-300 cursor-pointer hover:opacity-80`;
  };

  const getTileBackgroundStyle = (tile: MapTile) => {
    if (tile.ownerId && tile.ownerColor) {
      return { backgroundColor: tile.ownerColor };
    }
    return {};
  };

  const renderMap = () => {
    const mapGrid = [];
    
    for (let y = 0; y < 20; y++) {
      const row = [];
      for (let x = 0; x < 20; x++) {
        const tile = tiles.find(t => t.x === x && t.y === y);
        if (tile) {
          row.push(
            <div
              key={`${x},${y}`}
              className={getTileStyle(tile)}
              style={getTileBackgroundStyle(tile)}
              onClick={() => setSelectedTile(tile)}
              title={`${x},${y} - ${TILE_NAMES[tile.type as keyof typeof TILE_NAMES]}${tile.ownerName ? ` (${tile.ownerName})` : ''}`}
            />
          );
        } else {
          row.push(
            <div
              key={`${x},${y}`}
              className="w-6 h-6 border border-gray-300 bg-gray-100"
            />
          );
        }
      }
      mapGrid.push(
        <div key={y} className="flex">
          {row}
        </div>
      );
    }
    
    return mapGrid;
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading map...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">World Map</h1>
        <Button onClick={() => window.location.href = '/play'}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Territory Map</h2>
            <div className="overflow-auto">
              <div className="inline-block">
                {renderMap()}
              </div>
            </div>
          </Card>
        </div>

        {/* Legend and Info */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Tile Types</h3>
            <div className="space-y-2">
              {Object.entries(TILE_NAMES).map(([type, name]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${TILE_COLORS[type as keyof typeof TILE_COLORS]}`} />
                  <span className="text-sm">{name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Empires</h3>
            <div className="space-y-2">
              {Array.from(new Set(tiles.filter(t => t.ownerId).map(t => t.ownerName))).map(empireName => {
                const empireTile = tiles.find(t => t.ownerName === empireName);
                return (
                  <div key={empireName} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 border border-gray-800"
                      style={{ backgroundColor: empireTile?.ownerColor ?? undefined }}
                    />
                    <span className="text-sm">{empireName}</span>
                  </div>
                );
              })}
              {tiles.filter(t => t.ownerId).length === 0 && (
                <div className="text-sm text-gray-500">No territories claimed yet</div>
              )}
            </div>
          </Card>

          {selectedTile && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Selected Tile</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Position:</strong> ({selectedTile.x}, {selectedTile.y})</div>
                <div><strong>Type:</strong> {TILE_NAMES[selectedTile.type as keyof typeof TILE_NAMES]}</div>
                <div><strong>Level:</strong> {selectedTile.level}</div>
                {selectedTile.ownerName && (
                  <div><strong>Owner:</strong> {selectedTile.ownerName}</div>
                )}
                {selectedTile.ownerColor && (
                  <div className="flex items-center gap-2">
                    <strong>Color:</strong>
                    <div 
                      className="w-4 h-4 border border-gray-300"
                      style={{ backgroundColor: selectedTile.ownerColor }}
                    />
                  </div>
                )}
              </div>
              <Button 
                className="w-full mt-3"
                onClick={() => {
                  // Pre-fill order form with selected coordinates
                  window.location.href = `/play?targetX=${selectedTile.x}&targetY=${selectedTile.y}`;
                }}
              >
                Use as Target
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
