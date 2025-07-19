# Firebase Setup Instructions

## Fix Authentication Error

To resolve the "Firebase: Error (auth/unauthorized-domain)" error, follow these steps:

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your biobuddy project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Go to "Settings" tab
   - Click on "Authorized domains"

3. **Add Your Replit Domain**
   - Click "Add domain"
   - Add this exact domain: `${process.env.CURRENT_REPLIT_URL || 'your-replit-url'}`
   - Make sure to add the full URL including `https://`

4. **Save Changes**
   - Click "Save" to apply the changes
   - The authentication should work immediately after saving

## After Deployment

When you deploy your app to production:
- Add your `.replit.app` domain to the authorized domains list
- Add any custom domains you configure

## Troubleshooting

If you still get authentication errors:
- Double-check the domain spelling
- Ensure you're using the correct Firebase project
- Clear your browser cache and try again