/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import {assert} from 'chai';
import bel from 'bel';
import domEvents from 'dom-events';
import td from 'testdouble';
import {createMockRaf} from '../helpers/raf';
import {supportsCssVariables} from '../../../packages/mdc-ripple/util';

import {MDCRipple, MDCRippleFoundation} from '../../../packages/mdc-ripple/index';
import {MDCSelect} from '../../../packages/mdc-select/index';
import {cssClasses} from '../../../packages/mdc-select/constants';
import {MDCNotchedOutline} from '../../../packages/mdc-notched-outline/index';
import {MDCMenu, MDCMenuFoundation} from '../../../packages/mdc-menu/index';
import {MDCMenuSurfaceFoundation} from '../../../packages/mdc-menu-surface/index';
import MDCSelectFoundation from '../../../packages/mdc-select/foundation';
import MDCListFoundation from '../../../packages/mdc-list/foundation';

const LABEL_WIDTH = 100;

class FakeLabel {
  constructor() {
    this.float = td.func('label.float');
    this.getWidth = td.func('label.getWidth');

    td.when(this.getWidth()).thenReturn(LABEL_WIDTH);
  }
}

class FakeBottomLine {
  constructor() {
    this.activate = td.func('bottomLine.activate');
    this.deactivate = td.func('bottomLine.deactivate');
    this.setRippleCenter = td.func('bottomLine.setRippleCenter');
  }
}

class FakeOutline {
  constructor() {
    this.destroy = td.func('.destroy');
    this.notch = td.func('.notch');
    this.closeNotch = td.func('.closeNotch');
  }
}

class FakeMenu {
  constructor() {
    this.destroy = td.func('.destroy');
    this.items = [];
    this.hoistMenuToBody = td.func('.hoistMenuToBody');
    this.setAnchorElement = td.func('.setAnchorElement');
    this.setAnchorCorner = td.func('.setAnchorCorner');
    this.listen = td.func('.listen');
    this.unlisten = td.func('.listen');
  }
}

function getFixture() {
  return bel`
    <div class="mdc-select">
      <div class="mdc-select__selected-text"></div>
      <i class="mdc-select__dropdown-icon"></i>
      <div class="mdc-select__menu mdc-menu mdc-menu-surface">
      <ul class="mdc-list">
        <li class="mdc-list-item"></li>
        <li class="mdc-list-item" value="orange">          
          Orange
        </li>
        <li class="mdc-list-item" value="apple">
          Apple
        </li> 
      </ul>
      </div>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
}

function getOutlineFixture() {
  return bel`
    <div class="mdc-select mdc-select--outlined">
      <div class="mdc-select__selected-text"></div>
      <i class="mdc-select__dropdown-icon"></i>
      <div class="mdc-select__menu mdc-menu mdc-menu-surface">
      <ul class="mdc-list">
        <li class="mdc-list-item"></li>
        <li class="mdc-list-item" value="orange">          
          Orange
        </li>
        <li class="mdc-list-item" value="apple">
          Apple
        </li> 
      </ul>
      </div>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-notched-outline">
        <svg>
          <path class="mdc-notched-outline__path">
        </svg>
      </div>   
      <div class="mdc-notched-outline__idle"/>
    </div>
  `;
}

suite('MDCSelect-Enhanced');

test('attachTo returns a component instance', () => {
  assert.isOk(MDCSelect.attachTo(getFixture()) instanceof MDCSelect);
});

function setupTest(hasOutline = false, hasLabel = true, hasMockFoundation = false, hasMockMenu = true) {
  const bottomLine = new FakeBottomLine();
  const label = new FakeLabel();
  const fixture = hasOutline ? getOutlineFixture() : getFixture();
  const selectedText = fixture.querySelector('.mdc-select__selected-text');
  const labelEl = fixture.querySelector('.mdc-floating-label');
  const bottomLineEl = fixture.querySelector('.mdc-line-ripple');
  const menuSurface = fixture.querySelector('.mdc-select__menu');
  const MockFoundationConstructor = td.constructor(MDCSelectFoundation);
  const mockFoundation = new MockFoundationConstructor();
  const mockMenu = new FakeMenu();

  const outline = new FakeOutline();

  if (!hasLabel) {
    fixture.removeChild(labelEl);
  }

  const component = new MDCSelect(fixture,
    hasMockFoundation ? mockFoundation : undefined,
    () => label,
    () => bottomLine,
    () => outline,
    hasMockMenu ? () => mockMenu : (el) => new MDCMenu(el));

  return {fixture, selectedText, label, labelEl, bottomLine, bottomLineEl, component, outline, menuSurface,
    mockFoundation, mockMenu};
}

function setupWithMockFoundation() {
  return setupTest(false, true, true);
}

test('#get/setSelectedIndex', () => {
  const hasMockFoundation = false;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  assert.equal(component.selectedIndex, -1);
  component.selectedIndex = 1;
  assert.equal(component.selectedIndex, 1);
  menuSurface.parentElement.removeChild(menuSurface);
});

test('#get/setSelectedIndex 2x removes previously selected element', () => {
  const hasMockFoundation = false;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface,} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  assert.equal(component.selectedIndex, -1);
  component.selectedIndex = 1;
  component.selectedIndex = 2;
  assert.equal(component.selectedIndex, 2);
  assert.equal(menuSurface.querySelectorAll('.mdc-list-item--selected').length, 1);
  menuSurface.parentElement.removeChild(menuSurface);
});

test('#get/set disabled', () => {
  const {component, fixture} = setupTest();
  component.disabled = true;
  assert.isTrue(component.disabled);
  assert.isTrue(fixture.classList.contains(cssClasses.DISABLED));
  component.disabled = false;
  assert.isFalse(component.disabled);
  assert.isFalse(fixture.classList.contains(cssClasses.DISABLED));
});

test('#get value', () => {
  const hasMockFoundation = false;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  assert.equal(component.value, '');
  component.selectedIndex = 2;
  assert.equal(component.value, 'apple');
  component.selectedIndex = 1;
  assert.equal(component.value, 'orange');
  menuSurface.parentElement.removeChild(menuSurface);
});

test('#set value calls foundation.setValue', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {component, mockFoundation} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  component.value = 'orange';
  td.verify(mockFoundation.setValue('orange'), {times: 1});
});

test('#set selectedIndex calls foundation.selectedIndex', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {component, mockFoundation} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  component.selectedIndex = 1;
  td.verify(mockFoundation.setSelectedIndex(1), {times: 1});
});

test('#set disabled calls foundation.setDisabled', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {component, mockFoundation} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  component.disabled = true;
  td.verify(mockFoundation.setDisabled(true), {times: 1});
});

test('#initialSyncWithDOM sets the selected index if an option has the selected class', () => {
  const fixture = bel`
    <div class="mdc-select">
      <div class="mdc-select__selected-text"></div>
      <div class="mdc-select__menu mdc-menu mdc-menu-surface">
      <ul class="mdc-list">
        <li class="mdc-list-item"></li>
        <li class="mdc-list-item mdc-list-item--selected" value="orange">          
          Orange
        </li>
        <li class="mdc-list-item" value="apple">
          Apple
        </li> 
      </ul>
      </div>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture, /* foundation */ undefined);
  assert.equal(component.selectedIndex, 1);
});

test('#initialSyncWithDOM disables the select if the disabled class is found', () => {
  const fixture = bel`
    <div class="mdc-select mdc-select--disabled">
      <div class="mdc-select__selected-text"></div>
      <div class="mdc-select__menu mdc-menu mdc-menu-surface">
      <ul class="mdc-list">
        <li class="mdc-list-item mdc-list-item--selected"></li>
        <li class="mdc-list-item" value="orange">          
          Orange
        </li>
        <li class="mdc-list-item" value="apple">
          Apple
        </li> 
      </ul>
      </div>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture);
  assert.isTrue(component.disabled);
});

test('instantiates ripple', function() {
  if (!supportsCssVariables(window, true)) {
    this.skip(); // eslint-disable-line no-invalid-this
    return;
  }

  const fixture = getFixture();
  const raf = createMockRaf();

  const component = MDCSelect.attachTo(fixture);
  raf.flush();

  assert.instanceOf(component.ripple, MDCRipple);
  assert.isTrue(fixture.classList.contains(MDCRippleFoundation.cssClasses.ROOT));
  raf.restore();
});

test(`#constructor instantiates an outline on the ${cssClasses.OUTLINE_SELECTOR} element if present`, () => {
  const root = getFixture();
  root.appendChild(bel`<div class="mdc-notched-outline"></div>`);
  const component = new MDCSelect(root);
  assert.instanceOf(component.outline_, MDCNotchedOutline);
});

test('handles ripple focus properly', function() {
  if (!supportsCssVariables(window, true)) {
    this.skip(); // eslint-disable-line no-invalid-this
    return;
  }

  const fixture = getFixture();
  const raf = createMockRaf();

  MDCSelect.attachTo(fixture);
  raf.flush();

  const selectedText = fixture.querySelector('.mdc-select__selected-text');

  domEvents.emit(selectedText, 'focus');
  raf.flush();

  assert.isTrue(fixture.classList.contains(MDCRippleFoundation.cssClasses.BG_FOCUSED));
  raf.restore();
});

test('#destroy removes the ripple', function() {
  if (!supportsCssVariables(window, true)) {
    this.skip(); // eslint-disable-line no-invalid-this
    return;
  }

  const fixture = getFixture();
  const raf = createMockRaf();

  const component = new MDCSelect(fixture);
  raf.flush();

  assert.isTrue(fixture.classList.contains(MDCRippleFoundation.cssClasses.ROOT));
  component.destroy();
  raf.flush();

  assert.isFalse(fixture.classList.contains(MDCRippleFoundation.cssClasses.ROOT));
  raf.restore();
});

test('#destroy cleans up the outline if present', () => {
  const {component, outline} = setupTest();
  component.outline_ = outline;
  component.destroy();
  td.verify(outline.destroy());
});

test(`does not instantiate ripple when ${cssClasses.OUTLINED} class is present`, () => {
  const hasOutline = true;
  const {component} = setupTest(hasOutline);
  assert.isUndefined(component.ripple);
  assert.doesNotThrow(
    () => component.destroy());
});

test('adapter#addClass adds a class to the root element', () => {
  const {component, fixture} = setupTest();
  component.getDefaultFoundation().adapter_.addClass('foo');
  assert.isTrue(fixture.classList.contains('foo'));
});

test('adapter#removeClass removes a class from the root element', () => {
  const {component, fixture} = setupTest();
  fixture.classList.add('foo');
  component.getDefaultFoundation().adapter_.removeClass('foo');
  assert.isFalse(fixture.classList.contains('foo'));
});

test('adapter#hasClass returns true if a class exists on the root element', () => {
  const {component, fixture} = setupTest();
  fixture.classList.add('foo');
  assert.isTrue(component.getDefaultFoundation().adapter_.hasClass('foo'));
});

test('adapter_#floatLabel does not throw error if label does not exist', () => {
  const fixture = bel`
    <div class="mdc-select">
      <div class="mdc-select__selected-text"></div>
      <div class="mdc-select__menu mdc-menu mdc-menu-surface">
      <ul class="mdc-list">
        <li class="mdc-list-item mdc-list-item--selected"></li>
        <li class="mdc-list-item" value="orange">          
          Orange
        </li>
        <li class="mdc-list-item" value="apple">
          Apple
        </li> 
      </ul>
      </div>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture);
  assert.doesNotThrow(
    () => component.getDefaultFoundation().adapter_.floatLabel('foo'));
});

test('adapter#activateBottomLine and adapter.deactivateBottomLine ' +
  'does not throw error if bottomLine does not exist', () => {
  const fixture = bel`
    <div class="mdc-select">
      <div class="mdc-select__selected-text"></div>
      <div class="mdc-select__menu mdc-menu mdc-menu-surface">
      <ul class="mdc-list">
        <li class="mdc-list-item mdc-list-item--selected"></li>
        <li class="mdc-list-item" value="orange">          
          Orange
        </li>
        <li class="mdc-list-item" value="apple">
          Apple
        </li> 
      </ul>
      </div>
      <label class="mdc-floating-label">Pick a Food Group</label>
    </div>
  `;
  const component = new MDCSelect(fixture);
  assert.doesNotThrow(
    () => component.getDefaultFoundation().adapter_.activateBottomLine());
  assert.doesNotThrow(
    () => component.getDefaultFoundation().adapter_.deactivateBottomLine());
});

test('adapter#isRtl returns true when the root element is in an RTL context' +
  'and false otherwise', () => {
  const wrapper = bel`<div dir="rtl"></div>`;
  const {fixture, component} = setupTest();
  assert.isFalse(component.getDefaultFoundation().adapter_.isRtl());

  wrapper.appendChild(fixture);
  document.body.appendChild(wrapper);
  assert.isTrue(component.getDefaultFoundation().adapter_.isRtl());

  document.body.removeChild(wrapper);
});

test('adapter#floatLabel adds a class to the label', () => {
  const {component, label} = setupTest();

  component.getDefaultFoundation().adapter_.floatLabel('foo');
  td.verify(label.float('foo'));
});

test('adapter#activateBottomLine adds active class to the bottom line', () => {
  const {component, bottomLine} = setupTest();

  component.getDefaultFoundation().adapter_.activateBottomLine();
  td.verify(bottomLine.activate());
});

test('adapter#deactivateBottomLine removes active class from the bottom line', () => {
  const {component, bottomLine} = setupTest();

  component.getDefaultFoundation().adapter_.deactivateBottomLine();
  td.verify(bottomLine.deactivate());
});

test('adapter#notchOutline proxies labelWidth and isRtl to the outline', () => {
  const hasOutline = true;
  const {component, outline} = setupTest(hasOutline);
  const isRtl = false;

  component.getDefaultFoundation().adapter_.notchOutline(LABEL_WIDTH, isRtl);
  td.verify(outline.notch(LABEL_WIDTH, isRtl), {times: 1});
});

test('adapter#notchOutline does not proxy values to the outline if it does not exist', () => {
  const hasOutline = false;
  const {component, outline} = setupTest(hasOutline);
  const isRtl = false;

  component.getDefaultFoundation().adapter_.notchOutline(LABEL_WIDTH, isRtl);
  td.verify(outline.notch(LABEL_WIDTH, isRtl), {times: 0});
});

test('adapter#closeOutline closes the outline if there is an outline', () => {
  const hasOutline = true;
  const {component, outline} = setupTest(hasOutline);
  const adapter = component.getDefaultFoundation().adapter_;
  td.reset();
  adapter.closeOutline();
  td.verify(outline.closeNotch(), {times: 1});
});

test('adapter#closeOutline does nothing if there is no outline', () => {
  const hasOutline = false;
  const {component, outline} = setupTest(hasOutline);
  const adapter = component.getDefaultFoundation().adapter_;

  adapter.closeOutline();
  td.verify(outline.closeNotch(), {times: 0});
});

test('adapter#getLabelWidth returns the width of the label', () => {
  const {component} = setupTest();
  assert.equal(component.getDefaultFoundation().adapter_.getLabelWidth(), LABEL_WIDTH);
});

test('adapter#getLabelWidth returns 0 if the label does not exist', () => {
  const hasOutline = true;
  const hasLabel = false;
  const {component} = setupTest(hasOutline, hasLabel);

  assert.equal(component.getDefaultFoundation().adapter_.getLabelWidth(), 0);
});

test('adapter#getValue returns the selected element value', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  const textValue = menuSurface.querySelectorAll('.mdc-list-item')[1].getAttribute('value');
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.setSelectedIndex(1);
  const value = adapter.getValue();

  assert.equal(value, textValue);
  document.body.removeChild(menuSurface);
});

test('adapter#getValue returns the text content of the list item if no value attribute is present', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  const listItem = menuSurface.querySelectorAll('.mdc-list-item')[1];
  listItem.removeAttribute('value');
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.setSelectedIndex(1);
  const value = adapter.getValue();

  assert.equal(value, listItem.textContent.trim());
  document.body.removeChild(menuSurface);
});

test('adapter#setValue sets the list item to selected when the value is found in the list', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  const listItemValue = menuSurface.querySelectorAll('.mdc-list-item')[1].getAttribute('value');
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.setValue(listItemValue);

  assert.equal(adapter.getValue(), listItemValue);
  document.body.removeChild(menuSurface);
});

test('adapter#setValue sets the selectedElement_ to the value if the value attribute is not found in the list', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  const listItem = menuSurface.querySelectorAll('.mdc-list-item')[1];
  const listItemValue = listItem.getAttribute('value');
  listItem.removeAttribute('value');
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.setValue(listItemValue);

  assert.equal(adapter.getValue(), listItemValue);
  document.body.removeChild(menuSurface);
});

test('adapter#openMenu causes the menu to open', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component, mockMenu} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.openMenu();
  adapter.openMenu();
  assert.isTrue(mockMenu.open);
  document.body.removeChild(fixture);
});

test('adapter#closeMenu causes the menu to close', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component, mockMenu} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.openMenu();
  adapter.closeMenu();
  assert.isFalse(mockMenu.open);
  document.body.removeChild(fixture);
});

test('adapter#isMenuOpen returns true if the menu is opened, and false if not', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const adapter = component.getDefaultFoundation().adapter_;
  assert.isFalse(adapter.isMenuOpen());
  adapter.openMenu();
  assert.isTrue(adapter.isMenuOpen());
  document.body.removeChild(fixture);
});

test('adapter#setSelectedIndex adds the --selected class to the list item at the index specified', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const adapter = component.getDefaultFoundation().adapter_;
  assert.isNull(menuSurface.querySelector(`.${MDCListFoundation.cssClasses.LIST_ITEM_SELECTED_CLASS}`));
  adapter.setSelectedIndex(1);
  assert.isNotNull(menuSurface.querySelector(`.${MDCListFoundation.cssClasses.LIST_ITEM_SELECTED_CLASS}`));
  document.body.removeChild(fixture);
  document.body.removeChild(menuSurface);
});

test('adapter#setDisabled adds the --disabled class to the root element', () => {
  const hasMockFoundation = true;
  const hasMockMenu = true;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const adapter = component.getDefaultFoundation().adapter_;
  assert.isFalse(fixture.classList.contains(MDCSelectFoundation.cssClasses.DISABLED));
  adapter.setDisabled(true);
  assert.isTrue(fixture.classList.contains(MDCSelectFoundation.cssClasses.DISABLED));
  adapter.setDisabled(false);
  assert.isFalse(fixture.classList.contains(MDCSelectFoundation.cssClasses.DISABLED));
  document.body.removeChild(fixture);
});

test('change event triggers foundation.handleChange()', () => {
  const {selectedText, mockFoundation} = setupWithMockFoundation();
  domEvents.emit(selectedText, 'change');
  td.verify(mockFoundation.handleChange(true), {times: 1});
});

test('focus event triggers foundation.handleFocus()', () => {
  const {selectedText, mockFoundation} = setupWithMockFoundation();
  domEvents.emit(selectedText, 'focus');
  td.verify(mockFoundation.handleFocus(), {times: 1});
});

test('blur event triggers foundation.handleBlur()', () => {
  const {selectedText, mockFoundation} = setupWithMockFoundation();
  domEvents.emit(selectedText, 'blur');
  td.verify(mockFoundation.handleBlur(), {times: 1});
});

test('#destroy removes the change handler', () => {
  const {component, selectedText, mockFoundation} = setupWithMockFoundation();
  component.destroy();
  domEvents.emit(selectedText, 'change');
  td.verify(mockFoundation.handleChange(), {times: 0});
});

test('#destroy removes the focus handler', () => {
  const {component, selectedText, mockFoundation} = setupWithMockFoundation();
  component.destroy();
  domEvents.emit(selectedText, 'focus');
  td.verify(mockFoundation.handleFocus(), {times: 0});
});

test('#destroy removes the blur handler', () => {
  const {component, selectedText, mockFoundation} = setupWithMockFoundation();
  component.destroy();
  domEvents.emit(selectedText, 'blur');
  td.verify(mockFoundation.handleBlur(), {times: 0});
});

test('#destroy removes the click handler', () => {
  const {component, selectedText, mockFoundation} = setupWithMockFoundation();
  component.destroy();
  domEvents.emit(selectedText, 'click');
  td.verify(mockFoundation.handleClick(), {times: 0});
});

test('#destroy calls menu#destroy', () => {
  const {component, mockMenu} = setupTest();
  component.destroy();
  td.verify(mockMenu.destroy(), {times: 1});
});

test(`#destroy removes the listener for the ${MDCMenuFoundation.strings.SELECTED_EVENT}`, () => {
  const hasMockFoundation = false;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component, mockFoundation, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation,
    hasMockMenu);
  document.body.appendChild(fixture);
  component.destroy();

  const evtType = MDCMenuFoundation.strings.SELECTED_EVENT;
  const detail = {index: 1};
  let evt;
  if (typeof CustomEvent === 'function') {
    evt = new CustomEvent(evtType, {
      detail,
      bubbles: false,
    });
  } else {
    evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(evtType, false, false, detail);
  }
  menuSurface.dispatchEvent(evt);
  td.verify(mockFoundation.setSelectedIndex(1), {times: 0});

  document.body.removeChild(menuSurface);
  document.body.removeChild(fixture);
});

test('#destroy removes the mouseup listener', () => {
  const {bottomLine, component, fixture} = setupTest();
  const event = document.createEvent('MouseEvent');
  const clientX = 200;
  const clientY = 200;

  component.destroy();
  // IE11 mouseup event.
  event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  fixture.querySelector('.mdc-select__selected-text').dispatchEvent(event);

  td.verify(bottomLine.setRippleCenter(200), {times: 0});
});

test('mouseup on the select sets the line ripple origin', () => {
  const {bottomLine, fixture} = setupTest();
  const event = document.createEvent('MouseEvent');
  const clientX = 200;
  const clientY = 200;
  // IE11 mouseup event.
  event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  fixture.querySelector('.mdc-select__selected-text').dispatchEvent(event);

  td.verify(bottomLine.setRippleCenter(200), {times: 1});
});

test('mouseup on the select does nothing if the it does not have a lineRipple', () => {
  const hasOutline = true;
  const {bottomLine, fixture} = setupTest(hasOutline);
  const event = document.createEvent('MouseEvent');
  const clientX = 200;
  const clientY = 200;
  // IE11 mouseup event.
  event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  fixture.querySelector('.mdc-select__selected-text').dispatchEvent(event);

  td.verify(bottomLine.setRippleCenter(200), {times: 0});
});

test('menu surface opened event causes the first element (if not element is selected) to be focused', () => {
  const hasMockFoundation = false;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  component.selectedIndex = -1;

  const event = document.createEvent('Event');
  event.initEvent(MDCMenuSurfaceFoundation.strings.OPENED_EVENT, false, true);
  menuSurface.dispatchEvent(event);

  assert.equal(document.activeElement, menuSurface.querySelector('.mdc-list-item'));
  document.body.removeChild(fixture);
  document.body.removeChild(menuSurface);
});

test('menu surface opened event causes selected element to be focused', () => {
  const hasMockFoundation = false;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, component, menuSurface} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  component.selectedIndex = 1;
  const event = document.createEvent('Event');
  event.initEvent(MDCMenuSurfaceFoundation.strings.OPENED_EVENT, false, true);
  menuSurface.dispatchEvent(event);

  assert.equal(document.activeElement, menuSurface.querySelector('.mdc-list-item--selected'));
  assert.equal(component.selectedIndex, 1);
  document.body.removeChild(fixture);
  document.body.removeChild(menuSurface);
});

test('menu surface closed event calls foundation blur if selected-text is focused', () => {
  const {fixture, menuSurface, mockFoundation} = setupWithMockFoundation();
  document.body.appendChild(fixture);
  fixture.querySelector('.mdc-select__selected-text').focus();
  const event = document.createEvent('Event');
  event.initEvent(MDCMenuSurfaceFoundation.strings.CLOSED_EVENT, false, true);
  menuSurface.dispatchEvent(event);

  td.verify(mockFoundation.handleBlur(), {times: 0});
  document.body.removeChild(fixture);
});

test('menu surface closed event does not call foundation blur if selected-text is not focused', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, menuSurface, mockFoundation} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const event = document.createEvent('Event');
  event.initEvent(MDCMenuSurfaceFoundation.strings.CLOSED_EVENT, false, true);
  menuSurface.dispatchEvent(event);

  td.verify(mockFoundation.handleBlur(), {times: 1});
  document.body.removeChild(fixture);
  document.body.removeChild(menuSurface);
});

test('keydown event is added to selected-text when initialized', () => {
  const {fixture, mockFoundation} = setupWithMockFoundation();
  document.body.appendChild(fixture);
  domEvents.emit(fixture.querySelector('.mdc-select__selected-text'), 'keydown');
  td.verify(mockFoundation.handleKeydown(td.matchers.anything()), {times: 1});
  document.body.removeChild(fixture);
});

test('keydown event is removed from selected-text when destroyed', () => {
  const {fixture, mockFoundation, component} = setupWithMockFoundation();
  document.body.appendChild(fixture);
  component.destroy();
  domEvents.emit(fixture.querySelector('.mdc-select__selected-text'), 'keydown');
  td.verify(mockFoundation.handleKeydown(td.matchers.anything()), {times: 0});
  document.body.removeChild(fixture);
});

test('menu surface selected event causes the select to update', () => {
  const hasMockFoundation = true;
  const hasMockMenu = false;
  const hasOutline = false;
  const hasLabel = true;
  const {fixture, menuSurface, mockFoundation} = setupTest(hasOutline, hasLabel, hasMockFoundation, hasMockMenu);
  document.body.appendChild(fixture);
  const evtType = MDCMenuFoundation.strings.SELECTED_EVENT;
  const detail = {index: 1};
  let evt;
  if (typeof CustomEvent === 'function') {
    evt = new CustomEvent(evtType, {
      detail,
      bubbles: false,
    });
  } else {
    evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(evtType, false, false, detail);
  }
  menuSurface.dispatchEvent(evt);
  td.verify(mockFoundation.setSelectedIndex(1), {times: 1});

  document.body.removeChild(menuSurface);
  document.body.removeChild(fixture);
});
