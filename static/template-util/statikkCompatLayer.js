import { navigate } from 'gatsby';

let eventsToPrevent = ['DOMContentLoaded', 'load', 'readystatechange'];
let documentReadyState = 'loading';
if (typeof window !== 'undefined') {
  window.jamify = {
    log: function (...params) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[JAMIFY COMPAT]', ...params);
      }
    },
  };

  /**
   * Every time someone accesses document.readyState,
   * this function gets executed (replaced by Babel).
   * The function makes sure that the object indeed is
   * the page's document, because Babel replaces all
   * occurrences of <obj>.readyState with this function.
   */
  window.getDocumentReadyState = function getDocumentReadyState(origObject) {
    if (origObject instanceof HTMLDocument) {
      return documentReadyState;
    }
    return origObject.readyState;
  };

  /**
   * This function gets invoked by the 'enableBrowserLifecycleControl'
   * Babel plugin to check wheter or not execute a certain browser event.
   */
  window.shouldPreventEvent = function shouldPreventEvent(eventName) {
    const shouldPrevent = eventsToPrevent.includes(eventName);
    return shouldPrevent;
  };
}

/**
 * Execute this function every time a user navigates
 * to the page and before the page is rendered.
 * It makes sure "old" style websites work
 * as expected with Gatsby, by applying
 * several hacks. Sort of a compatibilty
 * layer for the traditional, imperative
 * way of building websites.
 */
export function before() {
  if (typeof window === 'undefined') return;
  function recreateNode(el, withChildren) {
    if (withChildren) {
      el.parentNode.replaceChild(el.cloneNode(true), el);
    } else {
      var newEl = el.cloneNode(false);
      while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
      el.parentNode.replaceChild(newEl, el);
    }
  }

  /**
   * In normal websites,
   * a route update also
   * means a page reload.
   * For all the content rendered
   * inside the __gatsby container
   * this also applies,
   * as it is completely re-rendered
   * and thus all event listeners
   * etc are removed, but this
   * holds not true for listeners
   * attached to body or window.
   * For those elements,
   * we need to "simulate" a page
   * reload here, so that the
   * repeated execution of
   * user scripts does not cause
   * errors when e.g. two click listeners
   * get bound to the body
   */
  function simulateReload() {
    // Remove all elements which were dynamicall added to the body element
    const bodyElemsToRemove = document.querySelectorAll(
      'body > :not(script):not(#___gatsby)',
    );
    bodyElemsToRemove.forEach((elem) => elem.remove());
    // $("body").off()
    recreateNode(document.querySelector('body'));
  }
  simulateReload();

  // This observer watches out for newly created link elements
  // and forces the use of gatsby's navigate
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((addedNode) => {
        if (!addedNode || !addedNode.querySelector) return;
        const addedLinkTags = [...addedNode.querySelectorAll('a')];
        if (addedNode.tagName === 'a') {
          addedLinkTags.push(addedNode);
        }
        addedLinkTags.forEach((linkElem) => {
          if (linkElem.attributes.href && linkElem.attributes.href.value) {
            const isLocalUrl = /^\/(?!\/)/.test(linkElem.attributes.href.value);
            if (isLocalUrl) {
              window.jamify.log(
                'Replacing <a> tag with Gatsby <Link>: ',
                linkElem.attributes.href.value,
              );
              linkElem.addEventListener('click', (e) => {
                /**
                 * WARNING: e.stopPropagation may also
                 * lead to unexpected side effects,
                 * as all actions which were intended
                 * to happen after a user clicks on this
                 * link, e.g. closing a accordeon
                 * don't happen anymore,
                 * but it's needed to prevent
                 * custom code to navigate to
                 * to another page.
                 * TODO: Use a custom babel plugin
                 * to detect changed on 'window.location.href'
                 * or calls to 'window.open' and replace
                 * it with a custom function, where we
                 * can decide wheter or not to
                 * accept the redirect.
                 */
                e.stopPropagation();
                e.preventDefault();
                navigate(linkElem.attributes.href.value);
              });
            }
          }
        });
      });
    });
  });
  observer.observe(document.body, { childList: true });
}

function waitFor(ms = 10) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Execute this function after
 * all "body" scripts have
 * been loaded
 */
export async function after() {
  if (typeof window === 'undefined') return;
  eventsToPrevent = [];
  document.dispatchEvent(new Event('DOMContentLoaded'));
  // Give event handlers a chance to execute
  await waitFor(1);
  window.dispatchEvent(new Event('load'));
  if (typeof window.onload === 'function') {
    window.onload(new Event('load'));
  }
  documentReadyState = 'complete';
  document.dispatchEvent(new Event('readystatechange'));
  if (typeof document.onreadystatechange === 'function') {
    document.onreadystatechange(new Event('readystatechange'));
  }
}
