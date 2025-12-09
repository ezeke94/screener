import { db } from './firebaseConfig';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { Criterion } from '../types';

const CRITERIA_DOC_ID = 'shared-criteria';
const CRITERIA_COLLECTION = 'config';

/**
 * Fetch shared criteria from Firestore
 * Returns default criteria if document doesn't exist
 */
export async function fetchSharedCriteria(): Promise<Criterion[]> {
  try {
    const docRef = doc(db, CRITERIA_COLLECTION, CRITERIA_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.criteria || getDefaultCriteria();
    }
    return getDefaultCriteria();
  } catch (error) {
    console.error('Error fetching criteria from Firestore:', error);
    return getDefaultCriteria();
  }
}

/**
 * Subscribe to real-time updates of shared criteria
 * Returns unsubscribe function
 */
export function subscribeToCriteria(
  onUpdate: (criteria: Criterion[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const docRef = doc(db, CRITERIA_COLLECTION, CRITERIA_DOC_ID);
    
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate(data.criteria || getDefaultCriteria());
        } else {
          onUpdate(getDefaultCriteria());
        }
      },
      (error) => {
        console.error('Error subscribing to criteria:', error);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    console.error('Error setting up criteria subscription:', error);
    onError?.(error as Error);
    return () => {}; // Return empty unsubscribe function
  }
}

/**
 * Default criteria if Firestore document doesn't exist
 */
function getDefaultCriteria(): Criterion[] {
  return [
    {
      id: '1',
      label: 'No strong blur',
      type: 'forbidden',
      strictness: 'High'
    },
    {
      id: '2',
      label: 'Adequate lighting',
      type: 'forbidden',
      strictness: 'Medium'
    },
    {
      id: '3',
      label: 'Subject visible and centered',
      type: 'desired'
    },
    {
      id: '4',
      label: 'Clean background',
      type: 'desired'
    }
  ];
}

/**
 * Feed comprehensive criteria to Firestore
 */
export async function seedSharedCriteria() {
  const criteria: Criterion[] = [
    { id: '1', label: 'Blurry or out of focus', type: 'forbidden', strictness: 'Medium' },
    { id: '2', label: 'Poor lighting / Too dark', type: 'forbidden', strictness: 'Low' },
    { id: '3', label: 'Negative interactions — angry faces, pulling child', type: 'forbidden', strictness: 'High' },
    { id: '4', label: 'Sad expressions', type: 'forbidden', strictness: 'Medium' },
    { id: '5', label: 'Rigid posing — staged, standing in lines', type: 'forbidden', strictness: 'Medium' },
    { id: '6', label: 'Inappropriate attire or body exposure', type: 'forbidden', strictness: 'High' },
    { id: '7', label: 'Untidy background — brooms, garbage, food, mess', type: 'forbidden', strictness: 'Medium' },
    { id: '8', label: 'Happy / Smiling expression', type: 'desired' },
  ];
  await setDoc(doc(db, CRITERIA_COLLECTION, CRITERIA_DOC_ID), { criteria });
}
