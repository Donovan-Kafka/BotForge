
import React, { useState, useEffect } from 'react';
import { Bot, Edit2, X } from 'lucide-react';
import { sysAdminService } from '../../api';

interface SubscriptionFeature {
  feature_id: number;
  name: string;
  description: string;
  display_order: number | null;
}

interface Subscription {
  subscription_id: number;
  name: string;
  price: number;
  staff_user_limit: number;
  status: number;
  description: string;
  features: SubscriptionFeature[];
}

interface Feature {
  feature_id: number;
  name: string;
}

export const PricingManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [staffUserLimit, setStaffUserLimit] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);

  // Feature Management State
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [currentSubId, setCurrentSubId] = useState<number | null>(null);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  const fetchSubscriptions = async () => {
    try {
      const res = await sysAdminService.listSubscriptions();
      if (res.ok) {
        setSubscriptions(res.subscriptions);
      }
    } catch (e) {
      console.error("Failed to fetch subscriptions", e);
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await sysAdminService.listFeatures();
      if (res.ok) {
        setAllFeatures(res.features);
      }
    } catch (e) {
      console.error("Failed to fetch features", e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchFeatures();
  }, []);

  const handleOpenModal = (sub?: Subscription) => {
    if (sub) {
      setEditingSub(sub);
      setName(sub.name);
      setPrice(sub.price.toString());
      setStaffUserLimit((sub.staff_user_limit ?? '').toString());
      setDescription(sub.description || '');
      setStatus(sub.status);
    } else {
      setEditingSub(null);
      setName('');
      setPrice('');
      setStaffUserLimit('');
      setDescription('');
      setStatus(0);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price || !staffUserLimit) return;
    const priceVal = parseFloat(price);
    const staffLimitVal = parseInt(staffUserLimit, 10);
    if (isNaN(priceVal) || isNaN(staffLimitVal) || staffLimitVal < 1) return;

    try {
      if (editingSub) {
        await sysAdminService.updateSubscription(editingSub.subscription_id, {
          name,
          price: priceVal,
          staff_user_limit: staffLimitVal,
          description,
          status
        });
      } else {
        await sysAdminService.createSubscription({
          name,
          price: priceVal,
          staff_user_limit: staffLimitVal,
          description,
          status
        });
      }
      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (e) {
      console.error("Failed to save subscription", e);
    }
  };
  /*
  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure? If this plan is in use, it will be deactivated instead of deleted.")) {
      try {
        await sysAdminService.deleteSubscription(id);
        fetchSubscriptions();
      } catch (e) {
        console.error("Failed to delete", e);
      }
    }
  };
 */
  const handleOpenFeatureModal = (sub: Subscription) => {
    setCurrentSubId(sub.subscription_id);
    setSelectedFeatureIds(sub.features.map(f => f.feature_id));
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeatures = async () => {
    if (currentSubId === null) return;
    try {
      await sysAdminService.updateSubscriptionFeatures(currentSubId, selectedFeatureIds);
      setIsFeatureModalOpen(false);
      fetchSubscriptions();
    } catch (e) {
      console.error("Failed to update features", e);
    }
  };

  const toggleFeatureSelection = (fid: number) => {
    setSelectedFeatureIds(prev =>
      prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* List View */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Subscription Plans</h2>
          {/*
          <div className="ml-auto">
            <button
              onClick={() => handleOpenModal()}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          </div>
          */}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Name</th>
                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Price</th>
                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Staff Limit</th>
                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Features</th>
                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Status</th>
                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No subscriptions found.</td></tr>
              ) : (
                subscriptions.map(s => (
                  <tr key={s.subscription_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{s.name}</td>
                    <td className="p-4 font-bold text-gray-600">${s.price}</td>
                    <td className="p-4 font-medium text-gray-600">{s.staff_user_limit}</td>
                    <td className="p-4 font-medium text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{s.features.length} items</span>
                        <button onClick={() => handleOpenFeatureModal(s)} className="text-xs text-blue-600 hover:underline">Manage</button>
                      </div>
                    </td>
                    <td className="p-4">
                      {s.status === 0 ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">active</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">inactive</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-3">
                      <Edit2 onClick={() => handleOpenModal(s)} className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-600" />
                      {/*
                      <Trash2 onClick={() => handleDelete(s.subscription_id)} className="h-5 w-5 text-red-400 cursor-pointer hover:text-red-600" />
                      */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingSub ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Plan Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-blue-50 border border-blue-200 rounded p-2.5 outline-none" placeholder="e.g. Standard" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Price</label>
                <input value={price} onChange={e => setPrice(e.target.value)} className="w-1/2 bg-blue-50 border border-blue-200 rounded p-2.5 outline-none" placeholder="0.00" type="number" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Staff User Limit</label>
                <input value={staffUserLimit} onChange={e => setStaffUserLimit(e.target.value)} className="w-1/2 bg-blue-50 border border-blue-200 rounded p-2.5 outline-none" placeholder="e.g. 10" type="number" min={1} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Status</label>
                <select value={status} onChange={e => setStatus(parseInt(e.target.value))} className="w-full bg-blue-50 border border-blue-200 rounded p-2.5 outline-none">
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-blue-50 border border-blue-200 rounded p-2.5 h-24 outline-none resize-none"></textarea>
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="text-gray-600 font-bold text-sm px-4 py-2">Cancel</button>
              <button onClick={handleSave} className="bg-gray-700 text-white font-bold px-8 py-2 rounded-lg text-sm hover:bg-gray-800 shadow-md">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Assignment Modal */}
      {isFeatureModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Manage Features</h2>
              <button onClick={() => setIsFeatureModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="mb-4 text-sm text-gray-600">Select features for this plan:</p>
              <div className="space-y-2">
                {allFeatures.map(f => (
                  <div key={f.feature_id}
                    onClick={() => toggleFeatureSelection(f.feature_id)}
                    className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedFeatureIds.includes(f.feature_id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                  >
                    <span className="font-medium text-gray-800">{f.name}</span>
                    {selectedFeatureIds.includes(f.feature_id) && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-gray-100 mt-auto flex justify-end gap-4">
              <button onClick={() => setIsFeatureModalOpen(false)} className="text-gray-600 font-bold text-sm px-4 py-2">Cancel</button>
              <button onClick={handleSaveFeatures} className="bg-gray-700 text-white font-bold px-8 py-2 rounded-lg text-sm hover:bg-gray-800 shadow-md">Update Features</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
