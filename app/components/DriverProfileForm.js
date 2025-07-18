'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from './DashboardLayout';

export default function DriverProfileForm({ user, profile = {} }) {
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    driver_license_number: '',
    driver_license_expiry: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    vehicle_license_plate: '',
    vehicle_insurance_policy: '',
    vehicle_insurance_expiry: '',
    emergency_contact: '',
    is_available: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Initialize form data with profile data
  useEffect(() => {
    if (profile) {
      // Splitting full name into first and last name if we have it but not individual fields
      let firstName = profile.first_name;
      let lastName = profile.last_name;
      
      if ((!firstName || !lastName) && profile.full_name) {
        const nameParts = profile.full_name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      setFormData(prevData => ({
        ...prevData,
        first_name: firstName || '',
        last_name: lastName || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        driver_license_number: profile.driver_license_number || '',
        driver_license_expiry: profile.driver_license_expiry || '',
        vehicle_make: profile.vehicle_make || '',
        vehicle_model: profile.vehicle_model || '',
        vehicle_year: profile.vehicle_year || '',
        vehicle_color: profile.vehicle_color || '',
        vehicle_license_plate: profile.vehicle_license_plate || '',
        vehicle_insurance_policy: profile.vehicle_insurance_policy || '',
        vehicle_insurance_expiry: profile.vehicle_insurance_expiry || '',
        emergency_contact: profile.emergency_contact || '',
        is_available: profile.is_available || false,
      }));
    }
  }, [profile, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({ 
      ...prevData, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Update profile in Supabase - only include fields that exist in the profiles table
      const profileData = {
        id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        address: formData.address,
        driver_license_number: formData.driver_license_number,
        driver_license_expiry: formData.driver_license_expiry,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        vehicle_color: formData.vehicle_color,
        vehicle_license_plate: formData.vehicle_license_plate,
        vehicle_insurance_policy: formData.vehicle_insurance_policy,
        vehicle_insurance_expiry: formData.vehicle_insurance_expiry,
        emergency_contact: formData.emergency_contact,
        is_available: formData.is_available,
        updated_at: new Date().toISOString()
      };
      
      // Try getting the profile first to see if we're updating or inserting
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      let error;
      
      if (existingProfile) {
        const result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        
        error = result.error;
      } else {
        const result = await supabase
          .from('profiles')
          .insert(profileData);
        
        error = result.error;
      }

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Update user metadata with first name and last name
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      if (fullName !== `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim()) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { 
            first_name: formData.first_name,
            last_name: formData.last_name
          }
        });

        if (metadataError) {
          console.warn('Failed to update user metadata, but profile was saved:', metadataError);
        }
      }

      setMessage({ 
        text: 'Profile updated successfully!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error.message || 'Failed to update profile. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
      
      // Clear success message after 3 seconds
      if (message.type === 'success') {
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 3000);
      }
    }
  };

  return (
    <DashboardLayout user={user} activeTab="settings">
      <div className="bg-white dark:bg-[#1C2C2F] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-primary dark:text-dark-primary mb-6">Driver Profile Settings</h2>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium text-primary dark:text-dark-primary mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="emergency_contact" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    id="emergency_contact"
                    name="emergency_contact"
                    type="text"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Home Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
              </div>
            </div>
            
            {/* Driver License Section */}
            <div>
              <h3 className="text-lg font-medium text-primary dark:text-dark-primary mb-4">Driver License Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="driver_license_number" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    License Number
                  </label>
                  <input
                    id="driver_license_number"
                    name="driver_license_number"
                    type="text"
                    value={formData.driver_license_number}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="driver_license_expiry" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    License Expiry Date
                  </label>
                  <input
                    id="driver_license_expiry"
                    name="driver_license_expiry"
                    type="date"
                    value={formData.driver_license_expiry}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
              </div>
            </div>
            
            {/* Vehicle Information Section */}
            <div>
              <h3 className="text-lg font-medium text-primary dark:text-dark-primary mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vehicle_make" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Make
                  </label>
                  <input
                    id="vehicle_make"
                    name="vehicle_make"
                    type="text"
                    value={formData.vehicle_make}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="vehicle_model" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Model
                  </label>
                  <input
                    id="vehicle_model"
                    name="vehicle_model"
                    type="text"
                    value={formData.vehicle_model}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="vehicle_year" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Year
                  </label>
                  <input
                    id="vehicle_year"
                    name="vehicle_year"
                    type="text"
                    value={formData.vehicle_year}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="vehicle_color" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Color
                  </label>
                  <input
                    id="vehicle_color"
                    name="vehicle_color"
                    type="text"
                    value={formData.vehicle_color}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="vehicle_license_plate" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    License Plate
                  </label>
                  <input
                    id="vehicle_license_plate"
                    name="vehicle_license_plate"
                    type="text"
                    value={formData.vehicle_license_plate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
              </div>
            </div>
            
            {/* Insurance Information Section */}
            <div>
              <h3 className="text-lg font-medium text-primary dark:text-dark-primary mb-4">Insurance Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vehicle_insurance_policy" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Policy Number
                  </label>
                  <input
                    id="vehicle_insurance_policy"
                    name="vehicle_insurance_policy"
                    type="text"
                    value={formData.vehicle_insurance_policy}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="vehicle_insurance_expiry" className="block text-sm font-medium text-primary dark:text-dark-primary mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    id="vehicle_insurance_expiry"
                    name="vehicle_insurance_expiry"
                    type="date"
                    value={formData.vehicle_insurance_expiry}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#121212] text-primary dark:text-dark-primary"
                  />
                </div>
              </div>
            </div>

            
            {/* Availability */}
            <div>
              <h3 className="text-lg font-medium text-primary dark:text-dark-primary mb-4">Availability</h3>
              <div className="flex items-center">
                <input
                  id="is_available"
                  name="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#84CED3] focus:ring-[#84CED3] border-gray-300 rounded"
                />
                <label htmlFor="is_available" className="ml-2 block text-sm font-medium text-primary dark:text-dark-primary">
                  I am currently available to accept trips
                </label>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#84CED3] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84CED3] disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Account Section */}
      <div className="bg-white dark:bg-[#1C2C2F] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-primary dark:text-dark-primary mb-4">Account Information</h3>
        <div className="mb-4">
          <div className="text-sm text-primary/70 dark:text-dark-primary/70">Email</div>
          <div className="font-medium text-primary dark:text-dark-primary">{user.email}</div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-medium text-primary dark:text-dark-primary mb-2">Password</h4>
          <p className="text-sm text-primary/70 dark:text-dark-primary/70 mb-4">
            You can update your password from the change password page.
          </p>
          <a
            href="/update-password"
            className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-primary dark:text-dark-primary bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#1C2C2F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84CED3] transition-colors"
          >
            Change Password
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}