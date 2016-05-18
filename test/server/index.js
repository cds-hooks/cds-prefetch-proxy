const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.post('/cds-services/:serviceId/analytics/:uuid', function(req, res) {
  if (req.params.uuid === 'error') {
    return res.status(500).send('Internal Server Error');
  }

  res.status(204).end();
});

app.post('/cds-services/:serviceId', function(req, res) {
  if (req.params.serviceId === '500') {
    return res.status(500).send('Internal Server Error');
  }

  readFile('/data/' + req.params.serviceId + '-card.json', function(data) {
    if (req.params.serviceId === 'patient') { data.cards[0].detail = req.body.prefetch.patient.resource.id; }
    res.json(data);
  });
});

app.get('/Patient/:id', function(req, res) {
  readFile('/data/patient-resource.json', function(data) {
    data.resource.id = req.params.id;
    res.json(data);
  });
});

app.get('/cds-services', function(req, res) {
  readFile('/data/services.json', function(data) {
    res.json(data);
  });
});

app.setServiceResult = function(code) {
  var routes = app._router.stack;
  routes.forEach(function(route, i, routes) {
    if (route.route && route.route.path === '/cds-services') {
      routes.splice(i, 1);
    }
  });

  if (code === 500) {
    app.get('/cds-services', function(req, res) {
      res.status(500).send('Internal Server Error');
    });
  } else if (code == 502) {
    app.get('/cds-services', function(req, res) {
      readFile('/data/invalid-services.json', function(data) {
        res.json(data);
      });
    });
  } else {
    app.get('/cds-services', function(req, res) {
      readFile('/data/services.json', function(data) {
        res.json(data);
      });
    });
  }
};

function readFile(file, cb) {
  fs.readFile(__dirname + file, function(err, data) {
    if(err) throw err;
    return cb(JSON.parse(data));
  });
}

module.exports = app;
