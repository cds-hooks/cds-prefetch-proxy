'use strict';

const path = require('path');

function normalize (str) {
  // make sure protocol is followed by two slashes
  str = str.replace(/:\//g, '://');

  // remove consecutive slashes
  str = str.replace(/([^:\s])\/+/g, '$1/');

  // remove trailing slash before parameters or hash
  str = str.replace(/\/(\?|&|#[^!])/g, '$1');

  // replace ? in parameters with &
  str = str.replace(/(\?.+)\?/g, '$1&');

  return str;
}

module.exports = function() {
  var url = path.join.apply(null, arguments);
  return normalize(url);
};

