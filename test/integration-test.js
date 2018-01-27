'use strict';

const fs = require('fs');
const path = require('path');
const urljoin = require('url-join');
const expect = require('chai').expect;

const app = require('../app');
const api = require('supertest')(app);
const testServer = require('./server');

const serviceBase = 'http://localhost:8080';

describe('cds prefetch proxy', function () {
    var server;

    beforeEach(function () {
        server = testServer.listen(8080);
    });

    afterEach(function (done) {
        server.close(done);
    });

    describe('POST /:actualServiceUrl/cds-services/:serviceId/analytics/:uuid', function () {
        const apiEndpoint = urljoin('', encodeURIComponent(serviceBase), '/cds-services/sample-service/analytics/');

        it('should forward the call to the upstream service and return the response to the client', function (done) {
            api.post(urljoin(apiEndpoint, '5ae4b91')).expect(204, done);
        });

        it('should return a 502 failure when there is an error with the upstream service', function (done) {
            api.post(urljoin(apiEndpoint, 'error'))
                .expect(502)
                .expect('Internal Server Error')
                .end(done);
        });
    });

    describe('GET /:actualServiceUrl/cds-services', function () {
        const apiEndpoint = urljoin('', encodeURIComponent(serviceBase), '/cds-services');

        afterEach(function () {
            testServer.setServiceResult(200);
        });

        it('should forward the call to the upstream service and return the response to the client', function (done) {
            testServer.setServiceResult(200);
            api.get(apiEndpoint)
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function (res) {
                    expect(res.body.services).to.be.an('array');
                    expect(res.body.services).to.not.be.empty; // eslint-disable-line no-unused-expressions
                })
                .end(done);
        });

        it('should return a 502 failure when the upstream service returns invalid json', function (done) {
            testServer.setServiceResult(502);

            api.get(apiEndpoint)
                .set('Accept', 'application/json')
                .expect(502)
                .end(done);
        });

        it('should return a 502 failure when there is an error with the upstream service', function (done) {
            testServer.setServiceResult(500);

            api.get(apiEndpoint)
                .set('Accept', 'application/json')
                .expect(502)
                .expect('Internal Server Error')
                .end(done);
        });
    });

    describe('POST /:actualServiceUrl/cds-services/:serviceId', function () {
        const apiEndpoint = urljoin('', encodeURIComponent(serviceBase), '/cds-services');
        var serviceRequest;

        beforeEach(function (done) {
            fs.readFile(path.join(__dirname, '/fixtures/service-request.json'), function (err, data) {
                if (err) {
                    throw err;
                }
                serviceRequest = JSON.parse(data);
                done();
            });
        });

        it('should forward the call to the upstream service and return the response to the client', function (done) {
            api.post(urljoin(apiEndpoint, '/success'))
                .set('Accept', 'application/json')
                .send(serviceRequest)
                .expect(200)
                .expect({
                    cards: [{
                        summary: 'Success Card',
                        detail: '',
                        source: {
                            label: 'Static CDS Service',
                            url: 'http://example.com'
                        },
                        indicator: 'success'
                    }]
                })
                .end(done);
        });

        it('should return a 400 failure when the client sends an invalid service request', function (done) {
            api.post(urljoin(apiEndpoint, '/invalid'))
                .set('Accept', 'application/json')
                .send({foo: 'bar'})
                .expect(400, done);
        });

        it('should return a 404 failure when the client tries to proxy a service that isnt discoverable', function (done) {
            api.post(urljoin(apiEndpoint, '/not-exist'))
                .set('Accept', 'application/json')
                .send(serviceRequest)
                .expect(404, done);
        });

        it('should return a 502 failure when the upstream service returns invalid json', function (done) {
            api.post(urljoin(apiEndpoint, '/invalid'))
                .set('Accept', 'application/json')
                .send(serviceRequest)
                .expect(502, done);
        });

        it('should not query the fhir server if prefetch data is included with the service request', function (done) {
            api.post(urljoin(apiEndpoint, '/patient'))
                .set('Accept', 'application/json')
                .send(serviceRequest)
                .expect(200)
                .expect(function (res) {
                    expect(res.body.cards[0].detail).to.equal('1288992');
                })
                .end(done);
        });

        it('should query the fhir server if prefetch data is missing from the service request', function (done) {
            delete serviceRequest.prefetch;

            api.post(urljoin(apiEndpoint, '/patient'))
                .set('Accept', 'application/json')
                .send(serviceRequest)
                .expect(function (res) {
                    expect(res.body.cards[0].detail).to.equal('1288992');
                })
                .expect(200, done);
        });

        it('should return a 502 failure when there is an error with the upstream service', function (done) {
            api.post(urljoin(apiEndpoint, '/500'))
                .set('Accept', 'application/json')
                .send(serviceRequest)
                .expect(502)
                .expect('Internal Server Error')
                .end(done);
        });
    });
});
