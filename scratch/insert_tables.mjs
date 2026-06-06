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

// Credentials
const email = "skmohdfaisal07@gmail.com";
const password = "123456";

// Categories to map
const OFFICE_FURNITURE_ID = "c0000000-0000-0000-0000-000000000026";
const STUDENT_ESSENTIALS_ID = "c0000000-0000-0000-0000-000000000008";
const DESK_SETUP_ID = "c0000000-0000-0000-0000-000000000002";
const categoryIds = [OFFICE_FURNITURE_ID, STUDENT_ESSENTIALS_ID, DESK_SETUP_ID];

const products = [
  {
    name: "Generic Ergonomic Multipurpose Foldable Wooden Laptop Bed Table",
    slug: "generic-multipurpose-foldable-laptop-table-b0gntd8ryk",
    asin: "B0GNTD8RYK",
    brand: "SmartXman Pick",
    description: "A highly practical and ergonomic folding laptop bed table designed for students, remote workers, and casual users. It serves as a comfortable laptop stand, study table, bed desk, or reading tray, making working from a bed, couch, or floor completely strain-free. Built with a solid MDF board top and powder-coated metal legs with protective foam paddings, it offers a sturdy surface for writing or placing laptops up to 15.6 inches.\n\nThe design includes convenient additions such as a dedicated cup holder to prevent accidental spills and a slot for holding tablets or smartphones, keeping all your devices organized. It requires zero assembly and can be folded flat in seconds for easy storage under your bed or behind a cupboard, saving valuable room space.",
    expert_note: "An excellent and highly affordable accessory for anyone who works or studies from their bed or sofa. Its lightweight, foldable legs and useful tablet/cup holder slots make it a highly functional everyday utility.",
    price_range: "₹500 - ₹1,000",
    current_price: 549,
    old_price: 999,
    rating: 4.1,
    smart_score: 8.2,
    value_score: 8.8,
    pros: [
      "Super affordable budget pricing",
      "Fold-flat legs for easy storage",
      "No assembly required: ready out of the box",
      "Includes dedicated cup holder and tablet slot"
    ],
    cons: [
      "Edge banding may show wear over time",
      "Not height adjustable"
    ],
    buying_verdict: "Perfect for students and WFH professionals looking for a simple, budget-friendly bed desk for daily laptop use and study sessions.",
    audience: ["Students", "Everyday Buyers", "Setup Lovers", "Laptop Gamers", "Budget Seekers"],
    use_case: ["Study", "Productivity", "Work From Home", "Ergonomics"],
    budget_range: ["Under ₹1000", "Under ₹1500"],
    tags: ["laptop table", "study table", "foldable desk", "bed table", "work from home", "student setup", "budget table", "portable stand"],
    sub_category: "Laptop Table",
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1000&auto=format&fit=crop"
    ],
    affiliate_link: "https://www.amazon.in/Multipurpose-Foldable-Breakfast-Portable-Ergonomic/dp/B0GNTD8RYK/ref=sr_1_11?crid=2E34507R8IQ50&dib=eyJ2IjoiMSJ9.GLfdkEXFFkL4lbHQNmIvGhLyTAsb3sDQndtajba6I5kAjrb2vYCTIuezLOS2PZlpiutcs4OxoZdIpdJedNzLZ6SipijBOruXOwRDCo9z710PAW7BiYT4TvzpD8YlJ-Idid_v-AbjpnhonsHR64W3T-B8jguixsRD6YddCoGtBvtlggjj6AVox_hAZzk78kYB3vwhEu17F3kMSmgVq0p6EsTSInN-8ZAQKPunksRLha3ZqU1_h0nsgwvu-7ItEKN2DrlOqVgYEDb2NLkBgxvv8-R0tG97OklzNPJM4Sfw1fU.U7OE7arYjA0b-bmEwcI2fKVtOaqPMiX0uokQ0DgZPKk&dib_tag=se&keywords=Study%2Btable%2B%2F%2Blaptop%2Btable&qid=1780517361&sprefix=study%2Btable%2B%2F%2Blaptop%2Btable%2Caps%2C247&sr=8-11&th=1",
    original_url: "https://www.amazon.in/Multipurpose-Foldable-Breakfast-Portable-Ergonomic/dp/B0GNTD8RYK/ref=sr_1_11?crid=2E34507R8IQ50&dib=eyJ2IjoiMSJ9.GLfdkEXFFkL4lbHQNmIvGhLyTAsb3sDQndtajba6I5kAjrb2vYCTIuezLOS2PZlpiutcs4OxoZdIpdJedNzLZ6SipijBOruXOwRDCo9z710PAW7BiYT4TvzpD8YlJ-Idid_v-AbjpnhonsHR64W3T-B8jguixsRD6YddCoGtBvtlggjj6AVox_hAZzk78kYB3vwhEu17F3kMSmgVq0p6EsTSInN-8ZAQKPunksRLha3ZqU1_h0nsgwvu-7ItEKN2DrlOqVgYEDb2NLkBgxvv8-R0tG97OklzNPJM4Sfw1fU.U7OE7arYjA0b-bmEwcI2fKVtOaqPMiX0uokQ0DgZPKk&dib_tag=se&keywords=Study%2Btable%2B%2F%2Blaptop%2Btable&qid=1780517361&sprefix=study%2Btable%2B%2F%2Blaptop%2Btable%2Caps%2C247&sr=8-11&th=1"
  },
  {
    name: "Callas Engineered Wood Computer Desk with Storage Shelf (ST-09)",
    slug: "callas-engineered-wood-computer-desk-st-09-b0ddh4f8w7",
    asin: "B0DDH4F8W7",
    brand: "Callas",
    description: "The Callas ST-09 is a modern, minimalist computer desk constructed from 17mm thick premium engineered wood, built specifically for home office setups, bedrooms, and dedicated student study corners. Featuring a spacious 90cm x 50cm desktop surface, it offers plenty of room for laptops, monitors, books, and writing pads without occupying too much floor space.\n\nThe desk is designed with smart storage in mind, incorporating an open top shelf/hutch to organize stationery and decorative items, and a spacious bottom storage compartment for CPU units, files, or storage boxes. Sold as a DIY (Do-It-Yourself) kit, it comes with clear instructions and can be easily assembled in 15-20 minutes, offering a stable and stylish workstation that fits into any modern interior.",
    expert_note: "A highly durable and compact study desk that offers the perfect balance of storage and workspace for small rooms. Its 17mm engineered wood build is highly resilient and provides a stable surface for full setups.",
    price_range: "₹1,500 - ₹2,500",
    current_price: 1999,
    old_price: 3999,
    rating: 4.3,
    smart_score: 8.5,
    value_score: 8.4,
    pros: [
      "Sturdy 17mm engineered wood top",
      "Smart compact design with integrated storage shelves",
      "Spacious 90cm x 50cm workspace",
      "Excellent budget option for small rooms"
    ],
    cons: [
      "DIY assembly required",
      "Edges can feel slightly sharp if not handled carefully"
    ],
    buying_verdict: "Ideal for students and remote workers who need a compact, dedicated study table with integrated storage at a budget-friendly price point.",
    audience: ["Students", "Working Professionals", "Office Goers", "Setup Lovers"],
    use_case: ["Study", "Productivity", "Work From Home", "Office Work", "Desk Setup", "Ergonomics"],
    budget_range: ["Under ₹2000", "Under ₹3000"],
    tags: ["computer desk", "writing table", "study desk", "engineered wood table", "office table", "compact desk", "Callas desk", "home office furniture"],
    sub_category: "Study Table",
    images: [
      "https://images.unsplash.com/photo-1519219788971-8d9797e0928e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532372320978-9b4d6a3a854c?q=80&w=1000&auto=format&fit=crop"
    ],
    affiliate_link: "https://www.amazon.in/Callas-Computer-Writing-Bedroom-ST-09-White/dp/B0DDH4F8W7/ref=sr_1_12?crid=2E34507R8IQ50&dib=eyJ2IjoiMSJ9.GLfdkEXFFkL4lbHQNmIvGhLyTAsb3sDQndtajba6I5kAjrb2vYCTIuezLOS2PZlpiutcs4OxoZdIpdJedNzLZ6SipijBOruXOwRDCo9z710PAW7BiYT4TvzpD8YlJ-Idid_v-AbjpnhonsHR64W3T-B8jguixsRD6YddCoGtBvtlggjj6AVox_hAZzk78kYB3vwhEu17F3kMSmgVq0p6EsTSInN-8ZAQKPunksRLha3ZqU1_h0nsgwvu-7ItEKN2DrlOqVgYEDb2NLkBgxvv8-R0tG97OklzNPJM4Sfw1fU.U7OE7arYjA0b-bmEwcI2fKVtOaqPMiX0uokQ0DgZPKk&dib_tag=se&keywords=Study%2Btable%2B%2F%2Blaptop%2Btable&qid=1780517361&sprefix=study%2Btable%2B%2F%2Blaptop%2Btable%2Caps%2C247&sr=8-12&th=1",
    original_url: "https://www.amazon.in/Callas-Computer-Writing-Bedroom-ST-09-White/dp/B0DDH4F8W7/ref=sr_1_12?crid=2E34507R8IQ50&dib=eyJ2IjoiMSJ9.GLfdkEXFFkL4lbHQNmIvGhLyTAsb3sDQndtajba6I5kAjrb2vYCTIuezLOS2PZlpiutcs4OxoZdIpdJedNzLZ6SipijBOruXOwRDCo9z710PAW7BiYT4TvzpD8YlJ-Idid_v-AbjpnhonsHR64W3T-B8jguixsRD6YddCoGtBvtlggjj6AVox_hAZzk78kYB3vwhEu17F3kMSmgVq0p6EsTSInN-8ZAQKPunksRLha3ZqU1_h0nsgwvu-7ItEKN2DrlOqVgYEDb2NLkBgxvv8-R0tG97OklzNPJM4Sfw1fU.U7OE7arYjA0b-bmEwcI2fKVtOaqPMiX0uokQ0DgZPKk&dib_tag=se&keywords=Study%2Btable%2B%2F%2Blaptop%2Btable&qid=1780517361&sprefix=study%2Btable%2B%2F%2Blaptop%2Btable%2Caps%2C247&sr=8-12&th=1"
  },
  {
    name: "Divija Store Foldable Wooden Laptop Bed Desk & Study Table",
    slug: "divija-store-foldable-wooden-laptop-bed-desk-study-table-b0dk77t75n",
    asin: "B0DK77T75N",
    brand: "Divija Store",
    description: "The Divija Store Foldable Laptop bed table is a premium wooden multipurpose utility stand designed for laptops, writing, reading, and casual bedroom breakfast dining. Featuring a durable and moisture-resistant wooden top with smooth rounded edges, this table provides a safe and ergonomic workspace that protects your wrists from sharp corners.\n\nIts design includes sturdy foldable metal legs that slip under beds or behind doors effortlessly, ensuring compact storage when not in use. A built-in cup holder keeps beverages secure during intense work sessions, and the integrated tablet slot comfortably holds smartphones and iPads, making it the perfect accessory for online classes, watching movies, or studying.",
    expert_note: "A well-crafted and versatile wooden bed table that provides excellent stability on soft surfaces. The rounded corner design and anti-slip feet offer superior comfort for students and everyday users.",
    price_range: "₹500 - ₹1,000",
    current_price: 599,
    old_price: 1299,
    rating: 4.2,
    smart_score: 8.3,
    value_score: 8.6,
    pros: [
      "Premium moisture-resistant wooden top",
      "Safe rounded corners to protect wrists",
      "No assembly required: ready for immediate use",
      "Features cup holder and iPad slot"
    ],
    cons: [
      "Leg height is non-adjustable",
      "Cup holder slot is slightly narrow for large mugs"
    ],
    buying_verdict: "A fantastic portable workspace for anyone who enjoys studying, drawing, or working with a laptop comfortably from their bed or sofa.",
    audience: ["Students", "Everyday Buyers", "Setup Lovers", "Budget Seekers"],
    use_case: ["Study", "Productivity", "Work From Home", "Ergonomics", "Lifestyle"],
    budget_range: ["Under ₹1000", "Under ₹1500"],
    tags: ["wooden bed desk", "foldable laptop table", "study table", "Divija table", "portable desk", "bed study tray", "stationery stand"],
    sub_category: "Laptop Table",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1000&auto=format&fit=crop"
    ],
    affiliate_link: "https://www.amazon.in/DIVIJA-STORE-Diwija-Foldable-Wooden/dp/B0DK77T75N/ref=sr_1_9?crid=2E34507R8IQ50&dib=eyJ2IjoiMSJ9.GLfdkEXFFkL4lbHQNmIvGhLyTAsb3sDQndtajba6I5kAjrb2vYCTIuezLOS2PZlpiutcs4OxoZdIpdJedNzLZ6SipijBOruXOwRDCo9z710PAW7BiYT4TvzpD8YlJ-Idid_v-AbjpnhonsHR64W3T-B8jguixsRD6YddCoGtBvtlggjj6AVox_hAZzk78kYB3vwhEu17F3kMSmgVq0p6EsTSInN-8ZAQKPunksRLha3ZqU1_h0nsgwvu-7ItEKN2DrlOqVgYEDb2NLkBgxvv8-R0tG97OklzNPJM4Sfw1fU.U7OE7arYjA0b-bmEwcI2fKVtOaqPMiX0uokQ0DgZPKk&dib_tag=se&keywords=Study%2Btable%2B%2F%2Blaptop%2Btable&qid=1780517361&sprefix=study%2Btable%2B%2F%2Blaptop%2Btable%2Caps%2C247&sr=8-9&th=1",
    original_url: "https://www.amazon.in/DIVIJA-STORE-Diwija-Foldable-Wooden/dp/B0DK77T75N/ref=sr_1_9?crid=2E34507R8IQ50&dib=eyJ2IjoiMSJ9.GLfdkEXFFkL4lbHQNmIvGhLyTAsb3sDQndtajba6I5kAjrb2vYCTIuezLOS2PZlpiutcs4OxoZdIpdJedNzLZ6SipijBOruXOwRDCo9z710PAW7BiYT4TvzpD8YlJ-Idid_v-AbjpnhonsHR64W3T-B8jguixsRD6YddCoGtBvtlggjj6AVox_hAZzk78kYB3vwhEu17F3kMSmgVq0p6EsTSInN-8ZAQKPunksRLha3ZqU1_h0nsgwvu-7ItEKN2DrlOqVgYEDb2NLkBgxvv8-R0tG97OklzNPJM4Sfw1fU.U7OE7arYjA0b-bmEwcI2fKVtOaqPMiX0uokQ0DgZPKk&dib_tag=se&keywords=Study%2Btable%2B%2F%2Blaptop%2Btable&qid=1780517361&sprefix=study%2Btable%2B%2F%2Blaptop%2Btable%2Caps%2C247&sr=8-9&th=1"
  }
];

async function insertProducts() {
  console.log("Logging in as admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Auth failed:", authError.message);
    process.exit(1);
  }
  console.log("Authenticated successfully.");

  for (const product of products) {
    try {
      console.log(`Inserting product: ${product.name}...`);
      
      const payload = {
        name: product.name,
        slug: product.slug,
        asin: product.asin,
        brand: product.brand,
        description: product.description,
        expert_note: product.expert_note,
        price_range: product.price_range,
        current_price: product.current_price,
        old_price: product.old_price,
        currency: "INR",
        rating: product.rating,
        smart_score: product.smart_score,
        value_score: product.value_score,
        pros: product.pros,
        cons: product.cons,
        buying_verdict: product.buying_verdict,
        audience: product.audience,
        use_case: product.use_case,
        budget_range: product.budget_range,
        tags: product.tags,
        sub_category: product.sub_category,
        images: product.images,
        affiliate_link: product.affiliate_link,
        original_url: product.original_url,
        primary_category_id: OFFICE_FURNITURE_ID, // Office Furniture & Comfort
        status: "published",
        approval_status: "published",
        show_on_homepage: true,
        show_in_deals: true,
        featured: true,
        trending: true,
        import_source: "manual",
        price_is_fresh: true,
        price_source: "manual",
        last_price_checked_at: new Date().toISOString()
      };

      // Check if product already exists with ASIN
      const { data: existing, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('asin', product.asin);

      let productId;
      
      if (existing && existing.length > 0) {
        console.log(`Product with ASIN ${product.asin} already exists. Updating it instead.`);
        productId = existing[0].id;
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId);
          
        if (updateError) {
          console.error(`Failed to update ${product.name}:`, updateError.message);
          continue;
        }
      } else {
        const { data: newProd, error: insertError } = await supabase
          .from('products')
          .insert([payload])
          .select('id')
          .single();

        if (insertError || !newProd) {
          console.error(`Failed to insert ${product.name}:`, insertError ? insertError.message : "No data returned");
          continue;
        }
        
        productId = newProd.id;
      }

      console.log(`Linked product ID: ${productId}`);

      // Link to categories
      // First delete existing maps
      await supabase.from('product_categories').delete().eq('product_id', productId);

      // Insert mappings for all target categories
      const categoryMappings = categoryIds.map(catId => ({
        product_id: productId,
        category_id: catId
      }));

      const { error: mappingError } = await supabase
        .from('product_categories')
        .insert(categoryMappings);

      if (mappingError) {
        console.error(`Failed to link categories for ${product.name}:`, mappingError.message);
      } else {
        console.log(`Linked categories successfully for: ${product.name}`);
      }

      // Add default price history
      await supabase.from('price_history').insert([{
        product_id: productId,
        old_price: product.old_price,
        new_price: product.current_price,
        currency: "INR",
        source: "manual",
        note: "Initial upload via script"
      }]);
      console.log("Price history added.");

    } catch (e) {
      console.error(`Error processing ${product.name}:`, e);
    }
  }

  console.log("All products successfully listed!");
}

insertProducts();
