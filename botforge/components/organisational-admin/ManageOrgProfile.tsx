import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { authService } from '../../api';
import { User } from '../../types';

interface ManageOrgProfileProps {
    onBack?: () => void;
}

export const ManageOrgProfile: React.FC<ManageOrgProfileProps> = ({ onBack }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Company Profile State
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('Technology');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                setUser(u);

                // Fetch Org Data
                if (u.organisation_id) {
                    const res = await authService.getOrgProfile(u.organisation_id);
                    if (res.ok && res.organisation) {
                        const org = res.organisation;
                        setCompanyName(org.name || '');
                        setIndustry(org.industry || 'Technology');
                        setDescription(org.description || '');
                        setLocation(org.location || '');
                        setWebsiteUrl(org.website_url || '');
                        // Map other fields as needed
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load profile data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        if (!user || !user.organisation_id) return;
        setIsSaving(true);
        try {
            // Re-use authService.updateOrgProfile which calls /api/public/organisation/profile
            // This endpoint expects organisation_id in body
            const payload = {
                organisation_id: user.organisation_id,
                company_name: companyName, // Accept name or company_name
                industry,
                description,
                location,
                website_url: websiteUrl
            };

            const res = await authService.updateOrgProfile(payload);
            if (res.ok) {
                setSuccessMsg("Company profile updated");
                // Refresh data to be sure
                loadData();
            } else {
                alert(res.error || "Failed to update company");
            }

        } catch (e) {
            alert("Error updating company");
        } finally {
            setIsSaving(false);
        }
    };



    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-6 py-8 font-sans text-gray-900">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">Manage Org Profile</h1>
                    <p className="text-gray-500 text-base">Manage your organization's public profile and details.</p>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-6 flex justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)}><X size={16} /></button>
                </div>
            )}

            {/* Company Profile Section */}
            <div className="max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-black">Company Profile</h2>
                    <button
                        onClick={handleSaveCompany}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>

                <div className="space-y-6">

                    {/* Company Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Company:</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>

                    {/* Industry */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Industry:</label>
                        <div className="relative">
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full p-3 border border-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none bg-white"
                            >
                                <option value="Technology">Technology</option>
                                <option value="F&B">F&B</option>
                                <option value="Retail">Retail</option>
                                <option value="Education">Education</option>
                            </select>
                        </div>
                    </div>

                    {/* Location / Address */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Address:</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Website URL:</label>
                        <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Description:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            rows={3}
                        />
                    </div>





                </div>
            </div>

        </div>
    );
};
