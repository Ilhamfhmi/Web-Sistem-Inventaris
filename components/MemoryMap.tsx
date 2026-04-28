'use client';

import { twMerge } from 'tailwind-merge';

export interface AuditDocument {
  id: number;
  unit: string;
  nama_eviden: string;
  format_req: string;
  is_uploaded: boolean;
  file_url: string | null;
  status?: 'completed' | 'missing' | 'revision';
}

interface Props {
  items: AuditDocument[];
  onSelect: (item: AuditDocument) => void;
  selectedId?: number;
}

export default function MemoryMap({ items, onSelect, selectedId }: Props) {
  // Sort items by ID for a consistent grid
  const sortedItems = [...items].sort((a, b) => a.id - b.id);

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 gap-3">
      {sortedItems.map((item) => {
        const isUploaded = item.is_uploaded && item.status !== 'missing';
        const isSelected = selectedId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            title={`${item.nama_eviden} (${item.format_req})`}
            className={twMerge(
              "aspect-square rounded-xl transition-all duration-300 relative group",
              // Missing: Grey/Dashed Border
              !isUploaded && "border-2 border-dashed border-[#E9ECEF] bg-white hover:border-[#1E3A8A]/30 hover:bg-[#F8F9FB]",
              // Uploaded: Solid Green
              isUploaded && "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 border-none",
              // Selected: Ring indicator
              isSelected && "ring-4 ring-[#1E3A8A] ring-offset-2 z-10 scale-110 shadow-xl"
            )}
          >
            <span className={twMerge(
              "text-[9px] font-black absolute inset-0 flex items-center justify-center transition-colors",
              isUploaded ? "text-white" : "text-slate-200"
            )}>
              {item.id}
            </span>
            
            {/* Tooltip-like effect on hover */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1C1E] text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity uppercase tracking-widest z-20">
              {item.nama_eviden.substring(0, 15)}...
            </div>
          </button>
        );
      })}
      
      {/* Skeleton placeholders if total items < 10 for visual balance */}
      {items.length > 0 && items.length < 10 && Array.from({ length: 10 - items.length }).map((_, i) => (
        <div 
          key={`skeleton-${i}`} 
          className="aspect-square rounded-xl border-2 border-dashed border-slate-50 opacity-50" 
        />
      ))}
    </div>
  );
}
