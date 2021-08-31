# testcafe-reporter-sealights
[![Build Status](https://travis-ci.org/ronisegal/testcafe-reporter-sealights.svg)](https://travis-ci.org/ronisegal/testcafe-reporter-sealights)

This is the **sealights** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).


## Install

```
npm install testcafe-reporter-sealights
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter sealights
```

### Passing parameters to reporter
* sl-token - Sealights token
* sl-tokenFile - Path to file contains the Sealights token
* sl-buildSessionId - Sealights build session id
* sl-buildSessionIdFile - Path to file contains the Sealights build session id
* sl-testStage - Test stage current tests are relates to
* sl-labId - Pre-defined Sealights lab-id (optional)
* sl-enforceFullRun - Overrides Sealights recommendations and run all tests (optional)
* sl-proxy - Proxy server (optional)
## Author
Sealights
