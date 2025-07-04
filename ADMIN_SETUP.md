# Admin Setup for Audit System

The audit system is restricted to admin users only. Here's how to set up admin access:

## Prerequisites

1. Make sure you have a registered user account
2. The backend server should be running
3. Database migrations should be applied

## Setting Up Admin Access

### Step 1: Register a User (if not already done)

1. Go to the registration page: `http://localhost:3000/register`
2. Create a new user account
3. Note down the email address you used

### Step 2: Promote User to Admin

Run the admin creation script from the backend directory:

```bash
cd backend
npm run create-admin <email>
```

Example:
```bash
npm run create-admin admin@example.com
```

### Step 3: Verify Admin Access

1. Log in with your admin account
2. You should now see an "Audit" tab in the sidebar
3. Click on the Audit tab to access the audit dashboard

## Security Features

- **Role-based Access**: Only users with `role: 'admin'` can access audit routes
- **JWT Token Validation**: Admin role is embedded in the JWT token
- **Backend Protection**: All audit endpoints are protected by admin middleware
- **Frontend Protection**: Audit tab is only visible to admin users
- **Graceful Fallback**: Non-admin users see an "Access Denied" message

## API Endpoints

Admin-only endpoints:
- `GET /api/audit/logs` - Get audit logs with filtering
- `GET /api/audit/stats` - Get audit statistics

## Troubleshooting

### "Access Denied" Message
- Ensure the user has been promoted to admin using the script
- Check that you're logged in with the correct account
- Verify the JWT token contains the admin role

### Admin Tab Not Visible
- Log out and log back in to refresh the JWT token
- Check the browser console for any errors
- Verify the user role in the database

### Database Issues
- Run `npm run migrate` to ensure all migrations are applied
- Check that the `role` column exists in the `User` table

## Database Schema

The `User` table now includes a `role` field:
- `role: 'user'` (default) - Regular user access
- `role: 'admin'` - Full access including audit system

## Security Notes

- Admin privileges should be granted carefully
- Consider implementing additional security measures for production
- Monitor admin access through the audit logs themselves
- Regularly review admin user list 