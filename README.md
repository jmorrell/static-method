# static-method

Replace function calls using esprima. Inspired by [static-module](https://github.com/substack/static-module)
by [substack](https://github.com/substack).

The goal is to quickly be able to replace specified function calls with a limited amount of fussing
around with the AST. If your needs are more sophisticated then you should look at [jstransform](https://github.com/facebook/jstransform), 
[falafel](https://github.com/substack/node-falafel), or go straight for [esprima](http://esprima.org/).

[![Build Status](https://secure.travis-ci.org/jmorrell/static-method.png?branch=master)](http://travis-ci.org/jmorrell/static-method)

```js
var staticMethod = require('static-method');

var sm = staticMethod({
  parseInt: function(src, node) {
    if (node.arguments.length === 1) {
      return 'parseInt(' + node.arguments[0].raw + ', 10)';
    }
  }
});

process.stdin.pipe(sm).pipe(process.stdout);
```

## Install

```zsh
npm install static-method
```

## Methods

### var sm = staticMethod(methods)

Returns a transform stream that transforms javascript source code according to each
property in the methods configuration object.

### methods object

`methods` is a configuration object. The keys are the function names you'd like to 
replace. The value is a function that defines the transform you'd like to perform
on that function call.

### transform function

Each transform function receives two arguments. The first is the source of the function
call. The second is a [falafel](https://github.com/substack/node-falafel) AST node that
you can modify directly, use to extract arguments, etc.

The easiest way to replace the call is to return a string from the transform function that
contains the replacement code. 

Ex: This replaces all calls to `foo()` with the string `"bar"`:

```js
var sm = staticMethod({
  foo: function() {
    return '"bar"';
  }
});
```

## Examples

### Replace all calls to `foo()` with calls to `bar()`.

```js
var staticMethod = require('static-method');

var sm = staticMethod({
  foo: function(src, node) {
    return src.replace(/^foo/, 'bar');
  }
});

process.stdin.pipe(sm).pipe(process.stdout);
```

input:

```zsh
$ cat source.js

foo();
foo(1, 2);
foo(a, function(err, data) {
  if (err) throw(err);
  console.log(data);
});
```

output:

```zsh
$ node replace.js < source.js

bar();
bar(1, 2);
bar(a, function(err, data) {
  if (err) throw(err);
  console.log(data);
});
```

### Comment out all calls to `eval` and add an alert

```js
var staticMethod = require('static-method');

var sm = staticMethod({
  eval: function(src, node) {
    return 'alert("Think about what you\'ve done"); /*' + src + '*/';
  }
});

process.stdin.pipe(sm).pipe(process.stdout);
```

input:

```zsh
$ cat source.js

console.log(eval("2 + 2"));
```

output:

```zsh
$ node replace.js < source.js

console.log(alert("Think hard about what you're doing") /*eval("2 + 2")*/);
```

### Add the radix to `parseInt`

It's best practice to always include the optional radix parameter in `parseInt` 
calls. Let's enforce this.

```js
var staticMethod = require('static-method');

var sm = staticMethod({
  parseInt: function(src, node) {
    if (node.arguments.length === 1) {
      return 'parseInt(' + node.arguments[0].raw + ', 10)';
    }
  }
});

process.stdin.pipe(sm).pipe(process.stdout);
```

input:

```zsh
$ cat source.js

parseInt();
parseInt('5');
parseInt('5', 10);
```

output:

```zsh
$ node replace.js < source.js

parseInt();
parseInt('5', 10);
parseInt('5', 10);
```

## License

MIT

