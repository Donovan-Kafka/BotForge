import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';
import './CreateCompanyProfile.css';

const CreateCompanyProfile: React.FC = () => {
  // 1. 定义基本的表单状态
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('f&b');
  const [size, setSize] = useState('11-50');

  // 2. 定义文件相关的状态
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 3. 创建一个引用 (Ref) 来控制隐藏的 input 标签
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      // 生成预览图 URL
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 点击 "Upload file" 按钮时，触发隐藏 input 的点击
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 提交表单给后端
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // --- 关键步骤：准备发送给后端的数据 ---
    // 使用 FormData 对象，它是处理文件上传的标准方式
    const formData = new FormData();
    formData.append('company', companyName);
    formData.append('industry', industry);
    formData.append('size', size);
    
    if (logoFile) {
      // 'logo' 是后端接收文件时需要的参数名 (比如 Java Controller 里的 @RequestParam("logo"))
      formData.append('logo', logoFile); 
    }

    // --- 打印出来检查一下 (调试用) ---
    console.log('准备发送的数据:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // --- 这里写对接后端的代码 (示例) ---
    /*
    try {
      const response = await fetch('http://your-backend-api.com/api/company/create', {
        method: 'POST',
        body: formData, // 注意：上传文件时不需要设置 Content-Type header，浏览器会自动设置
      });
      
      if (response.ok) {
        alert('创建成功！');
        // 跳转到下一步
      }
    } catch (error) {
      console.error('上传失败', error);
    }
    */
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
              required // 必填
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
              accept="image/*" // 只允许选图片
            />

            <div className="upload-container">
              {previewUrl ? (
                // 如果选了图，显示预览图
                <div className="preview-box">
                    <img src={previewUrl} alt="Logo Preview" className="preview-image" />
                </div>
              ) : (
                // 如果没选图，显示原来的图标
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
