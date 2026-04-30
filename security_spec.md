# Security Specification

## Data Invariants
1. Products must have a name, price, and category.
2. Orders must contain items and a sub-total.
3. Settings are only configurable by verified admins.
4. Banners are public read, admin write.

## The Dirty Dozen Payloads
1. **Ghost Product**: Creating a product with a hidden `isFree: true` field.
2. **Price Spoof**: Updating a product price to 0.01.
3. **Identity Spoof**: Creating an order with someone else's email.
4. **Settings Hijack**: Regular user trying to change the site logo.
5. **Banner Poisoning**: Injecting 1MB of text into a banner title.
6. **Order Tamper**: Updating an existing order status to 'delivered'.
7. **Admin Escalation**: Writing to `/admins/my-uid`.
8. **PII Leak**: Unauthorized user trying to list all orders.
9. **Orphaned Order**: Creating an order for a product that doesn't exist.
10. **Global Wipe**: Attempting to delete `settings/site_config`.
11. **ID Injection**: Using a 2KB long ID string.
12. **Status Lock Break**: Modifying an order after it has been cancelled.

## Test Runner (Draft)
```ts
// firestore.rules.test.ts
// logic to test these payloads against permission-denied...
```
