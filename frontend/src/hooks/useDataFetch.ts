// Hook personalizado para usar el servicio de fetch con cache
import { useState, useEffect, useCallback } from 'react';
import dataFetchService from '../services/dataFetchService';

interface UseDataFetchOptions {
  url: string;
  params?: any;
  autoFetch?: boolean;
  cacheDuration?: number;
  showNotification?: boolean;
  dependencies?: any[];
}

interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useDataFetch<T = any>(options: UseDataFetchOptions): UseDataFetchResult<T> {
  const {
    url,
    params,
    autoFetch = true,
    cacheDuration,
    showNotification = true,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dataFetchService.fetch<T>(url, {
        params,
        cacheDuration,
        showNotification
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params), cacheDuration, showNotification]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch, ...dependencies]);

  const clearCache = useCallback(() => {
    dataFetchService.clearCache(url);
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache
  };
}

// Hook para múltiples fetches en paralelo
export function useMultiDataFetch<T = any>(urls: string[]): {
  data: (T | null)[];
  loading: boolean;
  errors: (Error | null)[];
  refetchAll: () => Promise<void>;
} {
  const [data, setData] = useState<(T | null)[]>(new Array(urls.length).fill(null));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<(Error | null)[]>(new Array(urls.length).fill(null));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors(new Array(urls.length).fill(null));

    const promises = urls.map((url) =>
      dataFetchService.fetch<T>(url, { showNotification: false })
        .catch((err) => err)
    );

    const results = await Promise.all(promises);

    const newData: (T | null)[] = [];
    const newErrors: (Error | null)[] = [];

    results.forEach((result, index) => {
      if (result instanceof Error) {
        newData[index] = null;
        newErrors[index] = result;
      } else {
        newData[index] = result;
        newErrors[index] = null;
      }
    });

    setData(newData);
    setErrors(newErrors);
    setLoading(false);
  }, [urls.join(',')]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    loading,
    errors,
    refetchAll: fetchAll
  };
}