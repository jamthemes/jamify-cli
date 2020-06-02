/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions,
}) => {
  actions.setWebpackConfig({
    resolve: {
      // Include node_modules for preview building (you can delete this)
      modules: ["node_modules", "/opt/nodejs/node_modules"],
    },
    module: {
      rules: [
        {
          test: /\.cur$/,
          use: [`file-loader`],
        },
      ],
    },
  })
}
