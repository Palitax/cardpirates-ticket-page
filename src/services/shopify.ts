import event1Img from '../assets/event1.jpg';

const getShopifyConfig = () => {
  const globalConfig = (window as any).ShopifyStorefrontConfig || {};
  return {
    domain: globalConfig.domain || import.meta.env.VITE_SHOPIFY_DOMAIN || window.location.hostname || 'cardpirates.myshopify.com',
    token: globalConfig.token || import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || 'YOUR_STOREFRONT_TOKEN'
  };
};

const config = getShopifyConfig();
const SHOPIFY_DOMAIN = config.domain;
const STOREFRONT_ACCESS_TOKEN = config.token;
const API_VERSION = '2024-01';

const GRAPHQL_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

async function shopifyFetch<T>(query: string, variables = {}): Promise<T> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors) {
      console.error('Shopify GraphQL Errors:', json.errors);
      throw new Error(json.errors[0].message);
    }

    return json.data;
  } catch (error) {
    console.error('Failed to fetch from Shopify:', error);
    throw error;
  }
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  images: {
    nodes: ShopifyImage[];
  };
  variants: {
    nodes: ShopifyVariant[];
  };
  // Custom metafields for event data
  eventDate?: { value: string };
  eventLocation?: { value: string };
  eventVideoUrl?: { value: string };
}

// Queries
const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        description
        images(first: 5) {
          nodes {
            url
            altText
          }
        }
        variants(first: 5) {
          nodes {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
          }
        }
        eventDate: metafield(namespace: "custom", key: "event_date") {
          value
        }
        eventLocation: metafield(namespace: "custom", key: "event_location") {
          value
        }
      }
    }
  }
`;

const GET_PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      images(first: 10) {
        nodes {
          url
          altText
        }
      }
      variants(first: 5) {
        nodes {
          id
          title
          price {
            amount
            currencyCode
          }
          availableForSale
        }
      }
      eventDate: metafield(namespace: "custom", key: "event_date") {
        value
      }
      eventLocation: metafield(namespace: "custom", key: "event_location") {
        value
      }
      eventVideoUrl: metafield(namespace: "custom", key: "event_video_url") {
        value
      }
    }
  }
`;

const CREATE_CART_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const shopifyService = {
  async getEvents(limit = 10): Promise<ShopifyProduct[]> {
    try {
      const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(
        GET_PRODUCTS_QUERY,
        { first: limit }
      );
      return data.products.nodes;
    } catch {
      // Fallback Mock Data for demo purposes if Shopify is empty/unreachable
      return getMockEvents();
    }
  },

  async getEventByHandle(handle: string): Promise<ShopifyProduct | null> {
    try {
      const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
        GET_PRODUCT_BY_HANDLE_QUERY,
        { handle }
      );
      if (!data.product) {
        return getMockEvents().find(e => e.handle === handle) || null;
      }
      return data.product;
    } catch {
      return getMockEvents().find(e => e.handle === handle) || null;
    }
  },

  async createCheckoutLink(
    variantId: string, 
    email: string, 
    checkoutData: {
      firstName: string;
      lastName: string;
      address1: string;
      city: string;
      zip: string;
      country: string;
      company?: string;
    }
  ): Promise<string> {
    const input = {
      lines: [{ quantity: 1, merchandiseId: variantId }],
      buyerIdentity: {
        email: email,
        deliveryAddressPreferences: [{
          deliveryAddress: {
            firstName: checkoutData.firstName,
            lastName: checkoutData.lastName,
            address1: checkoutData.address1,
            city: checkoutData.city,
            zip: checkoutData.zip,
            country: checkoutData.country,
            company: checkoutData.company || null,
          }
        }]
      }
    };

    const data = await shopifyFetch<{
      cartCreate: {
        cart: { checkoutUrl: string } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(CREATE_CART_MUTATION, { input });

    if (data.cartCreate.userErrors.length > 0) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }

    return data.cartCreate.cart?.checkoutUrl || '';
  }
};

// High-quality mockup fallback data for events if Shopify API is in configuration phase
function getMockEvents(): ShopifyProduct[] {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);
  
  const inTwoWeeks = new Date();
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 12);

  const inThreeWeeks = new Date();
  inThreeWeeks.setDate(inThreeWeeks.getDate() + 20);

  return [
    {
      id: 'gid://shopify/Product/mock-1',
      title: 'Großes Cardpirates Turnier 2026',
      handle: 'grand-cardpirates-tournament-2026',
      description: 'Das ultimative TCG-Event des Jahres. Tritt gegen die besten Cardpirates Europas an, sichere dir exklusive Promokarten und kämpfe um einen riesigen Preispool.',
      descriptionHtml: '<p>Das ultimative TCG-Event des Jahres. Tritt gegen die besten Cardpirates Europas an, sichere dir exklusive Promokarten und kämpfe um einen riesigen Preispool.</p>',
      images: {
        nodes: [
          {
            url: (window as any).ShopifyAssets?.event1Url || event1Img,
            altText: 'Gaming Area'
          }
        ]
      },
      variants: {
        nodes: [
          {
            id: 'gid://shopify/ProductVariant/mock-var-1',
            title: 'Standard-Ticket',
            price: { amount: '45.00', currencyCode: 'EUR' },
            availableForSale: true
          }
        ]
      },
      eventDate: { value: nextWeek.toISOString() },
      eventLocation: { value: 'Halle 4, Köln, Deutschland' }
    },
    {
      id: 'gid://shopify/Product/mock-2',
      title: 'Retro Deck-building Masterclass',
      handle: 'retro-deckbuilding-masterclass',
      description: 'Lerne Deckbuilding-Strategien von legendären Spielern. Bringe deine Old-School-Karten mit und entdecke geheime Kartenkombinationen, um lokale Turniere zu dominieren.',
      descriptionHtml: '<p>Lerne Deckbuilding-Strategien von legendären Spielern. Bringe deine Old-School-Karten mit und entdecke geheime Kartenkombinationen, um lokale Turniere zu dominieren.</p>',
      images: {
        nodes: [
          {
            url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=1200',
            altText: 'Cards layout'
          }
        ]
      },
      variants: {
        nodes: [
          {
            id: 'gid://shopify/ProductVariant/mock-var-2',
            title: 'Masterclass-Ticket',
            price: { amount: '25.00', currencyCode: 'EUR' },
            availableForSale: true
          }
        ]
      },
      eventDate: { value: inTwoWeeks.toISOString() },
      eventLocation: { value: 'Pirates Hub, Hamburg, Deutschland' }
    },
    {
      id: 'gid://shopify/Product/mock-3',
      title: 'Card Trading & Networking Nacht',
      handle: 'card-trading-networking-night',
      description: 'Triff Sammler, tausche seltene Karten und teste deine neuen Decks in lockeren Runden. Snacks und Getränke sind im Ticketpreis enthalten.',
      descriptionHtml: '<p>Triff Sammler, tausche seltene Karten und teste deine neuen Decks in lockeren Runden. Snacks und Getränke sind im Ticketpreis enthalten.</p>',
      images: {
        nodes: [
          {
            url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
            altText: 'E-Sports Event'
          }
        ]
      },
      variants: {
        nodes: [
          {
            id: 'gid://shopify/ProductVariant/mock-var-3',
            title: 'Community-Pass',
            price: { amount: '15.00', currencyCode: 'EUR' },
            availableForSale: true
          }
        ]
      },
      eventDate: { value: inThreeWeeks.toISOString() },
      eventLocation: { value: 'Basecamp, Berlin, Deutschland' }
    }
  ];
}
