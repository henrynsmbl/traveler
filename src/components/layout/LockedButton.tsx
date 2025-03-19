import { Lock } from 'lucide-react';

const LockedButton = () => {
  return (
    <button 
      className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
      disabled
    >
      <Lock className="h-4 w-4" />
      Book (Coming Soon)
    </button>
  );
};

export default LockedButton;