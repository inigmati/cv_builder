const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 600000 }
}));

// Load credentials
const credentialsPath = path.join(__dirname, 'credentials.json');
let credentials = { userid: "admin", password: "password" };

if (fs.existsSync(credentialsPath)) {
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} else {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
}

// Authentication middleware
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    next();
}

// Serve admin page only if logged in
app.get('/admin', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { userid, password } = req.body;
    if (userid === credentials.userid && password === credentials.password) {
        req.session.user = userid;
        res.redirect('/admin');
    } else {
        res.status(401).send("Invalid credentials. <a href='/login.html'>Try again</a>");
    }
});

// Prevent direct access to admin.html
app.use((req, res, next) => {
    if (req.path === '/admin.html') {
        return res.status(403).send('Forbidden');
    }
        next();
});

// Handle content updates
app.post('/update', requireLogin, (req, res) => {
    const updates = {
        'index.html': generateHTML('Home', req.body.home),
        'about.html': generateHTML('About Me', req.body.about),
        'skills.html': generateHTML('Skills', req.body.skills),
        'links.html': generateHTML('Links', req.body.links),
        'contact.html': generateHTML('Contact', req.body.contact),
        // 'achievements.html': generateHTML('Achievements', req.body.achievements),
    };

    for (const [file, content] of Object.entries(updates)) {
        fs.writeFileSync(path.join(__dirname, 'public', file), content);
    }

    res.send('Content updated! <a href="/admin">Go back</a>');
});

// Serve public files
app.use(express.static('public'));

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out! <a href="/login.html">Login again</a>');
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

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
