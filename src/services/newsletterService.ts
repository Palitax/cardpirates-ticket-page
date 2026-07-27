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
   * Subscribes an email to the newsletter in Supabase and triggers a welcome email via Resend.
   */
  async subscribe(email: string, source: 'landing_page' | 'checkout' | 'footer' = 'landing_page'): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
    }

    // 1. ALWAYS trigger Welcome Email via Edge Function with await so it completes reliably
    try {
      if (supabase) {
        const { data, error: fnErr } = await supabase.functions.invoke('send-booking-notification', {
          body: { type: 'newsletter_welcome', email: cleanEmail }
        });
        if (fnErr) {
          console.warn('Edge Function invoke returned error:', fnErr);
        } else {
          console.log('Newsletter welcome email dispatched successfully:', data);
        }
      }
    } catch (fnErr) {
      console.warn('Could not trigger welcome email via Supabase Edge Function:', fnErr);
    }

    // 2. Save/Upsert subscriber in Supabase database
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
        }
      }
    } catch (e) {
      console.warn('Network error or Supabase offline, saving subscriber locally:', e);
    }

    // LocalStorage Fallback
    try {
      const existing = localStorage.getItem('cardpirates_newsletter_subscribers');
      const subscribers: string[] = existing ? JSON.parse(existing) : [];
      if (!subscribers.includes(cleanEmail)) {
        subscribers.push(cleanEmail);
        localStorage.setItem('cardpirates_newsletter_subscribers', JSON.stringify(subscribers));
      }
    } catch (err) {}

    return { success: true, message: 'Vielen Dank für deine Anmeldung zum Newsletter!' };
  },

  /**
   * Unsubscribes an email from the newsletter.
   */
  async unsubscribe(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Keine E-Mail-Adresse angegeben.' };
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            status: 'unsubscribed', 
            unsubscribed_at: new Date().toISOString() 
          })
          .eq('email', cleanEmail);

        if (error) {
          console.error('Error unsubscribing newsletter recipient:', error);
        }
      }
    } catch (e) {
      console.warn('Network error during unsubscribe:', e);
    }

    return { success: true, message: 'Du wurdest erfolgreich vom Newsletter abgemeldet.' };
  }
};
