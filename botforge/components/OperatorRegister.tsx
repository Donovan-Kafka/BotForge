import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type ValidateOk = {
  ok: true;
  invitation: {
    invitation_id: number;
    email: string;
    organisation_id: number;
    status: number;
  };
};

type ValidateFail = {
  ok: false;
  error?: string;   
};

export const OperatorRegister: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token") || "";
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
  // const API_BASE = "https://botforge-xrki.onrender.com"; // backend 
  // const API_BASE = "http://localhost:5000"; // backend 
  const [loading, setLoading] = useState(true);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [orgId, setOrgId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError("Missing invitation token.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/operator/invitations/validate?token=${encodeURIComponent(token)}`
        );
        const data = (await res.json()) as ValidateOk | ValidateFail;

        if (!data.ok) {
            const msg = ("error" in data && data.error) ? data.error : "Invalid invitation token.";
            setError(msg);
            return;
        }

        // ok branch
        setInvitedEmail(data.invitation.email);
        setOrgId(data.invitation.organisation_id);

      } catch {
        setError("Could not validate invitation. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const onSubmit = async () => {
    setError("");

    if (!username.trim()) return setError("Username is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!token) return setError("Missing token.");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/operator/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username: username.trim(),
          password,
          confirmPassword,
          email: invitedEmail, // must match invitation (your backend checks if provided)
        }),
      });

      const data = await res.json();

      if (data.ok) {
        alert("Operator account created. Please log in.");
        navigate("/login");
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch {
      setError("Registration failed due to network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Validating invitation...</div>;

  if (error) {
    return (
      <div className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-3">Operator Signup</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gray-900 text-white rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Operator Signup</h1>
      <p className="text-gray-600 mb-6">
        You’re signing up as: <b>{invitedEmail}</b>
        {orgId ? <span className="text-gray-400"> (Org #{orgId})</span> : null}
      </p>

      <label className="block text-sm font-bold mb-2">Username</label>
      <input
        className="w-full border rounded px-3 py-2 mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label className="block text-sm font-bold mb-2">Password</label>
      <input
        type="password"
        className="w-full border rounded px-3 py-2 mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label className="block text-sm font-bold mb-2">Confirm Password</label>
      <input
        type="password"
        className="w-full border rounded px-3 py-2 mb-6"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        onClick={onSubmit}
        disabled={submitting}
        className={`w-full py-3 rounded font-bold text-white ${
          submitting ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {submitting ? "Creating..." : "Create Operator Account"}
      </button>
    </div>
  );
};
