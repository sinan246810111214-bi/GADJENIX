/**
 * Generates JSON-LD for a product to improve SEO snippets in Google Search.
 */
export function generateProductSchema(product) {
  if (!product) return null;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image],
    "description": product.description,
    "sku": product.id || product.slug,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Gadgenix"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://gadgenix.com/product/${product.slug}`,
      "priceCurrency": "USD",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stockStatus === 'In Stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 4.5,
      "reviewCount": product.reviewCount || 10
    }
  };
}
