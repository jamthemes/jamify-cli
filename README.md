# Jamify - The ultimate Gatsby.js website converter

(this tool was extracted from a bigger monorepo, we finally had time to open source it!)

## What it is

Jamify let's you convert any website to a working Jamstack website by compiling it.
Currently, only **Gatsby.js** is supported as a compile target. Thanks to Jamify, you can convert _mostly_ every existing website to Gatsby with ease. Going from Gatsby.js to Next.js isn't that difficult after that.

You can also jump straight to [The Ultimate Template Porting Guide](https://www.notion.so/The-Ultimate-Template-Porting-Guide-1935e0b7824f4f42a4efa8b1ad89ead1) for a detailed, uncensored step by step guide.

## Showcase

Here's an example of a website we converted to Gatsby.js using the steps as documented in The Ultimate Template Porting Guide.

- Original site: [Source](https://www.bootstrapdash.com/product/marshmallow/) | [Live Demo](https://www.bootstrapdash.com/demo/marshmallow/)
- Gatsby.js starter: [Source](https://github.com/jamthemes/gatsby-starter-marshmallow) | [Live Demo](https://www.bootstrapdash.com/demo/marshmallow/)
- Next.js starter: [Source](https://www.bootstrapdash.com/product/marshmallow/) | [Live Demo](https://next-starter-marshmallow-showcase.vercel.app/)

## Usage

Try it out yourself now! Just like that:

```bash
npm i -g jamify # or "yarn global add jamify"
jamify gatsby --urls https://html5up.net/uploads/demos/paradigm-shift/ -o ./new-gatsby-site
```

This will convert the website located at "https://html5up.net/uploads/demos/paradigm-shift/" to a Gatsby.js project.

Now, let's start the Gatsby development server:

```bash
cd new-gatsby-site
npm i
gatsby develop
```

...and navigate to http://localhost:8000/uploads/demos/paradigm-shift/ 🧙‍♂️

For more options, type `jamify --help`

Get creative and pick any template you like from sources like [HTML5UP](https://html5up.net/) or [Bootstrapdash](https://www.bootstrapdash.com/free-landing-page-templates/). **But always make sure the license allows for the intended usage!**

**This is only the start of the journey.** For most sites, you will have a fully functioning Gatsby site now, but there are still some manual steps which need to be performed to reach an acceptable quality.
Here you can find a somewhat extensive guide for porting website templates to Gatsby.js using Jamify:

[The Ultimate Template Porting Guide](https://www.notion.so/The-Ultimate-Template-Porting-Guide-1935e0b7824f4f42a4efa8b1ad89ead1)

The document is editable, so you can add your findings too!

## For maintainers

When developing Jamify, first create a `.env` file in the root of your project:

```
DEV_COMMAND=gatsby -u http://localhost:8080 -r -o ./out
```

The `DEV_COMMAND` variable is the current command you want to simulate.

Now run `npm run dev`

Live-reload is enabled thanks to Nodemon.

### Commit Standard

Please use the [commitizen CLI](https://github.com/commitizen/cz-cli) to create commit messages
