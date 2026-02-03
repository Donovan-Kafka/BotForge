import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X, Edit2 } from 'lucide-react';
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

            {/* Security Section */}
            <h2 className="text-lg font-bold mb-6 text-black border-b border-gray-100 pb-4">Security</h2>
            <div className="space-y-6 mb-12 max-w-md">
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Change Password</label>
                    <p className="text-sm text-gray-500 mb-4">Ensure your account is using a long, random password to stay secure.</p>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Current Password"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            id="old-password"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            id="new-password"
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            id="confirm-password"
                        />
                        <button
                            onClick={async () => {
                                const oldP = (document.getElementById('old-password') as HTMLInputElement).value;
                                const newP = (document.getElementById('new-password') as HTMLInputElement).value;
                                const confirmP = (document.getElementById('confirm-password') as HTMLInputElement).value;

                                if (!oldP || !newP || !confirmP) {
                                    alert("Please fill all password fields");
                                    return;
                                }
                                if (newP !== confirmP) {
                                    alert("New passwords do not match");
                                    return;
                                }

                                setIsSaving(true);
                                try {
                                    const res = await orgAdminService.changePassword({
                                        user_id: user?.user_id,
                                        old_password: oldP,
                                        new_password: newP,
                                        confirm_password: confirmP
                                    });
                                    if (res.message) {
                                        setSuccessMsg("Password changed successfully");
                                        (document.getElementById('old-password') as HTMLInputElement).value = '';
                                        (document.getElementById('new-password') as HTMLInputElement).value = '';
                                        (document.getElementById('confirm-password') as HTMLInputElement).value = '';
                                    } else {
                                        alert(res.error || "Failed to change password");
                                    }
                                } catch (e) {
                                    alert("Error changing password");
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                            className="px-4 py-2 bg-black text-white rounded text-sm font-bold hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isSaving ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </div>
            </div>



        </div>
    );
};