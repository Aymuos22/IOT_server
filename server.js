// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize the Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

let latestData = { peopleCount: 0, temperature: 0 };

// Route to handle receiving data from ESP8266
app.post('/update', (req, res) => {
  // Extract data from the request body
  const { peopleCount, temperature } = req.body;

  if (peopleCount === undefined || temperature === undefined) {
    return res.status(400).json({ error: 'Invalid data format. Ensure `peopleCount` and `temperature` are provided.' });
  }

  console.log(`Received data: People Count - ${peopleCount}, Temperature - ${temperature}`);

  // Update the latest data
  latestData = { peopleCount, temperature };

  // Respond with the current status
  res.status(200).json({
    message: 'Data received successfully',
    status: {
      peopleInRoom: peopleCount,
      temperature: temperature
    }
  });
});

// Route to render the webpage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Room Status</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f9;
          color: #333;
        }

        .container {
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
          text-align: center;
          color: #2c3e50;
        }

        .data {
          margin-top: 20px;
          font-size: 18px;
        }

        .data p {
          margin: 10px 0;
          padding: 10px;
          background: #ecf0f1;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
        }

        .data p strong {
          color: #2980b9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Room Status</h1>
        <div class="data">
          <p><strong>People in Room:</strong> ${latestData.peopleCount}</p>
          <p><strong>Temperature:</strong> ${latestData.temperature} &#8451;</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
