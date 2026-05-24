import * as cheerio from 'cheerio';
import fs from 'fs';

async function testScrape(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const title = $('#productTitle').text().trim();
    const features = $('#feature-bullets ul li span.a-list-item').map((i, el) => $(el).text().trim()).get();
    
    console.log("Status Code:", res.status);
    console.log("Title:", title);
    console.log("Features:", features);
  } catch(e) {
    console.error(e);
  }
}

testScrape('https://www.amazon.in/dp/B0B296NTFV');
