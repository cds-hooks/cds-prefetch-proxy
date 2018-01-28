var urljoin = require('url-join');
var parse = require('url-parse');

module.exports = function (base, params) {
    var endpoint = urljoin(base, 'cds-services');

    if (typeof params === 'string') {
        endpoint = urljoin(endpoint, params);
    } else if (Array.isArray(params)) {
        params.forEach(function (param) {
            endpoint = urljoin(endpoint, param);
        });
    } else if (params) {
        endpoint = urljoin(endpoint, params.toString());
    }

    var url = parse(endpoint, false);
    if (!url.slashes) {
        url = parse('//' + endpoint, false);
        url.set('protocol', 'https:');
    }

    return url.href;
};
