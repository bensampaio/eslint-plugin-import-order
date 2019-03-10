# eslint-plugin-*

This plugin intends to support linting of ES2015+ import/export syntax. The rules in this plugin are meant to stay as close as possible to the ECMAScript standard.

That means, for example, that this plugin won't add support for import paths without file extensions or special import paths that depend on webpack loaders or some other bundler specificity.
The reason for that is mainly because supporting all those special cases adds a lot of complexity and makes the maintenance of a plugin like this quite difficult.
I started this project because none of the solutions out there covered all my use cases and because they were so complex I couldn't even figure out how to contribute.

Some of the rules in this plugin are based on existing rules from `eslint-plugin-import` but they come with different flavors.

## Rules

### Style guide

* Enforce a convention in module import order based on their path ([order-by-path](docs/rules/orderByPath.md)).

## Installation

```
npm install eslint-plugin-*
```

All rules are off by default. However, you may configure them manually in your `.eslintrc.(yml|json|js)`.