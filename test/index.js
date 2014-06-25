var assert = require('assert');
var through = require('through2');
var concat = require('concat-stream');

var staticMethod = require('../');

describe('transform functions', function() {

  it('should pass the source of the function as the first argument', function() {

  });

  it('should pass the AST node as the second argument', function() {

  });

});

describe('convert foo to bar', function() {
  var test;

  beforeEach(function() {
    test = testTransform(staticMethod({
      foo: function(src, node) {
        return src.replace(/^foo/, 'bar');
      }
    }));
  });

  it('simple case', function(done) {
    test("foo();", "bar();", done);
  });

  it('with arguments', function(done) {
    test("foo(1,2);", "bar(1,2);", done);
  });

  it('with variables as arguments', function(done) {
    test("foo(a, b);", "bar(a, b);", done);
  });

  it('with a callback as arguments', function(done) {
    var src =
      "foo(a, function(err, data) {\n" +
      "  if(err) throw err;\n" +
      "  console.log(data);\n" +
      "});\n";

    var dst =
      "bar(a, function(err, data) {\n" +
      "  if(err) throw err;\n" +
      "  console.log(data);\n" +
      "});\n";

    test(src, dst, done);
  });

  it('should only convert foo not baz.foo', function(done) {
    test("foo(); baz.foo();", "bar(); baz.foo();", done);
  });

  it('shouldnt convert zfoo', function(done) {
    test("foo(); zfoo();", "bar(); zfoo();", done);
  });
});


function textStream(string) {
  var stream = through();
  stream.push(string);
  stream.push(null);
  return stream;
}

function transform(sm, text, cb) {
  textStream(text).pipe(sm).pipe(concat(function(output) {
    cb(output.toString());
  }));
}

function testTransform(sm) {
  return function(src, dst, done) {
    transform(sm, src, function(out) {
      assert.equal(out, dst);
      done();
    });
  };
}
