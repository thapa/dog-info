# dog-info

This repo documents how to collect pet names from Shopify orders and save them to a customer metafield via a Vercel API.

## Contents
- `docs/shopify-flow.md` – step-by-step instructions for a Shopify Flow automation that extracts `_pet_name` line item properties, converts the customer GID into a numeric ID, and posts the data to the API.
- `api/save-pet-names.js` – Vercel serverless function that receives the Flow payload and writes the pet names into a customer metafield via Shopify's Admin GraphQL API.

## Environment variables for the Vercel function
| Variable | Required | Description |
| --- | --- | --- |
| `SHOPIFY_STORE_DOMAIN` | ✅ | Store domain such as `example-shop.myshopify.com`. |
| `SHOPIFY_ADMIN_API_TOKEN` | ✅ | Private/Admin API access token with `write_customers` scope. |
| `PET_NAME_METAFIELD_NAMESPACE` | ❌ | Namespace for the metafield. Defaults to `custom`. |
| `PET_NAME_METAFIELD_KEY` | ❌ | Metafield key. Defaults to `pet_names`. |
| `SHARED_SECRET` | ❌ | Optional bearer token shared with Shopify Flow to authenticate requests. |

Deploy the function to Vercel and configure Shopify Flow to call the deployed URL. See the docs for the exact Flow configuration.
