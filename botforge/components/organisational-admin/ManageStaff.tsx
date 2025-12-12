import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ManageStaffProps {
  onBack: () => void;
  onCreateRole: () => void; // Callback to switch to a Create Role view if we implemented it fully
}

export const ManageStaff: React.FC<ManageStaffProps> = ({ onBack, onCreateRole }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <button 
          onClick={onBack} 
          className="text-gray-500 hover:text-gray-900 text-sm flex items-center font-medium transition-colors"
        >
          <span className="text-lg mr-2 leading-none">‹</span> Back to Dashboard
        </button>
      </div>

      <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Manage Staff & Roles</h2>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Search Staff Section */}
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
            <h3 className="text-base font-bold text-gray-700 mb-4">Search Staff</h3>
            
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by name or email" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 outline-none focus:border-blue-500" 
                    />
                </div>
                <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-2.5 rounded-lg text-sm font-bold transition-colors">
                    Search
                </button>
            </div>

            <div className="space-y-4 mb-8">
                {/* User Row 1 */}
                <div className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="text-sm text-gray-800 font-bold">
                        User: <span className="font-normal">John Tan</span> &nbsp;&nbsp; Role: <span className="font-normal">Staff</span>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">View</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">Edit</button>
                    </div>
                </div>

                {/* User Row 2 */}
                <div className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="text-sm text-gray-800 font-bold">
                        User: <span className="font-normal">Lim Kai Xuan</span> &nbsp;&nbsp; Role: <span className="font-normal">Admin</span>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">View</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">Edit</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-2.5 rounded-lg text-sm font-bold transition-colors">
                    Invite New User
                </button>
            </div>
        </div>

        {/* Manage Roles Section */}
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
            <h3 className="text-base font-bold text-gray-700 mb-4">Manage Roles</h3>
            
            <div className="space-y-4 mb-8">
                {/* Role Row 1 */}
                <div className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="text-sm text-gray-800 font-bold">
                        Role: <span className="font-normal">Staff</span>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">View</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">Update</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">Delete</button>
                    </div>
                </div>

                {/* Role Row 2 */}
                <div className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="text-sm text-gray-800 font-bold">
                        Role: <span className="font-normal">Admin</span>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">View</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">Update</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-1.5 rounded text-sm font-bold transition-colors">Delete</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button 
                    onClick={onCreateRole}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-2.5 rounded-lg text-sm font-bold transition-colors"
                >
                    Create New Role
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};