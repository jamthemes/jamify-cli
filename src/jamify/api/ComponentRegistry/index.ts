import AssetRegistry from '../AssetRegistry';
import { componentsFromDocuments } from './util';
import { HtmlComponent } from '../../util/types/htmlComponent';
import { setContext } from './context';

/**
 * Creates html components
 * from the registered pages
 * which can then be compiled
 * for the different frameworks
 */
export default class ComponentRegistry {
  private assetRegistry: AssetRegistry;
  private components: HtmlComponent[] = [];

  constructor(assetRegistry: AssetRegistry) {
    this.assetRegistry = assetRegistry;
  }

  public async retrieve() {
    const pages = this.assetRegistry.getPages();
    const htmlDocuments = pages.map(page => page.htmlDocument);
    // Set context for utility functions
    setContext(this);
    const components = componentsFromDocuments(htmlDocuments);
    return components;
  }

  public getComponents() {
    return this.components;
  }

  public addComponent(component: HtmlComponent) {
    this.components.push(component);
  }

  public findComponentByName(cmpName: string) {
    return this.components.find(cmp => cmp.name === cmpName);
  }

  public findComponentByJsName(jsName: string) {
    return this.components.find(cmp => cmp.jsName === jsName);
  }
}
