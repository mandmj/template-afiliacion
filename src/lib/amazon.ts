import amazonPaapi from 'amazon-paapi';

export interface AmazonProduct {
  asin: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewsCount?: number;
  image?: string;
  url: string;
  features?: string[];
}

function commonParams() {
  return {
    AccessKey: process.env.AMAZON_ACCESS_KEY as string,
    SecretKey: process.env.AMAZON_SECRET_KEY as string,
    PartnerTag: process.env.AMAZON_PARTNER_TAG as string,
    PartnerType: 'Associates',
    Marketplace: process.env.AMAZON_MARKETPLACE || 'www.amazon.es',
  };
}

const DEFAULT_RESOURCES = [
  'Images.Primary.Large',
  'ItemInfo.Title',
  'ItemInfo.ByLineInfo',
  'ItemInfo.Features',
  'Offers.Listings.Price',
  'CustomerReviews.StarRating',
  'CustomerReviews.Count',
];

export async function getItems(asins: string[]): Promise<AmazonProduct[]> {
  const res = await amazonPaapi.GetItems({
    ...commonParams(),
    ItemIds: asins,
    Resources: DEFAULT_RESOURCES,
  });
  const items = res?.ItemsResult?.Items ?? [];
  return items.map(mapItem);
}

export async function searchItems(keywords: string, limit = 10): Promise<AmazonProduct[]> {
  const res = await amazonPaapi.SearchItems({
    ...commonParams(),
    Keywords: keywords,
    SearchIndex: 'SportingGoods',
    ItemCount: Math.min(limit, 10),
    Resources: DEFAULT_RESOURCES,
  });
  const items = res?.SearchResult?.Items ?? [];
  return items.map(mapItem);
}

function mapItem(item: any): AmazonProduct {
  const listing = item?.Offers?.Listings?.[0];
  const price = listing?.Price?.Amount;
  const currency = listing?.Price?.Currency;
  return {
    asin: item.ASIN,
    title: item?.ItemInfo?.Title?.DisplayValue ?? '',
    brand: item?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
    price,
    currency,
    rating: item?.CustomerReviews?.StarRating?.Value,
    reviewsCount: item?.CustomerReviews?.Count,
    image: item?.Images?.Primary?.Large?.URL,
    url: item.DetailPageURL,
    features: item?.ItemInfo?.Features?.DisplayValues,
  };
}
