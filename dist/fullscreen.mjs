// Keep the game view usable whether the browser grants native fullscreen or not.
export function mountFullscreen({
  surface,
  dialog,
  trigger,
  exitButton,
  background = [],
  onLayout = () => {},
}) {
  let active = false,
    wanted = false,
    pending = false,
    ownedNative = false,
    exiting = false,
    scrollY = 0,
    bodyStyle = '',
    returnFocus = null,
    inertStates = [],
    restoreAfterDialog = false;
  const nativeElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const nativeExit = () => document.exitFullscreen || document.webkitExitFullscreen;
  function viewport() {
    if (!active) return;
    const v = window.visualViewport,
      useVisual = !nativeElement() && (!v?.scale || v.scale === 1);
    surface.style.setProperty('--play-width', `${(useVisual && v?.width) || window.innerWidth}px`);
    surface.style.setProperty(
      '--play-height',
      `${(useVisual && v?.height) || window.innerHeight}px`,
    );
    onLayout(active);
  }
  function restoreFocus() {
    restoreAfterDialog = false;
    const visible = (el) => el?.isConnected && el.getClientRects().length;
    const target = visible(returnFocus)
      ? returnFocus
      : visible(trigger)
        ? trigger
        : surface.querySelector('#game-settings summary');
    target?.focus({ preventScroll: true });
  }
  function paint(next) {
    if (active === next) {
      if (active) viewport();
      return;
    }
    active = next;
    const settings = surface.querySelector('#game-settings');
    if (settings) settings.open = false;
    surface.classList.toggle('immersive', active);
    document.body.classList.toggle('immersive-open', active);
    trigger.setAttribute('aria-pressed', String(active));
    exitButton.hidden = !active;
    if (active) {
      restoreAfterDialog = false;
      scrollY = window.scrollY;
      bodyStyle = document.body.style.cssText;
      returnFocus = document.activeElement;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      inertStates = background.map((el) => [el, el.inert]);
      for (const [el] of inertStates) el.inert = true;
      surface.scrollTop = 0;
      viewport();
      exitButton.focus({ preventScroll: true });
    } else {
      for (const [el, inert] of inertStates) el.inert = inert;
      inertStates = [];
      document.body.style.cssText = bodyStyle;
      surface.style.removeProperty('--play-width');
      surface.style.removeProperty('--play-height');
      onLayout(false);
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
      if (dialog.open) restoreAfterDialog = true;
      else restoreFocus();
    }
  }
  async function leaveNative() {
    if (exiting) return;
    exiting = true;
    try {
      await nativeExit()?.call(document);
    } catch {
      if (nativeElement() === surface) {
        wanted = true;
        paint(true);
      }
    } finally {
      exiting = false;
      if (nativeElement() !== surface && !wanted) paint(false);
    }
  }
  function change() {
    if (nativeElement() === surface) {
      ownedNative = true;
      if (wanted) paint(true);
      else {
        paint(true);
        void leaveNative();
      }
    } else if (ownedNative) {
      ownedNative = false;
      wanted = false;
      paint(false);
    }
  }
  async function enter() {
    wanted = true;
    paint(true);
    if (pending || nativeElement() === surface) return;
    const request = surface.requestFullscreen || surface.webkitRequestFullscreen;
    if (
      !request ||
      (document.fullscreenEnabled === false && document.webkitFullscreenEnabled !== true)
    )
      return;
    pending = true;
    try {
      await request.call(surface, ...(surface.requestFullscreen ? [{ navigationUI: 'hide' }] : []));
      change();
    } catch {
      if (wanted) paint(true);
    } finally {
      pending = false;
      if (!wanted && nativeElement() !== surface) paint(false);
    }
  }
  function exit() {
    wanted = false;
    if (nativeElement() === surface) void leaveNative();
    else paint(false);
  }
  const toggle = () => (active ? exit() : enter());
  const escape = (event) => {
    if (event.key === 'Escape' && active && !dialog.open) {
      event.preventDefault();
      exit();
    }
  };
  const hide = () => {
    wanted = false;
    paint(false);
    if (nativeElement() === surface) void leaveNative();
  };
  trigger.addEventListener('click', toggle);
  exitButton.addEventListener('click', exit);
  dialog.addEventListener('close', () => {
    if (restoreAfterDialog && !active) restoreFocus();
  });
  document.addEventListener('fullscreenchange', change);
  document.addEventListener('webkitfullscreenchange', change);
  window.addEventListener('keydown', escape);
  window.addEventListener('pagehide', hide);
  window.addEventListener('resize', viewport);
  window.visualViewport?.addEventListener('resize', viewport);
  return {
    enter,
    exit,
    get active() {
      return active;
    },
    get pending() {
      return pending;
    },
  };
}
