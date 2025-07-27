// Demo component to showcase the Strategy Pattern in action

import React, { useState } from 'react';
import { store } from './store/store.ts';
import {
  LocalStorageStrategy,
  IndexedDBStrategy,
  SessionStorageStrategy,
  MemoryStorageStrategy,
} from './store/store-strategies.ts';
import './StorageStrategyDemo.css';

export const StorageStrategyDemo: React.FC = () => {
  const [currentStrategy, setCurrentStrategy] = useState('LocalStorage');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const strategies = {
    LocalStorage: new LocalStorageStrategy(),
    IndexedDB: new IndexedDBStrategy(),
    SessionStorage: new SessionStorageStrategy(),
    Memory: new MemoryStorageStrategy(),
  };

  const switchStrategy = async (strategyName: keyof typeof strategies) => {
    setIsLoading(true);
    setMessage('');

    try {
      await store.switchStorageStrategy(strategies[strategyName]);
      setCurrentStrategy(strategyName);
      setMessage(`✅ Successfully switched to ${strategyName} storage`);
    } catch (error) {
      setMessage(`❌ Failed to switch to ${strategyName}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = async () => {
    setIsLoading(true);
    try {
      await store.clearAllData();
      setMessage('🗑️ All data cleared');
    } catch (error) {
      setMessage(`❌ Failed to clear data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="main"
    >
      <h4 style={{ margin: '0 0 10px 0' }}>Storage Strategy Demo</h4>

      <div style={{ marginBottom: '10px' }}>
        <strong>Current: {currentStrategy}</strong>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          marginBottom: '10px',
        }}
      >
        {Object.keys(strategies).map((strategy) => (
          <button
            key={strategy}
            onClick={() => switchStrategy(strategy as keyof typeof strategies)}
            disabled={isLoading || strategy === currentStrategy}
            style={{
              padding: '5px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: strategy === currentStrategy ? 'not-allowed' : 'pointer',
              opacity: strategy === currentStrategy ? 0.5 : 1,
            }}
          >
            {strategy}
          </button>
        ))}
      </div>

      <button
        onClick={clearData}
        disabled={isLoading}
        style={{
          padding: '5px 10px',
          border: '1px solid #ff4444',
          borderRadius: '4px',
          backgroundColor: '#ff4444',
          color: 'white',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '10px',
        }}
      >
        Clear All Data
      </button>

      {isLoading && <div>⏳ Loading...</div>}
      {message && (
        <div style={{ fontSize: '11px', marginTop: '5px' }}>{message}</div>
      )}
    </div>
  );
};
