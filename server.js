const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Initialize the Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

let latestData = { peopleCount: 0, temperature: 0 };

// Route to handle receiving data from ESP8266
app.post('/update', (req, res) => {
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
      temperature: temperature,
    },
  });
});

// Route to reset data
app.post('/reset', (req, res) => {
  latestData = { peopleCount: 0, temperature: 0 };
  console.log('Data reset to initial values.');
  res.status(200).json({ message: 'Data has been reset.', latestData });
});

// Serve the static files for the client
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API to fetch the latest data
app.get('/data', (req, res) => {
  res.json(latestData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Client-side code
const clientCode = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Room Status</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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

    canvas {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Room Status</h1>
    <div class="data">
      <p><strong>People in Room:</strong> <span id="peopleCount">0</span></p>
      <p><strong>Temperature:</strong> <span id="temperature">0</span> &#8451;</p>
    </div>
    <canvas id="temperatureChart" width="400" height="200"></canvas>
  </div>

  <script>
    const peopleCountElem = document.getElementById('peopleCount');
    const temperatureElem = document.getElementById('temperature');

    const ctx = document.getElementById('temperatureChart').getContext('2d');
    const temperatureData = {
      labels: [],
      datasets: [{
        label: 'Temperature (°C)',
        data: [],
        borderColor: '#2980b9',
        borderWidth: 2,
        fill: false,
      }],
    };

    const temperatureChart = new Chart(ctx, {
      type: 'line',
      data: temperatureData,
      options: {
        scales: {
          x: { title: { display: true, text: 'Time' } },
          y: { title: { display: true, text: 'Temperature (°C)' } },
        },
      },
    });

    async function fetchData() {
      try {
        const response = await fetch('/data');
        const { peopleCount, temperature } = await response.json();

        // Update the displayed data
        peopleCountElem.textContent = peopleCount;
        temperatureElem.textContent = temperature;

        // Add data to the chart
        const time = new Date().toLocaleTimeString();
        temperatureData.labels.push(time);
        temperatureData.datasets[0].data.push(temperature);

        // Limit data points to 10 for clarity
        if (temperatureData.labels.length > 10) {
          temperatureData.labels.shift();
          temperatureData.datasets[0].data.shift();
        }

        temperatureChart.update();

        // Show alert if people count exceeds capacity
        if (peopleCount > 5) {
          alert('Capacity exceeded!');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    // Fetch data periodically
    setInterval(fetchData, 2000);
  </script>
</body>
</html>
`;

fs.writeFileSync('index.html', clientCode);
