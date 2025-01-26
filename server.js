const express = require('express');
const app = express();

// Serve static files (optional, if you have HTML/CSS/JS)
app.use(express.static('public'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Hello, Heroku!');
});

// Dynamic Port for Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

