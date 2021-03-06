var shell = require('..');

var assert = require('assert'),
    util = require('util');

shell.config.silent = true;

//
// Invalids
//

shell.exec();
assert.ok(shell.error());

var result = shell.exec('asdfasdf'); // could not find command
assert.ok(result.code > 0);

// Test 'fatal' mode for exec, temporarily overriding process.exit
var old_fatal = shell.config.fatal;
var old_exit = process.exit;

var exitcode = 9999;
process.exit = function (_exitcode) {
    exitcode = _exitcode;
};

shell.config.fatal = true;

var result = shell.exec('asdfasdf'); // could not find command
assert.equal(exitcode, 1);

shell.config.fatal = old_fatal;
process.exit = old_exit;

//
// Valids
//

//
// sync
//

// check if stdout goes to output
var result = shell.exec('node -e \"console.log(1234);\"');
assert.equal(shell.error(), null);
assert.equal(result.code, 0);
assert.ok(result.stdout === '1234\n' || result.stdout === '1234\nundefined\n'); // 'undefined' for v0.4

// check if stderr goes to output
var result = shell.exec('node -e \"console.error(1234);\"');
assert.equal(shell.error(), null);
assert.equal(result.code, 0);
assert.ok(result.stdout === '' || result.stdout === 'undefined\n'); // 'undefined' for v0.4
assert.ok(result.stderr === '1234\n' || result.stderr === '1234\nundefined\n'); // 'undefined' for v0.4

// check if stdout + stderr go to output
var result = shell.exec('node -e \"console.error(1234); console.log(666);\"');
assert.equal(shell.error(), null);
assert.equal(result.code, 0);
assert.ok(result.stdout === '666\n' || result.stdout === '666\nundefined\n');  // 'undefined' for v0.4
assert.ok(result.stderr === '1234\n' || result.stderr === '1234\nundefined\n');  // 'undefined' for v0.4

// check exit code
var result = shell.exec('node -e \"process.exit(12);\"');
assert.equal(shell.error(), null);
assert.equal(result.code, 12);

// interaction with cd
shell.cd('resources/external');
var result = shell.exec('node node_script.js');
assert.equal(shell.error(), null);
assert.equal(result.code, 0);
assert.equal(result.stdout, 'node_script_1234\n');
shell.cd('../..');

// check quotes escaping
var result = shell.exec( util.format('node -e "console.log(%s);"', "\\\"\\'+\\'_\\'+\\'\\\"") );
assert.equal(shell.error(), null);
assert.equal(result.code, 0);
assert.equal(result.stdout, "'+'_'+'\n");

//
// async
//

// no callback
var c = shell.exec('node -e \"console.log(1234)\"', {async:true});
assert.equal(shell.error(), null);
assert.ok('stdout' in c, 'async exec returns child process object');

//
// callback as 2nd argument
//
shell.exec('node -e \"console.log(5678);\"', function(code, stdout, stderr) {
  assert.equal(code, 0);
  assert.ok(stdout === '5678\n' || stdout === '5678\nundefined\n');  // 'undefined' for v0.4
  assert.ok(stderr === '' || stderr === 'undefined\n');  // 'undefined' for v0.4

  //
  // callback as 3rd argument
  //
  shell.exec('node -e \"console.log(5566);\"', {async:true}, function(code, stdout, stderr) {
    assert.equal(code, 0);
    assert.ok(stdout === '5566\n' || stdout === '5566\nundefined\n');  // 'undefined' for v0.4
    assert.ok(stderr === '' || stderr === 'undefined\n');  // 'undefined' for v0.4

    //
    // callback as 3rd argument (slient:true)
    //
    shell.exec('node -e \"console.log(5678);\"', {silent:true}, function(code, stdout, stderr) {
      assert.equal(code, 0);
      assert.ok(stdout === '5678\n' || stdout === '5678\nundefined\n');  // 'undefined' for v0.4
      assert.ok(stderr === '' || stderr === 'undefined\n');  // 'undefined' for v0.4

      shell.exit(123);

    });

  });

});

assert.equal(shell.error(), null);
