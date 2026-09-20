# Branch protection checklist

Use this checklist to keep merge and deploy gates consistent across all protected branches.

## Required GitHub branch protection

Apply these settings on the protected branches, typically `develop` and `main`.

- [ ] Require a pull request before merging
- [ ] Require approvals before merging
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings
- [ ] Mark these checks as required:
  - `Backend tests`
  - `Frontend tests`
  - `Quality gate`
  - `Sonar scan`

## Recommended environment protection

For the production environment:

- [ ] Require manual approval before deployment
- [ ] Restrict deployment to the `main` branch only
- [ ] Require the deployment workflow to succeed after checks are green

## Deployment release flow

1. Create a feature branch.
2. Open a PR into `develop`.
3. Required CI checks must pass.
4. Merge to `develop`.
5. Open a PR into `main`.
6. Required CI checks must pass again.
7. Merge to `main`.
8. Deployment workflow runs only after the protected branch is updated and the checks are green.
