import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("products")
    .select("*, primary_category:categories!products_primary_category_id_fkey(name)")
    .limit(5);

  if (error) {
    console.log("Supabase error fetching products with join:", error.message);
    console.log("Let's try relationship-free select...");
    const { data: data2, error: error2 } = await supabase
      .from("products")
      .select("*, categories(name)")
      .limit(5);
    if (error2) {
      console.log("Relationship-free select error:", error2.message);
    } else {
      console.log("Relationship-free select works!", data2);
    }
  } else {
    console.log("Query with foreign key works perfectly!", data);
  }
}

check();
