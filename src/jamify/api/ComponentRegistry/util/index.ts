import { JSDOM } from 'jsdom';
import createComponent from './createHtmlComponent';
import {
  ExtendedHtmlElement,
  HtmlComponent,
} from '../../../util/types/htmlComponent';
import getContext from '../context';

function $(jsdom: JSDOM, selector: string) {
  return Array.from(jsdom.window.document.querySelectorAll(selector));
}

/**
 * Get stringified dom structure
 */
function stringifyDomStructure(elem: Element, currStr: string = '') {
  const tagName = elem.tagName.toLowerCase();
  let currElemStr = `<${tagName}>`;
  for (const childNode of elem.childNodes as any) {
    // 1 = HMTLElement Node
    if (childNode.nodeType === 1) {
      currElemStr += stringifyDomStructure(
        childNode as HTMLElement,
        currElemStr,
      );
    } else {
      currElemStr += '<text-node></text-node>';
    }
  }
  currElemStr += `</${tagName}>`;
  return currElemStr;
}

/**
 * Determines if two elements have
 * the same HTML structure.
 */
function haveSameHierarchalStructure(
  elem1: Element,
  elem2: ExtendedHtmlElement,
) {
  const str1 = stringifyDomStructure(elem1);
  const str2 = stringifyDomStructure(elem2);
  return str1 === str2;
}

function determineSimilarElements(
  element: ExtendedHtmlElement,
  jsdom: JSDOM,
): ExtendedHtmlElement[] {
  // If element has no children, do not attempt to componentize it
  const qualifiesAsPossibleComponent = element.childElementCount > 0;
  if (!qualifiesAsPossibleComponent) return [];

  // Find elements with same hierachal structure and at least
  // *one* same attribute or class name
  const allBodyElements = $(jsdom, 'body *');
  const similarElements = allBodyElements.filter(
    (elemToCompare) =>
      elemToCompare !== element && areElementsSimilar(element, elemToCompare),
  );
  return similarElements;
}

/**
 * If elements have same hierarchal structure
 * and at least one common class name *or*
 * attribute value, they are considered
 * *similar*.
 */
function areElementsSimilar(
  elem1: ExtendedHtmlElement,
  elem2: ExtendedHtmlElement,
) {
  // const elem1ClassNames = (elem1.getAttribute('class') || '').split(' ');
  // const elem2ClassNames = (elem1.getAttribute('class') || '').split(' ');

  // const sameStructure = haveSameHierarchalStructure(elem1, elem2);
  // if (!sameStructure) return false;
  // const sameAttribute = !!Array.from(elem1.attributes).find(
  //   currAttr => currAttr.value === elem2.getAttribute(currAttr.name),
  // );
  // if (sameAttribute) return true;
  // const sameClassName = elem1ClassNames.find(className =>
  //   elem2ClassNames.includes(className),
  // );
  // return sameClassName;
  const sameStructure = haveSameHierarchalStructure(elem1, elem2);
  return sameStructure;
}

interface DomElementToHtmlComponentRepresentationParams {
  /**
   * Position in allComponentElements array
   */
  domElemPos: number;
  /**
   * Actual HtmlComponent
   */
  component: HtmlComponent;
  /**
   * DOM Element to replace
   */
  domElement: Element;
  document: HTMLDocument;
}

function domElementToHtmlComponentRepresentation({
  domElemPos,
  domElement,
  component,
  document,
}: DomElementToHtmlComponentRepresentationParams) {
  const newDomElem = document.createElement(component.name);

  for (const componentProperty of component.publicProperties) {
    const componentPropertyValue = componentProperty.elementValues.find(
      (_, i) => i === domElemPos,
    );
    if (!componentPropertyValue) {
      continue;
    }
    if (componentPropertyValue.value) {
      newDomElem.setAttribute(
        componentProperty.name,
        componentPropertyValue.value,
      );
    }
  }

  if (domElement.parentElement) {
    domElement.parentElement.replaceChild(newDomElem, domElement);
  }
}

/**
 * Determines similar elements in the DOM
 * using 'determineSimilarElements'. If
 * enough similar elements were found,
 * a component is created from that DOM
 * structure.
 */
function processElement(
  element: Element,
  jsdom: JSDOM,
): HtmlComponent | undefined {
  // const children = toElementArray(element.children);
  const similarElements = determineSimilarElements(element, jsdom);
  if (similarElements.length > 0) {
    // Create component from those elements
    const allComponentElements = [...similarElements, element];
    console.log(
      'allComponentElements',
      allComponentElements.map((elem) => elem.outerHTML),
    );
    const component = createComponent(allComponentElements);
    for (
      let domElemPos = 0;
      domElemPos < allComponentElements.length;
      domElemPos += 1
    ) {
      domElementToHtmlComponentRepresentation({
        component,
        domElemPos,
        domElement: allComponentElements[domElemPos],
        document: jsdom.window.document,
      });
    }
    return component;
  }
  return undefined;
}

/**
 * Gets all list child elements
 * in a DOM tree starting from
 * the specified element
 */
function getLastChildren(
  node: Element,
  currChildren: Element[] = [],
): Element[] {
  if (node.children.length === 0) {
    return [node];
  }
  const childrenArray = Array.from(node.children);
  const lastChildren = childrenArray
    .map((child) => getLastChildren(child, currChildren))
    .flat();
  return [...currChildren, ...lastChildren];
}

interface TraverseFromChildParams {
  node: Element;
  onElementFound: (element: Element) => void;
}

/**
 * Finds last children and traverses
 * the DOM tree from there on
 * until the topLevelNode is met.
 * Does NOT call 'onElementFound'
 * for the starting node
 */
let alreadyWalkedElements: Element[] = [];
function traverseFromElement({
  node: startingNode,
  onElementFound,
}: TraverseFromChildParams) {
  let currElements: Element[] = getLastChildren(startingNode);
  while (currElements.length > 0) {
    const newElements = currElements
      .map((currElem) => {
        const alreadyWalked = !!alreadyWalkedElements.find(
          (elem) => elem === currElem,
        );
        const newElem = currElem.parentElement as Element;

        const isElemStartNode = newElem === startingNode;
        if (alreadyWalked || isElemStartNode || !newElem) {
          return null;
        }
        return newElem;
      })
      .filter(Boolean) as Element[];
    currElements.forEach(onElementFound);
    alreadyWalkedElements = [...alreadyWalkedElements, ...currElements];
    currElements = newElements;
  }
}

/**
 * Detects similiar HTML
 * structures and derives
 * re-usable components
 * from them. Accepts multiple
 * JSDOM instances,
 * as it tries to detect
 * patterns across pages.
 * The components which
 * were detected are replaced
 * in-place in the passed
 * JSDOM instances.
 * Adds the new components to
 * the current ComponentRegistry
 * set in the context
 */
export function componentsFromDocuments(htmlDocuments: HTMLDocument[]) {
  // Merge all pages into one JSDOM instance
  const masterJsDom = new JSDOM();
  const masterBody = masterJsDom.window.document.body;

  const processedElements: Element[] = [];
  for (const document of htmlDocuments) {
    const pageHtmlWrapperElem = masterJsDom.window.document.createElement(
      'div',
    );
    pageHtmlWrapperElem.setAttribute('data-is-jsdom-page', 'true');
    const bodyHtml = document.body.innerHTML;
    pageHtmlWrapperElem.insertAdjacentHTML('beforeend', bodyHtml);
    masterBody.insertAdjacentElement('beforeend', pageHtmlWrapperElem);
    processedElements.push(pageHtmlWrapperElem);
  }

  traverseFromElement({
    node: masterBody,
    onElementFound: (element) => {
      if (element.hasAttribute('data-is-jsdom-page')) {
        return;
      }
      const component = processElement(element, masterJsDom);
      if (component) {
        // console.log('component', component);
        getContext().addComponent(component);
      }
    },
  });

  // const allElements = $(masterJsDom, 'body *');
  // for (const elemToProcess of allElements) {
  //   if (!processedElements.find(elem => elem === elemToProcess)) {
  //     processedElements.push(elemToProcess);
  //     const component = processElement(elemToProcess, masterJsDom);
  //     if (component) {
  //       allHtmlComponents.push(component);
  //     }
  //   }
  // }

  // Set html in original JSDOM instances
  const allPagesHtml = Array.from(
    masterBody.querySelectorAll('[data-is-jsdom-page="true"]'),
  ).map((pageElem) => pageElem.innerHTML);
  for (let i = 0; i < allPagesHtml.length; i = i + 1) {
    const document = htmlDocuments[i];
    document.body.innerHTML = allPagesHtml[i];
  }
}
