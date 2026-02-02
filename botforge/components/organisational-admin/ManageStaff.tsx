import React, { useEffect, useState } from 'react';
import { orgAdminService, orgRoleService } from '../../api';
import { User, Loader2, Trash2, Save } from 'lucide-react';

interface ManageStaffProps {
    onBack: () => void;
    onCreateRole: () => void;
}

export const ManageStaff: React.FC<ManageStaffProps> = ({ onBack, onCreateRole }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            const stored = localStorage.getItem('user');
            if (!stored) return;
            const userObj = JSON.parse(stored);
            setCurrentUser(userObj);

            if (userObj.organisation_id) {
                try {
                    const [usersRes, rolesRes] = await Promise.all([
                        orgAdminService.listOrgUsers(userObj.organisation_id),
                        orgRoleService.listRoles(userObj.organisation_id)
                    ]);
                    if (Array.isArray(usersRes)) setUsers(usersRes);
                    if (Array.isArray(rolesRes)) setRoles(rolesRes);
                } catch (e) {
                    console.error("Failed to load data", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadData();
    }, []);

    const handleDeleteRole = async (roleId: number) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await orgRoleService.deleteRole(roleId);
            setRoles(roles.filter(r => r.id !== roleId));
        } catch (e) {
            alert("Failed to delete role. It may be assigned to active users.");
        }
    };

    const handleUserRoleChange = async (userId: number, newRoleId: number) => {
        try {
            const res = await orgAdminService.updateUserRole(userId, newRoleId);
            if (res.user_id) {
                // Update local state
                setUsers(users.map(u => u.user_id === userId ? { ...u, org_role_id: newRoleId, org_role_name: res.org_role_name } : u));
                alert("User role updated!");
            }
        } catch (e) {
            console.error("Update failed", e);
            alert("Failed to update user role.");
        }
    };

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteResult, setInviteResult] = useState<{
        token: string;
        link: string;
        emailSent?: boolean;
        emailError?: string;
    } | null>(null);

    const handleInvite = async () => {
        if (!inviteEmail || !inviteEmail.includes('@')) {
            alert("Please enter a valid email.");
            return;
        }
        if (!currentUser?.organisation_id) return;

        setInviteLoading(true);
        try {
            const res = await orgAdminService.sendInvitation({
                email: inviteEmail,
                organisation_id: currentUser.organisation_id,
                invited_by_user_id: currentUser.user_id
            });
            if (res.ok) {
                setInviteResult({
                    token: res.token,
                    link: res.signup_link,
                    emailSent: res.email_sent,
                    emailError: res.email_error
                });
                setInviteEmail('');
            } else {
                alert("Error: " + res.error);
            }
        } catch (e) {
            alert("Failed to send invitation.");
        }
        setInviteLoading(false);
    };

    const copyLink = () => {
        if (inviteResult?.link) {
            navigator.clipboard.writeText(inviteResult.link);
            alert("Link copied to clipboard!");
        }
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteResult(null);
        setInviteEmail('');
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="animate-in fade-in duration-500 relative">
            {/* Invitation Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Invite New Staff</h3>
                            <p className="text-sm text-gray-500 mt-1">Send an invitation to join your organisation.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {!inviteResult ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 mb-4"
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={closeInviteModal}
                                            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleInvite}
                                            disabled={inviteLoading}
                                            className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors ${inviteLoading ? 'opacity-70 cursor-wait' : ''}`}
                                        >
                                            {inviteLoading ? 'Sending...' : 'Send Invite'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${inviteResult.emailSent === false ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                        <Save className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Invitation Created!</h4>

                                    {inviteResult.emailSent === false ? (
                                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded mb-4 text-left">
                                            <b>Warning: Email not sent.</b>
                                            <p className="mt-1">{inviteResult.emailError || "SMTP usage failed."}</p>
                                            <p className="mt-1">You must manually provide the link below to the user.</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 mb-6">
                                            An email has been sent to the user. You can also share this link manually.
                                        </p>
                                    )}

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 break-all font-mono text-sm text-gray-600">
                                        {inviteResult.link}
                                    </div>

                                    <button
                                        onClick={copyLink}
                                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors mb-3"
                                    >
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={closeInviteModal}
                                        className="w-full text-gray-500 font-bold py-2 hover:text-gray-800"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-gray-900 text-sm flex items-center font-medium transition-colors"
                >
                    <span className="text-lg mr-2 leading-none">‹</span> Back to Dashboard
                </button>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                    <User className="w-4 h-4" /> Invite Staff
                </button>
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Manage Staff & Roles</h2>

            <div className="max-w-6xl mx-auto space-y-8">

                {/* VIEW STAFF SECTION */}
                <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
                    <h3 className="text-base font-bold text-gray-700 mb-4">View Staff</h3>

                    <div className="space-y-4 mb-8">
                        {users.map((u) => (
                            <div key={u.user_id} className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-800 font-bold">
                                    User: <span className="font-normal">{u.username} ({u.email})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Role:</span>
                                    <select
                                        value={u.org_role_id || ''}
                                        onChange={(e) => handleUserRoleChange(u.user_id, Number(e.target.value))}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50"
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && <p className="text-gray-500 italic">No staff members found.</p>}
                    </div>
                </div>

                {/* MANAGE ROLES SECTION */}
                <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
                    <h3 className="text-base font-bold text-gray-700 mb-4">Manage Roles</h3>

                    <div className="space-y-4 mb-8">
                        {roles.map((role) => (
                            <div key={role.id} className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center">
                                <div className="text-sm text-gray-800 font-bold">
                                    Role: <span className="font-normal">{role.name}</span>
                                    {role.description && <span className="text-gray-500 font-normal text-xs ml-2">- {role.description}</span>}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded text-sm font-bold transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={onCreateRole}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md"
                        >
                            + Create Custom Role
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
