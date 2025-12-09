import React, { useState } from 'react';
import { Criterion, StrictnessLevel } from '../types';
import { Plus, X, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

interface CriteriaPanelProps {
  criteria: Criterion[];
  setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
  readOnly?: boolean;
}

export const CriteriaPanel: React.FC<CriteriaPanelProps> = ({ criteria, setCriteria, readOnly = false }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'forbidden' | 'desired'>('forbidden');
  const [newStrictness, setNewStrictness] = useState<StrictnessLevel>('Medium');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      label: newLabel,
      type: newType,
      strictness: newType === 'forbidden' ? newStrictness : undefined,
    };
    setCriteria([...criteria, newCriterion]);
    setNewLabel('');
  };

  const handleRemove = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleStrictnessChange = (id: string, level: StrictnessLevel) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, strictness: level } : c));
  };

  const forbidden = criteria.filter(c => c.type === 'forbidden');
  const desired = criteria.filter(c => c.type === 'desired');

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Sliders className="w-5 h-5 text-indigo-600" />
        Screener Configuration
      </h2>

      {!readOnly && (
        <>
          {/* Input Area - Stacked for sidebar compatibility */}
          <div className="flex flex-col gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="E.g., Blurry, Closed eyes..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
            
            <div className="flex gap-2">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'forbidden' | 'desired')}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
              >
                <option value="forbidden">Forbidden</option>
                <option value="desired">Desired</option>
              </select>
              
              {newType === 'forbidden' && (
                <select
                  value={newStrictness}
                  onChange={(e) => setNewStrictness(e.target.value as StrictnessLevel)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Med</option>
                  <option value="High">High</option>
                </select>
              )}
            </div>

            <button
              onClick={handleAdd}
              className="w-full px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Criteria
            </button>
          </div>
        </>
      )}

      <div className="space-y-6">
        {/* Forbidden List */}
        <div>
          <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Not Acceptable
          </h3>
          <div className="space-y-2">
            {forbidden.length === 0 && <p className="text-slate-400 text-sm italic">No forbidden criteria set.</p>}
            {forbidden.map((c) => (
              <div key={c.id} className="flex items-start justify-between p-3 bg-red-50 border border-red-100 rounded-md group">
                <div className="flex flex-col w-full mr-2">
                  <span className="text-slate-800 font-medium text-sm break-words">{c.label}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Strictness:</span>
                    {readOnly ? (
                      <span className="text-xs font-semibold text-indigo-600">{c.strictness}</span>
                    ) : (
                      <select
                        value={c.strictness}
                        onChange={(e) => handleStrictnessChange(c.id, e.target.value as StrictnessLevel)}
                        className="text-xs border-none bg-transparent font-semibold text-indigo-600 focus:ring-0 p-0 cursor-pointer w-auto"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desired List */}
        <div>
          <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Desired Tips
          </h3>
          <div className="space-y-2">
            {desired.length === 0 && <p className="text-slate-400 text-sm italic">No desired criteria set.</p>}
            {desired.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-md group">
                <span className="text-slate-800 font-medium text-sm break-words">{c.label}</span>
                {!readOnly && (
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};