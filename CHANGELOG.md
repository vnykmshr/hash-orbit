# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Release Checklist

**For maintainers creating a new release:**

- [ ] Update version in `package.json` (follow semver)
- [ ] Update this CHANGELOG.md with version and date
- [ ] Ensure all tests pass: `npm test`
- [ ] Verify coverage meets threshold: `npm run coverage`
- [ ] Run linting: `npm run lint`
- [ ] Clean build: `npm run build`
- [ ] Review dist/ output for correctness
- [ ] Commit changes: `chore(release): vX.Y.Z`
- [ ] Create git tag: `git tag vX.Y.Z`
- [ ] Push commits and tags: `git push && git push --tags`
- [ ] Publish to npm: `npm publish` (with 2FA)
- [ ] Create GitHub release with changelog notes
- [ ] Verify package on npm: `npm info hash-orbit`

---

## [Unreleased]

### Added

- Initial release of hash-orbit
- Consistent hashing ring implementation with virtual nodes
- `add()` method to add nodes to the ring
- `remove()` method to remove nodes with minimal redistribution
- `get()` method for O(log n) key lookup
- `getN()` method for replica selection
- `size` and `nodes` getters for introspection
- TypeScript support with full type definitions
- 100% test coverage with comprehensive test suite
- GitHub Actions CI workflow
- Pre-commit hooks with husky and lint-staged
- Comprehensive documentation and examples

## [0.1.0] - 2025-11-20

### Added

- Initial development version
- Core consistent hashing algorithm
- Binary search optimization
- MurmurHash integration for key hashing
- Full TypeScript support with strict mode
- Complete test suite with 34 tests
- ESLint and Prettier configuration
- CI/CD with GitHub Actions
- MIT License

[unreleased]: https://github.com/vnykmshr/hash-orbit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vnykmshr/hash-orbit/releases/tag/v0.1.0
