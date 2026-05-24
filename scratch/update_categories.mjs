import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin credentials
const email = "skmohdfaisal07@gmail.com";
const password = "123456";

async function updateCategories() {
  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }
  
  // 1. Fetch category ID for "Tech Accessories"
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'tech-accessories')
    .single();
    
  if (catError || !catData) {
    console.error("Could not find Tech Accessories category:", catError);
    return;
  }
  
  const categoryId = catData.id;
  console.log("Found category ID:", categoryId);
  
  // 2. Fetch the 5 recently added products (USB hubs)
  // We can filter by names or just get all uncategorized ones added recently
  const asins = ['B0CV7RMLWQ', 'B0BBV62WMX', 'B0F73SVVZH', 'B09M869Z5V', 'B0CFLT45KH'];
  
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name')
    .in('asin', asins);
    
  if (prodError || !products) {
    console.error("Could not fetch products:", prodError);
    return;
  }
  
  console.log(`Found ${products.length} products to update.`);
  
  for (const product of products) {
    // 3. Update primary_category_id and sub_category
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        primary_category_id: categoryId,
        sub_category: "USB Hub"
      })
      .eq('id', product.id);
      
    if (updateError) {
      console.error(`Failed to update ${product.name}:`, updateError);
      continue;
    }
    
    // 4. Update product_categories map
    // First delete any existing map just in case
    await supabase.from('product_categories').delete().eq('product_id', product.id);
    
    const { error: mapError } = await supabase
      .from('product_categories')
      .insert({
        product_id: product.id,
        category_id: categoryId
      });
      
    if (mapError) {
      console.error(`Failed to map category for ${product.name}:`, mapError);
    } else {
      console.log(`Updated category for: ${product.name}`);
    }
  }
  
  console.log("All done!");
}

updateCategories();
