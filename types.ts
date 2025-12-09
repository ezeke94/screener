export type StrictnessLevel = 'Low' | 'Medium' | 'High';

export interface Criterion {
  id: string;
  label: string;
  type: 'forbidden' | 'desired';
  strictness?: StrictnessLevel; // Only for forbidden
}

export type AnalysisStatus = 'pending' | 'analyzing' | 'pass' | 'fail' | 'error';

export interface PhotoData {
  id: string;
  file: File;
  previewUrl: string;
  status: AnalysisStatus;
  reasons: string[];
  feedback?: string;
}

export interface AnalysisResult {
  status: 'PASS' | 'FAIL';
  reasons: string[];
  feedback: string;
}