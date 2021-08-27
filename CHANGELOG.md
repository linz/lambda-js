## [1.0.1](https://github.com/linz/lambda-js/compare/v1.0.0...v1.0.1) (2021-08-27)


### Features

* reject lambda if unhandled errors happen ([5b121b3](https://github.com/linz/lambda-js/commit/5b121b341ec1c18a5fec8e7313d92c352722ec4d))



# [1.0.0](https://github.com/linz/lambda-js/compare/v0.3.2...v1.0.0) (2021-08-27)


### Features

* support non http lambda types ([#10](https://github.com/linz/lambda-js/issues/10)) ([ae9d1ae](https://github.com/linz/lambda-js/commit/ae9d1ae7b4832f90e4953ecf841e39883b66256d))


### BREAKING CHANGES

* modifies the base api

- `LambdaFunction.wrap` is now `lf.http`
- `lf.handler` can wrap any lambda event such as s3 events



## [0.3.2](https://github.com/linz/lambda-http/compare/v0.3.1...v0.3.2) (2021-08-19)


### Bug Fixes

* expose http header objects ([a49035e](https://github.com/linz/lambda-http/commit/a49035e5303a8c1a4e3455dec38cbed57a01a97f))



## [0.3.1](https://github.com/linz/lambda/compare/v0.3.0...v0.3.1) (2021-08-10)


### Bug Fixes

* correctly log the extra log context at the end of the request ([93a6435](https://github.com/linz/lambda/commit/93a6435af5df95aa041218ec3294786fa8836e34))



# [0.3.0](https://github.com/linz/lambda/compare/v0.2.0...v0.3.0) (2021-08-09)


### Features

* support .json() to parse the body as json if content-type is application/json ([9173dd9](https://github.com/linz/lambda/commit/9173dd9f37c7d7b6e6267648251514f960a32934))



# [0.2.0](https://github.com/linz/lambda/compare/v0.1.1...v0.2.0) (2021-08-09)


### Features

* support .body and .isBase64Encoded for requests ([f4faa62](https://github.com/linz/lambda/commit/f4faa62c932fedbdceea205203d92ed5688c859f))



## [0.1.1](https://github.com/linz/lambda/compare/v0.1.0...v0.1.1) (2021-08-09)



# 0.1.0 (2021-08-09)


### Features

* initial commit ([faad8ed](https://github.com/linz/lambda/commit/faad8edf610ce8d74fa366a42450120840671b95))



