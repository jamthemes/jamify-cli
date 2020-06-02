import componentizerNaming from './naming';
import {
  DynamicAttributeType,
  ElementDynamicAttribute,
  ElementAttributeDescriptor,
  HtmlComponentElement,
  HtmlComponentPublicProperty,
} from '../../../util/types/htmlComponent';
import getContext from '../context';

/**
 * Attributes which can be split/
 * combined using properties.
 */
interface CombinableAttribute {
  name: string;
  separator: string;
}

/**
 * Attributes collected
 * across elements.
 */
interface CollectedAttribute {
  name: string;
  elements: { values: string[] }[];
  separator?: string;
}

interface CollectAttributesAcrossElementsParams {
  elements: Element[];
}

function collectAttributesAcrossElements({
  elements,
}: CollectAttributesAcrossElementsParams): CollectedAttribute[] {
  /**
   * List of attributes which can
   * be split/combined using
   * the specified separator.
   * For now, only make classes
   * combinable. As styles are
   * expressed as objects in react,
   * that would complicate things
   * for now.
   */
  const COMBINABLE_ATTRIBUTES: CombinableAttribute[] = [
    { name: 'class', separator: ' ' },
    // { name: 'style', separator: ';' },
  ];

  return elements.reduce((arr, currentElement, elemIdx) => {
    const allElementAttributes = Array.from(currentElement.attributes);
    let newArr = [...arr];
    for (const attribute of allElementAttributes) {
      const isAttributeCombinable = COMBINABLE_ATTRIBUTES.find(
        cAttr => cAttr.name === attribute.name,
      );
      const attributeValues = isAttributeCombinable
        ? attribute.value
            .split(isAttributeCombinable.separator)
            .filter(Boolean)
            .map(str => str.trim())
        : [attribute.value];
      const foundCollectedAttribute = arr.find(
        attr => attr.name === attribute.name,
      );
      if (foundCollectedAttribute) {
        newArr = newArr.map(collectedAttr => {
          if (collectedAttr.name === attribute.name) {
            return {
              ...collectedAttr,
              elements: collectedAttr.elements.map((elem, idx) => {
                if (idx === elemIdx) {
                  return {
                    values: [...elem.values, ...attributeValues],
                  };
                }
                return elem;
              }),
            };
          }
          return collectedAttr;
        });
      } else {
        newArr = [
          ...newArr,
          {
            name: attribute.name,
            separator: isAttributeCombinable
              ? isAttributeCombinable.separator
              : undefined,
            elements: Array(elements.length)
              .fill({ values: [] })
              .map((_, idx) => {
                if (idx === elemIdx) {
                  return {
                    values: attributeValues,
                  };
                }
                return _;
              }),
          },
        ];
      }
    }
    return newArr;
  }, [] as CollectedAttribute[]);
}

interface GetDynamicElementAttributesParams {
  attributeType: DynamicAttributeType;
  dynamicValues: string[];
  collectedAttribute: CollectedAttribute;
  elements: Element[];
}

function getDynamicElementAttributes({
  attributeType,
  dynamicValues,
  collectedAttribute,
  elements,
}: GetDynamicElementAttributesParams): ElementDynamicAttribute[] {
  let dynamicValueAttributes: ElementDynamicAttribute[] = [];

  // If attibute type is set to content,
  // there can only be one dynamic
  // attribute, as it will always be
  // replaced with the specified
  // value
  if (
    attributeType === DynamicAttributeType.CONTENT &&
    dynamicValues.length > 0
  ) {
    // const propertyIdentifier = componentizerNaming.getPublicPropertyName({
    //   domPropertyName: collectedAttribute.name,
    //   dynamicValue: '',
    //   domTagName,
    //   dynamicAttributeType: attributeType,
    // });
    const elementValues = elements.map(element => {
      const value = element.getAttribute(collectedAttribute.name) || '';
      return {
        element,
        value,
      };
    });
    const dynamicContentAttribute: ElementDynamicAttribute = {
      name: collectedAttribute.name,
      type: attributeType,
      elementValues,
    };
    dynamicValueAttributes = [dynamicContentAttribute];
  }

  if (attributeType === DynamicAttributeType.TOGGLE) {
    dynamicValueAttributes = dynamicValues.map(dynamicValue => {
      // const propertyIdentifier = componentizerNaming.getPublicPropertyName({
      //   domPropertyName: collectedAttribute.name,
      //   dynamicValue,
      //   domTagName,
      //   dynamicAttributeType: attributeType,
      // });

      const elementValues = elements.map(element => {
        const value = element.getAttribute(collectedAttribute.name) || '';
        let elemValue = undefined;
        if (collectedAttribute.separator) {
          const foundDynamicValue = value
            .split(collectedAttribute.separator)
            .includes(dynamicValue);
          if (foundDynamicValue) {
            elemValue = 'true';
          }
        }

        return {
          element,
          value: elemValue,
        };
      });

      return {
        name: collectedAttribute.name,
        type: attributeType,
        elementValues,
        value: dynamicValue,
      } as ElementDynamicAttribute;
    });
  }

  return dynamicValueAttributes;
}

/**
 * Turns the attributes of multiple
 * elements into component properties
 */
export function getElementsAttributeDescriptors(
  elements: Element[],
): ElementAttributeDescriptor[] {
  const collectedAttributes = collectAttributesAcrossElements({ elements });

  const attributeDescriptors: ElementAttributeDescriptor[] = collectedAttributes.map(
    collectedAttribute => {
      const uniqueValues = Array.from(
        new Set(
          collectedAttribute.elements.reduce((arr, { values }) => {
            return [...arr, ...values];
          }, [] as string[]),
        ),
      );
      const allValues = collectedAttribute.elements.reduce(
        (arr, { values }) => {
          return [...arr, ...new Set(values)];
        },
        [] as string[],
      );
      const { staticValues, dynamicValues } = uniqueValues.reduce(
        (obj, uniqueValue) => {
          const { length: valueCount } = allValues.filter(
            val => val === uniqueValue,
          );
          const isValueStatic = valueCount === elements.length;
          return {
            staticValues: isValueStatic
              ? [...obj.staticValues, uniqueValue]
              : obj.staticValues,
            dynamicValues: isValueStatic
              ? obj.dynamicValues
              : [...obj.dynamicValues, uniqueValue],
          };
        },
        { staticValues: [], dynamicValues: [] } as {
          staticValues: string[];
          dynamicValues: string[];
        },
      );
      const attributeType = collectedAttribute.separator
        ? DynamicAttributeType.TOGGLE
        : DynamicAttributeType.CONTENT;

      const dynamicValueAttributes = getDynamicElementAttributes({
        attributeType,
        collectedAttribute,
        dynamicValues,
        elements,
      });

      const foundComponent = getContext().findComponentByName(
        elements[0].tagName.toLowerCase(),
      );
      let originalAttributeName = collectedAttribute.name;
      if (foundComponent) {
        // If element is a component, originalAttributeName
        // must be taken over from that component's attribute
        const foundPublicProp = foundComponent.publicProperties.find(
          publicProp => publicProp.name === collectedAttribute.name,
        );
        originalAttributeName = foundPublicProp?.originalAttributeName ?? '';
      }

      return {
        name: collectedAttribute.name,
        staticValues,
        originalAttributeName,
        valuesSeparator: collectedAttribute.separator,
        dynamicValues: dynamicValueAttributes,
      };
    },
  );

  const childrenAttributeDescriptor = getChildrenAttributeDescriptor(elements);

  return [
    ...attributeDescriptors,
    ...(childrenAttributeDescriptor ? [childrenAttributeDescriptor] : []),
  ];
}

/**
 * Gets all dynamic attributes
 * and creates and sets a publicPropertyName
 * for each. Then, an HtmlComponentPublicProperty
 * is created based on that.
 */
export function getAllPublicProperties(
  topLevelElem: HtmlComponentElement,
  componentName: string,
  currentProps: HtmlComponentPublicProperty[] = [],
): HtmlComponentPublicProperty[] {
  const componentAttributes = topLevelElem.componentAttributes || [];
  const publicProperties: HtmlComponentPublicProperty[] = componentAttributes
    .map(attr =>
      attr.dynamicValues.map(val => {
        const publicPropertyName = componentizerNaming.getPublicPropertyName({
          domTagName: topLevelElem.tagName,
          componentName,
          domPropertyName: val.name,
          dynamicAttributeType: val.type,
          dynamicValue: val.value,
        });

        val.publicPropertyName = publicPropertyName;

        return {
          name: publicPropertyName,
          jsName: componentizerNaming.toJsName(publicPropertyName),
          type: val.type,
          attributeName: val.publicPropertyName,
          elementValues: val.elementValues,
          originalAttributeName: attr.originalAttributeName,
        } as HtmlComponentPublicProperty;
      }),
    )
    .flat();

  const nonStringChildren = topLevelElem.children.filter(
    elem => typeof elem !== 'string',
  ) as HtmlComponentElement[];
  const childProps = nonStringChildren
    .map(childElem => {
      return getAllPublicProperties(childElem, componentName, currentProps);
    })
    .flat();

  const filtered = [...currentProps, ...publicProperties, ...childProps].filter(
    Boolean,
  ) as HtmlComponentPublicProperty[];
  const unique = Array.from(new Set(filtered.map(prop => prop.name))).map(
    propName => {
      return filtered.find(prop => prop.name === propName);
    },
  ) as HtmlComponentPublicProperty[];
  return unique;
}

/**
 * When all element's children
 * are text only, and are not
 * the same, create a public
 * property for them
 */
export function getChildrenAttributeDescriptor(
  elements: Element[],
): ElementAttributeDescriptor | undefined {
  const allElementTextValues = elements
    .map(elem =>
      elem.children.length === 0 && elem.innerHTML ? elem.innerHTML : undefined,
    )
    .filter(Boolean);

  const hasChildProperty =
    allElementTextValues.length === elements.length &&
    new Set(allElementTextValues).size > 1;
  if (hasChildProperty) {
    const elementValues = elements.map(elem => ({
      element: elem,
      value: elem.innerHTML,
    }));
    return {
      staticValues: [],
      originalAttributeName: '__children__',
      name: '__children__',
      dynamicValues: [
        {
          elementValues,
          name: '__children__',
          type: DynamicAttributeType.CHILDREN,
        },
      ],
    };
  }
  return undefined;
}
