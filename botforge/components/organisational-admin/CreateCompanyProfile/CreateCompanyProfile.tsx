import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';
import './CreateCompanyProfile.css';

interface CreateCompanyProfileProps {
  onSuccess?: () => void;
}

const CreateCompanyProfile: React.FC<CreateCompanyProfileProps> = ({ onSuccess }) => {

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('f&b');
  const [size, setSize] = useState('11-50');


  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);


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


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // 1. Create the data object
    const formData = new FormData();
    formData.append('company', companyName);
    formData.append('industry', industry);
    formData.append('size', size);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    // 2. FOR NOW: Just log it to inspect (Simulate backend)
    console.log("--- Form Submitted ---");
    console.log("Company:", companyName);
    console.log("Industry:", industry);
    console.log("Size:", size);
    if (logoFile) console.log("Logo File:", logoFile.name);

    // 3. Simulate success (Alert the user)
    alert("Profile info captured! (Backend integration pending)");

    // 4. (Optional) If you want to test navigation, you can call onSuccess() here
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="page-container">
      <header>
        <div className="logo-container">
          <div className="logo-icon">
            <img src="/1.png" alt="BotForge Logo" />
          </div>
          <span>BotForge</span>
        </div>

        {/* 右上角的 Hardcode 用户信息已被移除 */}
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
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry:</label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
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

            {/* 这个 input 是隐藏的，真正的功能全靠下面的 div 触发 */}
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

              {/* 点击这个按钮会触发上面的 hidden input */}
              <button type="button" className="upload-btn" onClick={handleUploadClick}>
                {previewUrl ? 'Change File' : 'Upload file'}
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
