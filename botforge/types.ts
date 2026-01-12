
export enum PageView {
  LANDING = 'LANDING',
  PRICING = 'PRICING',
  FAQ = 'FAQ',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ACTIVATED = 'ACTIVATED',
  PAYMENT = 'PAYMENT',
  DASHBOARD = 'DASHBOARD',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN'
  CREATE_COMPANY_PROFILE = 'CREATE_COMPANY_PROFILE'
}

export enum UserRole {
  GUEST = 'GUEST',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}
