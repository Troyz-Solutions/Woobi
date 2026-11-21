/**
 * Woobi Core Navigation - Navigation Router
 * Manages screen routing, bottom navigation tabs, and screen entry lifecycle hooks.
 */

export class NavigationRouter {
  constructor() {
    this.currentScreen = 'today';
    this.history = [];
    this.listeners = new Set();
    this.screenHooks = new Map();
    this.screenElements = new Map();
    this.activeScreenElement = null;
    this._cachedNavTabs = null;

    this.navMapping = {
      'today': 'today',
      'outfit-details': 'today',
      'swap-item': 'today',
      'outfit-ready': 'today',
      'preparing-outfits': 'today',
      'ai-stylist': 'today',
      'custom-builder': 'today',
      'photo-access': 'today',
      'not-enough-items': 'today',
      'outfit-feedback': 'today',
      'weekly-planning': 'today',
      'virtual-studio': 'today',

      'wardrobe': 'wardrobe',
      'review-item': 'wardrobe',
      'add-wardrobe': 'wardrobe',
      'empty-wardrobe': 'wardrobe',
      'upload-failed': 'wardrobe',
      'crop-photo': 'wardrobe',
      'edit-item': 'wardrobe',

      'saved': 'saved',
      'offline-mode': 'saved',

      'profile': 'profile',
      'wear-history': 'profile',
      'premium': 'profile',
      'manage-subscription': 'profile',
      'reminders': 'profile',
      'appearance-settings': 'profile',
      'performance-settings': 'profile',
      'account-privacy': 'profile',
      'help-support': 'profile',
      'delete-account': 'profile',
      'new-password': 'profile'
    };
  }

  registerScreenHook(screenId, callback) {
    if (!this.screenHooks.has(screenId)) {
      this.screenHooks.set(screenId, []);
    }
    this.screenHooks.get(screenId).push(callback);
  }

  onNavigate(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getScreenElement(screenId) {
    if (typeof document === 'undefined') return null;
    let el = this.screenElements.get(screenId);
    if (!el) {
      el = document.getElementById(`screen-${screenId}`);
      if (el) this.screenElements.set(screenId, el);
    }
    return el;
  }

  goToScreen(screenId) {
    const prevScreen = this.currentScreen;
    this.currentScreen = screenId;
    this.history.push(screenId);

    if (typeof document !== 'undefined') {
      // Synchronize debug screen selector dropdown if present
      const select = document.getElementById('screenSelect');
      if (select && select.value !== screenId) {
        select.value = screenId;
      }

      // Fast O(1) screen toggle using cached elements
      if (!this.activeScreenElement) {
        this.activeScreenElement = document.querySelector('.phone-screen.active');
      }
      const target = this.getScreenElement(screenId);
      if (target) {
        if (this.activeScreenElement && this.activeScreenElement !== target) {
          this.activeScreenElement.classList.remove('active');
        }
        target.classList.add('active');
        this.activeScreenElement = target;
      } else {
        // Fallback for dynamically injected or uncached screens
        document.querySelectorAll('.phone-screen').forEach(el => el.classList.remove('active'));
      }

      // Update Bottom Nav active tab indicator
      this.updateBottomNav(screenId);

      // Scroll phone screen container to top only if scrolled
      const container = document.getElementById('phoneScreenContainer');
      if (container && container.scrollTop !== 0) {
        container.scrollTop = 0;
      }
    }

    // 3D Rendering Lifecycle: Pause WebGL render loop on 2D pages to prevent lag & save CPU/GPU
    if (typeof window !== 'undefined' && window.Studio3D && window.Studio3D.isInitialized) {
      const is3DScreen = (screenId === 'today' || screenId === 'virtual-studio' || screenId === 'wardrobe');
      if (typeof window.Studio3D.setRenderingPaused === 'function') {
        window.Studio3D.setRenderingPaused(!is3DScreen);
      }
    }

    // Execute registered screen entry hooks
    const hooks = this.screenHooks.get(screenId);
    if (hooks) {
      hooks.forEach(fn => fn(screenId, prevScreen));
    }

    // Notify listeners
    this.listeners.forEach(fn => fn(screenId, prevScreen));
  }

  updateBottomNav(screenId) {
    if (typeof document === 'undefined') return;
    const targetTab = this.navMapping[screenId] || 'today';
    if (!this._cachedNavTabs || this._cachedNavTabs.length === 0) {
      this._cachedNavTabs = Array.from(document.querySelectorAll('.phone-bottom-nav .nav-tab')).map(btn => ({
        btn,
        text: btn.textContent.toLowerCase()
      }));
    }
    for (let i = 0; i < this._cachedNavTabs.length; i++) {
      const entry = this._cachedNavTabs[i];
      const isMatch = entry.text.includes(targetTab);
      entry.btn.classList.toggle('active', isMatch);
    }
  }

  getCurrentScreen() {
    return this.currentScreen;
  }
}

export const navigationRouter = new NavigationRouter();

// Backward compatibility bridge
if (typeof window !== 'undefined') {
  window.NavigationRouter = NavigationRouter;
  window.navigationRouter = navigationRouter;
  if (!window.app) window.app = {};
  const origGoToScreen = window.app.goToScreen;
  window.app.goToScreen = (screenId) => {
    navigationRouter.goToScreen(screenId);
    if (typeof origGoToScreen === 'function') origGoToScreen(screenId);
  };
}

export default navigationRouter;
