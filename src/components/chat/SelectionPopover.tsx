import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface SelectionPopoverProps {
  onAddSelection: (text: string) => void;
}

const SelectionPopover: React.FC<SelectionPopoverProps> = ({ onAddSelection }) => {
  const [selection, setSelection] = useState<{text: string, x: number, y: number} | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selectedText = window.getSelection()?.toString().trim();
      if (selectedText) {
        const range = window.getSelection()?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelection({
            text: selectedText,
            x: rect.x + rect.width / 2,
            y: rect.y - 10
          });
        }
      } else {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  if (!selection) return null;

  return (
    <div 
      className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
      style={{ left: selection.x, top: selection.y }}
    >
      <button
        onClick={() => {
          onAddSelection(selection.text);
          setSelection(null);
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg flex items-center gap-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Add to aitinerary</span>
      </button>
    </div>
  );
};

export default SelectionPopover; 