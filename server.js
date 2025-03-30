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
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

// Load credentials
const credentialsPath = path.join(__dirname, 'credentials.json');
let credentials = { userid: "admin", password: "password" };

if (fs.existsSync(credentialsPath)) {
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} else {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
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

//Serve admin page if logged in
app.get('/admin', (req, res) => {
    if (!req.session.user) {
        res.send('invalid url! <a href="/login">To login</a>');
        return res.redirect('/login');
        alert('You must be logged in to access this page.');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


// Handle content updates
app.post('/update', (req, res) => {
    if (!req.session.user) {
        return res.status(403).send('Unauthorized');
    }

    const updates = {
        'index.html': generateHTML('Home', req.body.home),
        'about.html': generateHTML('About Me', req.body.about),
        'skills.html': generateHTML('Skills', req.body.skills),
        'links.html': generateHTML('Links', req.body.links),
        'contact.html': generateHTML('Contact', req.body.contact),
        'achievements.html': generateHTML('Achievements', req.body.achievements),
    };

    for (const [file, content] of Object.entries(updates)) {
        fs.writeFileSync(path.join(__dirname, 'public', file), content);
    }

    res.send('Content updated! <a href="/admin">Go back</a>');
});

// Handle password change
app.post('/change-password', (req, res) => {
    if (!req.session.user) {
        return res.status(403).send('Unauthorized');
    }

    const { old_password, new_password } = req.body;

    if (old_password !== credentials.password) {
        return res.send('Incorrect old password! <a href="/admin">Try again</a>');
    }

    credentials.password = new_password;
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
    res.send('Password changed successfully! <a href="/admin">Go back</a>');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out! <a href="/login">Login again</a>');
});

// Function to generate updated HTML content
function generateHTML(title, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <a href="index.html">Home</a> |
        <a href="about.html">About Me</a> |
        <a href="skills.html">Skills</a> |
        <a href="links.html">Links</a> |
        <a href="contact.html">Contact</a> |
        <a href="achievements.html">Achievements</a>
    </nav>
    <div class="container">
        <h1>${title}</h1>
        <p>${content}</p>
    </div>
</body>
</html>`;
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
