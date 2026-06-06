'use strict';
// Comprehensive E2E API test
const BASE = 'http://localhost:5000/api';

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  if (!json.success && res.status >= 400) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.error}`);
  }
  return json;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  VendorBridge E2E API Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  let pass = 0, fail = 0;

  function ok(label) { console.log(`  ✅ ${label}`); pass++; }
  function ko(label, err) { console.log(`  ❌ ${label}: ${err.message}`); fail++; }

  // 1. HEALTH CHECK
  try {
    const h = await req('GET', '/health');
    ok(`Health: ${h.message} | DB: ${h.database}`);
  } catch (e) { ko('Health', e); }

  // 2. LOGIN - all 4 users
  let buyerToken, vendorToken, approverToken, adminToken;
  for (const [role, email] of [
    ['buyer', 'buyer@vendorbridge.com'],
    ['vendor', 'vendor@techsupply.com'],
    ['approver', 'approver@vendorbridge.com'],
    ['admin', 'admin@vendorbridge.com'],
  ]) {
    try {
      const r = await req('POST', '/login', { email, password: 'password123' });
      if (role === 'buyer') buyerToken = r.data.token;
      if (role === 'vendor') vendorToken = r.data.token;
      if (role === 'approver') approverToken = r.data.token;
      if (role === 'admin') adminToken = r.data.token;
      ok(`Login [${role}]: ${r.data.user.name} (${r.data.user.role})`);
    } catch (e) { ko(`Login [${role}]`, e); }
  }

  // 3. GET /me
  try {
    const me = await req('GET', '/me', null, buyerToken);
    ok(`GET /me: ${me.data.name} | org: ${me.data.organization?.name}`);
  } catch (e) { ko('GET /me', e); }

  // 4. VENDORS list
  try {
    const v = await req('GET', '/vendors', null, buyerToken);
    ok(`GET /vendors: ${v.data.length} vendors`);
  } catch (e) { ko('GET /vendors', e); }

  // 5. RFQs
  try {
    const rfqs = await req('GET', '/rfqs', null, buyerToken);
    ok(`GET /rfqs: ${rfqs.data.length} RFQs`);
  } catch (e) { ko('GET /rfqs', e); }

  // 6. QUOTATIONS
  try {
    const q = await req('GET', '/quotations', null, buyerToken);
    ok(`GET /quotations: ${q.data.length} quotations`);
  } catch (e) { ko('GET /quotations', e); }

  // 7. APPROVALS
  try {
    const a = await req('GET', '/approvals', null, approverToken);
    ok(`GET /approvals: ${a.data.length} approval requests`);
  } catch (e) { ko('GET /approvals', e); }

  // 8. PURCHASE ORDERS
  try {
    const po = await req('GET', '/purchase-orders', null, buyerToken);
    ok(`GET /purchase-orders: ${po.data.length} POs`);
  } catch (e) { ko('GET /purchase-orders', e); }

  // 9. INVOICES
  try {
    const inv = await req('GET', '/invoices', null, buyerToken);
    ok(`GET /invoices: ${inv.data.length} invoices`);
  } catch (e) { ko('GET /invoices', e); }

  // 10. USER LIST (admin)
  try {
    const u = await req('GET', '/users', null, adminToken);
    ok(`GET /users: ${u.data.length} users`);
  } catch (e) { ko('GET /users', e); }

  // 11. Vendor-specific PO listing (via vendor token)
  try {
    const vpo = await req('GET', '/purchase-orders', null, vendorToken);
    ok(`GET /purchase-orders [vendor]: ${vpo.data.length} POs`);
  } catch (e) { ko('GET /purchase-orders [vendor]', e); }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Results: ${pass} passed, ${fail} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
