# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-07-26
### Changed
- Moved a bunch of constants into a new package-private `ctx` module.
- `app` constructor supports an options object as the first argument now.
  The constructor is now more flexible with a couple added options.
- `app#add()` can be passed an array to add more than one item at a time.
- `app` and `extension` use `Symbol` properties for protected storage now.
  This replaces all the `$` prefixed properties that used to exist.
- `extension` constructor can make use of the options passed to the `app`.
- Optimized the app validation in `extension` class.
### Added
- `app#dataFor()` for caches, and other fun uses of `Map` objects.
- `app#orderedExtensions` getter; self explanatory what it's for.
- `app#isInited` getter as a sibling to `app#isStarted`.


## [1.1.0] - 2024-07-23
### Changed
- `app#extCall()` updated with a few extra features:
  - Now supports a plain object of named options.
  - Added ability to create and return a Map of return values,
    in addition to the existing ability to pass an existing Map.
  - May specify the function as one of the named options, in which case
    the `fn` positional argument isn't used at all.
- Bumped minimum version of `@lumjs/core` to current release.

## [1.0.0] - 2024-04-15
### Added
- Initial release.

[Unreleased]: https://github.com/supernovus/lum.web-app.js/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/supernovus/lum.web-app.js/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/supernovus/lum.web-app.js/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/supernovus/lum.web-app.js/releases/tag/v1.0.0

