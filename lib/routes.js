'use strict';

var express = require('express');
var router = express.Router();

var rp = require('request-promise');
var urljoin = require('url-join');

router.post('/:actualServiceUrl/cds-services/:serviceId/analytics/:uuid', function(req, res) {
  var endpoint = urljoin(req.params.actualServiceUrl, 'cds-services', req.params.serviceId, 'analytics', req.params.uuid);

  rp.post(endpoint).then(function() {
    res.status(204).end();
  })
  .catch(function(err) {
    res.status(502).send(err.error);
  });
});

router.get('/:actualServiceUrl/cds-services', function(req, res) {
  const validate = require('cds-validator').DiscoveryResponse;
  var endpoint = urljoin(req.params.actualServiceUrl, 'cds-services');

  rp.get(endpoint).then(function(body) {
    return validate(body).catch(function(err) {
      res.status(502).send(err);
    });
  })
  .then(function(obj) {
    res.json(obj);
  })
  .catch(function(err) {
    res.status(502).send(err.error);
  });
});

router.post('/:actualServiceUrl/cds-services/:serviceId', function routeHandler(req, res) {
  const validate = require('cds-validator').ServiceRequest;
  validate(req.body).then(function() {
    return rp(urljoin(req.params.actualServiceUrl, 'cds-services')).then(function(body) {
      var service = JSON.parse(body).services.filter(function(el) {
        return el.id === req.params.serviceId;
      })[0];

      if (!service) { throw new ServiceNotFoundError(req.params.serviceId); }

      var servicePrefetch = service.prefetch;
      var promises = [];

      if (servicePrefetch) {
        Object.keys(service.prefetch).forEach(function(key) {
          if (!req.body.prefetch || !req.body.prefetch[key]) {
            var resource = service.prefetch[key].replace(/\{\{Patient.id\}\}/, req.body.patient);

            promises.push(rp(urljoin(req.body.fhirServer, resource)).then(function(body) {
              if (!req.body.prefetch) { req.body.prefetch = {}; }
              req.body.prefetch[key] = JSON.parse(body);
            }));
          }
        });
      }

      return Promise.all(promises);
    });
  })
  .then(function() {
    var endpoint = urljoin(req.params.actualServiceUrl, 'cds-services', req.params.serviceId);
    return rp.post({
      uri: endpoint,
      body: req.body,
      json: true
    })
    .then(function(data) {
      const validate = require('cds-validator').Card;
      return validate(data);
    })
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      res.status(502).send(err.error);
    });
  })
  .catch(function(err) {
    if (err instanceof ServiceNotFoundError) {
      return res.status(404).end();
    }

    return res.status(400).send(err);
  });
});

function ServiceNotFoundError(serviceId) {
  this.name = 'ServiceNotFoundError';
  this.message = (serviceId || '');
}
ServiceNotFoundError.prototype = Error.prototype;

module.exports = router;
