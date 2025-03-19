import React from 'react';

const LoadingMessage = () => (
  <div className="w-full">
    <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 p-4">
      <div className="w-8 h-8 flex items-center">
        <img 
          src="/logo.svg" 
          alt="Loading" 
          className="w-6 h-6"
          style={{
            animation: 'takeoff 2.5s infinite ease-in-out',
            transformOrigin: 'center'
          }}
        />
      </div>
      <span>Searching...</span>
      <style jsx>{`
        @keyframes takeoff {
          0% { transform: translateX(8px) rotate(-10deg); }
          30% { transform: translateX(0) rotate(0deg); }
          100% { transform: translate(-24px, -24px) rotate(25deg); opacity: 0; }
        }
      `}</style>
    </div>
  </div>
);

export default LoadingMessage;