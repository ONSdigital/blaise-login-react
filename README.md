# Blaise login react

A collection of client/ server code to enable blaise logins for react sites.

We have split the codebase into two importable modules, this is a requirement of the different build lifecycles required
for react/ frontend typescript and nodejs.

For detailed information on each module:

- [blaise-login-react-client](/blaise-login-react-client)
- [blaise-login-react-server](/blaise-login-react-server)

## Importing

We are making use of Releases and Tags to maintain versions of our repository.
In your React project add this repository as a dependency, specifying a release version after the # at the end. For example:

```shell
yarn add git+https://github.com/ONSdigital/blaise-login-react#<RELEASE_TAG>
```
---

This helped us to get rid of working with SHAs of the subdirectories and will be a lot easier and cleaner to specify versions with Releases that we intend to use.

### Client code
To import Modules from blaise-login-react-client subdirectory: For example:

```sh
import { Authenticate } from "blaise-login-react/blaise-login-react-client";
```
### Server code
To import Modules from blaise-login-react-server subdirectory: For example:

```sh
import { newLoginHandler, Auth } from "blaise-login-react/blaise-login-react-server";
```


## Adding New Functionality or Bug fixing

This repo uses "Releases" to maintain versions. Releases are deployable software iterations you can package and make available for a wider audience to download and use. Releases are based on Git tags, which mark a specific point in your repository's history. 

Make the required changes and then create a new Release following instructions in the link. https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository 

### Rules for Tag Creation
(use SemVer https://semver.org/spec/v2.0.0.html  for versioning), e.g. v1.0.0, and document any recent changes/commits in the "Describe this release" section.

This new Release with the newly created Tag can then be added in the package.json file of the React repo that intends to use the blaise-login-react functionality.
```shell
yarn add git+https://github.com/ONSdigital/blaise-login-react#<RELEASE_TAG>
```


## Tests

`cd` into the relative subfolder and run the tests e.g:

```sh
cd blaise-login-react-server
yarn install
yarn test
```

## Build

As with the tests you need to `cd` into a subfolder before building, as this is a git based library you have to build
and commit the compiled code to allow importing.

```sh
cd blaise-login-react-server
yarn install
yarn build
# git add
# git commit
# git push (etc)
```
