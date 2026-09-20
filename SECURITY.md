# Security Policy

## System and Scope

Path Copy is a VS Code extension that copies local file paths and Git repository
references to the VS Code clipboard. It runs in the workspace extension host and
operates on files or folders explicitly selected by the user.

This policy covers the extension source in `src/`, its VS Code command and
configuration contributions in `package.json`, and the released extension package.

## Threat Model and Trust Boundaries

- Selected local file and folder paths are user-controlled input.
- Workspace configuration, including `pathCopy.remoteName` and
  `pathCopy.remoteUrlFormat`, is untrusted project-controlled input.
- Git repository metadata and remote URLs are untrusted local input.
- The extension may invoke the local `git` executable only to resolve a repository
  root or configured remote URL.
- Clipboard contents and paths displayed in the UI can contain sensitive local or
  repository information. The extension must copy values only after an explicit
  user command or picker action.

## Security Invariants

- Commands must operate only on local `file` URIs selected by the user or the
  active editor.
- User-controlled paths, Git remote names, and Git remote URLs must not be
  interpreted as shell syntax or execute arbitrary commands.
- Git must be invoked without a shell and with arguments passed separately.
- The extension must not transmit paths, repository metadata, clipboard values, or
  telemetry over the network.
- Errors must not expose unnecessary sensitive local information beyond what is
  needed to explain the failed user action.

## Reportable Findings and Severity Context

Report findings with realistic reachability that could cause:

- arbitrary command execution through a path, workspace setting, or Git metadata;
- copying or exposing data without a user-initiated action;
- unauthorized network transmission of local paths, repository data, or clipboard
  values;
- access outside the user-selected local resource or its required Git metadata;
- packaging or dependency compromise affecting extension users.

Severity should account for the local, user-initiated extension model and whether
an attacker can control a workspace, repository, or Git configuration opened by a
victim.

## Out of Scope, Exclusions, and Accepted Risk

- The correctness, availability, and security of VS Code, Git, the operating
  system, and third-party Git hosting services are out of scope unless this
  extension introduces a practical exploit path to them.
- Repository URLs and local paths intentionally copied after an explicit user
  action are expected functionality, not a disclosure by themselves.
- Findings requiring a user to deliberately copy and share a value exactly as
  shown, without bypassing an extension control, are out of scope.

## Known Limitations and Compensating Controls

- The extension relies on the installed `git` executable for Git-related
  operations. Git-related options are unavailable when Git cannot resolve the
  selected resource as part of a repository.
- The extension does not validate ownership or trustworthiness of a Git remote;
  copied remote URLs are references from the user's local Git configuration.
