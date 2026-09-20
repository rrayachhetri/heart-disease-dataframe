# Develop branch protection checklist

Use this checklist for the `develop` branch so PRs cannot merge unless the required quality gates are green.

- [ ] Require a pull request before merging
- [ ] Require at least 1 reviewer approval
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above rules
- [ ] Require these checks to pass:
  - `Backend tests`
  - `Frontend tests`
  - `Quality gate`
  - `Sonar scan`

## Merge flow

1. Open a PR from a feature branch into `develop`.
2. Verify the required CI checks are green.
3. Merge only after the PR is approved and checks succeed.
4. Repeat the same rule when merging `develop` into `main`.
