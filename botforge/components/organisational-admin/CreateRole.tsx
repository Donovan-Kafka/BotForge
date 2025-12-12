import React from 'react';

interface CreateRoleProps {
  onBack: () => void;
}

export const CreateRole: React.FC<CreateRoleProps> = ({ onBack }) => {
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Role</h2>
        <p className="text-gray-500">Define the role name and select which functions this role can access.</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Role Details */}
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
           <h3 className="font-bold text-gray-800 mb-6 text-base">Role Details</h3>
           <div className="mb-2">
             <label className="block text-sm font-bold text-gray-700 mb-2">Role Name</label>
             <input 
               type="text" 
               placeholder="e.g. Support Staff, Supervisor" 
               className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
             />
           </div>
        </div>

        {/* Permissions */}
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
           <h3 className="font-bold text-gray-800 mb-2 text-base">Accessible Functions / Permissions</h3>
           <p className="text-xs text-gray-500 mb-6">Tick the features that this role is allowed to use.</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 mb-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">Build Chatbot</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">Customise Chatbot</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">View Chat History</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">Manage Staff & Roles</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">Submit Feedback</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">Manage Account</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-sm text-gray-600 group-hover:text-gray-900">View Notifications</span>
              </label>
           </div>

           <div className="border-t border-gray-200 pt-6">
              <p className="text-sm font-bold text-gray-600 mb-4">Advanced (example only)</p>
              <div className="flex gap-8">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500 group-hover:text-gray-800">View</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500 group-hover:text-gray-800">Create</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500 group-hover:text-gray-800">Update</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500 group-hover:text-gray-800">Delete</span>
                 </label>
              </div>
           </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
           <button 
             onClick={onBack}
             className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={() => {
                // Handle create role logic here
                onBack();
             }}
             className="px-6 py-2.5 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-sm transition-colors shadow-sm"
           >
             Create Role
           </button>
        </div>

      </div>
    </div>
  );
};