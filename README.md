# Blaise login react

A collection of client/ server code to enable blaise logins for react sites.

We have split the codebase into two importable modules, this is a requirement of the different build lifecycles required
for react/ frontend typescript and nodejs.

For detailed information on each module:

- [blaise-login-react-client](/blaise-login-react-client)
- [blaise-login-react-server](/blaise-login-react-server)

## Importing

We are making use of [GitPkg](https://gitpkg.vercel.app/guide/) to make importing a git subdirectory easy.

```sh
# Client code
yarn add https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-client?main
# Server code
yarn add https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-server?main
```

**Note**: The drawback of this approach is that just running a `yarn upgrade` doesn't seem to work reliably.

The best workaround to this is to use a commit ref instead of `main` in the above. For example:

```
# Client code
yarn add https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-client?1bc811bb8993db7a8e75409cdd004500ebaba3d5
# Server code
yarn add https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-server?74e88ad500a734ce797df3ed3e2a85bdacb71980
```

Its worth noting that just because they are the same repo you do not need to use the same commit for each components,
obviously if we make breaking changes in one you will need a new version of both.

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
