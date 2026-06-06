import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    // remove quotes if any
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check categories
  const { data: categories, error: catError } = await supabase.from('categories').select('*');
  if (catError) {
    console.error("Categories error:", catError);
  } else {
    console.log("Categories in DB:");
    categories.forEach(c => console.log(`- ${c.name}: ${c.id}`));
  }

  // Check a few products
  const { data: products, error: prodError } = await supabase.from('products').select('*').limit(2);
  if (prodError) {
    console.error("Products error:", prodError);
  } else {
    console.log("Sample Products in DB:");
    console.log(JSON.stringify(products, null, 2));
  }
}

check();
