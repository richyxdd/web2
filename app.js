const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection URI
const uri = 'mongodb+srv://rmalloy22:jomama1256@cluster0.jqtai6u.mongodb.net/stock?retryWrites=true&w=majority';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Search logic
async function searchCompanies(searchTerm) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('stock');
    const collection = db.collection('PublicCompanies');

    const query = {
      $or: [
        { company: new RegExp(searchTerm, 'i') },
        { ticker: new RegExp(searchTerm, 'i') }
      ]
    };

    const results = await collection.find(query).toArray();
    return results;
  } catch (err) {
    console.error("Error during search:", err);
    return [];
  } finally {
    await client.close();
  }
}

// Root route – Search form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Company Search</title>
      </head>
      <body>
        <h1>Search for Companies</h1>
        <form method="GET" action="/process">
          <label for="searchTerm">Enter company name or ticker:</label><br>
          <input type="text" id="searchTerm" name="searchTerm" required><br><br>
          <button type="submit">Search</button>
        </form>
      </body>
    </html>
  `);
});

// Search results route
app.get('/process', async (req, res) => {
  const searchTerm = req.query.searchTerm;

  if (!searchTerm || searchTerm.trim() === '') {
    return res.send(`
      <h1>Search Results</h1>
      <p>Please enter a search term.</p>
      <p><a href="/">Back to search</a></p>
    `);
  }

  const results = await searchCompanies(searchTerm.trim());

  let resultHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Search Results</title>
      </head>
      <body>
        <h1>Search Results</h1>
  `;

  if (results.length > 0) {
    results.forEach(result => {
      const priceDisplay = result.price?.$numberDouble || result.price || 'N/A';
      resultHTML += `<p>Company: ${result.company}, Ticker: ${result.ticker}, Price: $${priceDisplay}</p>`;
    });
  } else {
    resultHTML += `<p>No results found for "${searchTerm}".</p>`;
  }

  resultHTML += `<p><a href="/">Back to search</a></p></body></html>`;
  res.send(resultHTML);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
