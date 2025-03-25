import React, { useState } from 'react';

function ManageSubscriptionButton({ customerId }: { customerId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      
      if (!response.ok) throw new Error('Failed to create portal session');
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      // Show error to user
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleManageSubscription}
      disabled={isLoading}
      className="btn btn-primary"
    >
      {isLoading ? 'Loading...' : 'Manage Subscription'}
    </button>
  );
}

export default ManageSubscriptionButton; 