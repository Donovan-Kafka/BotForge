import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { authService } from '../../api';
import { User } from '../../types';

interface ManageOrgProfileProps {
    onBack?: () => void;
}

type OrgIndustry = 'restaurant' | 'retail' | 'education';

type OrgProfileForm = {
    name: string;
    industry: OrgIndustry;
    description: string;
    location: string;
    city: string;
    country: string;
    contact_email: string;
    contact_phone: string;
    website_url: string;
    business_hours: string;

    restaurant: {
        cuisine_type: string;
        restaurant_style: string;
        dining_options: string;
        supports_reservations: boolean;
        reservation_link: string;
        price_range: string;
        seating_capacity: string;
        specialties: string;
    };
    education: {
        institution_type: string;
        target_audience: string;
        course_types: string;
        delivery_mode: string;
        intake_periods: string;
        application_link: string;
        response_time: string;
        key_programs: string;
    };
    retail: {
        retail_type: string;
        product_categories: string;
        has_physical_store: boolean;
        has_online_store: boolean;
        online_store_url: string;
        delivery_options: string;
        return_policy: string;
        warranty_info: string;
        payment_methods: string;
        promotions_note: string;
    };
};

const emptyForm = (): OrgProfileForm => ({
    name: '',
    industry: 'retail',
    description: '',
    location: '',
    city: '',
    country: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    business_hours: '',
    restaurant: {
        cuisine_type: '',
        restaurant_style: '',
        dining_options: '',
        supports_reservations: false,
        reservation_link: '',
        price_range: '',
        seating_capacity: '',
        specialties: '',
    },
    education: {
        institution_type: '',
        target_audience: '',
        course_types: '',
        delivery_mode: '',
        intake_periods: '',
        application_link: '',
        response_time: '',
        key_programs: '',
    },
    retail: {
        retail_type: '',
        product_categories: '',
        has_physical_store: true,
        has_online_store: false,
        online_store_url: '',
        delivery_options: '',
        return_policy: '',
        warranty_info: '',
        payment_methods: '',
        promotions_note: '',
    },
});

const asIndustry = (raw: any): OrgIndustry => {
    const v = String(raw || '').trim().toLowerCase();
    if (v === 'restaurant' || v === 'retail' || v === 'education') return v;
    if (v === 'f&b' || v === 'fnb') return 'restaurant';
    return 'retail';
};

const inputClass =
    'w-full p-3 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white';

function TextInput(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
}) {
    const { label, value, onChange, type = 'text', placeholder } = props;
    return (
        <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={inputClass}
                placeholder={placeholder}
            />
        </div>
    );
}

function TextArea(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
    placeholder?: string;
}) {
    const { label, value, onChange, rows = 3, placeholder } = props;
    return (
        <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={inputClass}
                rows={rows}
                placeholder={placeholder}
            />
        </div>
    );
}

function CheckboxField(props: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
    const { id, label, checked, onChange } = props;
    return (
        <div className="flex items-center gap-3">
            <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
            <label htmlFor={id} className="text-sm font-semibold text-gray-900">{label}</label>
        </div>
    );
}

export const ManageOrgProfile: React.FC<ManageOrgProfileProps> = ({ onBack }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [originalIndustry, setOriginalIndustry] = useState<OrgIndustry | null>(null);

    const [form, setForm] = useState<OrgProfileForm>(() => emptyForm());

    const industryLabel = useMemo(() => {
        if (form.industry === 'restaurant') return 'F&B (Restaurant)';
        if (form.industry === 'education') return 'Education';
        return 'Retail';
    }, [form.industry]);

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                setError('No logged-in user found.');
                return;
            }

            const u = JSON.parse(storedUser);
            setUser(u);

            if (!u.organisation_id) {
                setError('No organisation found for this user.');
                return;
            }

            const res = await authService.getOrgProfile(u.organisation_id);
            if (!res.ok || !res.organisation) {
                setError(res.error || 'Failed to load organization profile');
                return;
            }

            const org = res.organisation;
            const ind = asIndustry(org.industry);
            setOriginalIndustry(ind);

            setForm((prev) => ({
                ...prev,
                name: org.name || '',
                industry: ind,
                description: org.description || '',
                location: org.location || '',
                city: org.city || '',
                country: org.country || '',
                contact_email: org.contact_email || '',
                contact_phone: org.contact_phone || '',
                website_url: org.website_url || '',
                business_hours: org.business_hours || '',

                restaurant: {
                    ...prev.restaurant,
                    cuisine_type: org.restaurant?.cuisine_type || '',
                    restaurant_style: org.restaurant?.restaurant_style || '',
                    dining_options: org.restaurant?.dining_options || '',
                    supports_reservations: !!org.restaurant?.supports_reservations,
                    reservation_link: org.restaurant?.reservation_link || '',
                    price_range: org.restaurant?.price_range || '',
                    seating_capacity:
                        org.restaurant?.seating_capacity !== null && org.restaurant?.seating_capacity !== undefined
                            ? String(org.restaurant.seating_capacity)
                            : '',
                    specialties: org.restaurant?.specialties || '',
                },

                education: {
                    ...prev.education,
                    institution_type: org.education?.institution_type || '',
                    target_audience: org.education?.target_audience || '',
                    course_types: org.education?.course_types || '',
                    delivery_mode: org.education?.delivery_mode || '',
                    intake_periods: org.education?.intake_periods || '',
                    application_link: org.education?.application_link || '',
                    response_time: org.education?.response_time || '',
                    key_programs: org.education?.key_programs || '',
                },

                retail: {
                    ...prev.retail,
                    retail_type: org.retail?.retail_type || '',
                    product_categories: org.retail?.product_categories || '',
                    has_physical_store: org.retail?.has_physical_store ?? true,
                    has_online_store: !!org.retail?.has_online_store,
                    online_store_url: org.retail?.online_store_url || '',
                    delivery_options: org.retail?.delivery_options || '',
                    return_policy: org.retail?.return_policy || '',
                    warranty_info: org.retail?.warranty_info || '',
                    payment_methods: org.retail?.payment_methods || '',
                    promotions_note: org.retail?.promotions_note || '',
                },
            }));
        } catch (e) {
            console.error(e);
            setError('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.organisation_id) return;

        setIsSaving(true);
        setError(null);

        try {
            const payload: any = {
                organisation_id: user.organisation_id,
                name: form.name,
                industry: form.industry,
                description: form.description,
                location: form.location,
                city: form.city,
                country: form.country,
                contact_email: form.contact_email,
                contact_phone: form.contact_phone,
                website_url: form.website_url,
                business_hours: form.business_hours,
            };

            if (form.industry === 'restaurant') {
                payload.cuisine_type = form.restaurant.cuisine_type;
                payload.restaurant_style = form.restaurant.restaurant_style;
                payload.dining_options = form.restaurant.dining_options;
                payload.supports_reservations = form.restaurant.supports_reservations;
                payload.reservation_link = form.restaurant.reservation_link;
                payload.price_range = form.restaurant.price_range;
                const cap = parseInt(form.restaurant.seating_capacity, 10);
                if (!Number.isNaN(cap)) payload.seating_capacity = cap;
                payload.specialties = form.restaurant.specialties;
            }

            if (form.industry === 'education') {
                payload.institution_type = form.education.institution_type;
                payload.target_audience = form.education.target_audience;
                payload.course_types = form.education.course_types;
                payload.delivery_mode = form.education.delivery_mode;
                payload.intake_periods = form.education.intake_periods;
                payload.application_link = form.education.application_link;
                payload.response_time = form.education.response_time;
                payload.key_programs = form.education.key_programs;
            }

            if (form.industry === 'retail') {
                payload.retail_type = form.retail.retail_type;
                payload.product_categories = form.retail.product_categories;
                payload.has_physical_store = form.retail.has_physical_store;
                payload.has_online_store = form.retail.has_online_store;
                payload.online_store_url = form.retail.online_store_url;
                payload.delivery_options = form.retail.delivery_options;
                payload.return_policy = form.retail.return_policy;
                payload.warranty_info = form.retail.warranty_info;
                payload.payment_methods = form.retail.payment_methods;
                payload.promotions_note = form.retail.promotions_note;
            }

            const res = await authService.updateOrgProfile(payload);
            if (!res.ok) {
                setError(res.error || 'Failed to update company');
                return;
            }

            setSuccessMsg('Company profile updated');
            await loadData();
        } catch (e) {
            console.error(e);
            setError('Error updating company');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-6 py-8 font-sans text-gray-900">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">Manage Org Profile</h1>
                    <p className="text-gray-500 text-base">Manage your organization\'s public profile and details.</p>
                </div>

                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Back
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !user?.organisation_id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-6 flex justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}

            <div className="max-w-4xl space-y-8">
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-black">Company Profile</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                This information is used across your organization, including public details and chatbot context.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextInput label="Company Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Industry</label>
                            <select
                                value={form.industry}
                                onChange={(e) => {
                                    const next = asIndustry(e.target.value);
                                    if (originalIndustry && next !== originalIndustry) {
                                        const ok = window.confirm(
                                            'Changing industry will clear old industry-specific fields on save. Continue?'
                                        );
                                        if (!ok) return;
                                    }
                                    setSuccessMsg(null);
                                    setForm((p) => ({ ...p, industry: next }));
                                }}
                                className={inputClass}
                            >
                                <option value="restaurant">F&B (Restaurant)</option>
                                <option value="retail">Retail</option>
                                <option value="education">Education</option>
                            </select>
                            <div className="text-xs text-gray-500 mt-2">
                                Current: <span className="font-semibold">{industryLabel}</span>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <TextArea
                                label="Description"
                                value={form.description}
                                onChange={(v) => setForm((p) => ({ ...p, description: v }))}
                                rows={4}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <TextInput
                                label="Address"
                                value={form.location}
                                onChange={(v) => setForm((p) => ({ ...p, location: v }))}
                            />
                        </div>

                        <TextInput label="City" value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} />
                        <TextInput
                            label="Country"
                            value={form.country}
                            onChange={(v) => setForm((p) => ({ ...p, country: v }))}
                        />

                        <TextInput
                            label="Contact Email"
                            type="email"
                            value={form.contact_email}
                            onChange={(v) => setForm((p) => ({ ...p, contact_email: v }))}
                        />
                        <TextInput
                            label="Contact Phone"
                            value={form.contact_phone}
                            onChange={(v) => setForm((p) => ({ ...p, contact_phone: v }))}
                        />

                        <TextInput
                            label="Website URL"
                            value={form.website_url}
                            onChange={(v) => setForm((p) => ({ ...p, website_url: v }))}
                        />
                        <TextInput
                            label="Business Hours"
                            value={form.business_hours}
                            onChange={(v) => setForm((p) => ({ ...p, business_hours: v }))}
                            placeholder="e.g. Mon-Fri 9am-6pm"
                        />
                    </div>
                </div>

                {form.industry === 'restaurant' && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-white">
                        <h2 className="text-lg font-bold text-black mb-6">Restaurant Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput
                                label="Cuisine Type"
                                value={form.restaurant.cuisine_type}
                                onChange={(v) => setForm((p) => ({ ...p, restaurant: { ...p.restaurant, cuisine_type: v } }))}
                                placeholder="e.g. Italian"
                            />
                            <TextInput
                                label="Restaurant Style"
                                value={form.restaurant.restaurant_style}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, restaurant: { ...p.restaurant, restaurant_style: v } }))
                                }
                                placeholder="e.g. Casual dining"
                            />

                            <div className="md:col-span-2">
                                <TextInput
                                    label="Dining Options"
                                    value={form.restaurant.dining_options}
                                    onChange={(v) =>
                                        setForm((p) => ({ ...p, restaurant: { ...p.restaurant, dining_options: v } }))
                                    }
                                    placeholder="e.g. Dine-in, takeaway, delivery"
                                />
                            </div>

                            <CheckboxField
                                id="supports_reservations"
                                label="Supports Reservations"
                                checked={form.restaurant.supports_reservations}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, restaurant: { ...p.restaurant, supports_reservations: v } }))
                                }
                            />

                            <TextInput
                                label="Reservation Link"
                                value={form.restaurant.reservation_link}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, restaurant: { ...p.restaurant, reservation_link: v } }))
                                }
                            />

                            <TextInput
                                label="Price Range"
                                value={form.restaurant.price_range}
                                onChange={(v) => setForm((p) => ({ ...p, restaurant: { ...p.restaurant, price_range: v } }))}
                                placeholder="$ , $$ , $$$"
                            />

                            <TextInput
                                label="Seating Capacity"
                                type="number"
                                value={form.restaurant.seating_capacity}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, restaurant: { ...p.restaurant, seating_capacity: v } }))
                                }
                            />

                            <div className="md:col-span-2">
                                <TextArea
                                    label="Menu"
                                    value={form.restaurant.specialties}
                                    onChange={(v) => setForm((p) => ({ ...p, restaurant: { ...p.restaurant, specialties: v } }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {form.industry === 'education' && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-white">
                        <h2 className="text-lg font-bold text-black mb-6">Education Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput
                                label="Institution Type"
                                value={form.education.institution_type}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, education: { ...p.education, institution_type: v } }))
                                }
                            />
                            <TextInput
                                label="Target Audience"
                                value={form.education.target_audience}
                                onChange={(v) => setForm((p) => ({ ...p, education: { ...p.education, target_audience: v } }))}
                            />

                            <TextInput
                                label="Course Types"
                                value={form.education.course_types}
                                onChange={(v) => setForm((p) => ({ ...p, education: { ...p.education, course_types: v } }))}
                            />
                            <TextInput
                                label="Delivery Mode"
                                value={form.education.delivery_mode}
                                onChange={(v) => setForm((p) => ({ ...p, education: { ...p.education, delivery_mode: v } }))}
                            />

                            <TextInput
                                label="Intake Periods"
                                value={form.education.intake_periods}
                                onChange={(v) => setForm((p) => ({ ...p, education: { ...p.education, intake_periods: v } }))}
                            />
                            <TextInput
                                label="Application Link"
                                value={form.education.application_link}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, education: { ...p.education, application_link: v } }))
                                }
                            />

                            <TextInput
                                label="Response Time"
                                value={form.education.response_time}
                                onChange={(v) => setForm((p) => ({ ...p, education: { ...p.education, response_time: v } }))}
                            />

                            <div className="md:col-span-2">
                                <TextArea
                                    label="Key Programs"
                                    value={form.education.key_programs}
                                    onChange={(v) => setForm((p) => ({ ...p, education: { ...p.education, key_programs: v } }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {form.industry === 'retail' && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-white">
                        <h2 className="text-lg font-bold text-black mb-6">Retail Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput
                                label="Retail Type"
                                value={form.retail.retail_type}
                                onChange={(v) => setForm((p) => ({ ...p, retail: { ...p.retail, retail_type: v } }))}
                            />

                            <TextInput
                                label="Product Categories"
                                value={form.retail.product_categories}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, retail: { ...p.retail, product_categories: v } }))
                                }
                                placeholder="e.g. Fashion, Electronics"
                            />

                            <CheckboxField
                                id="has_physical_store"
                                label="Has Physical Store"
                                checked={form.retail.has_physical_store}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, retail: { ...p.retail, has_physical_store: v } }))
                                }
                            />

                            <CheckboxField
                                id="has_online_store"
                                label="Has Online Store"
                                checked={form.retail.has_online_store}
                                onChange={(v) => setForm((p) => ({ ...p, retail: { ...p.retail, has_online_store: v } }))}
                            />

                            <div className="md:col-span-2">
                                <TextInput
                                    label="Online Store URL"
                                    value={form.retail.online_store_url}
                                    onChange={(v) =>
                                        setForm((p) => ({ ...p, retail: { ...p.retail, online_store_url: v } }))
                                    }
                                />
                            </div>

                            <div className="md:col-span-2">
                                <TextInput
                                    label="Delivery Options"
                                    value={form.retail.delivery_options}
                                    onChange={(v) =>
                                        setForm((p) => ({ ...p, retail: { ...p.retail, delivery_options: v } }))
                                    }
                                />
                            </div>

                            <div className="md:col-span-2">
                                <TextInput
                                    label="Payment Methods"
                                    value={form.retail.payment_methods}
                                    onChange={(v) =>
                                        setForm((p) => ({ ...p, retail: { ...p.retail, payment_methods: v } }))
                                    }
                                />
                            </div>

                            <div className="md:col-span-2">
                                <TextArea
                                    label="Return Policy"
                                    value={form.retail.return_policy}
                                    onChange={(v) => setForm((p) => ({ ...p, retail: { ...p.retail, return_policy: v } }))}
                                    rows={3}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <TextArea
                                    label="Warranty Info"
                                    value={form.retail.warranty_info}
                                    onChange={(v) => setForm((p) => ({ ...p, retail: { ...p.retail, warranty_info: v } }))}
                                    rows={3}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <TextArea
                                    label="Promotions Note"
                                    value={form.retail.promotions_note}
                                    onChange={(v) => setForm((p) => ({ ...p, retail: { ...p.retail, promotions_note: v } }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageOrgProfile;
