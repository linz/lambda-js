<a name="3.2.1"></a>
## [4.1.0](https://github.com/linz/lambda-js/compare/v4.0.0...v4.1.0) (2023-08-14)


### Features

* **deps:** bump find-my-way from 7.0.1 to 7.3.1 ([#225](https://github.com/linz/lambda-js/issues/225)) ([cb14e4d](https://github.com/linz/lambda-js/commit/cb14e4dc2d7573c00f3008353ee9a678c69f49ff))
* **deps:** bump pino from 8.4.1 to 8.7.0 ([#232](https://github.com/linz/lambda-js/issues/232)) ([81b8e81](https://github.com/linz/lambda-js/commit/81b8e81364ba24e4daa4da8d3cbc6fd48d88102d))
* **deps:** bump pino from 8.7.0 to 8.8.0 ([#255](https://github.com/linz/lambda-js/issues/255)) ([a6291bc](https://github.com/linz/lambda-js/commit/a6291bc0efdf5ee9628dc6d6ff5d57596f11eb7e))
* **deps:** bump pino from 8.8.0 to 8.10.0 ([#266](https://github.com/linz/lambda-js/issues/266)) ([49ae385](https://github.com/linz/lambda-js/commit/49ae385646a994048cb5b6c506e4c27b0d63ac77))
* include github buildId in lambda messages ([60e5a76](https://github.com/linz/lambda-js/commit/60e5a7612f259ac3961e7ab342d68778e2af03f2))


### Bug Fixes

* allow custom response typings ([#344](https://github.com/linz/lambda-js/issues/344)) ([6a8e26a](https://github.com/linz/lambda-js/commit/6a8e26af2294c95171ca2ede0a22159e39fdbd5c))
* upgrade to stricter typescript ([#345](https://github.com/linz/lambda-js/issues/345)) ([1f862bc](https://github.com/linz/lambda-js/commit/1f862bc626e6204a445f5cf010d5a581a7a28a13))

## [4.0.0](https://github.com/linz/lambda-js/compare/v3.2.2...v4.0.0) (2022-08-18)


### ⚠ BREAKING CHANGES

* **http:** switch to async request handlers for http functions

### Features

* **http:** ensure requestId and correlationId are set on errors ([fcbf4f8](https://github.com/linz/lambda-js/commit/fcbf4f8982fb0d9ef1953b508918ea661f136c65))
* **http:** move all the handling logic into the router ([b3239ae](https://github.com/linz/lambda-js/commit/b3239aea661bf697b65227f9030ecc53880edd5d))
* **http:** switch to async request handlers for http functions ([03437f1](https://github.com/linz/lambda-js/commit/03437f1ccfd56de9de835d83fbfdcbef9b317c6b))
* **http:** track request counter ([851a930](https://github.com/linz/lambda-js/commit/851a9305b1fa7819579e7a3ff3ed192ff60e0b0c))
* **http:** use high resolution timer for metrics ([3150c32](https://github.com/linz/lambda-js/commit/3150c326aabc3f13c78072b7fc739a8981908bb0))

## [3.2.2](https://github.com/linz/lambda-js/compare/v3.2.1...v3.2.2) (2022-08-18)


### Bug Fixes

* query string parameters should not be lower cased ([5e36b5d](https://github.com/linz/lambda-js/commit/5e36b5d1e06dfeaad81e5ef2d0d003777f9e5fc5))

## [3.2.1](https://github.com/linz/lambda-js/compare/v3.2.0...v3.2.1) (2022-07-26)


### Bug Fixes

* ensure logging the request is the last thing that is done before sending a response ([#178](https://github.com/linz/lambda-js/issues/178)) ([c0fad56](https://github.com/linz/lambda-js/commit/c0fad56))


### Features

* **deps:** bump pino from 7.11.0 to 8.1.0 ([#165](https://github.com/linz/lambda-js/issues/165)) ([762f9f6](https://github.com/linz/lambda-js/commit/762f9f6))
* **deps:** bump pino from 8.1.0 to 8.3.0 ([#176](https://github.com/linz/lambda-js/issues/176)) ([172a442](https://github.com/linz/lambda-js/commit/172a442))



<a name="3.2.0"></a>
# [3.2.0](https://github.com/linz/lambda-js/compare/v3.1.1...v3.2.0) (2022-07-18)


### Features

* switch to a more complete routing engine find-my-way ([#169](https://github.com/linz/lambda-js/issues/169)) ([3f7c9f9](https://github.com/linz/lambda-js/commit/3f7c9f9))



<a name="3.1.1"></a>
## [3.1.1](https://github.com/linz/lambda-js/compare/v3.1.0...v3.1.1) (2022-07-04)


### Bug Fixes

* support request bodies in function urls ([3660ed1](https://github.com/linz/lambda-js/commit/3660ed1))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/linz/lambda-js/compare/v3.0.1...v3.1.0) (2022-05-25)


### Features

* add hooks to before and after requests ([#149](https://github.com/linz/lambda-js/issues/149)) ([627e391](https://github.com/linz/lambda-js/commit/627e391))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/linz/lambda-js/compare/v3.0.0...v3.0.1) (2022-05-23)


### Bug Fixes

* ensure the header enums are exported correctly ([b1a2b68](https://github.com/linz/lambda-js/commit/b1a2b68))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/linz/lambda-js/compare/v2.0.0...v3.0.0) (2022-05-23)


### Bug Fixes

* ensure apigateway does not parse a function url ([3b7a2eb](https://github.com/linz/lambda-js/commit/3b7a2eb))


### Features

* add itty router for http requests ([#122](https://github.com/linz/lambda-js/issues/122)) ([bf79b01](https://github.com/linz/lambda-js/commit/bf79b01))
* support function urls ([#147](https://github.com/linz/lambda-js/issues/147)) ([1b15d8c](https://github.com/linz/lambda-js/commit/1b15d8c))
* **deps:** bump pino from 6.13.1 to 7.5.0 ([#70](https://github.com/linz/lambda-js/issues/70)) ([2dcd90d](https://github.com/linz/lambda-js/commit/2dcd90d))


### BREAKING CHANGES

* this removes lf.http and makes it return a router, if you want to route all requests use `handler.router.all('*', fn)` to restore previous behaviour



# [2.0.0](https://github.com/linz/lambda-js/compare/v1.1.0...v2.0.0) (2021-09-15)


### Features

* switch to esm modules ([#25](https://github.com/linz/lambda-js/issues/25)) ([20c1288](https://github.com/linz/lambda-js/commit/20c1288c8d7b525d97ce7bfa26f124cdca0db2b0))


### BREAKING CHANGES

* this removes support for commonjs imports



# [1.1.0](https://github.com/linz/lambda-js/compare/v1.0.1...v1.1.0) (2021-09-02)


### Features

* **deps:** bump pino from 6.13.0 to 6.13.1 ([#7](https://github.com/linz/lambda-js/issues/7)) ([54fac0c](https://github.com/linz/lambda-js/commit/54fac0c32ac9a81579ed1a22478372e21daf8706))
* case insensitive query strings ([#17](https://github.com/linz/lambda-js/issues/17)) ([e5fee43](https://github.com/linz/lambda-js/commit/e5fee4304017538216a2ba383410a0bd2921fb93))
* include the awsRequestId in every log line ([e4a40de](https://github.com/linz/lambda-js/commit/e4a40de4642e22b46faed5c60f44ea3bcd8cb96f))
* trace a percentage of requests ([0d2e75a](https://github.com/linz/lambda-js/commit/0d2e75a9af070dfa6f67b9e28eafec1b092df42e))



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
