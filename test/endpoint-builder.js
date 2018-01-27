'use strict';

const builder = require('../lib/endpoint-builder.js');
const expect = require('chai').expect;

describe('endpoint builder', function () {
    it('should append cds-services to base', function () {
        expect(builder('http://localhost')).to.equal('http://localhost/cds-services');
    });

    it('should append param string', function () {
        expect(builder('http://localhost', 'param')).to.equal('http://localhost/cds-services/param');
    });

    it('should append param array', function () {
        expect(builder('http://localhost', ['1', '2', 3])).to.equal('http://localhost/cds-services/1/2/3');
    });

    it('should append param object', function () {
        var Param = function (val) {
            this.val = val;
        };
        Param.prototype.toString = function () {
            return this.val;
        };

        expect(builder('http://localhost', new Param('objValue'))).to.equal('http://localhost/cds-services/objValue');
    });

    it('should add proto if no slashes present', function () {
        expect(builder('localhost:9000')).to.equal('https://localhost:9000/cds-services');
    });
});
