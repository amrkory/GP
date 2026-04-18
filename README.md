# Wateen Healthcare — Angular 17 Web App

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
ng serve
# → http://localhost:4200

# 3. Build for production
ng build --configuration production
```

## Install missing package (SignalR)
```bash
npm install @microsoft/signalr
```

## Project Structure

```
src/app/
├── core/
│   ├── guards/         auth, role, no-auth, profile-completed
│   ├── interceptors/   jwt (auto-attaches Bearer token + silent refresh)
│   ├── models/         role.enum.ts, api.models.ts
│   └── services/       auth, patient, doctor, admin, appointment,
│                       signalr, notification
├── features/
│   ├── auth/           login, register, forgot-password, onboarding
│   ├── patient/        dashboard, appointments, vitals, checklist,
│   │                   prescriptions, records, nutrition, home-service,
│   │                   family, chat, profile
│   ├── doctor/         dashboard, patients, prescriptions, checklist,
│   │                   appointments, chat, schedule, profile
│   ├── service-provider/ dashboard, requests, visits, profile
│   └── admin/          dashboard, doctors, patients, providers, categories
└── shared/             (extend as needed)
```

## Role-Based Routing

| JWT Role       | Lands on              | Route prefix  |
|----------------|-----------------------|---------------|
| `Patient`      | `/patient/dashboard`  | `/patient/`   |
| `Doctor`       | `/doctor/dashboard`   | `/doctor/`    |
| `HomeService`  | `/provider/dashboard` | `/provider/`  |
| `Admin`        | `/admin/dashboard`    | `/admin/`     |

## Environment Config

Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production:    false,
  apiUrl:        'http://localhost:5000/api',   // your .NET 8 API
  socketUrl:     'http://localhost:5000',        // your SignalR hub
  calendlyApiKey: 'YOUR_CALENDLY_TOKEN',
};
```

## Backend Expectations (.NET 8)

- JWT token must include claims: `sub`, `email`, `role`, `given_name`, `family_name`, `profileCompleted`
- SignalR hub at: `/hubs/wateen`
- All API responses wrapped as: `{ success, data, message, errors }`
