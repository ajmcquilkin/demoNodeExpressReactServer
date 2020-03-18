var express = require('express');
var path = require('path');

const app = express();

// https://dev.to/loujaybee/using-create-react-app-with-express
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/react', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(8080);