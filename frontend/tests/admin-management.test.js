import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { transformWithOxc } from 'vite';
import { createSubmissionGate } from '../src/utils/submissionGate.js';

const elements = tree => !React.isValidElement(tree) ? [] : [tree, ...React.Children.toArray(tree.props.children).flatMap(elements)];
const text = tree => React.isValidElement(tree) ? React.Children.toArray(tree.props.children).map(text).join('') : String(tree ?? '');
const button = (tree, title) => elements(tree).find(item => item.type === 'button' && text(item).trim() === title);
const event = { preventDefault() {} };

// Exercise the actual components and event handlers, with isolated API fixtures.
// No production account, database, or browser storage is used.
async function screen(name, { role = 'admin', confirm = async () => true, fail = false } = {}) {
  const file = name === 'AdminSuppliers' ? 'admin/AdminSuppliers.jsx' : 'staff/StaffInventory.jsx';
  const source = await readFile(new URL('../src/pages/' + file, import.meta.url), 'utf8');
  const { code } = await transformWithOxc(source, file, { jsx: { runtime: 'classic' } });
  const slots = []; let cursor = 0; let effects = [];
  const requests = []; const messages = [];
  const supplier = { _id: 's1', supplierId: 'SP001', name: 'Test Farm', purchaseDue: 0, purchaseReturnDue: 0, status: 'Active' };
  const category = { _id: 'c1', name: 'chili powder', type: 'spice' };
  const env = {
    React, console, createSubmissionGate, AdminLayout: 'AdminLayout', Layout: 'Layout',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef() { const index = cursor++; return slots[index] ??= { current: { showModal() {}, close() {} } }; },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (!slots[index] || dependencies.some((value, i) => slots[index][i] !== value)) effects.push(effect);
      slots[index] = dependencies;
    },
    useAuth: () => ({ user: { role } }),
    supplierApi: {
      getAll: async () => ({ data: { suppliers: [supplier] } }),
      create: async payload => { requests.push(['create', payload]); if (fail) throw new Error('Failed'); return { data: { supplier: { ...supplier, ...payload, _id: 's2' } } }; },
      remove: async id => { requests.push(['supplier-delete', id]); if (fail) throw new Error('Failed'); },
    },
    categoryApi: { getAll: async () => ({ data: { categories: [category] } }), remove: async id => { requests.push(['category-delete', id]); if (fail) throw new Error('Failed'); } },
    productApi: Object.fromEntries(['getAll', 'lowStock', 'expiring'].map(key => [key, async () => ({ data: { products: [] } })])),
    confirmAction: confirm, notify: { success: message => messages.push(message) },
    apiErrorMessage: () => 'Unable to save this change.', notifyApiError: () => messages.push('Delete failed'),
    getCategoryTheme: () => ({ chip: '', icon: 'Icon' }), exportToCSV() {}, downloadInventoryPDF() {},
  };
  for (const icon of ['Building2', 'CheckCircle2', 'XCircle', 'Search', 'Download', 'Plus', 'Trash2', 'X', 'AlertTriangle', 'Clock', 'Package', 'Edit2']) env[icon] = icon;
  runInNewContext(code.replace(/^import[\s\S]*?;\r?$/gm, '').replace('export default function', 'function') + `\nthis.Component = ${name};`, env);
  const render = () => {
    cursor = 0; effects = [];
    const tree = env.Component();
    effects.forEach(effect => effect());
    return tree;
  };
  render(); await new Promise(setImmediate);
  return { render, requests, messages };
}

test('supplier form creates a record, blocks duplicate submission, and refreshes the table', async () => {
  const { render, requests } = await screen('AdminSuppliers');
  button(render(), 'Add Supplier').props.onClick();
  let tree = render();
  for (const [label, value] of [['Supplier ID', ' SP002 '], ['Supplier name', ' New Farm '], ['Mobile number', '0771234567']]) {
    const field = elements(tree).find(item => item.type === 'label' && text(item).startsWith(label));
    elements(field).find(item => item.type === 'input').props.onChange({ target: { value } });
  }
  tree = render();
  const submit = elements(tree).find(item => item.type === 'form').props.onSubmit;
  await Promise.all([submit(event), submit(event)]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0][1].supplierId, 'SP002');
  assert.equal(requests[0][1].name, 'New Farm');
  assert.ok(text(render()).includes('New Farm'));
});

test('supplier deletion requires submitting the dialog, and cancellation sends no request', async () => {
  const { render, requests } = await screen('AdminSuppliers');
  elements(render()).find(item => item.props['aria-label'] === 'Delete supplier Test Farm').props.onClick();
  button(render(), 'Cancel').props.onClick();
  assert.equal(requests.length, 0);
  elements(render()).find(item => item.props['aria-label'] === 'Delete supplier Test Farm').props.onClick();
  await elements(render()).find(item => item.type === 'form').props.onSubmit(event);
  assert.deepEqual(requests, [['supplier-delete', 's1']]);
  assert.ok(!text(render()).includes('Test Farm'));
});

test('supplier deletion failure keeps the record and displays an error', async () => {
  const { render } = await screen('AdminSuppliers', { fail: true });
  elements(render()).find(item => item.props['aria-label'] === 'Delete supplier Test Farm').props.onClick();
  await elements(render()).find(item => item.type === 'form').props.onSubmit(event);
  assert.ok(text(render()).includes('Test Farm'));
  assert.ok(elements(render()).some(item => item.props.role === 'alert'));
});

test('category delete is admin-only and respects cancellation and API failures', async () => {
  for (const [role, confirmed, fail, expected] of [['staff', true, false, 0], ['admin', false, false, 0], ['admin', true, true, 1], ['admin', true, false, 1]]) {
    const { render, requests } = await screen('StaffInventory', { role, fail, confirm: async () => confirmed });
    const findDelete = () => button(render(), 'Delete Category');
    if (role === 'staff') { assert.equal(findDelete(), undefined); continue; }
    assert.equal(elements(render()).filter(item => item.props['aria-label']?.startsWith('Delete category ')).length, 0);
    findDelete().props.onClick();
    const select = elements(render()).find(item => item.type === 'select' && elements(item).some(child => child.props.value === 'c1'));
    select.props.onChange({ target: { value: 'c1' } });
    const dialog = elements(render()).find(item => item.type === 'dialog');
    elements(dialog).find(item => item.type === 'form').props.onSubmit(event);
    await new Promise(setImmediate);
    assert.equal(requests.length, expected);
    assert.equal(!!findDelete(), true);
  }
});

test('closing the category dropdown dialog does not delete anything', async () => {
  const { render, requests } = await screen('StaffInventory');
  button(render(), 'Delete Category').props.onClick();
  const dialog = elements(render()).find(item => item.type === 'dialog');
  assert.ok(elements(dialog).some(item => item.type === 'option' && item.props.value === 'c1'));
  button(dialog, 'Cancel').props.onClick();
  assert.equal(requests.length, 0);
  assert.equal(button(render(), 'Delete Category').props.disabled, false);
});
