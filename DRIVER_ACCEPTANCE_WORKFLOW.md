# Driver Acceptance Workflow Implementation

## Overview
This implementation adds a new workflow where trips assigned to drivers require acceptance before they become "in progress".

## New Workflow
1. **Admin/Dispatcher assigns trip** → Status: `awaiting_driver_acceptance`
2. **Driver accepts trip** → Status: `in_progress`
3. **Driver rejects trip** → Status: `rejected` (driver_id cleared)

## Database Migration

### 1. Run the Migration
Execute the SQL in `db/driver_acceptance_migration.sql`:

```sql
-- This creates the necessary functions for the new workflow
```

### 2. Key Functions Created
- `assign_trip_to_driver(trip_id, driver_id)` - Sets status to awaiting_driver_acceptance
- `accept_trip(trip_id, driver_id)` - Changes status to in_progress
- `reject_trip(trip_id, driver_id)` - Changes status to rejected and clears driver_id

## Driver App Changes ✅ COMPLETED

### Files Updated:
- `app/components/DriverTripsView.js`
- `app/dashboard/trips/[tripId]/page.js`

### Changes Made:
1. Added new status `awaiting_driver_acceptance` to status badge classes
2. Added Accept/Reject buttons for trips with `awaiting_driver_acceptance` status
3. Created `acceptTrip()` and updated `rejectTrip()` functions to use RPC calls
4. Updated trip loading query to include new status
5. Updated status display text to show "Waiting Driver Acceptance"

## Required Updates for Other Apps

### Admin App (`/Volumes/C/CCT APPS/admin_app`)
Update these files to use the new workflow:

1. **Trip Assignment Logic**
   - When assigning a driver, use `assign_trip_to_driver()` function instead of direct update
   - Status should be set to `awaiting_driver_acceptance` instead of `in_progress`

2. **Status Display**
   - Add `awaiting_driver_acceptance` to status badge classes
   - Display as "Waiting Driver Acceptance"

3. **Trip Lists/Views**
   - Include `awaiting_driver_acceptance` in "active" trip queries
   - Update status filtering and display logic

### Dispatcher App (`/Volumes/C/CCT APPS/dispatcher_app`)
Update these files to use the new workflow:

1. **Trip Assignment Logic**
   - When assigning a driver, use `assign_trip_to_driver()` function
   - Status should be set to `awaiting_driver_acceptance`

2. **Status Display**
   - Add `awaiting_driver_acceptance` to status badge classes
   - Display as "Waiting Driver Acceptance"

3. **Trip Lists/Views**
   - Include `awaiting_driver_acceptance` in "active" trip queries
   - Update status filtering and display logic

## Example Code Changes for Admin/Dispatcher Apps

### Status Badge Function
```javascript
const getStatusBadgeClass = (status) => {
  switch(status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'upcoming':
      return 'bg-blue-100 text-blue-800';
    case 'awaiting_driver_acceptance':  // Add this
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-700';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};
```

### Status Display Text
```javascript
const getStatusText = (status) => {
  switch(status) {
    case 'pending': return 'Pending Assignment';
    case 'upcoming': return 'Upcoming';
    case 'awaiting_driver_acceptance': return 'Waiting Driver Acceptance';  // Add this
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'rejected': return 'Rejected';
    default: return status;
  }
};
```

### Trip Assignment Function
```javascript
const assignTripToDriver = async (tripId, driverId) => {
  try {
    const { error } = await supabase.rpc('assign_trip_to_driver', {
      trip_id: tripId,
      driver_id: driverId
    });
    
    if (error) throw error;
    
    // Refresh trip data
    await loadTrips();
    
    alert('Trip assigned successfully! Driver will receive notification to accept.');
  } catch (error) {
    console.error('Error assigning trip:', error);
    alert('Failed to assign trip. Please try again.');
  }
};
```

### Trip Queries
```javascript
// Include the new status in "active" trips
const { data: activeTrips } = await supabase
  .from('trips')
  .select('*')
  .in('status', ['pending', 'upcoming', 'awaiting_driver_acceptance', 'in_progress'])
  .order('pickup_time', { ascending: true });
```

## Testing the Implementation

1. **Run the database migration**
2. **Update admin/dispatcher apps** with the code changes above
3. **Test the workflow**:
   - Assign a trip to a driver from admin/dispatcher app
   - Verify it shows "Waiting Driver Acceptance" in all apps
   - Log in as the driver and accept the trip
   - Verify it changes to "In Progress" in all apps
   - Test rejection workflow

## Benefits

- ✅ Drivers must explicitly accept trips before they start
- ✅ Better workflow control and driver engagement
- ✅ Clear status visibility across all apps
- ✅ Backward compatible (existing trips continue to work)
- ✅ No breaking changes to existing functionality

## Notes

- The implementation is designed to be non-breaking
- Existing trips with `in_progress` status continue to work normally
- Only new trip assignments will use the new workflow
- All database functions are created with proper security (SECURITY DEFINER)