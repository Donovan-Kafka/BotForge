
export enum PageView {
  LANDING = 'LANDING',
  PRICING = 'PRICING',
  FAQ = 'FAQ',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ACTIVATED = 'ACTIVATED',
  PAYMENT = 'PAYMENT',
  DASHBOARD = 'DASHBOARD',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CREATE_PROFILE = 'CREATE_PROFILE',
}

export enum UserRole {
  GUEST = 'GUEST',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
  organisation_id: number;
  system_role_id?: number;
  org_role_id?: number;
  org_role_name?: string;
  is_profile_complete?: boolean;
  subscription_id?: number;
  permissions?: string[];
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating?: number;
}

export interface PricingPlan {
  name: string;
  price: number;
  staff_user_limit?: number;
  features: string[];
  recommended?: boolean;
}

export interface FAQ {
  faq_id: number;
  question: string;
  answer: string;
  status: number;
  display_order: number;
}

export interface Feature {
  feature_id: number;
  name: string;
  description: string;
}
