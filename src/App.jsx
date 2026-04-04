import { useState, useEffect, useRef } from "react";

// ── Google Fonts ───────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap";

// ── Role Permissions ───────────────────────────────────────────────────────
const PERMISSIONS = {
  Owner:      { invoices: true,  purchases: true,  inventory: true,  contacts: true,  reports: true,  payments: true,  deleteAny: true,  manageUsers: true  },
  Manager:    { invoices: true,  purchases: true,  inventory: true,  contacts: true,  reports: true,  payments: true,  deleteAny: true,  manageUsers: false },
  Sales:      { invoices: true,  purchases: false, inventory: false, contacts: true,  reports: false, payments: true,  deleteAny: false, manageUsers: false },
  Purchasing: { invoices: false, purchases: true,  inventory: true,  contacts: true,  reports: false, payments: false, deleteAny: false, manageUsers: false },
  Viewer:     { invoices: false, purchases: false, inventory: false, contacts: false, reports: true,  payments: false, deleteAny: false, manageUsers: false },
};

// ── Seed Data ──────────────────────────────────────────────────────────────
const SEED = {
  customers: [
    { id: "C001", name: "Hartwell Construction", phone: "555-0101", email: "orders@hartwell.com", balance: 4200 },
    { id: "C002", name: "Pinnacle Builders",     phone: "555-0182", email: "accounts@pinnacle.com", balance: 1750 },
    { id: "C003", name: "Blue Ridge Contractors",phone: "555-0234", email: "info@blueridge.com",   balance: 0    },
  ],
  suppliers: [
    { id: "S001", name: "SteelCore Supply",    phone: "555-0301", email: "sales@steelcore.com",    balance: 8500 },
    { id: "S002", name: "CementWorks Ltd",     phone: "555-0342", email: "orders@cementworks.com", balance: 2100 },
    { id: "S003", name: "TimberPro Wholesale", phone: "555-0390", email: "trade@timberpro.com",    balance: 0    },
  ],
  inventory: [
    { id: "INV001", name: "Portland Cement (50kg)", sku: "CEM-50", unit: "bag",   qty: 320,   cost: 12.5, price: 18.0, category: "Cement"     },
    { id: "INV002", name: "Steel Rebar 12mm (6m)",  sku: "RBR-12", unit: "rod",   qty: 480,   cost: 8.2,  price: 13.5, category: "Steel"      },
    { id: "INV003", name: "Red Facing Brick",        sku: "BRK-RF", unit: "piece", qty: 12400, cost: 0.45, price: 0.85, category: "Bricks"     },
    { id: "INV004", name: "Plywood 18mm (2.4x1.2m)",sku: "PLY-18", unit: "sheet", qty: 145,   cost: 22.0, price: 36.0, category: "Timber"     },
    { id: "INV005", name: "Sand (per tonne)",        sku: "SND-01", unit: "tonne", qty: 58,    cost: 28.0, price: 45.0, category: "Aggregates" },
    { id: "INV006", name: "Gravel 20mm (per tonne)", sku: "GRV-20", unit: "tonne", qty: 42,    cost: 32.0, price: 52.0, category: "Aggregates" },
  ],
  invoices: [
    { id: "IV-2025-001", customerId: "C001", date: "2025-03-10", due: "2025-03-25", status: "paid",   items: [{ inventoryId: "INV001", qty: 80, price: 18.0 }, { inventoryId: "INV002", qty: 60, price: 13.5 }], total: 2250, payments: [{ id:"P001", date:"2025-03-24", amount:2250, method:"Bank Transfer", note:"Full payment" }] },
    { id: "IV-2025-002", customerId: "C002", date: "2025-03-18", due: "2025-04-02", status: "partial", items: [{ inventoryId: "INV003", qty: 2000, price: 0.85 }], total: 1700, payments: [{ id:"P002", date:"2025-03-28", amount:750, method:"Cash", note:"Deposit" }] },
    { id: "IV-2025-003", customerId: "C001", date: "2025-03-25", due: "2025-04-09", status: "unpaid", items: [{ inventoryId: "INV004", qty: 70, price: 36.0 }], total: 2520, payments: [] },
    { id: "IV-2025-004", customerId: "C003", date: "2025-02-14", due: "2025-03-01", status: "overdue", items: [{ inventoryId: "INV005", qty: 20, price: 45.0 }], total: 900, payments: [] },
  ],
  purchases: [
    { id: "PO-2025-001", supplierId: "S001", date: "2025-03-05", status: "received", items: [{ inventoryId: "INV002", qty: 200, cost: 8.2  }], total: 1640, payments: [{ id:"PP001", date:"2025-03-10", amount:1640, method:"Bank Transfer", note:"" }] },
    { id: "PO-2025-002", supplierId: "S002", date: "2025-03-12", status: "pending",  items: [{ inventoryId: "INV001", qty: 150, cost: 12.5 }], total: 1875, payments: [] },
  ],
  users: [
    { id: "U1", name: "Isaac Owusu", role: "Owner",     avatar: "IO", pin: "1234" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `₵${Number(n || 0).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];
const uuid  = () => Math.random().toString(36).slice(2, 9);
const invId = (list) => `IV-${new Date().getFullYear()}-${String(list.length + 1).padStart(3,"0")}`;
const poId  = (list) => `PO-${new Date().getFullYear()}-${String(list.length + 1).padStart(3,"0")}`;
const paidAmount = (inv) => (inv.payments||[]).reduce((s,p)=>s+p.amount,0);
const STATUS_COLOR = { paid:"#22c55e", partial:"#a78bfa", unpaid:"#f59e0b", overdue:"#ef4444", received:"#22c55e", pending:"#f59e0b", cancelled:"#6b7280" };

// ── Icon ──────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
  const p = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    invoice:   <><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 2 2 2-2 2 2 3-2V4a2 2 0 0 0-2-2z"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="11" y1="16" x2="8" y2="16"/></>,
    purchase:  <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    inventory: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    customers: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    reports:   <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    payments:  <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    users:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    pdf:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    lock:      <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    check:     <><polyline points="20 6 9 17 4 12"/></>,
    warn:      <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    print:     <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
};

// ── Reusable UI ────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
    <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:12,width:"100%",maxWidth:wide?800:600,maxHeight:"90vh",overflowY:"auto" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid #2d3448",position:"sticky",top:0,background:"#1a1f2e",zIndex:1 }}>
        <h2 style={{ margin:0,fontSize:18,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,color:"#f0a500" }}>{title}</h2>
        <button onClick={onClose} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer" }}><Icon name="x"/></button>
      </div>
      <div style={{ padding:24 }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, children, half }) => (
  <div style={{ marginBottom:16,gridColumn:half?"span 1":undefined }}>
    <label style={{ display:"block",fontSize:11,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",marginBottom:6 }}>{label}</label>
    {children}
  </div>
);
const Input = (props) => <input {...props} style={{ width:"100%",background:"#0f1420",border:"1px solid #2d3448",borderRadius:6,padding:"9px 12px",color:"#e8eaf0",fontSize:14,outline:"none",boxSizing:"border-box",...props.style }}/>;
const Sel = ({ children,...props }) => <select {...props} style={{ width:"100%",background:"#0f1420",border:"1px solid #2d3448",borderRadius:6,padding:"9px 12px",color:"#e8eaf0",fontSize:14,outline:"none",boxSizing:"border-box" }}>{children}</select>;
const Btn = ({ children, variant="primary", ...props }) => <button {...props} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",background:variant==="primary"?"#f0a500":variant==="ghost"?"transparent":"#2d3448",color:variant==="primary"?"#0f1420":variant==="danger"?"#ef4444":"#e8eaf0",border:variant==="ghost"?"1px solid #2d3448":"none",...props.style }}>{children}</button>;
const Badge = ({ status }) => <span style={{ fontSize:11,fontWeight:700,color:STATUS_COLOR[status]||"#8892a4",background:`${STATUS_COLOR[status]||"#8892a4"}22`,padding:"3px 10px",borderRadius:4,textTransform:"uppercase",whiteSpace:"nowrap" }}>{status}</span>;

const PageHeader = ({ title, sub, action }) => (
  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28 }}>
    <div>
      <h1 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2,color:"#f0a500",margin:0 }}>{title}</h1>
      {sub && <p style={{ color:"#8892a4",fontSize:14,margin:"4px 0 0" }}>{sub}</p>}
    </div>
    {action}
  </div>
);

const Table = ({ heads, rows, empty="No data." }) => (
  <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,overflow:"hidden" }}>
    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
      <thead>
        <tr style={{ borderBottom:"1px solid #2d3448" }}>
          {heads.map(h=><th key={h} style={{ padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",whiteSpace:"nowrap" }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length===0
          ? <tr><td colSpan={heads.length} style={{ padding:32,textAlign:"center",color:"#8892a4" }}>{empty}</td></tr>
          : rows.map((row,i)=>(
            <tr key={i} style={{ borderBottom:"1px solid #2d3448",background:i%2===0?"transparent":"#1e2436" }}>
              {row.map((cell,j)=><td key={j} style={{ padding:"11px 16px",verticalAlign:"middle" }}>{cell}</td>)}
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

// ── Print Invoice HTML ─────────────────────────────────────────────────────
const printInvoice = (inv, customers, inventory) => {
  const cust = customers.find(c=>c.id===inv.customerId);
  const paid = paidAmount(inv);
  const balance = inv.total - paid;
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Invoice ${inv.id} — Imprexions Ventures</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:40px;max-width:800px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #f0a500}
  .brand{font-size:28px;font-weight:900;letter-spacing:2px;color:#f0a500;text-transform:uppercase}
  .brand-sub{font-size:11px;color:#888;letter-spacing:1px}
  .inv-title{font-size:32px;font-weight:900;color:#1a1a2e;letter-spacing:1px}
  .inv-num{font-size:14px;color:#888;margin-top:4px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
  .meta-box label{font-size:10px;font-weight:700;letter-spacing:1px;color:#999;text-transform:uppercase;display:block;margin-bottom:4px}
  .meta-box p{font-size:14px;font-weight:600;color:#1a1a2e}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#f5f5f8;padding:10px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;color:#666;text-transform:uppercase}
  td{padding:12px 14px;border-bottom:1px solid #eee;font-size:13px}
  .totals{display:flex;justify-content:flex-end}
  .totals-box{width:280px}
  .totals-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #eee}
  .totals-row.total{font-size:18px;font-weight:900;color:#f0a500;border-bottom:none;margin-top:4px}
  .totals-row.balance{font-size:15px;font-weight:700;color:#ef4444}
  .status-badge{display:inline-block;padding:3px 12px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;background:#${inv.status==='paid'?'22c55e':'f59e0b'}22;color:#${inv.status==='paid'?'22c55e':'f59e0b'};border:1px solid}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center}
  @media print{body{padding:20px}}
</style></head><body>
<div class="header">
  <div><div class="brand">Imprexions Ventures</div><div class="brand-sub">BUILDING MATERIALS</div></div>
  <div style="text-align:right"><div class="inv-title">INVOICE</div><div class="inv-num">${inv.id}</div><div style="margin-top:8px"><span class="status-badge">${inv.status.toUpperCase()}</span></div></div>
</div>
<div class="meta">
  <div class="meta-box"><label>Bill To</label><p style="font-size:16px;font-weight:700">${cust?.name||'—'}</p><p style="color:#666;font-weight:400">${cust?.email||''}</p><p style="color:#666;font-weight:400">${cust?.phone||''}</p></div>
  <div class="meta-box"><label>Invoice Date</label><p>${inv.date}</p><br/><label>Due Date</label><p>${inv.due}</p></div>
</div>
<table>
  <thead><tr><th>#</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    ${inv.items.map((it,i)=>{const prod=inventory.find(x=>x.id===it.inventoryId);return`<tr><td>${i+1}</td><td>${prod?.name||it.inventoryId}</td><td style="text-align:center">${it.qty} ${prod?.unit||''}</td><td style="text-align:right">${fmt(it.price)}</td><td style="text-align:right;font-weight:600">${fmt(it.qty*it.price)}</td></tr>`;}).join('')}
  </tbody>
</table>
<div class="totals"><div class="totals-box">
  <div class="totals-row"><span>Subtotal</span><span>${fmt(inv.total)}</span></div>
  <div class="totals-row total"><span>TOTAL</span><span>${fmt(inv.total)}</span></div>
  <div class="totals-row"><span>Amount Paid</span><span style="color:#22c55e">${fmt(paid)}</span></div>
  ${balance>0?`<div class="totals-row balance"><span>Balance Due</span><span>${fmt(balance)}</span></div>`:''}
</div></div>
${inv.payments&&inv.payments.length?`<div style="margin-top:24px"><h3 style="font-size:12px;font-weight:700;letter-spacing:1px;color:#999;text-transform:uppercase;margin-bottom:12px">Payment History</h3><table><thead><tr><th>Date</th><th>Method</th><th>Note</th><th style="text-align:right">Amount</th></tr></thead><tbody>${inv.payments.map(p=>`<tr><td>${p.date}</td><td>${p.method}</td><td>${p.note||'—'}</td><td style="text-align:right;color:#22c55e;font-weight:600">${fmt(p.amount)}</td></tr>`).join('')}</tbody></table></div>`:''}
<div class="footer">Imprexions Ventures · Building Materials · Thank you for your business!</div>
</body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(),400);
};

// ── Print Receipt ───────────────────────────────────────────────────────────
const printReceipt = (payment, inv, cust) => {
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Payment Receipt — Imprexions Ventures</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:40px;max-width:600px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #f0a500}
  .brand{font-size:28px;font-weight:900;letter-spacing:2px;color:#f0a500;text-transform:uppercase}
  .brand-sub{font-size:11px;color:#888;letter-spacing:1px}
  .receipt-title{font-size:32px;font-weight:900;color:#1a1a2e;letter-spacing:1px}
  .receipt-num{font-size:14px;color:#888;margin-top:4px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
  .meta-box label{font-size:10px;font-weight:700;letter-spacing:1px;color:#999;text-transform:uppercase;display:block;margin-bottom:4px}
  .meta-box p{font-size:14px;font-weight:600;color:#1a1a2e}
  .amount{display:flex;justify-content:center;margin:40px 0}
  .amount-box{background:#f5f5f8;border-radius:12px;padding:24px;text-align:center;border:2px solid #f0a500}
  .amount-label{font-size:12px;font-weight:700;letter-spacing:1px;color:#999;text-transform:uppercase;margin-bottom:8px}
  .amount-value{font-size:36px;font-weight:900;color:#f0a500}
  .details{margin-bottom:32px}
  .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center}
  @media print{body{padding:20px}}
</style></head><body>
<div class="header">
  <div><div class="brand">Imprexions Ventures</div><div class="brand-sub">BUILDING MATERIALS</div></div>
  <div style="text-align:right"><div class="receipt-title">RECEIPT</div><div class="receipt-num">${payment.id}</div></div>
</div>
<div class="meta">
  <div class="meta-box"><label>Received From</label><p style="font-size:16px;font-weight:700">${cust?.name||'—'}</p><p style="color:#666;font-weight:400">${cust?.email||''}</p><p style="color:#666;font-weight:400">${cust?.phone||''}</p></div>
  <div class="meta-box"><label>Invoice</label><p>${inv.id}</p><br/><label>Payment Date</label><p>${payment.date}</p></div>
</div>
<div class="amount">
  <div class="amount-box">
    <div class="amount-label">Amount Paid</div>
    <div class="amount-value">${fmt(payment.amount)}</div>
  </div>
</div>
<div class="details">
  <div class="detail-row"><span>Payment Method</span><span>${payment.method}</span></div>
  ${payment.note?`<div class="detail-row"><span>Note</span><span>${payment.note}</span></div>`:''}
  <div class="detail-row"><span>Invoice Total</span><span>${fmt(inv.total)}</span></div>
  <div class="detail-row"><span>Previous Balance</span><span>${fmt(inv.total - payment.amount)}</span></div>
</div>
<div class="footer">Imprexions Ventures · Building Materials · Thank you for your payment!</div>
</body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(),400);
};

// ── Print Report ───────────────────────────────────────────────────────────
const printReport = (title, data) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} — Imprexions Ventures</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:40px}
.brand{font-size:22px;font-weight:900;letter-spacing:2px;color:#f0a500;text-transform:uppercase}
h1{font-size:28px;font-weight:900;margin:16px 0 8px}
p{color:#666;font-size:13px;margin-bottom:24px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
.kpi{background:#f5f5f8;border-radius:8px;padding:16px;border-left:4px solid #f0a500}
.kpi label{font-size:10px;font-weight:700;letter-spacing:1px;color:#999;text-transform:uppercase;display:block;margin-bottom:4px}
.kpi span{font-size:22px;font-weight:900;color:#1a1a2e}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px}
th{background:#f5f5f8;padding:8px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;color:#666;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid #eee}
.footer{margin-top:32px;font-size:11px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:12px}
</style></head><body>
<div class="brand">Imprexions Ventures</div>
<h1>${title}</h1>
<p>Generated: ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
${data}
<div class="footer">Imprexions Ventures · Confidential Business Report</div>
</body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(),400);
};

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
const Dashboard = ({ data }) => {
  const totalRevenue   = data.invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.total,0);
  const outstanding    = data.invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.total-paidAmount(i)),0);
  const totalPurchases = data.purchases.reduce((s,p)=>s+p.total,0);
  const inventoryValue = data.inventory.reduce((s,i)=>s+i.qty*i.cost,0);
  const overdue        = data.invoices.filter(i=>i.status==="overdue");

  const KPI = ({ label, value, color, sub }) => (
    <div style={{ background:"#1a1f2e",border:`1px solid ${color}33`,borderRadius:10,padding:"20px 24px",flex:1,minWidth:160 }}>
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:1.5,color:"#8892a4",textTransform:"uppercase",marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26,fontWeight:800,color,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12,color:"#8892a4",marginTop:4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Dashboard" sub="Imprexions Ventures — Building Materials" />
      {overdue.length>0 && (
        <div style={{ background:"#ef444415",border:"1px solid #ef4444",borderRadius:8,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10,color:"#ef4444",fontSize:14,fontWeight:600 }}>
          <Icon name="warn" size={16}/> {overdue.length} invoice(s) are overdue — action required!
        </div>
      )}
      <div style={{ display:"flex",gap:16,flexWrap:"wrap",marginBottom:28 }}>
        <KPI label="Revenue Collected" value={fmt(totalRevenue)} color="#22c55e" sub="Fully paid invoices" />
        <KPI label="Outstanding"        value={fmt(outstanding)}  color="#f59e0b" sub="Balance due" />
        <KPI label="Total Purchases"    value={fmt(totalPurchases)} color="#60a5fa" sub="All purchase orders" />
        <KPI label="Inventory Value"    value={fmt(inventoryValue)} color="#a78bfa" sub="At cost price" />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
        <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:20 }}>
          <h3 style={{ margin:"0 0 16px",fontSize:12,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase" }}>Recent Invoices</h3>
          {[...data.invoices].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(inv=>{
            const cust=data.customers.find(c=>c.id===inv.customerId);
            return <div key={inv.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #2d3448" }}>
              <div><div style={{ fontSize:13,fontWeight:600,color:"#e8eaf0" }}>{inv.id}</div><div style={{ fontSize:12,color:"#8892a4" }}>{cust?.name}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:14,fontWeight:700,color:"#e8eaf0" }}>{fmt(inv.total)}</div><Badge status={inv.status}/></div>
            </div>;
          })}
        </div>
        <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:20 }}>
          <h3 style={{ margin:"0 0 16px",fontSize:12,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase" }}>Stock Levels</h3>
          {data.inventory.map(item=>(
            <div key={item.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #2d3448" }}>
              <div style={{ fontSize:13,color:"#e8eaf0" }}>{item.name}</div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontSize:13,fontWeight:700,color:item.qty<50?"#ef4444":"#22c55e" }}>{item.qty.toLocaleString()}</span>
                {item.qty<50 && <Icon name="warn" size={13}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════════════════
const Invoices = ({ data, setData, can }) => {
  const [showNew, setShowNew]     = useState(false);
  const [payModal, setPayModal]   = useState(null); // invoice obj
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState("all");
  const [form, setForm]           = useState({ customerId:"", date:today(), due:"", items:[{ inventoryId:"", qty:1 }] });
  const [payForm, setPayForm]     = useState({ date:today(), amount:"", method:"Bank Transfer", note:"" });

  const filtered = data.invoices.filter(inv=>{
    const cust = data.customers.find(c=>c.id===inv.customerId);
    const matchSearch = inv.id.toLowerCase().includes(search.toLowerCase()) || cust?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus==="all" || inv.status===filterStatus;
    return matchSearch && matchStatus;
  });

  const addItem    = () => setForm(f=>({...f,items:[...f.items,{inventoryId:"",qty:1}]}));
  const removeItem = (i)=> setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i,k,v)=> setForm(f=>{ const it=[...f.items]; it[i]={...it[i],[k]:v}; return{...f,items:it}; });
  const calcTotal  = ()=> form.items.reduce((s,it)=>{ const inv=data.inventory.find(x=>x.id===it.inventoryId); return s+(inv?inv.price*Number(it.qty):0); },0);

  const saveInv = () => {
    if(!form.customerId||!form.due) return;
    const total = calcTotal();
    setData(d=>({...d, invoices:[...d.invoices,{ id:invId(d.invoices),...form,status:"unpaid",total,payments:[] }]}));
    setShowNew(false);
    setForm({ customerId:"",date:today(),due:"",items:[{inventoryId:"",qty:1}] });
  };

  const addPayment = () => {
    if(!payForm.amount||Number(payForm.amount)<=0) return;
    setData(d=>({
      ...d,
      invoices: d.invoices.map(inv=>{
        if(inv.id!==payModal.id) return inv;
        const newPayments = [...(inv.payments||[]),{ id:"P"+uuid(),...payForm,amount:Number(payForm.amount) }];
        const paid = newPayments.reduce((s,p)=>s+p.amount,0);
        const status = paid>=inv.total?"paid":paid>0?"partial":"unpaid";
        return {...inv,payments:newPayments,status};
      })
    }));
    setPayModal(null);
    setPayForm({ date:today(),amount:"",method:"Bank Transfer",note:"" });
  };

  const deleteInv = (id) => setData(d=>({...d,invoices:d.invoices.filter(i=>i.id!==id)}));

  return (
    <div>
      <PageHeader title="Invoices" sub="Sales to your customers"
        action={can.invoices && <Btn onClick={()=>setShowNew(true)}><Icon name="plus" size={16}/>New Invoice</Btn>} />

      <div style={{ display:"flex",gap:12,marginBottom:20,flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#8892a4" }}><Icon name="search" size={16}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices…"
            style={{ width:"100%",background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:8,padding:"9px 12px 9px 38px",color:"#e8eaf0",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
        </div>
        <Sel value={filterStatus} onChange={e=>setFilter(e.target.value)} style={{ width:140 }}>
          {["all","paid","partial","unpaid","overdue"].map(s=><option key={s} value={s}>{s==="all"?"All Status":s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </Sel>
      </div>

      <Table heads={["Invoice #","Customer","Date","Due","Total","Paid","Balance","Status","Actions"]}
        rows={filtered.map(inv=>{
          const cust = data.customers.find(c=>c.id===inv.customerId);
          const paid = paidAmount(inv);
          const bal  = inv.total - paid;
          return [
            <span style={{ fontWeight:700,color:"#60a5fa" }}>{inv.id}</span>,
            <span style={{ color:"#e8eaf0",fontWeight:600 }}>{cust?.name||"—"}</span>,
            <span style={{ color:"#8892a4" }}>{inv.date}</span>,
            <span style={{ color:"#8892a4" }}>{inv.due}</span>,
            <span style={{ fontWeight:700,color:"#e8eaf0" }}>{fmt(inv.total)}</span>,
            <span style={{ color:"#22c55e",fontWeight:600 }}>{fmt(paid)}</span>,
            <span style={{ fontWeight:700,color:bal>0?"#f59e0b":"#22c55e" }}>{fmt(bal)}</span>,
            <Badge status={inv.status}/>,
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {can.payments && bal>0 && <button onClick={()=>setPayModal(inv)} style={{ background:"#a78bfa22",color:"#a78bfa",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>+ Payment</button>}
              <button onClick={()=>printInvoice(inv,data.customers,data.inventory)} style={{ background:"none",border:"1px solid #2d3448",borderRadius:5,padding:"4px 8px",color:"#8892a4",cursor:"pointer" }}><Icon name="pdf" size={13}/></button>
              {can.deleteAny && <button onClick={()=>deleteInv(inv.id)} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer" }}><Icon name="trash" size={13}/></button>}
            </div>
          ];
        })}
      />

      {/* New Invoice Modal */}
      {showNew && (
        <Modal title="New Invoice" onClose={()=>setShowNew(false)}>
          <Field label="Customer"><Sel value={form.customerId} onChange={e=>setForm(f=>({...f,customerId:e.target.value}))}>
            <option value="">Select customer…</option>
            {data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel></Field>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <Field label="Invoice Date"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
            <Field label="Due Date"><Input type="date" value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))}/></Field>
          </div>
          <Field label="Line Items">
            {form.items.map((item,i)=>{
              const prod = data.inventory.find(x=>x.id===item.inventoryId);
              return <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 80px 90px 32px",gap:8,marginBottom:8 }}>
                <Sel value={item.inventoryId} onChange={e=>updateItem(i,"inventoryId",e.target.value)}>
                  <option value="">Select product…</option>
                  {data.inventory.map(inv=><option key={inv.id} value={inv.id}>{inv.name}</option>)}
                </Sel>
                <Input type="number" min="1" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)} placeholder="Qty"/>
                <Input readOnly value={prod?fmt(prod.price*item.qty):"$0.00"} style={{ color:"#f0a500" }}/>
                <button onClick={()=>removeItem(i)} style={{ background:"none",border:"1px solid #2d3448",borderRadius:6,color:"#8892a4",cursor:"pointer" }}><Icon name="x" size={14}/></button>
              </div>;
            })}
            <button onClick={addItem} style={{ background:"none",border:"1px dashed #2d3448",borderRadius:6,padding:"8px 16px",color:"#8892a4",cursor:"pointer",fontSize:13,width:"100%",marginTop:4 }}>+ Add Line Item</button>
          </Field>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderTop:"1px solid #2d3448" }}>
            <span style={{ fontSize:18,fontWeight:800,color:"#f0a500",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1 }}>TOTAL: {fmt(calcTotal())}</span>
            <Btn onClick={saveInv}>Save Invoice</Btn>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {payModal && (
        <Modal title={`Record Payment — ${payModal.id}`} onClose={()=>setPayModal(null)}>
          <div style={{ background:"#0f1420",borderRadius:8,padding:16,marginBottom:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ color:"#8892a4",fontSize:13 }}>Invoice Total</span><span style={{ fontWeight:700,color:"#e8eaf0" }}>{fmt(payModal.total)}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ color:"#8892a4",fontSize:13 }}>Already Paid</span><span style={{ fontWeight:700,color:"#22c55e" }}>{fmt(paidAmount(payModal))}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <span style={{ color:"#8892a4",fontSize:13 }}>Balance Due</span><span style={{ fontWeight:700,color:"#f59e0b",fontSize:16 }}>{fmt(payModal.total-paidAmount(payModal))}</span>
            </div>
          </div>
          {(payModal.payments||[]).length>0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",marginBottom:8 }}>Payment History</div>
              {payModal.payments.map(p=>(
                <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #2d3448",fontSize:13 }}>
                  <div><span style={{ color:"#e8eaf0" }}>{p.date}</span> · <span style={{ color:"#8892a4" }}>{p.method}</span>{p.note&&<> · <span style={{ color:"#8892a4" }}>{p.note}</span></>}</div>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontWeight:700,color:"#22c55e" }}>{fmt(p.amount)}</span>
                    <button onClick={()=>printReceipt(p, payModal, data.customers.find(c=>c.id===payModal.customerId))} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer",padding:4 }}><Icon name="pdf" size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Field label="Payment Date"><Input type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Amount"><Input type="number" step="0.01" value={payForm.amount} placeholder={`Max ${fmt(payModal.total-paidAmount(payModal))}`} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))}/></Field>
          <Field label="Payment Method">
            <Sel value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}>
              {["Bank Transfer","Cash","Cheque","Mobile Money","Card","Backend","Other"].map(m=><option key={m}>{m}</option>)}
            </Sel>
          </Field>
          <Field label="Note (optional)"><Input value={payForm.note} onChange={e=>setPayForm(f=>({...f,note:e.target.value}))}/></Field>
          <div style={{ textAlign:"right" }}><Btn onClick={addPayment}><Icon name="check" size={15}/>Record Payment</Btn></div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PURCHASES
// ══════════════════════════════════════════════════════════════════════════
const Purchases = ({ data, setData, can }) => {
  const [showNew, setShowNew] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [form, setForm] = useState({ supplierId:"", date:today(), items:[{ inventoryId:"", qty:1 }] });
  const [payForm, setPayForm] = useState({ date:today(), amount:"", method:"Bank Transfer", note:"" });

  const addItem    = () => setForm(f=>({...f,items:[...f.items,{inventoryId:"",qty:1}]}));
  const removeItem = (i)=> setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i,k,v)=> setForm(f=>{ const it=[...f.items]; it[i]={...it[i],[k]:v}; return{...f,items:it}; });
  const calcTotal  = ()=> form.items.reduce((s,it)=>{ const inv=data.inventory.find(x=>x.id===it.inventoryId); return s+(inv?inv.cost*Number(it.qty):0); },0);

  const savePO = () => {
    if(!form.supplierId) return;
    setData(d=>({...d, purchases:[...d.purchases,{ id:poId(d.purchases),...form,status:"pending",total:calcTotal(),payments:[] }]}));
    setShowNew(false);
    setForm({ supplierId:"",date:today(),items:[{inventoryId:"",qty:1}] });
  };

  const markReceived = (id) => {
    const po = data.purchases.find(p=>p.id===id);
    setData(d=>({
      ...d,
      purchases: d.purchases.map(p=>p.id===id?{...p,status:"received"}:p),
      inventory: d.inventory.map(inv=>{ const it=po.items.find(x=>x.inventoryId===inv.id); return it?{...inv,qty:inv.qty+Number(it.qty)}:inv; }),
    }));
  };

  const addPayment = () => {
    if(!payForm.amount||Number(payForm.amount)<=0) return;
    setData(d=>({
      ...d,
      purchases: d.purchases.map(po=>{
        if(po.id!==payModal.id) return po;
        const newPayments=[...(po.payments||[]),{id:"PP"+uuid(),...payForm,amount:Number(payForm.amount)}];
        return {...po,payments:newPayments};
      })
    }));
    setPayModal(null);
    setPayForm({ date:today(),amount:"",method:"Bank Transfer",note:"" });
  };

  return (
    <div>
      <PageHeader title="Purchase Orders" sub="Stock from your suppliers"
        action={can.purchases && <Btn onClick={()=>setShowNew(true)}><Icon name="plus" size={16}/>New PO</Btn>} />
      <Table heads={["PO #","Supplier","Date","Items","Total","Paid","Status","Actions"]}
        rows={data.purchases.map(po=>{
          const sup=data.suppliers.find(s=>s.id===po.supplierId);
          const paid=paidAmount(po);
          return [
            <span style={{ fontWeight:700,color:"#60a5fa" }}>{po.id}</span>,
            <span style={{ color:"#e8eaf0",fontWeight:600 }}>{sup?.name||"—"}</span>,
            <span style={{ color:"#8892a4" }}>{po.date}</span>,
            <span style={{ color:"#8892a4" }}>{po.items.length} line(s)</span>,
            <span style={{ fontWeight:700,color:"#e8eaf0" }}>{fmt(po.total)}</span>,
            <span style={{ color:"#22c55e",fontWeight:600 }}>{fmt(paid)}</span>,
            <Badge status={po.status}/>,
            <div style={{ display:"flex",gap:6 }}>
              {can.purchases && po.status==="pending" && <button onClick={()=>markReceived(po.id)} style={{ background:"#22c55e22",color:"#22c55e",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>Mark Received</button>}
              {can.payments && <button onClick={()=>setPayModal(po)} style={{ background:"#a78bfa22",color:"#a78bfa",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>Payments</button>}
            </div>
          ];
        })}
      />

      {showNew && (
        <Modal title="New Purchase Order" onClose={()=>setShowNew(false)}>
          <Field label="Supplier"><Sel value={form.supplierId} onChange={e=>setForm(f=>({...f,supplierId:e.target.value}))}>
            <option value="">Select supplier…</option>
            {data.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Items">
            {form.items.map((item,i)=>{
              const prod=data.inventory.find(x=>x.id===item.inventoryId);
              return <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 80px 90px 32px",gap:8,marginBottom:8 }}>
                <Sel value={item.inventoryId} onChange={e=>updateItem(i,"inventoryId",e.target.value)}>
                  <option value="">Select product…</option>
                  {data.inventory.map(inv=><option key={inv.id} value={inv.id}>{inv.name}</option>)}
                </Sel>
                <Input type="number" min="1" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)} placeholder="Qty"/>
                <Input readOnly value={prod?fmt(prod.cost*item.qty):"$0.00"} style={{ color:"#60a5fa" }}/>
                <button onClick={()=>removeItem(i)} style={{ background:"none",border:"1px solid #2d3448",borderRadius:6,color:"#8892a4",cursor:"pointer" }}><Icon name="x" size={14}/></button>
              </div>;
            })}
            <button onClick={addItem} style={{ background:"none",border:"1px dashed #2d3448",borderRadius:6,padding:"8px 16px",color:"#8892a4",cursor:"pointer",fontSize:13,width:"100%",marginTop:4 }}>+ Add Item</button>
          </Field>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderTop:"1px solid #2d3448" }}>
            <span style={{ fontSize:18,fontWeight:800,color:"#60a5fa",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1 }}>TOTAL: {fmt(calcTotal())}</span>
            <Btn onClick={savePO}>Save PO</Btn>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title={`Payments — ${payModal.id}`} onClose={()=>setPayModal(null)}>
          <div style={{ background:"#0f1420",borderRadius:8,padding:16,marginBottom:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ color:"#8892a4",fontSize:13 }}>PO Total</span><span style={{ fontWeight:700,color:"#e8eaf0" }}>{fmt(payModal.total)}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <span style={{ color:"#8892a4",fontSize:13 }}>Total Paid</span><span style={{ fontWeight:700,color:"#22c55e" }}>{fmt(paidAmount(payModal))}</span>
            </div>
          </div>
          {(payModal.payments||[]).map(p=>(
            <div key={p.id} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #2d3448",fontSize:13 }}>
              <span style={{ color:"#8892a4" }}>{p.date} · {p.method}</span>
              <span style={{ fontWeight:700,color:"#22c55e" }}>{fmt(p.amount)}</span>
            </div>
          ))}
          <div style={{ marginTop:16 }}>
            <Field label="Date"><Input type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))}/></Field>
            <Field label="Amount"><Input type="number" step="0.01" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))}/></Field>
            <Field label="Method"><Sel value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}>
              {["Bank Transfer","Cash","Cheque","Mobile Money","Card","Backend","Other"].map(m=><option key={m}>{m}</option>)}
            </Sel></Field>
          </div>
          <div style={{ textAlign:"right" }}><Btn onClick={addPayment}><Icon name="check" size={15}/>Record Payment</Btn></div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════════════════════════════════
const Inventory = ({ data, setData, can }) => {
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch]   = useState("");
  const [form, setForm]       = useState({ name:"",sku:"",unit:"piece",qty:0,cost:0,price:0,category:"" });

  const filtered = data.inventory.filter(i=>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())
  );

  const save = () => {
    if(!form.name||!form.sku) return;
    setData(d=>({...d,inventory:[...d.inventory,{ id:"INV"+uuid(),...form,qty:Number(form.qty),cost:Number(form.cost),price:Number(form.price) }]}));
    setShowNew(false);
    setForm({ name:"",sku:"",unit:"piece",qty:0,cost:0,price:0,category:"" });
  };

  return (
    <div>
      <PageHeader title="Inventory" sub="Stock levels and pricing"
        action={can.inventory && <Btn onClick={()=>setShowNew(true)}><Icon name="plus" size={16}/>Add Product</Btn>} />
      <div style={{ position:"relative",marginBottom:20 }}>
        <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#8892a4" }}><Icon name="search" size={16}/></span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, SKU, or category…"
          style={{ width:"100%",background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:8,padding:"9px 12px 9px 38px",color:"#e8eaf0",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
      </div>
      <Table heads={["SKU","Product","Category","Stock","Cost","Sale Price","Margin",""]}
        rows={filtered.map(item=>{
          const margin=item.price>0?(((item.price-item.cost)/item.price)*100).toFixed(1):0;
          return [
            <span style={{ fontFamily:"monospace",fontSize:12,color:"#8892a4" }}>{item.sku}</span>,
            <span style={{ fontWeight:600,color:"#e8eaf0" }}>{item.name}</span>,
            <span style={{ background:"#2d3448",color:"#a78bfa",padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700 }}>{item.category}</span>,
            <span style={{ fontWeight:700,color:item.qty<50?"#ef4444":"#22c55e" }}>{item.qty.toLocaleString()} {item.unit}s {item.qty<50&&"⚠"}</span>,
            <span style={{ color:"#8892a4" }}>{fmt(item.cost)}</span>,
            <span style={{ fontWeight:700,color:"#f0a500" }}>{fmt(item.price)}</span>,
            <span style={{ color:"#22c55e" }}>{margin}%</span>,
            can.inventory && <button onClick={()=>setData(d=>({...d,inventory:d.inventory.filter(i=>i.id!==item.id)}))} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer" }}><Icon name="trash" size={13}/></button>
          ];
        })}
      />
      {showNew && (
        <Modal title="Add Product" onClose={()=>setShowNew(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <Field label="Product Name"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Portland Cement 50kg"/></Field>
            <Field label="SKU"><Input value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} placeholder="e.g. CEM-50"/></Field>
            <Field label="Category"><Input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="e.g. Cement"/></Field>
            <Field label="Unit"><Sel value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
              {["bag","piece","rod","sheet","tonne","litre","roll","box","pallet","metre"].map(u=><option key={u}>{u}</option>)}
            </Sel></Field>
            <Field label="Starting Qty"><Input type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/></Field>
            <Field label="Cost Price ($)"><Input type="number" step="0.01" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))}/></Field>
            <Field label="Sale Price ($)"><Input type="number" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></Field>
          </div>
          <div style={{ textAlign:"right",marginTop:8 }}><Btn onClick={save}>Add Product</Btn></div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// CONTACTS
// ══════════════════════════════════════════════════════════════════════════
const Contacts = ({ data, setData, can }) => {
  const [tab, setTab]   = useState("customers");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name:"",phone:"",email:"",balance:0 });

  const isC = tab==="customers";
  const list = isC ? data.customers : data.suppliers;

  const save = () => {
    if(!form.name) return;
    const newC = { id:(isC?"C":"S")+uuid(),...form,balance:Number(form.balance) };
    setData(d=>isC?{...d,customers:[...d.customers,newC]}:{...d,suppliers:[...d.suppliers,newC]});
    setShowNew(false);
    setForm({ name:"",phone:"",email:"",balance:0 });
  };

  const del = (id) => setData(d=>isC?{...d,customers:d.customers.filter(c=>c.id!==id)}:{...d,suppliers:d.suppliers.filter(s=>s.id!==id)});

  return (
    <div>
      <PageHeader title="Contacts" sub="Customers & Suppliers"
        action={can.contacts && <Btn onClick={()=>setShowNew(true)}><Icon name="plus" size={16}/>Add {isC?"Customer":"Supplier"}</Btn>} />
      <div style={{ display:"flex",gap:4,marginBottom:20,background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:8,padding:4,width:"fit-content" }}>
        {["customers","suppliers"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 20px",borderRadius:6,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",textTransform:"capitalize",background:tab===t?"#f0a500":"none",color:tab===t?"#0f1420":"#8892a4" }}>{t}</button>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16 }}>
        {list.map(c=>(
          <div key={c.id} style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div style={{ width:44,height:44,borderRadius:10,background:isC?"#f0a50033":"#60a5fa33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:isC?"#f0a500":"#60a5fa",fontFamily:"'Bebas Neue',sans-serif" }}>
                {c.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
              </div>
              {can.deleteAny && <button onClick={()=>del(c.id)} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer" }}><Icon name="trash" size={14}/></button>}
            </div>
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:15,fontWeight:700,color:"#e8eaf0",marginBottom:4 }}>{c.name}</div>
              <div style={{ fontSize:12,color:"#8892a4",marginBottom:2 }}>{c.phone}</div>
              <div style={{ fontSize:12,color:"#8892a4",marginBottom:12 }}>{c.email}</div>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",marginBottom:4 }}>
                {isC?"Outstanding":"Amount Owed"}
              </div>
              <div style={{ fontSize:20,fontWeight:800,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,color:c.balance>0?"#f59e0b":"#22c55e" }}>{fmt(c.balance)}</div>
            </div>
          </div>
        ))}
      </div>
      {showNew && (
        <Modal title={`Add ${isC?"Customer":"Supplier"}`} onClose={()=>setShowNew(false)}>
          <Field label="Company / Name"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
          <Field label="Opening Balance ($)"><Input type="number" step="0.01" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))}/></Field>
          <div style={{ textAlign:"right" }}><Btn onClick={save}>Save</Btn></div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════
const Reports = ({ data }) => {
  const totalRevenue   = data.invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.total,0);
  const totalPartial   = data.invoices.filter(i=>i.status==="partial").reduce((s,i)=>s+paidAmount(i),0);
  const totalOutstanding = data.invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.total-paidAmount(i)),0);
  const totalPurchases = data.purchases.reduce((s,p)=>s+p.total,0);
  const grossProfit    = totalRevenue - totalPurchases;
  const inventoryVal   = data.inventory.reduce((s,i)=>s+i.qty*i.cost,0);

  // Top customers by invoiced amount
  const custRevenue = data.customers.map(c=>({
    name: c.name,
    total: data.invoices.filter(i=>i.customerId===c.id).reduce((s,i)=>s+i.total,0),
    paid:  data.invoices.filter(i=>i.customerId===c.id).reduce((s,i)=>s+paidAmount(i),0),
  })).sort((a,b)=>b.total-a.total);

  // Category breakdown
  const categories = [...new Set(data.inventory.map(i=>i.category))];
  const catData = categories.map(cat=>{
    const items = data.inventory.filter(i=>i.category===cat);
    return { cat, value:items.reduce((s,i)=>s+i.qty*i.cost,0), qty:items.reduce((s,i)=>s+i.qty,0) };
  }).sort((a,b)=>b.value-a.value);

  const printProfitLoss = () => {
    printReport("Profit & Loss Summary", `
      <div class="kpis">
        <div class="kpi"><label>Revenue Collected</label><span>${fmt(totalRevenue)}</span></div>
        <div class="kpi"><label>Partial Payments</label><span>${fmt(totalPartial)}</span></div>
        <div class="kpi"><label>Total Purchases</label><span>${fmt(totalPurchases)}</span></div>
        <div class="kpi"><label>Gross Profit</label><span>${fmt(grossProfit)}</span></div>
      </div>
      <h2 style="font-size:16px;margin-bottom:12px">Invoice Summary</h2>
      <table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
      ${data.invoices.map(inv=>{ const c=data.customers.find(x=>x.id===inv.customerId); const paid=paidAmount(inv); return`<tr><td>${inv.id}</td><td>${c?.name||'—'}</td><td>${inv.date}</td><td>${fmt(inv.total)}</td><td style="color:#22c55e">${fmt(paid)}</td><td style="color:#f59e0b">${fmt(inv.total-paid)}</td><td>${inv.status}</td></tr>`; }).join('')}
      </tbody></table>`);
  };

  const printInventoryReport = () => {
    printReport("Inventory Valuation Report", `
      <div class="kpis">
        <div class="kpi"><label>Total Items</label><span>${data.inventory.length}</span></div>
        <div class="kpi"><label>Inventory Value</label><span>${fmt(inventoryVal)}</span></div>
        <div class="kpi"><label>Low Stock Items</label><span>${data.inventory.filter(i=>i.qty<50).length}</span></div>
        <div class="kpi"><label>Categories</label><span>${categories.length}</span></div>
      </div>
      <table><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Qty</th><th>Unit</th><th>Cost</th><th>Price</th><th>Value</th><th>Margin</th></tr></thead><tbody>
      ${data.inventory.map(i=>{ const m=i.price>0?(((i.price-i.cost)/i.price)*100).toFixed(1):0; return`<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.category}</td><td style="${i.qty<50?'color:#ef4444;font-weight:700':''}">${i.qty}</td><td>${i.unit}</td><td>${fmt(i.cost)}</td><td>${fmt(i.price)}</td><td>${fmt(i.qty*i.cost)}</td><td>${m}%</td></tr>`; }).join('')}
      </tbody></table>`);
  };

  const printCustomerReport = () => {
    printReport("Customer Revenue Report", `
      <table><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Total Invoiced</th><th>Total Paid</th><th>Outstanding</th></tr></thead><tbody>
      ${custRevenue.map(c=>`<tr><td style="font-weight:700">${c.name}</td><td>${data.customers.find(x=>x.name===c.name)?.phone||''}</td><td>${data.customers.find(x=>x.name===c.name)?.email||''}</td><td>${fmt(c.total)}</td><td style="color:#22c55e">${fmt(c.paid)}</td><td style="color:#f59e0b">${fmt(c.total-c.paid)}</td></tr>`).join('')}
      </tbody></table>`);
  };

  const Card = ({ label, value, color="#e8eaf0", sub }) => (
    <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:"18px 20px" }}>
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22,fontWeight:800,fontFamily:"'Bebas Neue',sans-serif",color,letterSpacing:1 }}>{value}</div>
      {sub&&<div style={{ fontSize:12,color:"#8892a4",marginTop:2 }}>{sub}</div>}
    </div>
  );

  const ReportBox = ({ title, onPrint, children }) => (
    <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:20,marginBottom:20 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontSize:13,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase" }}>{title}</h3>
        <button onClick={onPrint} style={{ display:"flex",alignItems:"center",gap:6,background:"#2d3448",border:"none",borderRadius:6,padding:"6px 14px",color:"#e8eaf0",fontSize:12,fontWeight:600,cursor:"pointer" }}><Icon name="print" size={13}/>Export PDF</button>
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <PageHeader title="Reports" sub="Business performance overview" />
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:24 }}>
        <Card label="Revenue Collected" value={fmt(totalRevenue)} color="#22c55e"/>
        <Card label="Partial Received"  value={fmt(totalPartial)}  color="#a78bfa"/>
        <Card label="Outstanding"       value={fmt(totalOutstanding)} color="#f59e0b"/>
        <Card label="Total Purchases"   value={fmt(totalPurchases)} color="#60a5fa"/>
        <Card label="Gross Profit"      value={fmt(grossProfit)}  color={grossProfit>=0?"#22c55e":"#ef4444"}/>
        <Card label="Inventory Value"   value={fmt(inventoryVal)}  color="#f0a500"/>
      </div>

      <ReportBox title="Profit & Loss Summary" onPrint={printProfitLoss}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
          {[{ l:"Total Invoiced",v:fmt(data.invoices.reduce((s,i)=>s+i.total,0)),c:"#e8eaf0" },
            { l:"Revenue Collected",v:fmt(totalRevenue),c:"#22c55e" },
            { l:"Total Purchases",v:fmt(totalPurchases),c:"#60a5fa" },
          ].map(x=><div key={x.l} style={{ background:"#0f1420",borderRadius:8,padding:12 }}>
            <div style={{ fontSize:11,color:"#8892a4",marginBottom:4 }}>{x.l}</div>
            <div style={{ fontSize:18,fontWeight:800,color:x.c }}>{x.v}</div>
          </div>)}
        </div>
      </ReportBox>

      <ReportBox title="Customer Revenue" onPrint={printCustomerReport}>
        {custRevenue.map(c=>{
          const pct = c.total>0?Math.min(100,(c.paid/c.total)*100):0;
          return <div key={c.name} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
            <div style={{ width:120,fontSize:13,color:"#e8eaf0",fontWeight:600,flexShrink:0 }}>{c.name}</div>
            <div style={{ flex:1,height:8,background:"#2d3448",borderRadius:4,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${pct}%`,background:"#f0a500",borderRadius:4,transition:"width 0.5s" }}/>
            </div>
            <div style={{ fontSize:13,color:"#f0a500",fontWeight:700,width:80,textAlign:"right" }}>{fmt(c.total)}</div>
            <div style={{ fontSize:12,color:"#22c55e",width:70,textAlign:"right" }}>{fmt(c.paid)} paid</div>
          </div>;
        })}
      </ReportBox>

      <ReportBox title="Inventory by Category" onPrint={printInventoryReport}>
        {catData.map(c=>{
          const pct = inventoryVal>0?(c.value/inventoryVal)*100:0;
          return <div key={c.cat} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
            <div style={{ width:100,fontSize:13,color:"#a78bfa",fontWeight:600,flexShrink:0 }}>{c.cat}</div>
            <div style={{ flex:1,height:8,background:"#2d3448",borderRadius:4,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${pct}%`,background:"#a78bfa",borderRadius:4 }}/>
            </div>
            <div style={{ fontSize:12,color:"#8892a4",width:60,textAlign:"right" }}>{pct.toFixed(1)}%</div>
            <div style={{ fontSize:13,color:"#e8eaf0",fontWeight:700,width:80,textAlign:"right" }}>{fmt(c.value)}</div>
          </div>;
        })}
      </ReportBox>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
const UserManagement = ({ data, setData, currentUser }) => {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm]       = useState({ name:"", role:"Sales", pin:"" });

  const ROLES = ["Owner","Manager","Sales","Purchasing","Viewer"];

  const save = () => {
    if(!form.name||form.pin.length<4) return;
    setData(d=>({...d,users:[...d.users,{ id:"U"+uuid(),avatar:form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),...form }]}));
    setShowNew(false);
    setForm({ name:"",role:"Sales",pin:"" });
  };

  const del = (id) => {
    if(id===currentUser.id) return;
    setData(d=>({...d,users:d.users.filter(u=>u.id!==id)}));
  };

  return (
    <div>
      <PageHeader title="User Management" sub="Team members & permissions"
        action={<Btn onClick={()=>setShowNew(true)}><Icon name="plus" size={16}/>Add User</Btn>} />

      {/* Permissions Matrix */}
      <div style={{ background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:20,marginBottom:24 }}>
        <h3 style={{ margin:"0 0 16px",fontSize:12,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase" }}>Permissions Matrix</h3>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #2d3448" }}>
                <th style={{ padding:"8px 12px",textAlign:"left",color:"#8892a4",fontSize:11,fontWeight:700,textTransform:"uppercase" }}>Permission</th>
                {["Owner","Manager","Sales","Purchasing","Viewer"].map(r=>(
                  <th key={r} style={{ padding:"8px 12px",textAlign:"center",color:"#8892a4",fontSize:11,fontWeight:700,textTransform:"uppercase" }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(PERMISSIONS.Owner).map((perm,i)=>(
                <tr key={perm} style={{ borderBottom:"1px solid #2d3448",background:i%2===0?"transparent":"#1e2436" }}>
                  <td style={{ padding:"8px 12px",color:"#e8eaf0",fontWeight:500,textTransform:"capitalize" }}>{perm.replace(/([A-Z])/g," $1")}</td>
                  {["Owner","Manager","Sales","Purchasing","Viewer"].map(role=>(
                    <td key={role} style={{ padding:"8px 12px",textAlign:"center" }}>
                      {PERMISSIONS[role][perm]
                        ? <span style={{ color:"#22c55e",fontSize:16 }}>✓</span>
                        : <span style={{ color:"#2d3448",fontSize:16 }}>✕</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team List */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16 }}>
        {data.users.map(u=>(
          <div key={u.id} style={{ background:"#1a1f2e",border:`1px solid ${u.id===currentUser.id?"#f0a500":"#2d3448"}`,borderRadius:10,padding:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:10,background:"#f0a50022",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#f0a500",fontFamily:"'Bebas Neue',sans-serif" }}>{u.avatar}</div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#e8eaf0" }}>{u.name}</div>
                  <div style={{ fontSize:12,color:"#8892a4" }}>PIN: {"●".repeat(u.pin.length)}</div>
                </div>
              </div>
              {u.id!==currentUser.id && <button onClick={()=>del(u.id)} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer" }}><Icon name="trash" size={14}/></button>}
            </div>
            <div style={{ marginTop:12 }}>
              <span style={{ background:"#f0a50022",color:"#f0a500",padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:700 }}>{u.role}</span>
              {u.id===currentUser.id && <span style={{ marginLeft:8,fontSize:11,color:"#8892a4" }}>← you</span>}
            </div>
            <div style={{ marginTop:12,display:"flex",flexWrap:"wrap",gap:4 }}>
              {Object.entries(PERMISSIONS[u.role]).filter(([,v])=>v).map(([k])=>(
                <span key={k} style={{ fontSize:10,background:"#22c55e15",color:"#22c55e",padding:"2px 7px",borderRadius:4,fontWeight:600,textTransform:"capitalize" }}>{k.replace(/([A-Z])/g," $1")}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="Add Team Member" onClose={()=>setShowNew(false)}>
          <Field label="Full Name"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Jordan Smith"/></Field>
          <Field label="Role"><Sel value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            {ROLES.map(r=><option key={r}>{r}</option>)}
          </Sel></Field>
          <Field label="4-digit PIN"><Input type="password" maxLength={6} value={form.pin} onChange={e=>setForm(f=>({...f,pin:e.target.value}))} placeholder="e.g. 1234"/></Field>
          <div style={{ textAlign:"right" }}><Btn onClick={save}><Icon name="lock" size={14}/>Add User</Btn></div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// LOGIN / USER SWITCHER
// ══════════════════════════════════════════════════════════════════════════
const Login = ({ users, onLogin }) => {
  const [selected, setSelected] = useState(null);
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");

  const attempt = () => {
    if(selected && pin===selected.pin) { onLogin(selected); }
    else { setError("Wrong PIN. Try again."); setPin(""); }
  };

  return (
    <div style={{ minHeight:"100vh",background:"#0f1420",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%",maxWidth:420,padding:24 }}>
        <div style={{ textAlign:"center",marginBottom:40 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:3,color:"#f0a500" }}>IMPREXIONS</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:4,color:"#8892a4" }}>VENTURES</div>
          <div style={{ marginTop:8,fontSize:13,color:"#8892a4" }}>Building Materials · Accounting System</div>
        </div>

        {!selected ? (
          <>
            <div style={{ fontSize:12,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",marginBottom:12,textAlign:"center" }}>Who's logging in?</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {users.map(u=>(
                <button key={u.id} onClick={()=>{ setSelected(u); setError(""); setPin(""); }}
                  style={{ display:"flex",alignItems:"center",gap:14,background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:"14px 18px",cursor:"pointer",transition:"border-color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#f0a500"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#2d3448"}>
                  <div style={{ width:40,height:40,borderRadius:9,background:"#f0a50022",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#f0a500",fontFamily:"'Bebas Neue',sans-serif",flexShrink:0 }}>{u.avatar}</div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:14,fontWeight:700,color:"#e8eaf0" }}>{u.name}</div>
                    <div style={{ fontSize:12,color:"#8892a4" }}>{u.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign:"center",marginBottom:24 }}>
              <div style={{ width:56,height:56,borderRadius:14,background:"#f0a50022",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#f0a500",fontFamily:"'Bebas Neue',sans-serif",margin:"0 auto 12px" }}>{selected.avatar}</div>
              <div style={{ fontSize:16,fontWeight:700,color:"#e8eaf0" }}>{selected.name}</div>
              <div style={{ fontSize:12,color:"#8892a4" }}>{selected.role}</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <Input type="password" maxLength={6} value={pin} onChange={e=>{ setPin(e.target.value); setError(""); }} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Enter your PIN" style={{ textAlign:"center",fontSize:22,letterSpacing:8 }}/>
            </div>
            {error && <div style={{ color:"#ef4444",fontSize:13,textAlign:"center",marginBottom:12 }}>{error}</div>}
            <Btn onClick={attempt} style={{ width:"100%",justifyContent:"center",padding:12,fontSize:14 }}><Icon name="lock" size={15}/>Sign In</Btn>
            <button onClick={()=>setSelected(null)} style={{ display:"block",width:"100%",background:"none",border:"none",color:"#8892a4",cursor:"pointer",marginTop:12,fontSize:13,textAlign:"center" }}>← Back to user list</button>
          </>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data, setData]         = useState(SEED);
  const [page, setPage]         = useState("dashboard");
  const [currentUser, setUser]  = useState(null);
  const [windowWidth, setWindowWidth] = useState(1024);

  useEffect(() => {
    const link = document.createElement("link");
    link.href  = FONT_URL;
    link.rel   = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('accounting-data');
      if (savedData) {
        setData(JSON.parse(savedData));
      }
    } catch (error) {
      console.warn('Failed to load saved data:', error);
      localStorage.removeItem('accounting-data');
    }

    try {
      const savedUser = localStorage.getItem('current-user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUser(user);
      }
    } catch (error) {
      console.warn('Failed to load current user:', error);
      localStorage.removeItem('current-user');
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('accounting-data', JSON.stringify(data));
  }, [data]);

  // Save current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('current-user');
    }
  }, [currentUser]);

  if(!currentUser) return <Login users={data.users} onLogin={u=>{ setUser(u); localStorage.setItem('current-user', JSON.stringify(u)); setPage("dashboard"); }}/>;

  const can = PERMISSIONS[currentUser.role] || PERMISSIONS.Viewer;

  const NAV = [
    { id:"dashboard", label:"Dashboard",  icon:"dashboard" },
    can.invoices   && { id:"invoices",  label:"Invoices",       icon:"invoice"   },
    can.purchases  && { id:"purchases", label:"Purchases",      icon:"purchase"  },
    can.inventory  && { id:"inventory", label:"Inventory",      icon:"inventory" },
    can.contacts   && { id:"contacts",  label:"Contacts",       icon:"customers" },
    can.reports    && { id:"reports",   label:"Reports",        icon:"reports"   },
    can.payments   && { id:"payments",  label:"Payment Ledger", icon:"payments"  },
    can.manageUsers && { id:"users",   label:"Users",           icon:"users"     },
  ].filter(Boolean);

  const pendingInvoices = data.invoices.filter(i=>i.status==="unpaid"||i.status==="overdue").length;
  const overdueCount    = data.invoices.filter(i=>i.status==="overdue").length;

  // Payment Ledger page
  const PaymentLedger = () => {
    const allPayments = [
      ...data.invoices.flatMap(inv=>(inv.payments||[]).map(p=>({
        ...p, ref:inv.id, type:"Received",
        party: data.customers.find(c=>c.id===inv.customerId)?.name||"—",
        color:"#22c55e"
      }))),
      ...data.purchases.flatMap(po=>(po.payments||[]).map(p=>({
        ...p, ref:po.id, type:"Paid Out",
        party: data.suppliers.find(s=>s.id===po.supplierId)?.name||"—",
        color:"#ef4444"
      }))),
    ].sort((a,b)=>b.date.localeCompare(a.date));

    const totalIn  = allPayments.filter(p=>p.type==="Received").reduce((s,p)=>s+p.amount,0);
    const totalOut = allPayments.filter(p=>p.type==="Paid Out").reduce((s,p)=>s+p.amount,0);

    return (
      <div>
        <PageHeader title="Payment Ledger" sub="All payment transactions" />
        <div style={{ display:"flex",gap:16,marginBottom:24,flexWrap:"wrap" }}>
          {[{ l:"Total Received",v:fmt(totalIn),c:"#22c55e" },{ l:"Total Paid Out",v:fmt(totalOut),c:"#ef4444" },{ l:"Net Cash Flow",v:fmt(totalIn-totalOut),c:totalIn-totalOut>=0?"#22c55e":"#ef4444" }].map(x=>(
            <div key={x.l} style={{ flex:1,minWidth:160,background:"#1a1f2e",border:"1px solid #2d3448",borderRadius:10,padding:"16px 20px" }}>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,color:"#8892a4",textTransform:"uppercase",marginBottom:6 }}>{x.l}</div>
              <div style={{ fontSize:24,fontWeight:800,fontFamily:"'Bebas Neue',sans-serif",color:x.c }}>{x.v}</div>
            </div>
          ))}
        </div>
        <Table heads={["Date","Reference","Party","Type","Method","Note","Amount"]}
          rows={allPayments.map(p=>[
            <span style={{ color:"#8892a4" }}>{p.date}</span>,
            <span style={{ fontWeight:700,color:"#60a5fa" }}>{p.ref}</span>,
            <span style={{ color:"#e8eaf0" }}>{p.party}</span>,
            <span style={{ fontSize:11,fontWeight:700,color:p.color,background:`${p.color}22`,padding:"2px 8px",borderRadius:4 }}>{p.type}</span>,
            <span style={{ color:"#8892a4" }}>{p.method}</span>,
            <span style={{ color:"#8892a4" }}>{p.note||"—"}</span>,
            <span style={{ fontWeight:700,color:p.color }}>{fmt(p.amount)}</span>,
          ])}
        />
      </div>
    );
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const PAGES = { dashboard:Dashboard, invoices:Invoices, purchases:Purchases, inventory:Inventory, contacts:Contacts, reports:Reports, payments:PaymentLedger, users:UserManagement };
  const PageComponent = PAGES[page] || Dashboard;

  const handleNavClick = (pageId) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ display:"flex",minHeight:"100vh",background:"#0f1420",fontFamily:"'DM Sans',sans-serif",color:"#e8eaf0",flexDirection:"column" }}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && window.innerWidth < 768 && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:99 }} onClick={()=>setMobileMenuOpen(false)}/>
      )}

      {/* Mobile Header */}
      {windowWidth < 768 && (
        <div style={{ background:"#111827",borderBottom:"1px solid #1e2436",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,zIndex:50,minHeight:56 }}>
          <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{ background:"none",border:"none",color:"#f0a500",cursor:"pointer",minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1={3} y1={6} x2={21} y2={6}/><line x1={3} y1={12} x2={21} y2={12}/><line x1={3} y1={18} x2={21} y2={18}/></svg>
          </button>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1,color:"#f0a500" }}>IMPREXIONS</div>
        </div>
      )}

      <div style={{ display:"flex",flex:1 }}>
        {/* Desktop Sidebar */}
        <div style={{ width:230,background:"#111827",borderRight:"1px solid #1e2436",display:windowWidth < 768?"none":"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto" }}>
        <div style={{ padding:"24px 20px 16px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:"#f0a500",lineHeight:1.1 }}>IMPREXIONS<br/>VENTURES</div>
          <div style={{ fontSize:10,color:"#8892a4",letterSpacing:1,marginTop:2 }}>BUILDING MATERIALS</div>
        </div>

        <nav style={{ flex:1,padding:"4px 10px" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>handleNavClick(n.id)}
              style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 12px",borderRadius:8,border:"none",background:page===n.id?"#f0a50015":"none",color:page===n.id?"#f0a500":"#8892a4",cursor:"pointer",fontSize:13,fontWeight:page===n.id?700:500,textAlign:"left",marginBottom:1,position:"relative",minHeight:44,touchAction:"manipulation" }}>
              <Icon name={n.icon} size={16}/>
              {n.label}
              {n.id==="invoices" && pendingInvoices>0 && (
                <span style={{ marginLeft:"auto",background:overdueCount?"#ef4444":"#f59e0b",color:"#fff",fontSize:10,fontWeight:800,borderRadius:10,padding:"1px 6px" }}>{pendingInvoices}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Current user */}
        <div style={{ padding:"12px 10px",borderTop:"1px solid #1e2436" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#1a1f2e",borderRadius:8 }}>
            <div style={{ width:32,height:32,borderRadius:8,background:"#f0a50033",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#f0a500",flexShrink:0 }}>{currentUser.avatar}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#e8eaf0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{currentUser.name}</div>
              <div style={{ fontSize:10,color:"#8892a4" }}>{currentUser.role}</div>
            </div>
            <button onClick={()=>setUser(null)} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer",flexShrink:0,minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center" }} title="Sign out"><Icon name="lock" size={14}/></button>
          </div>
        </div>
        </div>

        {/* Mobile Sidebar */}
        <div style={{ width:230,background:"#111827",borderRight:"1px solid #1e2436",display:windowWidth < 768?"flex":"none",flexDirection:"column",flexShrink:0,position:"fixed",top:56,left:mobileMenuOpen?0:-230,height:"calc(100vh - 56px)",overflowY:"auto",zIndex:101,transition:"left 0.3s ease" }}>
          <nav style={{ flex:1,padding:"4px 10px" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>handleNavClick(n.id)}
                style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 12px",borderRadius:8,border:"none",background:page===n.id?"#f0a50015":"none",color:page===n.id?"#f0a500":"#8892a4",cursor:"pointer",fontSize:13,fontWeight:page===n.id?700:500,textAlign:"left",marginBottom:1,position:"relative",minHeight:44,touchAction:"manipulation" }}>
                <Icon name={n.icon} size={16}/>
                {n.label}
                {n.id==="invoices" && pendingInvoices>0 && (
                  <span style={{ marginLeft:"auto",background:overdueCount?"#ef4444":"#f59e0b",color:"#fff",fontSize:10,fontWeight:800,borderRadius:10,padding:"1px 6px" }}>{pendingInvoices}</span>
                )}
              </button>
            ))}
          </nav>
          <div style={{ padding:"12px 10px",borderTop:"1px solid #1e2436" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#1a1f2e",borderRadius:8 }}>
              <div style={{ width:32,height:32,borderRadius:8,background:"#f0a50033",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#f0a500",flexShrink:0 }}>{currentUser.avatar}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:"#e8eaf0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{currentUser.name}</div>
                <div style={{ fontSize:10,color:"#8892a4" }}>{currentUser.role}</div>
              </div>
              <button onClick={()=>setUser(null)} style={{ background:"none",border:"none",color:"#8892a4",cursor:"pointer",flexShrink:0,minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center" }} title="Sign out"><Icon name="lock" size={14}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1,overflow:"auto" }}>
        <div style={{ padding:windowWidth < 768?"16px 12px":"32px 36px",maxWidth:1100,margin:"0 auto" }}>
          {page==="payments" ? <PaymentLedger/> :
           page==="users"    ? <UserManagement data={data} setData={setData} currentUser={currentUser}/> :
           <PageComponent data={data} setData={setData} can={can}/>}
        </div>
      </div>
    </div>
  );
}
