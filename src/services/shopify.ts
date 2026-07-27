import event1Img from '../assets/event1.jpg';
import event2Img from '../assets/event2.jpg';
import event3Img from '../assets/event3.jpg';

const getShopifyConfig = () => {
  const globalConfig = (window as any).ShopifyStorefrontConfig || {};
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return {
    domain: (!isLocal && globalConfig.domain && globalConfig.domain !== 'localhost') 
      ? globalConfig.domain 
      : (import.meta.env.VITE_SHOPIFY_DOMAIN || 'cardpiratescrew.com'),
    token: globalConfig.token || import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '4fb5c5e0cba28f099773e3d20c3393dc'
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

// Helper to parse media (videos and images) from Shopify Storefront API
function mapShopifyProduct(rawProduct: any): ShopifyProduct {
  if (!rawProduct) return rawProduct;

  let videoUrl = rawProduct.eventVideoUrl?.value || undefined;
  const images: ShopifyImage[] = rawProduct.images?.nodes ? [...rawProduct.images.nodes] : [];

  if (rawProduct.media?.nodes) {
    for (const item of rawProduct.media.nodes) {
      if (item.sources && item.sources.length > 0) {
        const mp4Source = item.sources.find((s: any) => s.mimeType?.includes('mp4') || s.format === 'mp4') || item.sources[0];
        if (mp4Source?.url && !videoUrl) {
          videoUrl = mp4Source.url;
        }
      } else if (item.embedUrl && !videoUrl) {
        videoUrl = item.embedUrl;
      }

      if (item.previewImage?.url) {
        if (!images.some(img => img.url === item.previewImage.url)) {
          images.push({ url: item.previewImage.url, altText: item.alt || null });
        }
      }
    }
  }

  return {
    ...rawProduct,
    images: { nodes: images },
    eventVideoUrl: videoUrl ? { value: videoUrl } : rawProduct.eventVideoUrl
  };
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
        media(first: 10) {
          nodes {
            mediaContentType
            alt
            previewImage {
              url
            }
            ... on MediaVideo {
              id
              sources {
                url
                mimeType
                format
              }
            }
            ... on Video {
              id
              sources {
                url
                mimeType
                format
              }
            }
            ... on ExternalVideo {
              id
              embedUrl
              host
            }
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
      media(first: 10) {
        nodes {
          mediaContentType
          alt
          previewImage {
            url
          }
          ... on MediaVideo {
            id
            sources {
              url
              mimeType
              format
            }
          }
          ... on Video {
            id
            sources {
              url
              mimeType
              format
            }
          }
          ... on ExternalVideo {
            id
            embedUrl
            host
          }
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
      const data = await shopifyFetch<{ products: { nodes: any[] } }>(
        GET_PRODUCTS_QUERY,
        { first: limit }
      );
      if (!data.products.nodes || data.products.nodes.length === 0) {
        console.warn("Shopify returned 0 products. Falling back to mock events for staging.");
        return getMockEvents();
      }
      return data.products.nodes.map(mapShopifyProduct);
    } catch {
      // Fallback Mock Data for demo purposes if Shopify is empty/unreachable
      return getMockEvents();
    }
  },

  async getEventByHandle(handle: string): Promise<ShopifyProduct | null> {
    try {
      const data = await shopifyFetch<{ product: any | null }>(
        GET_PRODUCT_BY_HANDLE_QUERY,
        { handle }
      );
      if (!data.product) {
        return getMockEvents().find(e => e.handle === handle) || null;
      }
      return mapShopifyProduct(data.product);
    } catch {
      return getMockEvents().find(e => e.handle === handle) || null;
    }
  },

  async createCheckoutLink(
    variantIdOrItems: string | Array<{ variantId: string; quantity: number }>, 
    email: string, 
    _checkoutData?: {
      firstName: string;
      lastName: string;
      address1: string;
      city: string;
      zip: string;
      country: string;
      company?: string;
    },
    quantity: number = 1
  ): Promise<string> {
    const lines = typeof variantIdOrItems === 'string'
      ? [{ quantity: quantity, merchandiseId: variantIdOrItems }]
      : variantIdOrItems.map(item => ({ quantity: item.quantity, merchandiseId: item.variantId }));

    if (lines.some(l => l.merchandiseId.includes('mock-var'))) {
      throw new Error('Dies ist ein Demo-Event (Mock-Daten). Bitte lege ein echtes Produkt im Shopify-Admin an, um den realen Shopify-Checkout zu testen.');
    }

    const cleanEmail = email ? email.trim() : '';
    const isValidEmail = Boolean(cleanEmail && cleanEmail.includes('@') && cleanEmail.includes('.'));

    const input: any = { lines };

    if (isValidEmail) {
      input.buyerIdentity = {
        email: cleanEmail,
      };
    }

    const data = await shopifyFetch<{
      cartCreate: {
        cart: { checkoutUrl: string } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(CREATE_CART_MUTATION, { input });

    if (data.cartCreate?.userErrors && data.cartCreate.userErrors.length > 0) {
      throw new Error(`Shopify Kassen-Fehler: ${data.cartCreate.userErrors[0].message}`);
    }

    if (!data.cartCreate?.cart?.checkoutUrl) {
      throw new Error('Shopify konnte keinen Link zur Kasse erstellen.');
    }

    return data.cartCreate.cart.checkoutUrl;
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
            title: 'Privat',
            price: { amount: '45.00', currencyCode: 'EUR' },
            availableForSale: true
          },
          {
            id: 'gid://shopify/ProductVariant/mock-var-1-exhibitor',
            title: 'Aussteller',
            price: { amount: '120.00', currencyCode: 'EUR' },
            availableForSale: true
          }
        ]
      },
      eventDate: { value: nextWeek.toISOString() },
      eventLocation: { value: 'Halle 4, Köln, Deutschland' }
    },
    {
      id: 'gid://shopify/Product/mock-2',
      title: 'Cardpirates Community Meetup',
      handle: 'cardpirates-community-meetup',
      description: 'Triff die Crew und andere TCG-Sammler bei unserem entspannten Community Meetup. Tausche Karten, fachsimple über die neuesten Sets und verbringe einen coolen Nachmittag unter Gleichgesinnten.',
      descriptionHtml: '<p>Triff die Crew und andere TCG-Sammler bei unserem entspannten Community Meetup. Tausche Karten, fachsimple über die neuesten Sets und verbringe einen coolen Nachmittag unter Gleichgesinnten.</p>',
      images: {
        nodes: [
          {
            url: (window as any).ShopifyAssets?.event2Url || event2Img,
            altText: 'Community Meetup'
          }
        ]
      },
      variants: {
        nodes: [
          {
            id: 'gid://shopify/ProductVariant/mock-var-2',
            title: 'Meetup-Ticket',
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
      title: 'Cardpirates TCG Trade Night',
      handle: 'cardpirates-tcg-trade-night',
      description: 'Bringe deine Ordner mit und mach dich bereit für die ultimative TCG Trade Night. Tausche Pokémon, One Piece und Magic: The Gathering Karten mit Sammlern aus der gesamten Community.',
      descriptionHtml: '<p>Bringe deine Ordner mit und mach dich bereit für die ultimative TCG Trade Night. Tausche Pokémon, One Piece und Magic: The Gathering Karten mit Sammlern aus der gesamten Community.</p>',
      images: {
        nodes: [
          {
            url: (window as any).ShopifyAssets?.event3Url || event3Img,
            altText: 'Trade Night'
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
