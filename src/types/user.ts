export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    createdAt: Date;
    stripeCustomerId?: string;
    subscription?: StripeSubscription;
  }
  
  export interface StripeSubscription {
    id: string;
    status: string;
    priceId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }
  
  export interface SubscriptionPlan {
    id: string;
    name: string;
    priceId: {
      monthly: string;
      yearly: string;
    };
    features: string[];
  }