const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use('/cv', express.static(path.join(__dirname, 'public/cv')));
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

// Serve homepage (outside CV section)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
            <link rel="stylesheet" href="/cv/style.css">
        </head>
        <body>
            <h1>Welcome</h1>
            <a href="/cv/index.html">Click for CV</a>
        </body>
        </html>
    `);
});

// Serve login page
app.get('/cv/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/cv', 'login.html'));
});

// Handle login request
app.post('/cv/login', (req, res) => {
    const { userid, password } = req.body;
    if (userid === credentials.userid && password === credentials.password) {
        req.session.user = userid;
        res.redirect('/cv/admin');
    } else {
        res.send('Invalid credentials! <a href="/cv/login">Try again</a>');
    }
});

// Serve admin page if logged in
app.get('/cv/admin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/cv/login');
    }
    res.sendFile(path.join(__dirname, 'public/cv', 'admin.html'));
});

// Handle content updates
app.post('/cv/update', (req, res) => {
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
        fs.writeFileSync(path.join(__dirname, 'public/cv', file), content);
    }

    res.send('Content updated! <a href="/cv/admin">Go back</a>');
});

// Handle password change
app.post('/cv/change-password', (req, res) => {
    if (!req.session.user) {
        return res.status(403).send('Unauthorized');
    }

    const { old_password, new_password } = req.body;

    if (old_password !== credentials.password) {
        return res.send('Incorrect old password! <a href="/cv/admin">Try again</a>');
    }

    credentials.password = new_password;
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
    res.send('Password changed successfully! <a href="/cv/admin">Go back</a>');
});

// Logout route
app.get('/cv/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out! <a href="/cv/login">Login again</a>');
});

// Function to generate updated HTML content
function generateHTML(title, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/cv/style.css">
</head>
<body>
    <nav>
        <a href="/cv/index.html">Home</a> |
        <a href="/cv/about.html">About Me</a> |
        <a href="/cv/skills.html">Skills</a> |
        <a href="/cv/links.html">Links</a> |
        <a href="/cv/contact.html">Contact</a> |
        <a href="/cv/achievements.html">Achievements</a>
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
