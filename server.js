const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret_key', resave: false, saveUninitialized: true }));

// Load content and credentials
const contentFile = 'content.json';
const configFile = 'config.json';

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

    if (username === config.username && bcrypt.compareSync(password, config.password)) {
        req.session.user = username;
        return res.redirect('/admin.html');
    }

    res.send('Invalid credentials. <a href="/login.html">Try again</a>');
});

// Update website content
app.post('/update', (req, res) => {
    if (!req.session.user) return res.send('Unauthorized. <a href="/login.html">Login</a>');

    const newContent = {
        home: req.body.home,
        about: req.body.about,
        skills: req.body.skills,
        links: req.body.links,
        contact: req.body.contact,
        achievements: req.body.achievements
    };

    fs.writeFileSync(contentFile, JSON.stringify(newContent, null, 4));
    res.send('Content updated! <a href="/admin.html">Back</a>');
});

// Change password
app.post('/change-password', (req, res) => {
    if (!req.session.user) return res.send('Unauthorized. <a href="/login.html">Login</a>');

    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    if (!bcrypt.compareSync(req.body.old_password, config.password)) {
        return res.send('Incorrect old password. <a href="/admin.html">Back</a>');
    }

    config.password = bcrypt.hashSync(req.body.new_password, 10);
    fs.writeFileSync(configFile, JSON.stringify(config, null, 4));

    res.send('Password changed successfully! <a href="/admin.html">Back</a>');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
