import React, { useState, useEffect } from 'react';
import { orgAdminService } from '../../api';
import { User } from '../../types';
import { Loader2, Save, Shield } from 'lucide-react';

interface CreateRoleProps {
    user: User;
    onSuccess?: () => void;
}

export const CreateRole: React.FC<CreateRoleProps> = ({ user, onSuccess }) => {
    const [roleName, setRoleName] = useState('');
    const [description, setDescription] = useState('');
    const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchPerms = async () => {
            const res = await orgAdminService.listAvailablePermissions();
            if (res.ok) {
                setAvailablePermissions(res.permissions);
            }
        };
        fetchPerms();
    }, []);

    const togglePermission = (key: string) => {
        setSelectedPermissions(prev => 
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await orgAdminService.createRole({
                organisation_id: user.organisation_id,
                name: roleName,
                description,
                permissions: selectedPermissions
            });

            if (res.ok) {
                setMessage("Role created successfully!");
                setRoleName('');
                setDescription('');
                setSelectedPermissions([]);
                if (onSuccess) onSuccess();
            } else {
                setMessage(`Error: ${res.error}`);
            }
        } catch (err) {
            setMessage("Failed to create role.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center">
                <Shield className="mr-2 text-blue-600" /> Create New Role
            </h3>

            {message && (
                <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Role Name</label>
                    <input 
                        type="text" 
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Chatbot Manager"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Description</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="What can this role do?"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Permissions</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded border border-gray-200">
                        {availablePermissions.map(perm => (
                            <label key={perm.key} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-100 rounded">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPermissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-gray-800">{perm.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors flex justify-center items-center"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" size={18} /> Save Role</>}
                </button>
            </form>
        </div>
    );
};
