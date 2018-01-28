# cds-prefetch-proxy

[![Build Status](https://travis-ci.org/cds-hooks/cds-prefetch-proxy.svg?branch=master)](https://travis-ci.org/cds-hooks/cds-prefetch-proxy)
[![devDependency Status](https://david-dm.org/cds-hooks/cds-prefetch-proxy.svg)](https://david-dm.org/cds-hooks/cds-prefetch-proxy)

A generic proxy that takes the URL of an underlying service, and exposes a gateway in front of it.

This service exposes the CDS API calls and forwards them to the underlying service. In cases that preFetch data are expected, but not present, the proxy will assemble the required `preFetchData`.

Where possible, the proxy uses the [CDS Validator](https://github.com/cds-hooks/cds-validator) library to validate the schemas of the requests or responses.

Tests for the API methods written cover the following expected behaviors:

```text
GET /:actualServiceUrl/cds-services
  ✓ should forward the call to the upstream service and return the response to the client
  ✓ should return a 502 failure when the upstream service returns invalid json
  ✓ should return a 502 failure when there is an error with the upstream service

POST /:actualServiceUrl/cds-services/:serviceId
  ✓ should forward the call to the upstream service and return the response to the client
  ✓ should return a 400 failure when the client sends an invalid service request
  ✓ should return a 404 failure when the client tries to proxy a service that isnt discoverable
  ✓ should return a 502 failure when the upstream service returns invalid json
  ✓ should return a 502 failure when there is an error with the upstream service
  ✓ should not query the fhir server if prefetch data is included with the service request
  ✓ should query the fhir server if prefetch data is missing from the service request

POST /:actualServiceUrl/cds-services/:serviceId/analytics/:uuid
  ✓ should forward the call to the upstream service and return the response to the client
  ✓ should return a 502 failure when there is an error with the upstream service
```

## Example
The underlying service MUST be specified as the first segment of the request path and must be url encoded. To set up this proxy on localhost to forward to the CDS Hooks sandbox at https://fhir-org-cds-services.appspot.com/, use the following request:

```
$ npm start
$ curl http://localhost:3000/https%3A%2F%2Ffhir-org-cds-services.appspot.com/cds-services

{"services":[{"hook":"medication-prescribe","name":"Random grab-bag of mock services","title":"Random grab-bag of mock services","description":"Generate a bunch of cards for various reasons","id":"pediatric-dose-check","prefetch":{"patient":"Patient/{{Patient.id}}"}},{"name":"CMS Pricing Service","title":"CMS Pricing Service","id":"cms-price-check","description":"Estimate the price of a prescription based on historical pharmacy dispensing data","hook":"medication-prescribe"},{"id":"patient-hello-world","name":"Patient hello world","title":"Patient hello world","description":"Greet patient by name","hook":"patient-view","prefetch":{"patientToGreet":"Patient/{{Patient.id}}"}}]}

$
```

## Deployment
This proxy service can be deployed with Docker. By default, the Dockerfile exposes port 3000. Creating the Docker container can be done by:

```bash
$ docker build -t <your-name>/cds-hooks-prefetch-proxy .
Successfully built <container-id>

$ docker run -p 3000:3000 -d <your-name>/cds-hooks-prefetch-proxy npm start
```
