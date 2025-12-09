import { useState, useEffect, useCallback } from 'react';
import { Criterion } from '../types';

const STORAGE_KEY = 'talc_screening_criteria';

// Default criteria if none are saved
const DEFAULT_CRITERIA: Criterion[] = [
  { id: '1', label: 'No strong blur', type: 'forbidden', strictness: 'High' },
  { id: '2', label: 'Adequate lighting', type: 'forbidden', strictness: 'Medium' },
  { id: '3', label: 'Subject visible and centered', type: 'desired' },
  { id: '4', label: 'Clean background', type: 'desired' },
];

export function useCriteria() {
  const [criteria, setCriteriaState] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load criteria from localStorage on mount
  useEffect(() => {
    const loadCriteria = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCriteriaState(parsed);
        } else {
          setCriteriaState(DEFAULT_CRITERIA);
          // Save defaults for first-time users
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CRITERIA));
        }
      } catch (error) {
        console.error('Failed to load criteria:', error);
        setCriteriaState(DEFAULT_CRITERIA);
      } finally {
        setIsLoading(false);
      }
    };

    loadCriteria();
  }, []);

  // Save criteria to localStorage
  const saveCriteria = useCallback((newCriteria: Criterion[]) => {
    setCriteriaState(newCriteria);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCriteria));
    } catch (error) {
      console.error('Failed to save criteria:', error);
    }
  }, []);

  // Reset to defaults
  const resetCriteria = useCallback(() => {
    saveCriteria(DEFAULT_CRITERIA);
  }, [saveCriteria]);

  // Add new criterion
  const addCriterion = useCallback((criterion: Criterion) => {
    const newCriteria = [...criteria, criterion];
    saveCriteria(newCriteria);
  }, [criteria, saveCriteria]);

  // Update existing criterion
  const updateCriterion = useCallback((id: string, updates: Partial<Criterion>) => {
    const newCriteria = criteria.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCriteria(newCriteria);
  }, [criteria, saveCriteria]);

  // Remove criterion
  const removeCriterion = useCallback((id: string) => {
    const newCriteria = criteria.filter(c => c.id !== id);
    saveCriteria(newCriteria);
  }, [criteria, saveCriteria]);

  return {
    criteria,
    isLoading,
    saveCriteria,
    resetCriteria,
    addCriterion,
    updateCriterion,
    removeCriterion,
  };
}
