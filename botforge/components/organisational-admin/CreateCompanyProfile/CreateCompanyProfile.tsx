import React, { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import './CreateCompanyProfile.css';
import { authService } from '../../../api'; 
import { Loader2 } from 'lucide-react';

interface CreateCompanyProfileProps {
  onSuccess?: () => void;
}

const CreateCompanyProfile: React.FC<CreateCompanyProfileProps> = ({ onSuccess }) => {
  // Core Fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Industry Specific Fields (Examples)
  const [cuisineType, setCuisineType] = useState(''); // For F&B
  const [institutionType, setInstitutionType] = useState(''); // For Education

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.system_role_id === 0) {
           if (onSuccess) onSuccess();
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, [onSuccess]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      // Prepare payload with all fields supported by auth_service.py
      const payload = {
        organisation_id: user.organisation_id,
        company_name: companyName,
        industry: industry,
        description: description,
        location: location,
        website_url: websiteUrl,
        contact_email: contactEmail,
        // Conditional industry fields
        cuisine_type: industry === 'F&B' ? cuisineType : undefined,
        institution_type: industry === 'Education' ? institutionType : undefined,
      };

      const res = await authService.updateOrgProfile(payload);

      if (res.ok) {
        if (onSuccess) onSuccess();
      } else {
        alert("Failed to update profile: " + (res.error || "Unknown error"));
      }

    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <header>
        <div className="logo-container">
          <div className="logo-icon"><span>🤖</span></div>
          <span>BotForge</span>
        </div>
      </header>

      <main>
        <h1>Set up your Company Profile</h1>
        <form className="setup-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Company Name:</label>
            <input 
              type="text" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Industry:</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="Technology">Technology</option>
              <option value="F&B">F&B</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your business"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location:</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Website URL:</label>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
            </div>
          </div>

          {/* Conditional Fields based on auth_service.py logic */}
          {industry === 'F&B' && (
            <div className="form-group">
              <label>Cuisine Type:</label>
              <input 
                type="text" 
                placeholder="e.g. Italian, Fast Food" 
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
              />
            </div>
          )}

          {industry === 'Education' && (
            <div className="form-group">
              <label>Institution Type:</label>
              <input 
                type="text" 
                placeholder="e.g. University, K-12" 
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
              />
            </div>
          )}

          <div className="submit-container">
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
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
