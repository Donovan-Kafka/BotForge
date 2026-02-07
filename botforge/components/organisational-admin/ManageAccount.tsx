import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { orgAdminService } from '../../api';

interface ManageAccountProps {
  onBack: () => void;
}

export const ManageAccount: React.FC<ManageAccountProps> = ({ onBack }) => {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffCapacity, setStaffCapacity] = useState<{
    subscription_name: string | null;
    staff_limit: number | null;
    active_staff_count: number;
    pending_invitation_count: number;
    remaining_invites: number;
    message: string | null;
  } | null>(null);
  const [isLoadingCapacity, setIsLoadingCapacity] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadStaffCapacity = async (organisationId: number) => {
      setIsLoadingCapacity(true);
      setCapacityError(null);
      try {
        const res = await orgAdminService.getStaffCapacity(organisationId);
        if (res?.ok && res?.staff_capacity) {
          setStaffCapacity(res.staff_capacity);
          return;
        }

        // Backward compat: older backend might not have /staff-capacity yet.
        const fallback = await orgAdminService.listOrgUsers(organisationId);
        setStaffCapacity(fallback?.staff_capacity ?? null);
        if (!fallback?.staff_capacity) {
          setCapacityError((res && res.error) || (fallback && fallback.error) || 'Unable to load staff capacity');
        }
      } catch (e) {
        setStaffCapacity(null);
        setCapacityError('Unable to load staff capacity');
      } finally {
        setIsLoadingCapacity(false);
      }
    };

    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setName(u.username || '');
      setEmail(u.email || '');
      if (u.organisation_id) {
        loadStaffCapacity(u.organisation_id);
      }
    }
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setMsg(null);

    try {
      const res = await orgAdminService.updateAdminProfile({
        user_id: user.user_id,
        username: name,
        email: email,
      });

      if (res?.error) {
        setMsg({ type: 'error', text: res.error });
        return;
      }

      setMsg({ type: 'success', text: 'Profile updated successfully' });

      const updated = {
        ...user,
        username: res.username ?? name,
        email: res.email ?? email,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'All password fields are required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsSaving(true);
    setMsg(null);

    try {
      const res = await orgAdminService.changePassword({
        user_id: user.user_id,
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res?.error) {
        setMsg({ type: 'error', text: res.error });
        return;
      }

      setMsg({ type: 'success', text: 'Password changed successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to change password' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Manage Account</h2>

      {msg && (
        <div
          className={`p-4 rounded mb-6 text-center ${
            msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="border border-gray-300 rounded-xl p-8 mb-8 bg-white">
        <h3 className="text-sm font-bold text-gray-700 mb-6">Account Information</h3>

        <div className="space-y-6 max-w-xl mx-auto">
          {user?.organisation_id && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3">
              <div className="text-sm font-bold text-blue-900">Staff Seats Left</div>
              {isLoadingCapacity ? (
                <div className="text-sm text-blue-800 mt-1">Loading staff capacity...</div>
              ) : staffCapacity && staffCapacity.staff_limit !== null ? (
                <div className="text-sm text-blue-800 mt-1">
                  <span className="font-bold">{staffCapacity?.remaining_invites ?? 0}</span> seat(s) available.
                </div>
              ) : (
                <div className="text-sm text-blue-800 mt-1">
                  {staffCapacity?.message || capacityError || 'Staff limit unavailable.'}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <label className="w-24 pl-4 text-sm font-bold text-gray-700">Name :</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 p-2 text-sm text-right text-gray-700 outline-none bg-transparent focus:bg-gray-50"
            />
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <label className="w-24 pl-4 text-sm font-bold text-gray-700">Email :</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-2 text-sm text-right text-gray-700 outline-none bg-transparent focus:bg-gray-50"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
              Update Details
            </button>
          </div>
        </div>
      </div>

      <div className="border border-gray-300 rounded-xl p-8 bg-white">
        <h3 className="text-sm font-bold text-gray-700 mb-6">Security</h3>

        <div className="space-y-6 max-w-xl mx-auto">
          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <label className="w-32 pl-4 text-sm font-bold text-gray-700">Old Password :</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="flex-1 p-2 text-sm text-right text-gray-700 outline-none bg-transparent focus:bg-gray-50"
            />
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <label className="w-32 pl-4 text-sm font-bold text-gray-700">New Password :</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 p-2 text-sm text-right text-gray-700 outline-none bg-transparent focus:bg-gray-50"
            />
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <label className="w-32 pl-4 text-sm font-bold text-gray-700">Confirm :</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 p-2 text-sm text-right text-gray-700 outline-none bg-transparent focus:bg-gray-50"
            />
          </div>

          <div className="flex justify-end gap-6">
            <button
              onClick={handleChangePassword}
              disabled={isSaving}
              className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-8 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
