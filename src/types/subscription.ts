export interface SubscriptionPlan {
    id: string;
    name: string;
    priceId: {
      monthly: string;
      yearly: string;
    };
    features: string[];
  }
  
  export interface StripeSubscription {
    id: string;
    status: string;
    priceId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }