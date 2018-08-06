# Contributing to Peach wallet

## Overview

Are you here because you are interested in lightning technology and want to help with Peach wallet?
Awesome, feel welcome and read the following section to understand how it works.
If you get stuck at any point you can create a ticket on GitHub.
The basic premise of the approach is to announce your plans before you start work, and once you have started working, craft your changes into a stream of small and easily reviewable commits.
If you have a suggestion, you can create an issue if it doesn't exist.
If you want to work on some issue, write about it in that issue to avoid duplicate work.

## Pull Requests

We love pull requests. Here's a quick guide how to make it:

1. Fork the repo.

2. Add a test for your change. Only refactoring and documentation changes do not require new tests.
If you are adding functionality or fixing a bug, we need a test!

3. Make sure that your code passes tests  by running `npm run test`.
The eslint rules are not final by any means and can be changed if necessary.

4. Make the test pass.

5. Commit your changes. Please write an issue number and use an appropriate commit title.
If your pull request fixes an issue, specify it in the commit message. Here is an example:


```
 [FEATURE] #105 Commit title 
 // use blank line
 Detailed commit description
```

   For more information about commit prefixes see the Appendix.


Push to your fork and submit a pull request.
Please provide us with some explanation why you made the changes.
For new features make sure to explain a standard use case to us.

## Tests

For runing end 2 end tests you need btcd and lnd binaries in `PATH`

## Appendix

### Commit Tagging

All commits should be tagged. 
Tags are denoted by square brackets (`[]`) and come at the start of commit title.
Then write detailed commit message describing what changes you made in the commit.

**Use a blank line to separate details of commit and commit title.** 

### Bug Fixes

In general bug fixes are pulled into the branch.
As such, the prefix is: `[BUGFIX]`.
If a bug fix is a serious regression that requires a new patch release,
`[BUGFIX release]` can be used instead.

### Cleanup

Cleanup commits are for removing deprecated functionality and should be tagged as `[CLEANUP]`.

### Features

All additions and fixes for features should be tagged as `[FEATURE]`

### Documentation

Documentation commits are tagged as `[DOC]`.

### Other

In general, almost all commits should fall into one of these categories and have corresponding tag.
In cases when commits can't match any category, please submit your PR untagged.

## Contribution Checklist
[  ] All changes are nodejs version 8.1.1 and npm version 5.6.0 compliant.  
[  ] The code being submitted is commented in JSDoc format.  
[  ] For new code: Code is accompanied by tests, which exercise both the positive and negative (error paths) conditions (if applicable).  
[  ] For bug fixes: Code is accompanied by new tests, which trigger the bug being fixed to prevent regressions.  
[  ] Any new logging statements use an appropriate subsystem and logging level.  
[  ] Running `npm run test` does not report any new issues that did not already exist.  

#### Licensing of Contributions
****
All contributions must be licensed with the [APACHE license](LICENCE).
This is the same license as all of the code found within Peach wallet.