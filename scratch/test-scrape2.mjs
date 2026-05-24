import * as cheerio from 'cheerio';
import fs from 'fs';

async function testScrape(url) {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
