const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// Define a route for the root URL
app.get('/', (req, res) => {
    res.send('Hello from your Express server!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});