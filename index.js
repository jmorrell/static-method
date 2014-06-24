var through = require('through2');
var concat = require('concat-stream');
var duplexer = require('duplexer2');
var falafel = require('falafel');


module.exports = function parse(methods) {
  var body, src;
  var output = through();

  return duplexer(concat(function (buf) {
    try {
      body = buf.toString('utf8');
      src = falafel(body, walk);
    } catch(err) {
      return error(err);
    }

    output.push(String(src));
    output.push(null);
  }), output);

  function error(msg) {
    var err = typeof msg === "string" ? new Error(msg) : msg;
    output.emit('error', err);
  }

  function walk(node) {
    if (node.type === 'CallExpression') {
      var replaceFn = methods[node.callee.name];
      var ret = null;

      if (replaceFn) {
        ret = replaceFn(node.source(), node);
        if (typeof ret === "string") {
          node.update(ret);
        }
      }
    }
  }
};

