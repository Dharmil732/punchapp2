
import { serverAdmin } from '@/lib/serverAdmin';
import { notify } from '@/lib/notify';
function row(r){
  return `<tr>
    <td>${r.name||''}</td><td>${r.email||''}</td><td>${r.employee_code||''}</td>
    <td class="num">${(r.base_hours||0).toFixed(2)}</td><td class="num">${(r.ot_hours||0).toFixed(2)}</td>
    <td>${r.currency||''}</td><td class="num">${(r.rate_per_hour||0).toFixed(2)}</td>
    <td class="num">${(r.amount_base||0).toFixed(2)}</td><td class="num">${(r.amount_ot||0).toFixed(2)}</td>
    <td class="num total">${(r.amount_total||0).toFixed(2)}</td>
  </tr>`;
}
export async function POST(req){
  const sb = serverAdmin(); const { start, end, to } = await req.json();
  const { data, error } = await sb.rpc('payroll_with_rates_and_ot', { p_start: start, p_end: end });
  if(error) return Response.json({ ok:false, error:error.message }, { status: 500 });
  const rows = (data||[]).map(row).join('');
  const html = `
  <style>
    .wrap{font-family:Arial,Helvetica,sans-serif;color:#111}
    h2{margin:0 0 12px 0}
    table{width:100%;border-collapse:collapse}
    th,td{padding:10px;border-bottom:1px solid #eee;text-align:left}
    th{background:#fafafa}
    .num{text-align:right;font-variant-numeric:tabular-nums}
    .total{font-weight:700}
    .meta{color:#666;font-size:12px;margin-top:8px}
  </style>
  <div class="wrap">
    <h2>Payroll Report</h2>
    <div class="meta">Period: ${start} to ${end}</div>
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>Code</th>
          <th>Base Hours</th><th>OT Hours</th>
          <th>Curr</th><th>Rate/hr</th>
          <th>Base $</th><th>OT $</th><th>Total $</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
  const dest = Array.isArray(to) ? to[0] : to;
  const sent = await notify({ to: dest, subject: `Payroll ${start} — ${end}`, html });
  return Response.json({ ok:true, email: sent });
}
