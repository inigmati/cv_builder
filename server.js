const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

// Load credentials
const credentialsPath = path.join(__dirname, 'credentials.json');
let credentials = { userid: "admin", password: "password" };
if (fs.existsSync(credentialsPath)) {
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} else {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
}

// Load and save content
const contentPath = path.join(__dirname, 'content.json');
let content = {};
if (fs.existsSync(contentPath)) {
    content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
} else {
    content = {
        home: "Welcome to my 90s-style resume website!",
        about: "[A short paragraph about yourself]",
        skills: "[Skill 1], [Skill 2], [Skill 3]",
        links: "[GitHub], [LinkedIn]",
        contact: "[your.email@example.com], [Your Phone]",
        achievements: "[Achievement 1], [Achievement 2]"
    };
    fs.writeFileSync(contentPath, JSON.stringify(content));
}

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login request
app.post('/login', (req, res) => {
    const { userid, password } = req.body;
    if (userid === credentials.userid && password === credentials.password) {
        req.session.user = userid;
        res.redirect('/admin');
    } else {
        res.send('Invalid credentials! <a href="/login">Try again</a>');
    }
});

// Serve admin page
app.get('/admin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fetch content for admin panel
app.get('/get-content', (req, res) => {
    res.json(content);
});

// Handle content updates
app.post('/update', (req, res) => {
    if (!req.session.user) {
        return res.status(403).send('Unauthorized');
    }
    content = { ...content, ...req.body };
    fs.writeFileSync(contentPath, JSON.stringify(content));
    res.json({ message: "Content updated successfully" });
});

// Serve content for website
app.get('/content', (req, res) => {
    res.json(content);
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out! <a href="/login">Login again</a>');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
