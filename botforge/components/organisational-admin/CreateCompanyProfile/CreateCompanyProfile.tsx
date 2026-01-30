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
  const [industry, setIndustry] = useState('Technology');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  // Restaurant-specific fields
  const [cuisineType, setCuisineType] = useState('');
  const [restaurantStyle, setRestaurantStyle] = useState('');
  const [diningOptions, setDiningOptions] = useState('');
  const [supportsReservations, setSupportsReservations] = useState(false);
  const [reservationLink, setReservationLink] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [specialties, setSpecialties] = useState('');

  // Education-specific fields
  const [institutionType, setInstitutionType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [courseTypes, setCourseTypes] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [intakePeriods, setIntakePeriods] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [keyPrograms, setKeyPrograms] = useState('');

  // Retail-specific fields
  const [retailType, setRetailType] = useState('');
  const [productCategories, setProductCategories] = useState('');
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [hasOnlineStore, setHasOnlineStore] = useState(false);
  const [onlineStoreUrl, setOnlineStoreUrl] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [paymentMethods, setPaymentMethods] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.system_role_id === 0 && onSuccess) onSuccess();
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
        industry,
        description,
        location,
        city,
        country,
        website_url: websiteUrl,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        business_hours: businessHours,
        // Industry Specifics
        ...(industry === 'F&B' && {
          cuisine_type: cuisineType,
          restaurant_style: restaurantStyle,
          dining_options: diningOptions,
          supports_reservations: supportsReservations,
          reservation_link: reservationLink,
          price_range: priceRange,
          seating_capacity: parseInt(seatingCapacity) || 0,
          specialties
        }),
        ...(industry === 'Education' && {
          institution_type: institutionType,
          target_audience: targetAudience,
          course_types: courseTypes,
          delivery_mode: deliveryMode,
          intake_periods: intakePeriods,
          application_link: applicationLink,
          response_time: responseTime,
          key_programs: keyPrograms
        }),
        ...(industry === 'Retail' && {
          retail_type: retailType,
          product_categories: productCategories,
          has_physical_store: hasPhysicalStore,
          has_online_store: hasOnlineStore,
          online_store_url: onlineStoreUrl,
          delivery_options: deliveryOptions,
          return_policy: returnPolicy,
          payment_methods: paymentMethods
        })
      };

      const res = await authService.updateOrgProfile(payload);
      if (res.ok && onSuccess) {
        // Update local storage to reflect profile completion
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
    <div className="page-container">
      <main>
        <h1>Set up your Company Profile</h1>
        <form className="setup-form" onSubmit={handleSubmit}>
          {/* Common Section */}
          <div className="form-group">
            <label>Company Name:</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Industry:</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="Technology">Technology</option>
              <option value="F&B">F&B (Restaurant)</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
            </select>
          </div>

          <div className="form-group">
            <label>Address:</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City:</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Country:</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          {/* Industry Specific Fields */}
          {industry === 'F&B' && (
            <div className="industry-section">
              <h3>Restaurant Details</h3>
              <div className="form-group">
                <label>Cuisine Type (e.g., Italian, Fusion):</label>
                <input type="text" value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} />
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
                <label>
                  <input type="checkbox" checked={supportsReservations} onChange={(e) => setSupportsReservations(e.target.checked)} />
                  Supports Reservations
                </label>
              </div>
            </div>
          )}

          {industry === 'Retail' && (
            <div className="industry-section">
              <h3>Retail Details</h3>
              <div className="form-group">
                <label>Product Categories:</label>
                <input type="text" placeholder="Shoes, Bags, Accessories" value={productCategories} onChange={(e) => setProductCategories(e.target.value)} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={hasOnlineStore} onChange={(e) => setHasOnlineStore(e.target.checked)} />
                  Has Online Store
                </label>
              </div>
            </div>
          )}

          <div className="submit-container">
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin h-5 w-5" />}
              {isSubmitting ? 'Saving...' : 'Continue to Pricing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateCompanyProfile;
