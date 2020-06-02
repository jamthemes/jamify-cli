import { ImportedPageAsset } from '../jsxCompiler/createImports';

interface CreateReactPageComponentParams {
  jsx: string;
  identifierImports: ImportedPageAsset[];
  nonIdentifierImports: ImportedPageAsset[];
  /** Array of React component names */
  reactComponentsToImport: string[];
  reactComponentName: string;
  compatLayerRelativePath: string;
}

/**
 * Template to create
 * a react component
 * from the compiled
 * JSX of the page
 */
export default function createReactPageComponent({
  jsx,
  reactComponentName,
  compatLayerRelativePath,
  reactComponentsToImport,
  identifierImports,
  nonIdentifierImports,
}: CreateReactPageComponentParams) {
  const scriptAssets = identifierImports.filter(
    asset => asset.type === 'HtmlScript',
  );
  let imports = identifierImports
    .map(
      asset =>
        `import ${asset.importIdentifier} from "${asset.relativeImportPath}"`,
    )
    .join('\n');

  imports +=
    '\n' +
    nonIdentifierImports
      .map(asset => `import '${asset.relativeImportPath}';`)
      .join('\n');

  imports +=
    '\n' +
    reactComponentsToImport
      .map(cmpName => `import ${cmpName} from '../components/${cmpName}.js';`)
      .join('\n');

  const bodyJs = scriptAssets
    .map(script => `${script.importIdentifier}();`)
    .join('\n');

  const jsxFileContent = `
    import React, { useEffect } from "react"
    import { Helmet } from "react-helmet"
    import { Link } from "gatsby"
    import { after, before } from "${compatLayerRelativePath}"
    ${imports}

    export default function ${reactComponentName}() {
      useEffect(() => {
        (async () => {
          before();
          if (typeof window !== undefined) {
            ${bodyJs}
          }
          after();
        })();
      }, []);

      return (
        ${jsx}
      );
    }
  `;

  return jsxFileContent;
}
