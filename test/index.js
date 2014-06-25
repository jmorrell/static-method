var assert = require('assert');
var through = require('through2');
var concat = require('concat-stream');
var has = require('has');

var staticMethod = require('../');

describe('transform functions', function() {

  it('should make no transform if nothing is returned', function(done) {
    var sm = staticMethod({
      foo: function(src) {
        // do nothing
      }
    });

    var code = "2 + 2; foo(a, b, c); 1 + 1;";

    transform(sm, code, function(out) {
      assert.equal(code, out);
      done();
    });
  });

  it('should pass the source of the function as the first argument', function(done) {
    var sm = staticMethod({
      foo: function(src) {
        assert.equal(src, "foo(a, b, c)");
      }
    });

    transform(sm, "2 + 2; foo(a, b, c); 1 + 1;", function(out) {
      done();
    });
  });

  it('should pass the falafel AST node as the second argument', function(done) {
    var sm = staticMethod({
      foo: function(src, node) {
        assert(has(node, "callee"));
        assert(has(node, "arguments"));
        assert(has(node, "range"));
        assert(has(node, "parent"));

        assert.equal(node.source(), "foo(a, b, c)");
      }
    });

    transform(sm, "2 + 2; foo(a, b, c); 1 + 1;", function(out) {
      done();
    });
  });

  it('will allow the code to be modified through node#update', function(done) {
    var sm = staticMethod({
      foo: function(src, node) {
        node.update("2 + 2");
      }
    });

    transform(sm, "1 + 1; foo(a, b, c); 3 + 3;", function(out) {
      assert.equal(out, "1 + 1; 2 + 2; 3 + 3;");
      done();
    });
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

  it('nested function calls', function(done) {
    var src =
      "foo(\n" +
      "foobaz(\n" +
      "foo(a,b,c)\n" +
      ")\n" +
      ");";

    var dst =
      "bar(\n" +
      "foobaz(\n" +
      "bar(a,b,c)\n" +
      ")\n" +
      ");";

    test(src, dst, done);
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
