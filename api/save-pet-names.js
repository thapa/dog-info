export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.SHARED_SECRET;
  if (secret) {
    const provided = req.headers['authorization']?.replace('Bearer ', '');
    if (provided !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      return res.status(400).json({ error: 'Body must be valid JSON' });
    }
  }

  const { customer_id: numericCustomerId, pet_names: petNames } = payload || {};

  if (!numericCustomerId || !petNames) {
    return res.status(400).json({ error: 'customer_id and pet_names are required' });
  }

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const metafieldNamespace = process.env.PET_NAME_METAFIELD_NAMESPACE || 'custom';
  const metafieldKey = process.env.PET_NAME_METAFIELD_KEY || 'pet_names';

  if (!shopDomain || !adminToken) {
    return res.status(500).json({ error: 'Shopify credentials are not configured' });
  }

  const customerGid = `gid://shopify/Customer/${numericCustomerId}`;
  const mutation = `#graphql
    mutation SavePetNames($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          namespace
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    metafields: [
      {
        ownerId: customerGid,
        namespace: metafieldNamespace,
        key: metafieldKey,
        type: 'single_line_text_field',
        value: petNames,
      },
    ],
  };

  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Shopify API error response:', text);
      return res.status(response.status).json({ error: 'Shopify API request failed', details: text });
    }

    const result = await response.json();
    const errors = result?.data?.metafieldsSet?.userErrors;
    if (errors && errors.length > 0) {
      return res.status(400).json({ error: 'Shopify returned user errors', details: errors });
    }

    const saved = result?.data?.metafieldsSet?.metafields?.[0];
    return res.status(200).json({ success: true, metafield: saved });
  } catch (error) {
    console.error('Unexpected error saving metafield:', error);
    return res.status(500).json({ error: 'Unexpected error', details: error.message });
  }
}
