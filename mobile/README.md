# Digital Tracker Mobile App

A cross-platform mobile app (Android + iOS) for employee location tracking built with Expo React Native.

## Features

- **Firebase Authentication**: Secure login with email/password
- **Real-time Location Tracking**: GPS-based trip tracking with Socket.io
- **Trip Management**: Start/stop trips with live location updates
- **Trip History**: View detailed trip history with statistics
- **Admin Dashboard**: Monitor all employees and their trips
- **Role-based Access**: Different interfaces for employees and admins
- **Offline Support**: Local storage for user data and tokens

## Project Structure

```
mobile/
├── App.js                          # Main app entry point
├── app.json                        # Expo app configuration
├── .env                            # Environment variables
├── src/
│   ├── config/
│   │   └── firebase.js             # Firebase configuration
│   ├── api/
│   │   ├── client.js               # Axios client with interceptors
│   │   ├── authService.js          # Authentication API calls
│   │   ├── tripService.js          # Trip management API calls
│   │   └── adminService.js         # Admin API calls
│   ├── screens/
│   │   ├── SplashScreen.js         # App launch screen
│   │   ├── LoginScreen.js           # User login
│   │   ├── ForgotPasswordScreen.js  # Password reset with OTP
│   │   ├── EmployeeDashboard.js     # Employee home screen
│   │   ├── StartTripScreen.js       # Start trip with GPS
│   │   ├── StopTripScreen.js        # Stop trip with live tracking
│   │   ├── TripHistoryScreen.js     # View trip history
│   │   ├── AdminDashboard.js       # Admin monitoring dashboard
│   │   └── ProfileScreen.js         # User profile and logout
│   ├── components/
│   │   ├── TripCard.js             # Reusable trip card component
│   │   └── StatsBadge.js           # Statistics badge component
│   ├── navigation/
│   │   └── AppNavigator.js         # Stack + tab navigation
│   ├── utils/
│   │   ├── storage.js              # AsyncStorage helpers
│   │   └── formatters.js           # Date/time formatting utilities
│   └── sockets/
│       └── locationSocket.js       # Socket.io real-time tracking
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Firebase Configuration (optional - can be set directly in firebase.js)
# EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
# EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
# EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
# EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication with Email/Password provider
4. Copy your Firebase configuration to `src/config/firebase.js`
5. Update the `firebaseConfig` object with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "your_actual_api_key",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project_id.appspot.com",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id"
};
```

### 3. Backend Requirements

Ensure your backend server is running and accessible:
- Backend should be running on port 5000 (or update API_URL in .env)
- CORS should be configured to allow your mobile app
- Socket.io should be enabled for real-time features

## Running the App

### Development

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

This will start the Expo development server and show a QR code.

### Testing on Device

1. Install the **Expo Go** app on your Android or iOS device
2. Scan the QR code from the terminal with Expo Go
3. The app will load and connect to your development server

### Android Testing

```bash
# Run on Android device/emulator
npx expo start --android

# Or build APK
npx expo build:android
```

### iOS Testing

```bash
# Run on iOS device/simulator (macOS only)
npx expo start --ios

# Or build IPA
npx expo build:ios
```

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure the build:
```bash
eas build:configure
```

4. Build APK for Android:
```bash
eas build --platform android
```

5. Build IPA for iOS (requires Apple Developer account):
```bash
eas build --platform ios
```

### Using Classic Expo Build

```bash
# Build Android APK
npx expo build:android

# Build iOS IPA (requires Apple Developer account)
npx expo build:ios
```

## API Endpoints Used

The mobile app uses these exact backend endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/resend-otp` - Resend OTP

### Trip Management
- `POST /api/trips/start` - Start trip
- `POST /api/trips/stop` - Stop trip
- `GET /api/trips/stats` - Get trip statistics
- `GET /api/trips/history` - Get trip history

### Admin (role=admin only)
- `GET /api/admin/employees` - Get all employees
- `GET /api/admin/trips/:employeeId` - Get employee trips

## Socket.io Events

### Client to Server
- `start_tracking` - Start location tracking for a trip
- `stop_tracking` - Stop location tracking
- `location_update` - Send location updates
- `join_admin_room` - Join admin monitoring
- `leave_admin_room` - Leave admin monitoring

### Server to Client
- `location_update` - Receive location updates
- `trip_started` - Trip started notification
- `trip_stopped` - Trip stopped notification
- `employee_location` - Employee location update (admin)
- `employee_trip_update` - Employee trip update (admin)

## Permissions Required

### Android
- `ACCESS_FINE_LOCATION` - For GPS location tracking
- `ACCESS_COARSE_LOCATION` - For approximate location

### iOS
- Location permission (When in Use)
- Motion permission (for background location if needed)

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   - Check Firebase configuration in `src/config/firebase.js`
   - Ensure Email/Password provider is enabled in Firebase Console
   - Verify API keys are correct

2. **API Connection Error**
   - Check if backend server is running
   - Verify API_URL in .env file
   - Check CORS configuration on backend

3. **Location Permission Denied**
   - Enable location permissions in device settings
   - Check if location services are enabled
   - For Android, ensure permissions are granted in app settings

4. **Socket.io Connection Failed**
   - Check if backend Socket.io server is running
   - Verify socket URL configuration
   - Check network connectivity

5. **Build Errors**
   - Clear Expo cache: `npx expo start -c`
   - Reset node_modules: `rm -rf node_modules && npm install`
   - Check for dependency conflicts

### Debug Mode

Enable debug mode by adding to your `.env`:
```env
EXPO_PUBLIC_DEBUG=true
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Verify backend API is working correctly
3. Ensure Firebase configuration is correct
4. Check Expo and React Native documentation

## License

This project is part of the Digital Tracker employee location tracking system.
