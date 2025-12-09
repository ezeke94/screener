import { useState, useEffect } from 'react';
import { Criterion } from '../types';
import { fetchSharedCriteria, subscribeToCriteria, updateSharedCriteria, addCriterion, removeCriterion, updateCriterion } from '../services/criteriaService';

interface UseSharedCriteriaReturn {
  criteria: Criterion[];
  loading: boolean;
  error: Error | null;
  // Admin operations (require authenticated user according to Firestore rules)
  saveCriteria: (criteria: Criterion[]) => Promise<void>;
  addCriterion: (c: Criterion) => Promise<void>;
  updateCriterion: (c: Criterion) => Promise<void>;
  removeCriterion: (id: string) => Promise<void>;
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

  // Admin wrappers
  const saveCriteria = async (newCriteria: Criterion[]) => {
    await updateSharedCriteria(newCriteria);
  };

  const addCrit = async (c: Criterion) => {
    await addCriterion(c);
  };

  const updateCrit = async (c: Criterion) => {
    await updateCriterion(c);
  };

  const removeCrit = async (id: string) => {
    await removeCriterion(id);
  };

  return { criteria, loading, error, saveCriteria, addCriterion: addCrit, updateCriterion: updateCrit, removeCriterion: removeCrit };
}

