export interface ExtendedHtmlElement extends Element {}

export interface ElementAttributeValues {
  element: Element;
  value?: string;
}

export enum DynamicAttributeType {
  /**
   * Value can be turned on/off
   */
  TOGGLE = 'toggle',
  /**
   * 'content' means that the value
   * gets specified from the outside
   * via the component's public
   * properties
   */
  CONTENT = 'content',
  /**
   * The attribute value
   * will be set as the
   * element's children
   */
  CHILDREN = 'children',
}

export interface ElementDynamicAttribute {
  name: string;
  /**
   * Associated public component property.
   * Is set later on when when all
   * component properties were detected,
   * in HtmlComponent.ts
   */
  publicPropertyName?: string;
  /**
   * Toggle means that this value
   * can either be turned on or off,
   * content means that the value
   * gets specified from the outside
   * via the component's public
   * properties
   */
  type: DynamicAttributeType;
  /**
   * If 'type' is set to toggle,
   * this is the value being
   * toggled
   */
  value?: string;
  /**
   * The actual values
   * of the DOM elements
   * are stored here.
   * This can be used
   * to create re-create
   * those elements
   * with the correct
   * component values
   */
  elementValues: ElementAttributeValues[];
}

export interface ElementAttributeDescriptor {
  /**
   * Attribute name, e.g. class
   */
  name: string;
  /**
   * Name of original attribute
   * in case this attribute
   * is a public property
   * of another component
   */
  originalAttributeName: string;
  staticValues: string[];
  /**
   * Those values can be toggled.
   * If multiple, they are concatenated
   * using the specified valuesSeparator
   */
  dynamicValues: ElementDynamicAttribute[];
  /**
   * Used to concatenate multiple
   * dynamic attribute values
   */
  valuesSeparator?: string;
}

/**
 * Element which is needed to
 * later on re-construct
 * the component in e.g. JSX
 */
export interface HtmlComponentElement {
  tagName: string;
  /**
   * This array of attributes
   * gives information about
   * the element's attributes,
   * if they can be set from
   * outside and with which
   * property
   */
  componentAttributes: ElementAttributeDescriptor[];
  children: (HtmlComponentElement | string)[];
}

export interface HtmlComponentPublicProperty {
  name: string;
  jsName: string;
  type: DynamicAttributeType;
  /**
   * Name of actual HTML
   * attribute
   */
  attributeName: string;
  /**
   * The actual values
   * of the DOM elements
   * are stored here.
   * This can be used
   * to create re-create
   * those elements
   * with the correct
   * component values
   */
  elementValues: ElementAttributeValues[];
  originalAttributeName: string;
}

export interface HtmlComponent {
  /**
   * html component name
   */
  name: string;
  /**
   * camel cased name to be used
   * in JS, e.g. Gatsby
   */
  jsName: string;
  /**
   * Properties which can be
   * set from the outside
   * when creating the component
   */
  publicProperties: HtmlComponentPublicProperty[];
  entryElement: HtmlComponentElement;
}
