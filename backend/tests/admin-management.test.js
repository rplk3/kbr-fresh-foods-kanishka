const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function controller(file, models) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers', file), 'utf8'), {
    module, exports: module.exports, console: { error() {} },
    require: name => { if (!(name in models)) throw new Error(`Unexpected dependency: ${name}`); return models[name]; },
  });
  return module.exports;
}
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('supplier creation trims required fields and preserves contact details', async () => {
  let saved;
  const api = controller('supplierController.js', {
    '../models/Supplier': { create: async payload => { saved = payload; return { _id: 'supplier-1', ...payload }; } },
    '../models/Product': {}, '../models/Purchase': {},
  });
  const res = response();
  await api.createSupplier({ body: { supplierId: ' SP100 ', name: ' Fresh Farm ', mobile: '0771234567' } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(saved.supplierId, 'SP100');
  assert.equal(saved.name, 'Fresh Farm');
  assert.equal(saved.mobile, '0771234567');
});

test('supplier creation rejects blank names and reports duplicate IDs', async () => {
  let calls = 0;
  const api = controller('supplierController.js', {
    '../models/Supplier': { create: async () => { calls++; throw { code: 11000 }; } },
    '../models/Product': {}, '../models/Purchase': {},
  });
  const invalid = response();
  await api.createSupplier({ body: { supplierId: 'SP100', name: '  ' } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(calls, 0);
  const duplicate = response();
  await api.createSupplier({ body: { supplierId: 'SP100', name: 'Fresh Farm' } }, duplicate);
  assert.equal(duplicate.statusCode, 409);
  assert.match(duplicate.body.message, /already exists/);
});

for (const reason of ['purchaseDue', 'purchaseReturnDue', 'product', 'purchase', 'unused', 'missing', 'invalid', 'database']) {
  test(`supplier deletion handles ${reason} without removing linked data`, async () => {
    let deletes = 0;
    const supplier = { _id: 'supplier-1', name: 'Fresh Farm', purchaseDue: 0, purchaseReturnDue: 0 };
    if (reason.endsWith('Due')) supplier[reason] = 100;
    const api = controller('supplierController.js', {
      '../models/Supplier': {
        findById: async () => {
          if (reason === 'invalid') throw { name: 'CastError' };
          if (reason === 'database') throw new Error('Disconnected');
          return reason === 'missing' ? null : supplier;
        },
        findByIdAndDelete: async id => { assert.equal(id, supplier._id); deletes++; },
      },
      '../models/Product': { exists: async query => { assert.equal(query.$or[0].supplierRef, supplier._id); assert.equal(query.$or[1].supplierName, supplier.name); return reason === 'product'; } },
      '../models/Purchase': { exists: async query => { assert.equal(query.supplierName, supplier.name); return reason === 'purchase'; } },
    });
    const res = response();
    await api.deleteSupplier({ params: { id: supplier._id } }, res);
    const codes = { unused: 200, missing: 404, invalid: 400, database: 500 };
    assert.equal(res.statusCode, codes[reason] || 409);
    assert.equal(deletes, reason === 'unused' ? 1 : 0);
  });
}

for (const reason of ['used', 'unused', 'missing', 'invalid', 'database']) {
  test(`category deletion handles ${reason} and never deletes products`, async () => {
    let deletes = 0;
    const api = controller('categoryController.js', {
      '../models/Category': {
        findById: async () => {
          if (reason === 'invalid') throw { name: 'CastError' };
          if (reason === 'database') throw new Error('Disconnected');
          return reason === 'missing' ? null : { _id: 'category-1' };
        },
        findByIdAndDelete: async () => { deletes++; },
      },
      '../models/Product': { exists: async query => {
        assert.equal(query.category, 'category-1');
        assert.deepEqual(Object.keys(query), ['category'], 'Include inactive products too');
        return reason === 'used';
      } },
    });
    const res = response();
    await api.deleteCategory({ params: { id: 'category-1' } }, res);
    assert.equal(res.statusCode, { used: 409, unused: 200, missing: 404, invalid: 400, database: 500 }[reason]);
    assert.equal(deletes, reason === 'unused' ? 1 : 0);
  });
}
