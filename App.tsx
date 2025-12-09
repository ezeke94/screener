import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { CriteriaPanel } from './components/CriteriaPanel';
import { PhotoCard } from './components/PhotoCard';
import { Criterion, PhotoData } from './types';
import { analyzePhoto } from './services/geminiService';
import { useCriteria } from './hooks/useCriteria';
import { Upload, Wand2, Trash2 } from 'lucide-react';

export default function App() {
  const { criteria, isLoading: isLoadingCriteria, saveCriteria } = useCriteria();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: PhotoData[] = Array.from(e.target.files).map((file: File) => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        reasons: [],
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    e.target.value = '';
  };

  const processPhoto = useCallback(async (photo: PhotoData) => {
    try {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'analyzing' } : p));
      
      const result = await analyzePhoto(photo.file, criteria);
      
      setPhotos(prev => prev.map(p => p.id === photo.id ? { 
        ...p, 
        status: result.status === 'PASS' ? 'pass' : 'fail',
        reasons: result.reasons,
        feedback: result.feedback
      } : p));

    } catch (error) {
      console.error(error);
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'error' } : p));
    }
  }, [criteria]);

  const processPending = async () => {
    setIsProcessingBatch(true);
    const pendingPhotos = photos.filter(p => p.status === 'pending');
    
    // Process sequentially to avoid rate limits if many photos
    for (const photo of pendingPhotos) {
      await processPhoto(photo);
    }
    setIsProcessingBatch(false);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to remove all photos?')) {
      setPhotos([]);
    }
  };

  const pendingCount = photos.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Sidebar: Criteria Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <CriteriaPanel criteria={criteria} setCriteria={saveCriteria} />
          
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h3 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Upload Photos
            </h3>
            <p className="text-indigo-700 text-sm mb-4">
              Select photos to evaluate against your configured criteria.
            </p>
            <label className="block w-full cursor-pointer">
              <span className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm">
                Choose Files
              </span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
          </div>
        </div>

        {/* Right Content: Photo Grid */}
        <div className="lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Photos ({photos.length})
            </h2>
            
            <div className="flex gap-2">
              {photos.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              )}
              
              <button
                onClick={processPending}
                disabled={isProcessingBatch || pendingCount === 0}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium flex items-center gap-2"
              >
                {isProcessingBatch ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Screen Pending ({pendingCount})
                  </>
                )}
              </button>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <Upload className="w-12 h-12 mb-3 opacity-50" />
              <p className="font-medium">No photos uploaded yet</p>
              <p className="text-sm">Upload photos to begin screening</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {photos.map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onRetry={() => processPhoto(photo)}
                  onDelete={deletePhoto}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}