'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function VehicleCheckoffForm({ user, onComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [notes, setNotes] = useState('');
  const [issuesFound, setIssuesFound] = useState('');
  const [checkoffData, setCheckoffData] = useState({
    // Pre-trip inspection
    exterior_condition: false,
    tires_condition: false,
    lights_working: false,
    mirrors_clean: false,
    windshield_clean: false,
    fluid_levels: false,
    brakes_working: false,
    horn_working: false,
    seatbelts_working: false,
    emergency_equipment: false,
    wheelchair_lift_working: false,
    wheelchair_securements: false,
    
    // Interior cleanliness
    interior_clean: false,
    seats_clean: false,
    floor_clean: false,
    
    // Documentation
    registration_current: false,
    insurance_current: false,
    inspection_current: false,
  });
  
  const supabase = createClientComponentClient();

  // Check if form was already completed today
  useEffect(() => {
    async function checkExistingCheckoff() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('vehicle_checkoffs')
          .select('*')
          .eq('driver_id', user.id)
          .eq('checkoff_date', today)
          .single();
        
        if (data && !error) {
          // Form already completed today
          setCheckoffData({
            exterior_condition: data.exterior_condition,
            tires_condition: data.tires_condition,
            lights_working: data.lights_working,
            mirrors_clean: data.mirrors_clean,
            windshield_clean: data.windshield_clean,
            fluid_levels: data.fluid_levels,
            brakes_working: data.brakes_working,
            horn_working: data.horn_working,
            seatbelts_working: data.seatbelts_working,
            emergency_equipment: data.emergency_equipment,
            wheelchair_lift_working: data.wheelchair_lift_working,
            wheelchair_securements: data.wheelchair_securements,
            interior_clean: data.interior_clean,
            seats_clean: data.seats_clean,
            floor_clean: data.floor_clean,
            registration_current: data.registration_current,
            insurance_current: data.insurance_current,
            inspection_current: data.inspection_current,
          });
          setVehicleId(data.vehicle_id || '');
          setNotes(data.notes || '');
          setIssuesFound(data.issues_found || '');
        }
      } catch (error) {
        console.error('Error checking existing checkoff:', error);
      }
    }
    
    checkExistingCheckoff();
  }, [user.id, supabase]);

  const handleCheckboxChange = (field) => {
    setCheckoffData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate critical items
    const criticalItems = [
      'exterior_condition',
      'tires_condition', 
      'lights_working',
      'brakes_working',
      'seatbelts_working'
    ];
    
    const failedCritical = criticalItems.filter(item => !checkoffData[item]);
    
    if (failedCritical.length > 0) {
      const proceed = window.confirm(
        'Some critical safety items are not checked. Are you sure you want to continue?'
      );
      if (!proceed) return;
    }
    
    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if record exists for today
      const { data: existing } = await supabase
        .from('vehicle_checkoffs')
        .select('id')
        .eq('driver_id', user.id)
        .eq('checkoff_date', today)
        .single();
      
      const checkoffRecord = {
        driver_id: user.id,
        vehicle_id: vehicleId,
        checkoff_date: today,
        ...checkoffData,
        notes,
        issues_found: issuesFound,
      };
      
      let error;
      
      if (existing) {
        // Update existing record
        ({ error } = await supabase
          .from('vehicle_checkoffs')
          .update(checkoffRecord)
          .eq('id', existing.id));
      } else {
        // Insert new record
        ({ error } = await supabase
          .from('vehicle_checkoffs')
          .insert(checkoffRecord));
      }
      
      if (error) throw error;
      
      if (onComplete) {
        onComplete(true);
      } else {
        alert('Vehicle checkoff completed successfully!');
      }
      
    } catch (error) {
      console.error('Error submitting checkoff:', error);
      alert('Failed to submit checkoff. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkboxGroups = [
    {
      title: 'Pre-Trip Safety Inspection',
      items: [
        { field: 'exterior_condition', label: 'Exterior body condition acceptable', critical: true },
        { field: 'tires_condition', label: 'Tires properly inflated & good tread', critical: true },
        { field: 'lights_working', label: 'All lights working (headlights, signals, brake)', critical: true },
        { field: 'mirrors_clean', label: 'Mirrors clean and properly adjusted' },
        { field: 'windshield_clean', label: 'Windshield clean, no cracks' },
        { field: 'fluid_levels', label: 'Fluid levels checked (oil, coolant, washer)' },
        { field: 'brakes_working', label: 'Brakes tested and working properly', critical: true },
        { field: 'horn_working', label: 'Horn working' },
        { field: 'seatbelts_working', label: 'All seatbelts working', critical: true },
        { field: 'emergency_equipment', label: 'Emergency equipment present (first aid, fire extinguisher)' },
      ]
    },
    {
      title: 'Accessibility Equipment',
      items: [
        { field: 'wheelchair_lift_working', label: 'Wheelchair lift/ramp operational' },
        { field: 'wheelchair_securements', label: 'Wheelchair tie-downs and securements working' },
      ]
    },
    {
      title: 'Interior Cleanliness',
      items: [
        { field: 'interior_clean', label: 'Interior clean and odor-free' },
        { field: 'seats_clean', label: 'Seats clean and in good condition' },
        { field: 'floor_clean', label: 'Floor clean and clear of debris' },
      ]
    },
    {
      title: 'Documentation',
      items: [
        { field: 'registration_current', label: 'Vehicle registration current' },
        { field: 'insurance_current', label: 'Insurance documentation current' },
        { field: 'inspection_current', label: 'Vehicle inspection current' },
      ]
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5] mb-2">
          Daily Vehicle Inspection Checklist
        </h2>
        <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
          Complete this checklist before starting your shift
        </p>
      </div>

      {/* Vehicle ID */}
      <div>
        <label htmlFor="vehicle_id" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
          Vehicle ID / License Plate
        </label>
        <input
          type="text"
          id="vehicle_id"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] bg-white dark:bg-[#24393C] text-[#2E4F54] dark:text-[#E0F4F5]"
          placeholder="e.g., ABC-123"
          required
        />
      </div>

      {/* Checklist Groups */}
      {checkboxGroups.map((group) => (
        <div key={group.title} className="bg-white dark:bg-[#1C2C2F] p-4 rounded-lg border border-[#DDE5E7] dark:border-[#3F5E63]">
          <h3 className="font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-3">
            {group.title}
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => (
              <label key={item.field} className="flex items-start">
                <input
                  type="checkbox"
                  checked={checkoffData[item.field]}
                  onChange={() => handleCheckboxChange(item.field)}
                  className="mt-0.5 h-4 w-4 text-[#7CCFD0] focus:ring-[#7CCFD0] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-[#2E4F54] dark:text-[#E0F4F5]">
                  {item.label}
                  {item.critical && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Issues Found */}
      <div>
        <label htmlFor="issues" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
          Issues Found (if any)
        </label>
        <textarea
          id="issues"
          value={issuesFound}
          onChange={(e) => setIssuesFound(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] bg-white dark:bg-[#24393C] text-[#2E4F54] dark:text-[#E0F4F5]"
          placeholder="Describe any issues that need attention..."
        />
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] bg-white dark:bg-[#24393C] text-[#2E4F54] dark:text-[#E0F4F5]"
          placeholder="Any other notes..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-[#7CCFD0] rounded-md hover:bg-[#60BFC0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Checkoff'}
        </button>
      </div>
      
      <p className="text-xs text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
        * Critical safety items that must be addressed before operating the vehicle
      </p>
    </form>
  );
}