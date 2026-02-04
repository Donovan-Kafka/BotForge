import React, { useState, FormEvent, useEffect } from 'react';
import './CreateCompanyProfile.css';
import { authService } from '../../../api';
import { Loader2 } from 'lucide-react';

interface CreateCompanyProfileProps {
  onSuccess?: () => void;
}

const CreateCompanyProfile: React.FC<CreateCompanyProfileProps> = ({ onSuccess }) => {
  // Core & Common Fields
  const [companyName, setCompanyName] = useState('');
  
  // CHANGED: Default to 'restaurant' since 'technology' is removed
  const [industry, setIndustry] = useState('restaurant'); 
  
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  // Industry-specific fields
  const [cuisineType, setCuisineType] = useState('');
  const [restaurantStyle, setRestaurantStyle] = useState('');
  const [diningOptions, setDiningOptions] = useState('');
  const [supportsReservations, setSupportsReservations] = useState(false);
  const [reservationLink, setReservationLink] = useState('');
  const [priceRange, setPriceRange] = useState('$');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [specialties, setSpecialties] = useState('');

  // Education fields
  const [institutionType, setInstitutionType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [courseTypes, setCourseTypes] = useState('');

  // Retail fields
  const [productCategories, setProductCategories] = useState('');
  const [hasOnlineStore, setHasOnlineStore] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if ((user.is_profile_complete || user.system_role_id === 0) && onSuccess) {
          onSuccess();
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

      const payload = {
        organisation_id: user.organisation_id,
        name: companyName,
        industry: industry,
        description,
        location,
        city,
        country,
        website_url: websiteUrl,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        business_hours: businessHours,
        ...(industry === 'restaurant' && {
          cuisine_type: cuisineType,
          restaurant_style: restaurantStyle,
          dining_options: diningOptions,
          supports_reservations: supportsReservations,
          reservation_link: reservationLink,
          price_range: priceRange,
          seating_capacity: parseInt(seatingCapacity) || 0,
          specialties
        }),
        ...(industry === 'education' && {
          institution_type: institutionType,
          target_audience: targetAudience,
          course_types: courseTypes
        }),
        ...(industry === 'retail' && {
          product_categories: productCategories,
          has_online_store: hasOnlineStore
        })
      };

      const res = await authService.updateOrgProfile(payload);
      if (res.ok && onSuccess) {
        const updatedUser = { ...user, is_profile_complete: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onSuccess();
      } else {
        alert("Failed to update profile: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // CHANGED: Added 'create-company-profile-wrapper' class here to match CSS
    <div className="create-company-profile-wrapper page-container">
      <main>
        <h1>Set up your Company Profile</h1>
        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name:</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Industry:</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {/* CHANGED: Removed Technology option */}
              <option value="restaurant">F&B (Restaurant)</option>
              <option value="retail">Retail</option>
              <option value="education">Education</option>
            </select>
          </div>

          <div className="form-group">
            <label>Address:</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City:</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Country:</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required />
            </div>
          </div>

          {industry === 'restaurant' && (
            <div className="industry-section">
              <h3>Restaurant Details</h3>
              <div className="form-group">
                <label>Cuisine Type:</label>
                <input type="text" value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} placeholder="e.g. Italian" />
              </div>
              <div className="form-group">
                <label>Price Range:</label>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>
              </div>
              <div className="form-group">
                <label>Seating Capacity:</label>
                <input type="number" value={seatingCapacity} onChange={(e) => setSeatingCapacity(e.target.value)} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={supportsReservations} onChange={(e) => setSupportsReservations(e.target.checked)} />
                  Supports Reservations
                </label>
              </div>
            </div>
          )}

          {industry === 'retail' && (
            <div className="industry-section">
              <h3>Retail Details</h3>
              <div className="form-group">
                <label>Product Categories:</label>
                <input type="text" value={productCategories} onChange={(e) => setProductCategories(e.target.value)} placeholder="e.g. Fashion, Electronics" />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={hasOnlineStore} onChange={(e) => setHasOnlineStore(e.target.checked)} />
                  Has Online Store
                </label>
              </div>
            </div>
          )}
          
          {industry === 'education' && (
            <div className="industry-section">
              <h3>Education Details</h3>
              <div className="form-group">
                <label>Institution Type:</label>
                <input type="text" value={institutionType} onChange={(e) => setInstitutionType(e.target.value)} placeholder="e.g. University, High School" />
              </div>
              <div className="form-group">
                 <label>Target Audience:</label>
                 <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
              </div>
            </div>
          )}

          <div className="submit-container">
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
              {isSubmitting ? 'Saving...' : 'Continue to Pricing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateCompanyProfile;
