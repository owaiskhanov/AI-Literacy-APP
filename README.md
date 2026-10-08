# AI Literacy 🚀📱

A modern, delightfully animated mobile onboarding & authentication experience built with **React Native** and **Expo SDK 57**.

Featuring Apple "hello"-style cursive stroke animations, debossed typography, fantasy artwork, and seamless Google OAuth 2.0 sign-in.

---

## ✨ Features

- **🔐 Google OAuth 2.0 Sign-In**: Native-like Google authentication via `expo-auth-session` and `expo-web-browser` with automatic user profile retrieval (name, email, avatar).
- **✍️ Apple "hello"-Style Handwriting Animation**: Vector stroke-draw and progressive fill-fade for cursive text powered by Sacramento monoline script and `react-native-svg`.
- **🎨 Debossed Visual Aesthetics**: Realistic sunlit stone deboss text effect with subtle specular highlights.
- **📱 Fully Responsive**: Fluid percentage-based layout engineered to look pixel-perfect across modern iPhone (Dynamic Island), Android, and tablet screens.
- **⚡ Expo SDK 57 & React Native 0.86**: Latest native architecture with React 19 support.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev/) (React Native 0.86)
- **UI & Graphics**: [react-native-svg](https://github.com/software-mansion/react-native-svg)
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) & [Sacramento](https://fonts.google.com/specimen/Sacramento)
- **Authentication**: `expo-auth-session`, `expo-web-browser`, `expo-crypto`
- **Build & CI/CD**: Expo Application Services ([EAS Build](https://docs.expo.dev/build/introduction/))

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/owaiskhanov/AI-Literacy-APP.git
cd AI-Literacy-APP
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npx expo start
```

- Press **`w`** to open in your web browser.
- Scan the QR code with **Expo Go** on iOS or Android.

---

## 📦 Building for Production

### Android (Google Play Store `.aab`):
```bash
eas build --platform android --profile production
```

### iOS (App Store):
```bash
eas build --platform ios --profile production
```

---

## 📄 License

MIT © [owaiskhanov](https://github.com/owaiskhanov)
