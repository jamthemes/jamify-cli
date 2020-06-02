import {
  getElementsAttributeDescriptors,
  getAllPublicProperties,
} from './createHtmlComponentProperties';
import componentizerNaming from './naming';
import {
  HtmlComponentElement,
  ExtendedHtmlElement,
  HtmlComponent,
} from '../../../util/types/htmlComponent';

function createComponentElementStructure(
  elements: Element[],
): HtmlComponentElement {
  const [originalDomElement] = elements;
  const componentAttributes = getElementsAttributeDescriptors(elements);

  const domChildren = Array.from(originalDomElement.childNodes);
  let componentChildren: (HtmlComponentElement | string)[] = [];
  for (let i = 0; i < domChildren.length; i += 1) {
    const type = elements[0].childNodes[i].nodeType === 1 ? 'element' : 'text';
    const allDomChildren = elements.map(elem => elem.childNodes[i]);
    const childrenToAdd =
      type === 'element'
        ? createComponentElementStructure(allDomChildren as HTMLElement[])
        : allDomChildren?.[i]?.nodeValue || '';
    componentChildren.push(childrenToAdd);
  }

  return {
    tagName: originalDomElement.tagName.toLowerCase(),
    children: componentChildren,
    componentAttributes,
  };
}

/**
 * Elements which were found to be similar
 * using determineSimilarElements can
 * be componentized. This function tries
 * to find out which parts of the
 * component stays the same and which parts
 * change (those parts need to be configurable)
 * via properties
 */
export default function createHtmlComponent(
  similarElements: ExtendedHtmlElement[],
): HtmlComponent {
  // We know that the markup structure
  // of those elements is the same.
  const topLevelComponentElement = createComponentElementStructure(
    similarElements,
  );

  const componentName = componentizerNaming.getComponentName({
    entryElement: topLevelComponentElement,
  });

  const componentJsName = componentizerNaming.toJsName(componentName, true);

  const publicComponentProperties = getAllPublicProperties(
    topLevelComponentElement,
    componentName,
  );

  return {
    name: componentName,
    jsName: componentJsName,
    publicProperties: publicComponentProperties,
    entryElement: topLevelComponentElement,
  };
}
