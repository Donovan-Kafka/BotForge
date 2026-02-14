import React, { useState, useEffect } from 'react';
import { Bot, Search, ShieldAlert } from 'lucide-react';
import { sysAdminService } from '../../api';



export const UserManagement: React.FC = () => {
  
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const res = await sysAdminService.listOrganisations();
      if (res.ok) setOrgs(res.organisations || []); // you can rename users -> orgs later
    } finally {
      setLoading(false);
    }
  };


  const handleToggleStatus = async (orgId: number, currentStatus: boolean) => {
    const res = await sysAdminService.updateOrganisationStatus(orgId, !currentStatus);
    if (res.ok) loadOrgs();
  };

  const filteredUsers = orgs.filter((o: any) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.organisation_id.toString().includes(searchQuery)
  );

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500 relative">
  


        <div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-r-lg flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-bold">Access Control Zone</h3>
              <p className="text-red-600 text-sm">Actions taken here will immediately affect user login capability.</p>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Security Clearance</h2>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search organisation..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-red-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Org ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Security Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((org: any) => (
                  <tr
                    key={org.organisation_id}
                    className={!org.status ? "bg-red-50/30 transition-colors" : "hover:bg-gray-50 transition-colors"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold mr-3 text-sm ${
                            org.status ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {String(org.name).substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{org.name}</div>
                          <div className="text-gray-500 text-xs">ID: {org.organisation_id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {org.organisation_id}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          org.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {org.status ? "Active" : "Revoked"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleToggleStatus(org.organisation_id, org.status)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${
                          org.status
                            ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {org.status ? "Revoke Access" : "Restore Access"}
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </div>
      
    </div>
  );
};
