import assert from 'node:assert/strict';
import { mountFullscreen } from '../dist/fullscreen.mjs';
class Element extends EventTarget {
  constructor() {
    super();
    this.isConnected = true;
    this.hidden = false;
    this.inert = false;
    this.attributes = {};
    this.classes = new Set();
    this.classList = {
      toggle: (name, on) => (on ? this.classes.add(name) : this.classes.delete(name)),
    };
    this.style = {
      cssText: 'color:red',
      setProperty: (k, v) => (this.style[k] = v),
      removeProperty: (k) => delete this.style[k],
    };
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  getClientRects() {
    return this.hidden ? [] : [{}];
  }
  focus() {
    document.activeElement = this;
  }
  querySelector() {
    return null;
  }
}
function fixture() {
  const doc = new EventTarget(),
    win = new EventTarget();
  doc.body = new Element();
  Object.assign(win, {
    innerWidth: 1024,
    innerHeight: 768,
    scrollY: 240,
    scrollTo: ({ top }) => (win.scrollY = top),
    visualViewport: Object.assign(new EventTarget(), { width: 1024, height: 768, scale: 1 }),
  });
  Object.assign(globalThis, { document: doc, window: win });
  const surface = new Element(),
    dialog = new Element(),
    trigger = new Element(),
    exitButton = new Element(),
    background = [new Element(), new Element()];
  background[1].inert = true;
  dialog.open = false;
  trigger.focus();
  let layouts = 0;
  const controller = mountFullscreen({
    surface,
    dialog,
    trigger,
    exitButton,
    background,
    onLayout: () => layouts++,
  });
  const change = () => doc.dispatchEvent(new Event('fullscreenchange'));
  const escape = () => {
    const e = new Event('keydown', { cancelable: true });
    e.key = 'Escape';
    win.dispatchEvent(e);
  };
  return {
    doc,
    win,
    surface,
    dialog,
    trigger,
    exitButton,
    background,
    controller,
    change,
    escape,
    layouts: () => layouts,
  };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
{
  const f = fixture();
  await f.controller.enter();
  assert.equal(f.controller.active, true);
  assert.equal(f.surface.style['--play-height'], '768px');
  assert.ok(f.background.every((e) => e.inert));
  assert.equal(f.doc.activeElement, f.exitButton);
  f.win.visualViewport.height = 640;
  f.win.visualViewport.dispatchEvent(new Event('resize'));
  assert.equal(f.surface.style['--play-height'], '640px');
  f.escape();
  assert.equal(f.controller.active, false);
  assert.equal(f.doc.body.style.cssText, 'color:red');
  assert.equal(f.win.scrollY, 240);
  assert.deepEqual(
    f.background.map((e) => e.inert),
    [false, true],
  );
  assert.equal(f.doc.activeElement, f.trigger);
}
{
  const f = fixture();
  f.surface.requestFullscreen = async () => {
    throw Error('denied');
  };
  await f.controller.enter();
  assert.equal(f.controller.active, true);
  assert.equal(f.controller.pending, false);
  f.controller.exit();
  assert.equal(f.controller.active, false);
}
{
  const f = fixture();
  f.surface.requestFullscreen = async () => {
    f.doc.fullscreenElement = f.surface;
    f.change();
  };
  f.doc.exitFullscreen = async () => {
    f.doc.fullscreenElement = null;
    f.change();
  };
  await f.controller.enter();
  assert.equal(f.controller.active, true);
  f.escape();
  await tick();
  assert.equal(f.doc.fullscreenElement, null);
  assert.equal(f.controller.active, false);
  await f.controller.enter();
  f.doc.fullscreenElement = null;
  f.change();
  assert.equal(f.controller.active, false, 'browser exit synchronizes playing view');
}
{
  const f = fixture();
  let grant;
  f.surface.requestFullscreen = () =>
    new Promise(
      (r) =>
        (grant = () => {
          f.doc.fullscreenElement = f.surface;
          f.change();
          r();
        }),
    );
  f.doc.exitFullscreen = async () => {
    f.doc.fullscreenElement = null;
    f.change();
  };
  const pending = f.controller.enter();
  f.controller.exit();
  assert.equal(f.controller.active, false);
  grant();
  await pending;
  await tick();
  assert.equal(f.doc.fullscreenElement, null);
  assert.equal(f.controller.active, false);
  assert.equal(f.doc.body.style.cssText, 'color:red');
}
{
  const f = fixture();
  f.doc.fullscreenEnabled = false;
  f.doc.webkitFullscreenEnabled = true;
  f.surface.webkitRequestFullscreen = () => {
    f.doc.webkitFullscreenElement = f.surface;
    f.doc.dispatchEvent(new Event('webkitfullscreenchange'));
  };
  f.doc.webkitExitFullscreen = () => {
    f.doc.webkitFullscreenElement = null;
    f.doc.dispatchEvent(new Event('webkitfullscreenchange'));
  };
  await f.controller.enter();
  assert.equal(f.controller.active, true);
  f.controller.exit();
  await tick();
  assert.equal(f.controller.active, false);
}
{
  const f = fixture();
  await f.controller.enter();
  f.dialog.open = true;
  const close = new Element();
  close.focus();
  f.escape();
  assert.equal(f.controller.active, true, 'dialog Escape does not close game view');
  f.controller.exit();
  assert.equal(f.doc.activeElement, close, 'exit leaves modal focus alone');
  f.dialog.open = false;
  f.dialog.dispatchEvent(new Event('close'));
  assert.equal(f.doc.activeElement, f.trigger, 'closing modal restores original launcher');
}
{
  const f = fixture();
  f.surface.requestFullscreen = async () => {
    f.doc.fullscreenElement = f.surface;
    f.change();
  };
  f.doc.exitFullscreen = async () => {
    throw Error('exit failed');
  };
  await f.controller.enter();
  f.controller.exit();
  await tick();
  assert.equal(f.controller.active, true);
  assert.equal(f.exitButton.hidden, false);
}
console.log(
  'Fullscreen fallback, native/prefixed events, delayed grant, Escape, modal focus, viewport and exit-failure recovery: pass',
);
