var express = require('express');
var path = require('path');
var serveStatic = require('serve-static');

const app = express();

// app.use(serveStatic('/build', { 'index': 'index.html' }));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/react', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
  console.log(res);
});

app.listen(8080);