export function findDivsByText(text) {
  const divs = document.querySelectorAll('div');
  const matchedDivs = [];
  for (const div of divs) {
    if (div.textContent === text) {
      matchedDivs.push(div);
    }
  }
  return matchedDivs.length > 0 ? matchedDivs : null;
}

export function findButtonsByText(text) {
  const buttons = document.querySelectorAll('div[role="button"]');
  const matchedButtons = [];
  for (const button of buttons) {
    if (button.textContent === text) {
      matchedButtons.push(button);
    }
  }
  return matchedButtons.length > 0 ? matchedButtons : null;
}

export const findClosestParent = (element, selector) => {
  let parent = element;
  while (parent.parentNode && !parent.querySelector(selector)) {
    parent = parent.parentNode;
  }
  return parent.querySelector(selector);
};

export function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

export const findClosest = (element, selector) => {
  let currentElement = element;
  while (currentElement.parentNode && !currentElement.querySelector(selector)) {
    currentElement = currentElement.parentNode;
  }
  return currentElement.querySelector(selector);
};

export function clearChildText(children) {
  for (let i = 0; i < children.length; i++) {
    children[i].textContent = '';
  }
  // let deleteEvent = new KeyboardEvent('keydown', {
  //   key: 'Delete',
  //   bubbles: true,
  // });
  // parentElement.dispatchEvent(deleteEvent);
}

export function clearContent(element) {
  if (element.contentEditable === 'true') {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Ensure the element is focused to receive the key event
    element.focus();

    // Create a keyboard event and dispatch it
    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });

    // For older browsers
    if (typeof event.initKeyboardEvent === 'function') {
      event.initKeyboardEvent('keydown', true, true, window, 'Delete', 0, '', false, '');
    }

    element.dispatchEvent(event);
  }
}
