import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  apiKeyError: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setApiKeyError: (error: string | null) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('pal-ai-apiKey');
  });
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('pal-ai-apiKey', apiKey);
      setApiKeyError(null); // Clear error when a new key is set
    } else {
      localStorage.removeItem('pal-ai-apiKey');
    }
  }, [apiKey]);
  
  const setApiKey = (key: string) => {
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
  };

  const isKeySet = useMemo(() => !!apiKey, [apiKey]);

  const value = {
    apiKey,
    isKeySet,
    apiKeyError,
    setApiKey,
    clearApiKey,
    setApiKeyError,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};