/*const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');

axios.get('https://en.wikipedia.org/wiki/Zionism')
  .then(response => {
   
    const $ = cheerio.load(response.data);
    const title = $('h1').text();
     console.log(`Page Title:${title}`);
    // Scrape data using cheerio
$('a').each((index, element) => {
    const link=$(element).attr('href');
    const linkText=$(element).text().trim();
    if (link && link.startsWith('/wiki/')){
        console.log(`${linkText}: https://en.wikipedia.org${link}`)
    }
});

  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
  */


  /*
 const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Scrape Wikipedia for internal links and export to CSV
axios.get('https://en.wikipedia.org/wiki/Zionism')
  .then(response => {
    const $ = cheerio.load(response.data);
    const title = $('h1').text();
    console.log(`Page Title: ${title}`);

    let results = [];
    $('a').each((index, element) => {
      const link = $(element).attr('href');
      const linkText = $(element).text().trim();
      if (link && link.startsWith('/wiki/') && linkText) {
        results.push({ text: linkText, url: `https://en.wikipedia.org${link}` });
      }
    });

    // Prepare CSV content
    const csvContent = "LinkText,URL\n" + results.map(r => 
      `"${r.text.replace(/"/g, '""')}","${r.url}"`
    ).join('\n');

    fs.writeFileSync('wiki_links.csv', csvContent);
    console.log(`✅ CSV saved as wiki_links.csv (${results.length} links)`);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
*/
/*
document.getElementById('scrape-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const url = document.getElementById('url').value;
  const selector = document.getElementById('selector').value;
  const field = document.getElementById('field').value;
  document.getElementById('msg').textContent = 'Scraping...';

  try {
    // Fetch the HTML (works only if CORS is allowed)
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Select all items
    const items = Array.from(doc.querySelectorAll(selector));
    let rows = [["Text", "Link"]];
    items.forEach(el => {
      let target = el.querySelector(field) || el;
      let text = target.textContent.trim();
      let link = target.href || '';
      rows.push([text, link]);
    });

    // Convert to CSV
    let csv = rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    let blob = new Blob([csv], {type: "text/csv"});
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "scraped.csv";
    a.click();
    document.getElementById('msg').textContent = `Done! Downloaded ${rows.length-1} rows.`;
  } catch (err) {
    document.getElementById('msg').textContent = 'Error: ' + err.message;
  }
});
*/
const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // serve HTML from same folder
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/scraper.html'); // serve index.html
});
app.post('/scrape', async (req, res) => {
  let { url, selector, field, chunk } = req.body;
  chunk = parseInt(chunk) || 50; // Default to 50 if not given

  if (!url || !selector || !field) {
    return res.status(400).send('Missing criteria.');
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const items = $(selector);
    let rows = [["Text", "Link"]];
    let count = 0;

    items.each((i, el) => {
      if (rows.length > chunk) return false;
      let target = $(el).find(field).length ? $(el).find(field) : $(el);
      let text = target.text().trim().replace(/\s+/g, ' ');
      let link = target.attr('href') || '';
      if (text) rows.push([text, link || '']);
    });

    let csv = rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename=scraped_chunk.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);

  } catch (err) {
    res.status(500).send('Error scraping: ' + err.message);
  }
});


app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
