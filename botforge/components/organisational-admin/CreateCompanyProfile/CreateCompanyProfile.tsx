import React, { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import './CreateCompanyProfile.css';
import { authService } from '../../../api'; // Make sure this path is correct based on your folder structure
import { Loader2 } from 'lucide-react';

interface CreateCompanyProfileProps {
  onSuccess?: () => void;
}

const CreateCompanyProfile: React.FC<CreateCompanyProfileProps> = ({ onSuccess }) => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [size, setSize] = useState('1-10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill logic (optional, keeps existing session checks)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // If system admin, we might skip this step or just allow pass-through
        if (user.role_id === 0 || user.system_role_id === 0) {
           if (onSuccess) onSuccess();
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, [onSuccess]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Get current user to find Organisation ID
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        alert("Session expired. Please login again.");
        return;
      }
      const user = JSON.parse(storedUser);

      if (!user.organisation_id) {
        alert("Error: No organisation found for this user.");
        setIsSubmitting(false);
        return;
      }

      // 2. Call the Backend API
      const res = await authService.updateOrgProfile({
        organisation_id: user.organisation_id,
        industry: industry,
        size: size
      });

      if (res.ok) {
        // 3. On success, navigate to the next page
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert("Failed to update profile: " + (res.error || "Unknown error"));
      }

    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <header>
        <div className="logo-container">
          <div className="logo-icon">
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🤖</span>
          </div>
          <span>BotForge</span>
        </div>
        <div></div>
      </header>

      <main>
        <h1>Set up your account</h1>

        <form className="setup-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="company">Company:</label>
            <input
              type="text"
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Confirm Company Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry:</label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="Technology">Technology</option>
              <option value="F&B">F&B</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="size">Company Size:</label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </select>
          </div>

          <div className="form-group">
            <label>Company Logo:</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*"
            />

            <div className="upload-container">
              {previewUrl ? (
                <div className="preview-box">
                  <img src={previewUrl} alt="Logo Preview" className="preview-image" />
                </div>
              ) : (
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              )}
              <button type="button" className="upload-btn" onClick={handleUploadClick}>
                {previewUrl ? 'Change File' : 'Upload file'}
              </button>
            </div>
            <p style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>
              * Logo upload is currently visual only.
            </p>
          </div>

          <div className="submit-container">
            <button 
              type="submit" 
              className="btn-submit flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin h-5 w-5" />}
              {isSubmitting ? 'Saving...' : 'Choose Subscription Plan'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateCompanyProfile;
