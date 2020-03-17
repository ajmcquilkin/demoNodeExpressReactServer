var express = require('express');
var path = require('path');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(8080);