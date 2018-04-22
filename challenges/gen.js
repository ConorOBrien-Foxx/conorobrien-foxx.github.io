#!/usr/bin/node

const fs = require("fs");
const glob = require("glob");
const md = require("markdown-it")();
const mk = require("markdown-it-katex");
md.use(mk);

const genPage = (name, body) => 
`<!DOCTYPE html>
<html lang="en">
<head>
    <title>${name}</title>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/github-markdown-css/2.2.1/github-markdown.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css">
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
${body}
</body>`;

// fs.writeFileSync("index.html", HEAD + md.render("# Hello, Cruel World!\nI like $e=mc^2$ very much.") + TAIL);

let indices = [];

glob("./*.md", (err, files) => {
    if(err) throw err;
    let i = 1;
    files.forEach(file => {
        let data = fs.readFileSync(file).toString();
        
        let name = data.match(/#\s*(.+?)$/m)[1];
        let date = data.match(/##\s*(.+?)$/m)[1]
        let linkName = name.replace(/\s+/g, "-").toLowerCase() + ".html";
        
        let result = genPage(name, md.render(data));
        
        fs.writeFileSync(linkName, result);
        
        indices.push(`${i++}. [${name}](${linkName}) - ${date}`);
    });

    let inner = "";
    
    inner += "# Index of challenges\n";
    inner += indices.join("\n");
    
    res = genPage("Challenges", md.render(inner));

    fs.writeFileSync("index.html", res);    
    
});