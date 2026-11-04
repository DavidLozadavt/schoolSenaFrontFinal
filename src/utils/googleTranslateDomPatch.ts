declare global {
  interface Window {
    __schoolSenaTranslateDomPatchInstalled?: boolean;
  }
}

export function installGoogleTranslateDomPatch(): void {
  if (typeof window === 'undefined' || typeof Node !== 'function' || !Node.prototype) {
    return;
  }
  if (window.__schoolSenaTranslateDomPatchInstalled) {
    return;
  }
  window.__schoolSenaTranslateDomPatchInstalled = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        try {
          originalRemoveChild.call(child.parentNode, child);
        } catch {
          /* ignore */
        }
      }
      return child;
    }
    // eslint-disable-next-line prefer-rest-params
    return originalRemoveChild.apply(this, arguments as unknown as [T]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    // eslint-disable-next-line prefer-rest-params
    return originalInsertBefore.apply(this, arguments as unknown as [T, Node | null]) as T;
  };
}
