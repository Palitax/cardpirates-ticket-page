import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const globalConfig = (window as any).SupabaseConfig || {};
  return {
    url: globalConfig.url || import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: globalConfig.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };
};

const config = getSupabaseConfig();
const SUPABASE_URL = config.url;
const SUPABASE_ANON_KEY = config.anonKey;

// Create client only if configuration exists, otherwise fall back to Mock Supabase Client for local testing
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export interface CustomerProfile {
  shopify_customer_id: string;
  user_type: 'private' | 'business';
  company_name?: string;
  vat_number?: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  zip_code: string;
  country: string;
  phone: string;
}

// Service wrapper to easily handle mock storage or real Supabase database
export const profileService = {
  async getProfile(shopifyCustomerId: string): Promise<CustomerProfile | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('shopify_customer_id', shopifyCustomerId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          console.error('Error fetching profile from Supabase:', error);
        } else {
          return data;
        }
      }
    } catch (e) {
      console.warn('Network error fetching profile from Supabase, falling back to local storage:', e);
    }
    // LocalStorage Fallback for local sandbox/testing
    const profile = localStorage.getItem(`profile_${shopifyCustomerId}`);
    return profile ? JSON.parse(profile) : null;
  },

  async saveProfile(profile: CustomerProfile): Promise<CustomerProfile> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(profile, { onConflict: 'shopify_customer_id' })
          .select()
          .single();

        if (error) {
          console.error('Error saving profile to Supabase:', error);
        } else {
          return data;
        }
      }
    } catch (e) {
      console.warn('Network error saving profile to Supabase, falling back to local storage:', e);
    }
    // LocalStorage Fallback
    localStorage.setItem(`profile_${profile.shopify_customer_id}`, JSON.stringify(profile));
    return profile;
  }
};
