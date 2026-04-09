import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiSave, FiMapPin } from "react-icons/fi";
import { getDeliveryLocationRules, updateDeliveryLocationRules } from "../../services/AdminService.js";

const LocationControl = () => {
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [locationRules, setLocationRules] = useState({
    isEnabled: false,
    allowedCities: "",
    allowedStates: "",
    allowedCountries: "",
    allowedPincodes: "",
  });

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
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchLocationRules();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiMapPin className="text-blue-600" /> Location Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Restrict delivery by city, state, country, or pincode.
          </p>
        </div>
        <button
          onClick={handleSaveLocationRules}
          disabled={savingRules}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          <FiSave size={16} /> {savingRules ? "Saving..." : "Save Rules"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
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
      </div>
    </div>
  );
};

export default LocationControl;