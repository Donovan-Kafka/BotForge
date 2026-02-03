import React, { useState, useEffect } from 'react';
import { orgRoleService } from '../../api';
import { Loader2 } from 'lucide-react';

interface CreateRoleProps {
  onBack: () => void;
}

export const CreateRole: React.FC<CreateRoleProps> = ({ onBack }) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const res = await orgRoleService.listPermissions();
        if (Array.isArray(res)) {
          setAvailablePermissions(res);
        }
      } catch (error) {
        console.error("Failed to load permissions", error);
      } finally {
        setIsLoadingPerms(false);
      }
    };
    fetchPerms();
  }, []);

  const togglePerm = (id: number) => {
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!roleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const user = JSON.parse(storedUser);

    setIsSubmitting(true);
    try {
      // 1. Create the Role
      const roleRes = await orgRoleService.createRole({
        organisation_id: user.organisation_id,
        name: roleName,
        description: description
      });

      if (roleRes.id) {
        // 2. Assign Permissions
        if (selectedPerms.length > 0) {
          await orgRoleService.assignPermissions(roleRes.id, selectedPerms);
        }
        alert("Role created successfully!");
        onBack(); // Return to list
      } else {
        alert("Error creating role: " + (roleRes.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 text-sm flex items-center font-medium transition-colors"
        >
          <span className="text-lg mr-2 leading-none">‹</span> Back to Manage Roles
        </button>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Custom Role</h2>
        <p className="text-gray-500">Define the role name and select access rights.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">

        {/* Role Details */}
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 text-base">Role Details</h3>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Supervisor"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2 text-base">Accessible Functions</h3>
          <p className="text-xs text-gray-500 mb-6">Select the features this role can access.</p>

          {isLoadingPerms ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {availablePermissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-3 cursor-pointer group p-2 border border-transparent hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePerm(perm.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">
                    {perm.description || perm.code}
                  </span>
                </label>
              ))}
              {availablePermissions.length === 0 && <p className="text-gray-500 italic">No permissions found.</p>}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            Create Role
          </button>
        </div>

      </div>
    </div>
  );
};
