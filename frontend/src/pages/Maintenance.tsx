import { useState, useEffect } from "react";
import { Wrench, Plus, X, AlertTriangle, CheckCircle } from "lucide-react";

const API = "http://127.0.0.1:8000";

const SERVICE_TYPES = [
  "Oil Change", "Tyre Rotation", "Brake Service", "Air Filter",
  "Battery Check", "Coolant Flush", "Transmission Service",
  "Wheel Alignment", "General Inspection", "Other"
];

interface MaintenanceRecord {
  maintenance_id: string;
  vehicle_id: string;
  vehicle_name: string;
  service_type: string;
  date: string;
  cost: number;
  odometer_at_service: number;
  next_due_km?: number;
  next_due_date?: string;
  notes?: string;
}

const emptyForm = {
  vehicle_id: "",
  vehicle_name: "",
  service_type: "Oil Change",
  date: new Date().toISOString().split("T")[0],
  cost: "",
  odometer_at_service: "",
  next_due_km: "",
  next_due_date: "",
  notes: "",
};

export default function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [dueRecords, setDueRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState("");
  const token = localStorage.getItem("token");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchData = async () => {
    try {
      const url = filterVehicle ? `${API}/maintenance?vehicle_id=${filterVehicle}` : `${API}/maintenance`
      const recRes = await fetch(url, { headers })
      const recData = await recRes.json()
      setRecords(recData.records || [])
    } catch (e) { console.error(e) }
    try {
      const dueRes = await fetch(`${API}/maintenance/due`, { headers })
      const dueData = await dueRes.json()
      setDueRecords(dueData.due_records || [])
    } catch (e) { console.error(e) }
    try {
      const vRes = await fetch(`${API}/vehicles`, { headers })
      const vData = await vRes.json()
      setVehicles(vData.vehicles || vData || [])
    } catch (e) { console.error(e) }
  };

  useEffect(() => { fetchData(); }, [filterVehicle]);

  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = vehicles.find((v: any) => v.vehicle_id === e.target.value);
    setForm(f => ({
      ...f,
      vehicle_id: e.target.value,
      vehicle_name: v?.name || v?.vehicle_name || e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.cost || !form.odometer_at_service) {
      alert("Vehicle, cost, and odometer are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        cost: parseFloat(form.cost),
        odometer_at_service: parseInt(form.odometer_at_service),
        next_due_km: form.next_due_km ? parseInt(form.next_due_km) : null,
        next_due_date: form.next_due_date || null,
      };
      const res = await fetch(`${API}/maintenance`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(emptyForm);
        fetchData();
      } else {
        alert("Failed to save record");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`${API}/maintenance/${id}`, { method: "DELETE", headers });
    fetchData();
  };

  const isDue = (record: MaintenanceRecord) =>
    dueRecords.some(d => d.maintenance_id === record.maintenance_id);

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
            <Wrench className="text-teal-600" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Maintenance Tracker</h1>
            <p className="text-xs text-gray-400">Service history and upcoming due dates</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Log Service
        </button>
      </div>

      {/* Due Alerts Banner */}
      {dueRecords.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="text-amber-500" size={16} />
            <span className="text-amber-700 font-medium text-sm">
              {dueRecords.length} service{dueRecords.length > 1 ? "s" : ""} due soon
            </span>
          </div>
          <div className="space-y-0.5">
            {dueRecords.map(d => (
              <div key={d.maintenance_id} className="text-xs text-amber-600">
                <span className="font-medium">{d.vehicle_name}</span> — {d.service_type}
                {" "}
                <span className="text-amber-500">({d.due_reasons?.join(", ")})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={filterVehicle}
          onChange={e => setFilterVehicle(e.target.value)}
          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Vehicles</option>
          {vehicles.map((v: any) => (
            <option key={v.vehicle_id} value={v.vehicle_id}>
              {v.name || v.vehicle_name || v.vehicle_id}
            </option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Odometer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cost (₹)</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Next Due</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-12 text-sm">
                  No maintenance records yet.{" "}
                  <button onClick={() => setShowForm(true)} className="text-teal-600 hover:underline">
                    Log your first service →
                  </button>
                </td>
              </tr>
            )}
            {records.map(r => (
              <tr key={r.maintenance_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{r.vehicle_name}</td>
                <td className="px-4 py-3 text-gray-600">{r.service_type}</td>
                <td className="px-4 py-3 text-gray-500">{r.date}</td>
                <td className="px-4 py-3 text-gray-500">{Number(r.odometer_at_service).toLocaleString()} km</td>
                <td className="px-4 py-3 text-gray-700 font-medium">₹{Number(r.cost).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 text-xs space-y-0.5">
                  {r.next_due_date && <div>📅 {r.next_due_date}</div>}
                  {r.next_due_km && <div>🛣️ {Number(r.next_due_km).toLocaleString()} km</div>}
                  {!r.next_due_date && !r.next_due_km && <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  {isDue(r)
                    ? <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 text-xs px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Due Soon</span>
                    : <span className="inline-flex items-center gap-1 text-teal-600 bg-teal-50 border border-teal-200 text-xs px-2 py-0.5 rounded-full"><CheckCircle size={10} /> OK</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(r.maintenance_id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-800">{records.length}</div>
            <div className="text-gray-400 text-xs mt-1">Total Records</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-800">
              ₹{records.reduce((s, r) => s + Number(r.cost), 0).toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs mt-1">Total Spent</div>
          </div>
          <div className={`rounded-xl p-4 shadow-sm text-center border ${dueRecords.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
            <div className={`text-2xl font-bold ${dueRecords.length > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {dueRecords.length}
            </div>
            <div className="text-gray-400 text-xs mt-1">Services Due</div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-800 font-semibold text-base">Log Service Record</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-gray-500 text-xs mb-1 block">Vehicle *</label>
                <select
                  value={form.vehicle_id}
                  onChange={handleVehicleSelect}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v: any) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.name || v.vehicle_name || v.vehicle_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-gray-500 text-xs mb-1 block">Service Type *</label>
                <select
                  value={form.service_type}
                  onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-gray-500 text-xs mb-1 block">Service Date *</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-gray-500 text-xs mb-1 block">Cost (₹) *</label>
                <input type="number" placeholder="2500" value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-gray-500 text-xs mb-1 block">Odometer at Service (km) *</label>
                <input type="number" placeholder="45000" value={form.odometer_at_service}
                  onChange={e => setForm(f => ({ ...f, odometer_at_service: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-gray-500 text-xs mb-1 block">Next Due Date</label>
                <input type="date" value={form.next_due_date}
                  onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-gray-500 text-xs mb-1 block">Next Due Odometer (km)</label>
                <input type="number" placeholder="50000" value={form.next_due_km}
                  onChange={e => setForm(f => ({ ...f, next_due_km: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-gray-500 text-xs mb-1 block">Notes</label>
                <textarea placeholder="Any additional notes..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 rounded-lg py-2 text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm transition-colors">
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}