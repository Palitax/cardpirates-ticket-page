import { supabase } from './supabase';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribed_at?: string;
}

export const newsletterService = {
  /**
   * Subscribes an email to the newsletter in Supabase (with localStorage fallback for dev).
   */
  async subscribe(email: string, source: 'landing_page' | 'checkout' | 'footer' = 'landing_page'): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .upsert(
            { 
              email: cleanEmail, 
              status: 'active', 
              source,
              subscribed_at: new Date().toISOString()
            },
            { onConflict: 'email' }
          );

        if (error) {
          console.error('Error saving newsletter subscriber to Supabase:', error);
          throw error;
        }

        return { success: true, message: 'Vielen Dank für deine Anmeldung zum Newsletter!' };
      }
    } catch (e) {
      console.warn('Network error or Supabase offline, saving subscriber locally:', e);
    }

    // LocalStorage Fallback for dev / offline mode
    try {
      const existing = localStorage.getItem('cardpirates_newsletter_subscribers');
      const subscribers: string[] = existing ? JSON.parse(existing) : [];
      if (!subscribers.includes(cleanEmail)) {
        subscribers.push(cleanEmail);
        localStorage.setItem('cardpirates_newsletter_subscribers', JSON.stringify(subscribers));
      }
      return { success: true, message: 'Vielen Dank für deine Anmeldung zum Newsletter!' };
    } catch (err) {
      return { success: false, message: 'Fehler beim Speichern der Anmeldung.' };
    }
  }
};
