// tampermonkey/kagi-code-collapse.user.js
// ==UserScript==
// @name         Kagi Assistant Code Collapse
// @namespace    https://kagi.com/
// @version      0.1
// @description  Adds a collapse button to code blocks on Kagi Assistant.
// @match        https://kagi.com/assistant*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const collapseIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
     stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 10l4 -4l4 4"></path>
  <path d="M8 14l4 4l4 -4"></path>
</svg>`.trim();

  const style = document.createElement('style');
  style.textContent = `
.km-btn-collapse svg {
  transition: transform 0.2s ease;
}
.km-code-collapsed .km-btn-collapse svg {
  transform: rotate(180deg);
}
.km-code-collapsed .km-code-body {
  display: none !important;
}
`;
  document.head.appendChild(style);

  const processedAttr = 'kmCollapseInit';

  function findBody(block) {
    const directChildren = Array.from(block.children);
    const preferred = directChildren.find((el) =>
      el.matches('.highlight, .code-content, .code-body, pre, code')
    );
    if (preferred) {
      return preferred;
    }
    return directChildren.find(
      (el) =>
        !el.classList.contains('code-buttons') &&
        !el.classList.contains('code-header') &&
        !el.classList.contains('code-title')
    ) || null;
  }

  function enhance(block) {
    if (!block || block.dataset[processedAttr] === '1') {
      return;
    }

    const buttonsBar = block.querySelector('.code-buttons');
    if (!buttonsBar) {
      return;
    }

    const body = findBody(block);
    if (!body) {
      return;
    }

    block.dataset[processedAttr] = '1';
    body.classList.add('km-code-body');

    const templateBtn = buttonsBar.querySelector('button');
    const collapseBtn = templateBtn
      ? templateBtn.cloneNode(false)
      : document.createElement('button');

    collapseBtn.className = templateBtn ? templateBtn.className : 'btn-collapse';
    collapseBtn.classList.add('km-btn-collapse');
    collapseBtn.type = 'button';
    collapseBtn.title = 'Collapse';
    collapseBtn.innerHTML = collapseIcon;
    collapseBtn.removeAttribute('data-action');
    collapseBtn.setAttribute('aria-pressed', 'false');

    collapseBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const collapsed = block.classList.toggle('km-code-collapsed');
      collapseBtn.title = collapsed ? 'Expand' : 'Collapse';
      collapseBtn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    });

    buttonsBar.insertBefore(collapseBtn, buttonsBar.firstChild);
  }

  function scan(root = document) {
    root.querySelectorAll('.codehilite').forEach(enhance);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        if (node.matches && node.matches('.codehilite')) {
          enhance(node);
        } else {
          scan(node);
        }
      });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scan();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
