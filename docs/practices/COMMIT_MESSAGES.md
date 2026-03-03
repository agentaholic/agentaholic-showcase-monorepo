When creating git commit messages, the description/first line should follow this pattern "<type>(<subject>): <action>"

"<type>" should be one of these values:

- "feat" for features or changes that would create a minor version bump in semantic versioning
- "fix" for changes that fix behavior and would create a patch version bump in semantic versioning
- "docs" for changes that pertain to documentation, or changes to comments and information
- "style" for changes that only adjust the formatting of code, like whitespace
- "refactor" for refactor-like changes that preserve the existing behavior of the code
- "test" for changes that only modify test files
- "chore" for all miscellaneous changes that don't directly affect the behavior of the application

"<subject>" can be a reference (name) to a specific file, or service or endpoint or the abstract name of something where it is implied that the action is acting upon. When referencing a service endpoint, always use the format "{service name}.{endpoint name}" for the subject instead of just the endpoint name, so that we know which service the endpoint belongs to.

When writing a git commit, check the current branch name. If the branch name matches the Linear-recommended pattern of `age-<number>-<title>`, then ensure that the ticket ID of `AGE-<number>` is incorporated into the `<subject>` of the first line of the commit message. For example, if you're planning on using the subject of "router", but you also notice that the branch name is `age-82-initial-react-router-setup`, then write a commit message that looks like "feat(AGE-82, router): setup react-router v7 with placeholder routes..."

"<action>" is where the real description of the change will go. Always use imperative tense. Don't capitalize the first letter. Don't put a '.' at the end.
