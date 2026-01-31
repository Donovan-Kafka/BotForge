
import React, { useState, useEffect } from 'react';
import { Bot, Edit2, X } from 'lucide-react';
import { sysAdminService } from '../../api';
import { Feature } from '../../types';

export const FeatureManagement: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchFeatures = async () => {
    try {
      const res = await sysAdminService.listFeatures();
      if (res.ok) {
        setFeatures(res.features);
      }
    } catch (error) {
      console.error("Failed to fetch features", error);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleOpenModal = (feature?: Feature) => {
    if (feature) {
      setEditingFeature(feature);
      setName(feature.name);
      setDescription(feature.description);
    } else {
      setEditingFeature(null);
      setName('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      if (editingFeature) {
        await sysAdminService.updateFeature(editingFeature.feature_id, { name, description });
      } else {
        await sysAdminService.createFeature({ name, description });
      }
      setIsModalOpen(false);
      fetchFeatures();
    } catch (error) {
      console.error("Failed to save feature", error);
    }
  };
  /*
  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      await sysAdminService.deleteFeature(id);
      fetchFeatures();
    }
  };
  */
  return (
    <div className="animate-in fade-in duration-500">
      {/* List View */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Feature Management</h2>
          {/*
          <div className="ml-auto">
            <div className="ml-auto">
              <button
                onClick={() => handleOpenModal()}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Feature
              </button>
            </div>
          </div>
          */}
        </div>

        <div className="space-y-4">
          {features.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No features found.</p>
          ) : (
            features.map((f) => (
              <div key={f.feature_id} className="border border-gray-300 p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors shadow-sm group">
                <div>
                  <span className="font-bold text-gray-700 text-lg block">{f.name}</span>
                  {f.description && <span className="text-gray-500 text-sm">{f.description}</span>}
                </div>
                <div className="flex gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2
                    onClick={() => handleOpenModal(f)}
                    className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
                  />
                  {/*
                  <Trash2
                    onClick={() => handleDelete(f.feature_id)}
                    className="h-5 w-5 text-red-400 cursor-pointer hover:text-red-600 transition-colors"
                  />
                  */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFeature ? 'Edit Feature' : 'New Feature'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Feature Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="e.g. Analytics Dashboard"
                />
              </div>
              {/* Category removed */}
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-lg p-3 h-32 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all"
                  placeholder="Brief description of the feature..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 font-bold text-sm hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-gray-700 text-white font-bold px-8 py-2.5 rounded-lg text-sm hover:bg-gray-800 shadow-md transition-all active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
