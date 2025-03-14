export interface SearchResult {
  href: string;
  total: number;
  next?: string;
  prev?: string;
  limit: number;
  offset: number;
  itemSummaries: ItemSummary[]
}

export interface ItemSummary {
  itemId: string;
  title: string;
  leafCategoryIds: string[];
  categories: {
    categoryId: string;
    categoryName: string;
  }[];
  image: {
    imageUrl: string;
  };
  price: {
    value: string;
    currency: string;
  };
  itemHref: string;
  seller: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  marketingPrice?: {
    originalPrice: {
      value: string;
      currency: string;
    };
    discountPercentage: string;
    discountAmount: {
      value: string;
      currency: string;
    };
    priceTreatment: string;
  };
  condition: string;
  conditionId: string;
  thumbnailImages: {
    imageUrl: string;
  }[];
  shippingOptions: {
    shippingCostType: string;
    shippingCost: {
      value: string;
      currency: string;
    };
    minEstimatedDeliveryDate: string;
    maxEstimatedDeliveryDate: string;
  }[];
  buyingOptions: string[];
  itemAffiliateWebUrl: string;
  itemWebUrl: string;
  itemLocation: {
    postalCode: string;
    country: string;
  };
  additionalImages: {
    imageUrl: string;
  }[];
  adultOnly: boolean;
  legacyItemId: string;
  availableCoupons: boolean;
  itemCreationDate: string;
  topRatedBuyingExperience: boolean;
  priorityListing: boolean;
  listingMarketplaceId: string;
}