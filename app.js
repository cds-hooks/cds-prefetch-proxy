'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

var routes = require('./lib/routes');

app.use(bodyParser.json());
app.use('/', routes);

module.exports = app;
