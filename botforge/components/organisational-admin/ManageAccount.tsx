import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Save, X, Edit2 } from 'lucide-react';
import { authService, orgAdminService } from '../../api';
import { User } from '../../types';

interface ManageAccountProps {
    onBack?: () => void;
}

export const ManageAccount: React.FC<ManageAccountProps> = ({ onBack }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Personal Info State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    // Temporary state for inline editing
    const [tempName, setTempName] = useState('');
    const [tempEmail, setTempEmail] = useState('');

    // Company Profile State
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('Technology');
    const [companySize, setCompanySize] = useState('11-50'); // Not connected to backend yet, keep as dummy
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Logo dummy
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                setName(u.username || '');
                setEmail(u.email || '');

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

    // Handlers for Personal Info
    const handleEditName = () => {
        setTempName(name);
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const res = await orgAdminService.updateAdminProfile({ // Use existing endpoint
                user_id: user.user_id,
                username: tempName,
                email: email // Keep email same
            });

            if (res.username) {
                setName(res.username);
                // update local user
                const updated = { ...user, username: res.username };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);
                setIsEditingName(false);
                setSuccessMsg("Username updated");
            } else {
                // fallback if error structure different
                if (res.error) alert(res.error);
            }
        } catch (e) {
            alert("Failed to update name");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelName = () => {
        setIsEditingName(false);
    }

    const handleEditEmail = () => {
        setTempEmail(email);
        setIsEditingEmail(true);
    };

    const handleSaveEmail = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const res = await orgAdminService.updateAdminProfile({
                user_id: user.user_id,
                username: name, // Keep name same
                email: tempEmail
            });

            if (res.email) {
                setEmail(res.email);
                const updated = { ...user, email: res.email };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);
                setIsEditingEmail(false);
                setSuccessMsg("Email updated");
            } else {
                if (res.error) alert(res.error);
            }
        } catch (e) {
            alert("Failed to update email");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEmail = () => {
        setIsEditingEmail(false);
    }

    // Handlers for Company Profile
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


    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-6 py-8 font-sans text-gray-900">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-16 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">{name}</h1>
                    <p className="text-gray-500 text-base">Manage your details and personal preferences here.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        {/* Avatar Placeholder */}
                        <img
                            src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
                            alt="Profile"
                            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-[2px] border-2 border-white">
                            {/* Verified icon */}
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-6 flex justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)}><X size={16} /></button>
                </div>
            )}

            {/* Basics Section */}
            <h2 className="text-lg font-bold mb-6 text-black border-b border-gray-100 pb-4">Basics</h2>

            <div className="space-y-0 mb-12">

                {/* Photo Row (Static for now) */}
                <div className="flex items-center justify-between py-6 border-b border-gray-100">
                    <div className="w-1/3">
                        <span className="text-sm font-bold text-black">Photo</span>
                    </div>
                    <div className="w-1/3 flex justify-start">
                        <img
                            src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <button disabled className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-400 cursor-not-allowed">
                            Edit
                        </button>
                    </div>
                </div>

                {/* Name Row */}
                <div className="flex items-center justify-between py-8 border-b border-gray-100">
                    <div className="w-1/3">
                        <span className="text-sm font-bold text-black">Name</span>
                    </div>
                    <div className="w-1/3 text-left w-full mr-4">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                autoFocus
                            />
                        ) : (
                            <span className="text-sm font-medium text-gray-900">{name}</span>
                        )}
                    </div>
                    <div className="w-1/3 flex justify-end gap-2">
                        {isEditingName ? (
                            <>
                                <button onClick={handleCancelName} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSaveName} disabled={isSaving} className="px-6 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                                </button>
                            </>
                        ) : (
                            <button onClick={handleEditName} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Email Row */}
                <div className="flex items-center justify-between py-8 border-b border-gray-100">
                    <div className="w-1/3">
                        <span className="text-sm font-bold text-black">Email address</span>
                    </div>
                    <div className="w-1/3 text-left w-full mr-4">
                        {isEditingEmail ? (
                            <input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                autoFocus
                            />
                        ) : (
                            <span className="text-sm font-medium text-gray-900">{email}</span>
                        )}
                    </div>
                    <div className="w-1/3 flex justify-end gap-2">
                        {isEditingEmail ? (
                            <>
                                <button onClick={handleCancelEmail} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSaveEmail} disabled={isSaving} className="px-6 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                                </button>
                            </>
                        ) : (
                            <button onClick={handleEditEmail} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                            </button>
                        )}
                    </div>
                </div>

            </div>

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


                    {/* Company Size  (Mock) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Company Size:</label>
                        <div className="relative">
                            <select
                                value={companySize}
                                onChange={(e) => setCompanySize(e.target.value)}
                                className="w-full p-3 border border-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none bg-white"
                            >
                                <option>1-10</option>
                                <option>11-50</option>
                                <option>51-200</option>
                                <option>200+</option>
                            </select>
                        </div>
                    </div>

                    {/* Company Logo (Mock upload) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Company Logo:</label>
                        <div
                            className="border border-gray-400 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-48"
                            onClick={triggerFileInput}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="h-full w-auto object-contain" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="bg-blue-500 rounded-lg p-4 mb-4">
                                        <Upload className="w-8 h-8 text-white" />
                                    </div>
                                    <button className="px-4 py-2 border border-gray-400 rounded font-bold text-sm text-gray-800 bg-white">
                                        Upload file
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>

        </div>
    );
};