import { useEffect, useState } from "react";
import api from "../../services/Api";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiTruck, FiUser, FiPhone, FiMail, FiX, FiSave, FiMapPin } from "react-icons/fi";
import { getDeliveryLocationRules, updateDeliveryLocationRules } from "../../services/AdminService.js";

const ManageDeliveryMen = () => {
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [adding, setAdding] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [locationRules, setLocationRules] = useState({
    isEnabled: false,
    allowedCities: "",
    allowedStates: "",
    allowedCountries: "",
    allowedPincodes: "",
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchDeliveryMen = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/delivery-men", authHeader());
      setDeliveryMen(res.data.deliveryMen || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch delivery men");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationRules = async () => {
    try {
      const res = await getDeliveryLocationRules();
      const rules = res?.data?.rules || {};
      setLocationRules({
        isEnabled: !!rules.isEnabled,
        allowedCities: (rules.allowedCities || []).join(", "),
        allowedStates: (rules.allowedStates || []).join(", "),
        allowedCountries: (rules.allowedCountries || []).join(", "),
        allowedPincodes: (rules.allowedPincodes || []).join(", "),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch delivery location rules");
    }
  };

  const handleSaveLocationRules = async () => {
    try {
      setSavingRules(true);
      await updateDeliveryLocationRules({
        isEnabled: locationRules.isEnabled,
        allowedCities: locationRules.allowedCities,
        allowedStates: locationRules.allowedStates,
        allowedCountries: locationRules.allowedCountries,
        allowedPincodes: locationRules.allowedPincodes,
      });
      toast.success("Delivery location rules updated");
      await fetchLocationRules();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update delivery location rules");
    } finally {
      setSavingRules(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDeliveryMen();
    fetchLocationRules();
  }, []);

  const handleAdd = async () => {
    const { name, email, password, phone } = form;
    if (!name || !email || !password || !phone) {
      toast.error("All fields are required");
      return;
    }
    try {
      setAdding(true);
      await api.post("/api/admin/delivery-men", form, authHeader());
      toast.success("Delivery man added!");
      setShowAddModal(false);
      setForm({ name: "", email: "", password: "", phone: "" });
      fetchDeliveryMen();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add delivery man");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this delivery man?")) return;
    try {
      await api.delete(`/api/admin/delivery-men/${id}`, authHeader());
      toast.success("Deleted");
      setDeliveryMen((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/api/admin/delivery-men/${id}/toggle-status`, {}, authHeader());
      setDeliveryMen((prev) =>
        prev.map((d) => (d._id === id ? { ...d, isActive: res.data.isActive } : d))
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiTruck className="text-orange-500" /> Delivery Men
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage delivery staff accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <FiPlus size={16} />
          Add Delivery Man
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <FiMapPin className="text-blue-600" /> Delivery Location Rules
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Enable this to restrict orders only to allowed cities, states, countries, or pincodes.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700">Restrict Delivery Locations</label>
          <input
            type="checkbox"
            checked={locationRules.isEnabled}
            onChange={(e) => setLocationRules((prev) => ({ ...prev, isEnabled: e.target.checked }))}
            className="h-4 w-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Cities (comma separated)</label>
            <textarea
              rows={3}
              value={locationRules.allowedCities}
              onChange={(e) => setLocationRules((prev) => ({ ...prev, allowedCities: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Kochi, Mumbai"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed States (comma separated)</label>
            <textarea
              rows={3}
              value={locationRules.allowedStates}
              onChange={(e) => setLocationRules((prev) => ({ ...prev, allowedStates: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Kerala, Maharashtra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Countries (comma separated)</label>
            <textarea
              rows={3}
              value={locationRules.allowedCountries}
              onChange={(e) => setLocationRules((prev) => ({ ...prev, allowedCountries: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="India"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Pincodes (comma separated)</label>
            <textarea
              rows={3}
              value={locationRules.allowedPincodes}
              onChange={(e) => setLocationRules((prev) => ({ ...prev, allowedPincodes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="682001, 400001"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveLocationRules}
            disabled={savingRules}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <FiSave size={16} /> {savingRules ? "Saving..." : "Save Location Rules"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : deliveryMen.length === 0 ? (
        <div className="bg-white rounded-xl p-10 shadow text-center text-gray-500">
          <FiTruck size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No delivery men yet</p>
          <p className="text-sm mt-1">Add a delivery man to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryMen.map((dm) => (
                <tr key={dm._id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{dm.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dm.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dm.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        dm.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {dm.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(dm._id)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        title={dm.isActive ? "Deactivate" : "Activate"}
                      >
                        {dm.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => handleDelete(dm._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Delivery Man Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Add Delivery Man</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={22} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Set password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {adding ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Adding...</>
                ) : (
                  <><FiPlus size={16} /> Add</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDeliveryMen;
