import React, { useState, ChangeEvent, FormEvent } from 'react';
import './CreateCompanyProfile.css'; // Updated to match the new CSS filename

interface FormData {
  company: string;
  industry: string;
  size: string;
}

const CreateCompanyProfile: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    company: '',
    industry: 'f&b',
    size: '11-50',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Company Profile Submitted:', formData);
    // Add logic to save company profile here
  };

  return (
    <div className="page-container">
      <header>
        <div className="logo-container">
          <div className="logo-icon">
             {/* Make sure to put your logo in the public folder or import it */}
            <img src="/1.png" alt="BotForge Logo" />
          </div>
          <span>BotForge</span>
        </div>

        <div className="user-menu">
          <div className="notification-icon">
            <div className="notification-dot"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>

          <div className="user-info">
            <div className="user-text">
              <div className="user-name">Hi, Robby</div>
              <div className="user-role">Org Admin</div>
            </div>
            <div className="avatar">R</div>
          </div>

          <a href="#" className="logout-link">
            Logout
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </a>
        </div>
      </header>

      <main>
        <h1>Set up your account</h1>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company">Company:</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry:</label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
            >
              <option value="f&b">F&B</option>
              <option value="tech">Technology</option>
              <option value="retail">Retail</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="size">Company Size:</label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
            >
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </select>
          </div>

          <div className="form-group">
            <label>Company Logo:</label>
            <div className="upload-container">
              <div className="upload-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              </div>
              <button type="button" className="upload-btn">
                Upload file
              </button>
            </div>
          </div>

          <div className="submit-container">
            <button type="submit" className="btn-submit">
              Choose Subscription Plan
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateCompanyProfile;
