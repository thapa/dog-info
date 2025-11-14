# Shopify Flow automation for collecting pet names

The automation below extracts every `_pet_name` line item property from a newly created order, converts the order's customer ID from a GID into Shopify's numeric ID, and posts everything to the Vercel endpoint defined in this repo.

## Prerequisites
- Shopify Flow is installed on the Shopify store.
- The Vercel endpoint from `api/save-pet-names.js` is deployed and its URL is available (for example, `https://your-app.vercel.app/api/save-pet-names`).

## Flow outline
1. **Trigger – Order created**: Start the workflow when a new order is created.
2. **Initialize variables**
   - Add the *Set variable* action named **`Pet names`**.
   - Type: *List of strings*.
   - Initial value: leave empty so it starts as `[]`.
3. **Loop through line items**
   - Add the *For each* action and set *List* to `{{order.line_items}}`.
   - Inside the loop, add another *For each* action for the line item properties with *List* set to `{{line_item.properties}}`.
   - Inside the inner loop, add an *If* condition checking `{{property.name}}` **is equal to** `_pet_name`.
   - Add an additional condition to make sure the value is not blank: `{{property.value}}` **is not equal to** `` (empty string).
   - Inside the `true` branch, use *Add item to list variable*:
     - Variable: **`Pet names`**
     - Value: `{{property.value | strip}}`
4. **After both loops**, add an *If* condition to make sure the list is not empty: `{{variables.Pet names | size}}` **is greater than** `0`.
5. **Send the HTTP request** (only within the true branch of the previous condition):
   - Action: *Send HTTP request*.
   - Method: `POST`.
   - URL: `https://your-app.vercel.app/api/save-pet-names` (replace with your deployment).
   - Headers:
     - `Content-Type: application/json`
     - (Optional) `Authorization: Bearer YOUR_SHARED_SECRET`
   - Body (raw JSON):
```json
{
  "customer_id": "{{ order.customer.id | split: '/' | last }}",
  "pet_names": "{{ variables.Pet names | join: ', ' }}"
}
```

### Converting the customer GID to a numeric ID
The expression `{{ order.customer.id | split: '/' | last }}` takes the GraphQL ID (`gid://shopify/Customer/123456789`) and returns only the trailing numeric part (`123456789`).

### Example result
If an order has three line item properties `_pet_name` with values `Bella`, `Max`, and `Rocky`, the HTTP request body sent to the Vercel API looks like:
```json
{
  "customer_id": "123456789",
  "pet_names": "Bella, Max, Rocky"
}
```

The Vercel endpoint is responsible for saving the values in a customer metafield.
