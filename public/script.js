// script.js - Fetch and display dynamic content
document.addEventListener("DOMContentLoaded", function () {
    fetch("/content.json")
        .then(response => response.json())
        .then(data => {
            document.getElementById("home-content").innerText = data.home;
            document.getElementById("about-content").innerText = data.about;
            document.getElementById("skills-content").innerText = data.skills;
            document.getElementById("links-content").innerText = data.links;
            document.getElementById("contact-content").innerText = data.contact;
            document.getElementById("achievements-content").innerText = data.achievements;
        })
        .catch(error => console.error("Error fetching content:", error));
});
