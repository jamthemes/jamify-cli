# Jamify

**A tool to help porting websites to modern tech stacks**
(project was extracted from the a bigger, internal monorepo)

## Using the CLI

It is currently not published to NPM because it is a closed source project and we don't have a NPM premium account. For now, this is also better, as bugs may arise when using the tool, which can be immediately tracked and fixed when used locally.

When the repository was cloned, perform the following steps to be able to use the CLI tool locally:

```bash
npm i
npm run build
npm link
```

Now you can use it in your Shell of choice. Type `jamify --help` to get details about the usage.

## Developing Jamify

When developing Jamify, first create a `.env` file in the root of your project:

```
DEV_COMMAND=gatsby -u http://localhost:8080 -r -o ./out
```

The `DEV_COMMAND` variable is the current command you want to simulate.

Now run `npm run dev`

Live-reload is enabled thanks to Nodemon.

## Commit Standard

Please use the [commitizen CLI](https://github.com/commitizen/cz-cli) to create commit messages
