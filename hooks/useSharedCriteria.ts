import { useState, useEffect } from 'react';
import { Criterion } from '../types';
import { fetchSharedCriteria, subscribeToCriteria } from '../services/criteriaService';

interface UseSharedCriteriaReturn {
  criteria: Criterion[];
  loading: boolean;
  error: Error | null;
}

export function useSharedCriteria(): UseSharedCriteriaReturn {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // First, fetch initial criteria
    fetchSharedCriteria()
      .then((initialCriteria) => {
        setCriteria(initialCriteria);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });

    // Then subscribe to real-time updates
    const unsubscribe = subscribeToCriteria(
      (updatedCriteria) => {
        setCriteria(updatedCriteria);
      },
      (err) => {
        setError(err);
      }
    );

    return () => unsubscribe();
  }, []);

  return { criteria, loading, error };
}
