# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/supernovus/lum.web-app.js/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/supernovus/lum.web-app.js/releases/tag/v1.0.0

