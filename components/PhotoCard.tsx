import React, { useState } from 'react';
import { PhotoData } from '../types';
import { Check, X, Loader2, Download, RefreshCw, Trash2 } from 'lucide-react';

interface PhotoCardProps {
  photo: PhotoData;
  onRetry: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onRetry, onDelete }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const isPass = photo.status === 'pass';
  const isFail = photo.status === 'fail';
  const isPending = photo.status === 'pending';
  const isAnalyzing = photo.status === 'analyzing';
  const isError = photo.status === 'error';

  let borderColor = 'border-slate-200';
  if (isPass) borderColor = 'border-emerald-500 ring-2 ring-emerald-500 ring-opacity-50';
  if (isFail) borderColor = 'border-red-500 ring-2 ring-red-500 ring-opacity-50';
  if (isAnalyzing) borderColor = 'border-indigo-400 ring-2 ring-indigo-400 ring-opacity-50 animate-pulse';

  const loadImage = (src: string, isRemote: boolean): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (isRemote) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // 1. Load the main photo
      const fileUrl = URL.createObjectURL(photo.file);
      const mainImage = await loadImage(fileUrl, false); 

      // 2. Load the logo (Prioritize local assets with robust checking)
      let logoImage: HTMLImageElement | null = null;
      
      const logoPaths = [
        // Correct filename as per user instruction
        "/assets/logo.png",
        // Handling potential 'assests' folder typo mentioned in prompt history
        "/assests/logo.png",
        // Relative check
        "assets/logo.png",
        // Remote fallback as last resort
        "https://fees.talcworld.com/static/media/logo-light.6d227ed7ba1a9e559495.png"
      ];

      for (const path of logoPaths) {
        try {
          const isRemote = path.startsWith('http');
          
          if (!isRemote) {
            // For local files, use fetch to ensure existence and avoid canvas tainting
            const response = await fetch(path);
            if (!response.ok) continue; // Skip if file not found (404)
            
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            logoImage = await loadImage(objectUrl, false);
          } else {
            // For remote files
            logoImage = await loadImage(path, true);
          }

          if (logoImage) break; // Found a working logo
        } catch (e) {
          // Continue to next path
          console.debug(`Failed to load logo from ${path}`, e);
        }
      }

      // 3. Create Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      // 4. Calculate Dimensions (5% White Border)
      const borderSize = Math.floor(Math.min(mainImage.width, mainImage.height) * 0.05);
      const newWidth = mainImage.width + (borderSize * 2);
      const newHeight = mainImage.height + (borderSize * 2);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // 5. Draw White Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, newWidth, newHeight);

      // 6. Draw Main Photo Centered
      ctx.drawImage(mainImage, borderSize, borderSize);

      // 7. Draw Logo (if loaded)
      if (logoImage) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Logo Constraints: Max 25% width, Max 20% height of original photo
        const maxW = mainImage.width * 0.25;
        const maxH = mainImage.height * 0.20;

        // Calculate scaling to maintain aspect ratio
        const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
        
        const logoW = logoImage.width * scale;
        const logoH = logoImage.height * scale;

        // Padding: 2.5% of the shortest side
        const padding = Math.min(mainImage.width, mainImage.height) * 0.025;

        // Position: Top Right inside the photo area
        const logoX = borderSize + mainImage.width - logoW - padding;
        const logoY = borderSize + padding;

        // Semi-transparent background for logo visibility
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        const bgPadding = 8;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
           ctx.roundRect(
            logoX - bgPadding, 
            logoY - bgPadding, 
            logoW + (bgPadding * 2), 
            logoH + (bgPadding * 2), 
            8
          );
        } else {
           ctx.rect(
            logoX - bgPadding, 
            logoY - bgPadding, 
            logoW + (bgPadding * 2), 
            logoH + (bgPadding * 2)
           );
        }
        ctx.fill();

        // Draw the logo
        ctx.drawImage(logoImage, logoX, logoY, logoW, logoH);
      }
      
      // 8. Convert to URL and Download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const link = document.createElement('a');
      link.download = `screened-${photo.id}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(fileUrl);

    } catch (error) {
      console.error("Canvas processing failed:", error);
      alert("Could not process image with border/logo. Downloading original.");
      
      const link = document.createElement('a');
      link.href = photo.previewUrl;
      link.download = `original-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`relative group bg-white rounded-lg shadow-sm border-2 overflow-hidden flex flex-col ${borderColor} transition-all duration-300`}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={photo.previewUrl}
          alt="Uploaded content"
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Status */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <span className="text-xs font-semibold text-indigo-800">Checking...</span>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isPass && <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> PASS</span>}
          {isFail && <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><X className="w-3 h-3" /> FAIL</span>}
          {isError && <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">ERROR</span>}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
           <div>
             <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ID: {photo.id}</span>
           </div>
        </div>

        {/* Analysis Results */}
        <div className="flex-1 space-y-2 mb-3">
          {isPending && <p className="text-sm text-slate-500 italic">Waiting for analysis...</p>}
          {isAnalyzing && <p className="text-sm text-indigo-600 font-medium animate-pulse">Analyzing photo quality...</p>}
          
          {isError && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              Analysis failed. Please retry.
            </div>
          )}

          {/* Reasons List */}
          {photo.reasons.length > 0 && (
             <div className="space-y-1">
               {photo.reasons.map((reason, idx) => (
                 <div key={idx} className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 p-1.5 rounded">
                   <X className="w-3 h-3 mt-0.5 shrink-0" />
                   <span>{reason}</span>
                 </div>
               ))}
             </div>
          )}
          
          {/* Feedback Tip */}
          {photo.feedback && (
             <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded italic">
               💡 {photo.feedback}
             </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => onRetry(photo.id)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Retry Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(photo.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isPass && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="ml-auto px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {isDownloading ? 'Saving...' : 'Download'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};