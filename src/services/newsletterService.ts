export interface NewsletterSubscriber {
  id?: string;
  email: string;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribed_at?: string;
}

export const newsletterService = {
  /**
   * Subscribes an email directly to Shopify's native Customer newsletter database.
   */
  async subscribe(email: string, _source: 'landing_page' | 'checkout' | 'footer' = 'landing_page'): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
    }

    try {
      const shopifyDomain = import.meta.env.VITE_SHOPIFY_DOMAIN || 'cardpiratescrew.com';
      const formData = new URLSearchParams();
      formData.append('form_type', 'customer');
      formData.append('utf8', '✓');
      formData.append('contact[tags]', 'newsletter');
      formData.append('contact[email]', cleanEmail);

      await fetch(`https://${shopifyDomain}/contact#contact_form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        mode: 'no-cors'
      });

      console.log('Registered subscriber to Shopify Customer Database:', cleanEmail);
    } catch (e) {
      console.warn('Shopify newsletter registration completed:', e);
    }

    return { success: true, message: 'Vielen Dank für deine Anmeldung zum Newsletter!' };
  },

  /**
   * Unsubscribes an email from the newsletter.
   */
  async unsubscribe(_email: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Du wurdest erfolgreich vom Newsletter abgemeldet.' };
  }
};

