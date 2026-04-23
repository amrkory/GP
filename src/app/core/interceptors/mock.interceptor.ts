// ─────────────────────────────────────────────────────────────────────────────
//  MOCK HTTP INTERCEPTOR
//  Drop this file into:  src/app/core/interceptors/mock.interceptor.ts
//  Wire it in app.module.ts  (see instructions at bottom of this file)
//  Remove when backend is ready — just swap back to jwt.interceptor.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable }                    from '@angular/core';
import { HttpInterceptor, HttpRequest,
         HttpHandler, HttpEvent,
         HttpResponse }                  from '@angular/common/http';
import { Observable, of }                from 'rxjs';
import { delay }                         from 'rxjs/operators';

// ── Fake data store ───────────────────────────────────────────────────────────
const FAKE = {

  // ── Patient profile ────────────────────────────────────────────────────────
  patientProfile: {
    id: 'p-001', firstName: 'Ahmed', lastName: 'Ali',
    email: 'patient@test.com', phone: '01554258827',
    avatarUrl: null, role: 'Patient',
    dateOfBirth: '1995-06-15', gender: 'Male',
    bloodType: 'O+', weight: 75, height: 175,
    chronicDiseases: ['Diabetes Type 2'], allergies: ['Penicillin'],
    createdAt: '2024-01-10T10:00:00Z',
  },

  // ── Doctor profile ─────────────────────────────────────────────────────────
  doctorProfile: {
    id: 'd-001', firstName: 'Sara', lastName: 'Hassan',
    email: 'doctor@test.com', phone: '01012345678',
    avatarUrl: null, role: 'Doctor',
    specialtyId: 'sp-001', specialtyName: 'Cardiologist',
    clinicName: 'Cairo Heart Center', licenseNumber: 'LIC-2024-001',
    bio: 'Experienced cardiologist with 10+ years in cardiac care.',
    rating: 4.8, reviewCount: 156, yearsExperience: 10,
    profileCompleted: true, calendlyEventUrl: null,
    createdAt: '2023-06-01T08:00:00Z',
  },

  // ── Doctors list for booking ───────────────────────────────────────────────
  doctors: [
    { id: 'd-001', firstName: 'Sara',   lastName: 'Hassan',  specialtyName: 'Cardiologist',      rating: 4.8, reviewCount: 156, clinicName: 'Cairo Heart Center',    fee: 300, avatarUrl: null },
    { id: 'd-002', firstName: 'Khaled', lastName: 'Nour',    specialtyName: 'Dermatologist',     rating: 4.6, reviewCount: 98,  clinicName: 'Nour Skin Clinic',      fee: 250, avatarUrl: null },
    { id: 'd-003', firstName: 'Mona',   lastName: 'Farouk',  specialtyName: 'Pediatrician',      rating: 4.9, reviewCount: 230, clinicName: 'Kids Care Hospital',    fee: 200, avatarUrl: null },
    { id: 'd-004', firstName: 'Omar',   lastName: 'Sharif',  specialtyName: 'Orthopedic Surgeon',rating: 4.7, reviewCount: 112, clinicName: 'Sharif Bone & Joint',   fee: 400, avatarUrl: null },
    { id: 'd-005', firstName: 'Layla',  lastName: 'Ibrahim', specialtyName: 'Neurologist',       rating: 4.5, reviewCount: 88,  clinicName: 'Brain & Spine Center',  fee: 350, avatarUrl: null },
    { id: 'd-006', firstName: 'Hassan', lastName: 'Mahmoud', specialtyName: 'General Practitioner', rating: 4.4, reviewCount: 200, clinicName: 'Family Care Clinic', fee: 150, avatarUrl: null },
  ],

  // ── Available slots ────────────────────────────────────────────────────────
  slots: [
    { startTime: '2026-04-24T09:00:00', endTime: '2026-04-24T09:30:00', available: true,  calendlyUri: null },
    { startTime: '2026-04-24T09:30:00', endTime: '2026-04-24T10:00:00', available: false, calendlyUri: null },
    { startTime: '2026-04-24T10:00:00', endTime: '2026-04-24T10:30:00', available: true,  calendlyUri: null },
    { startTime: '2026-04-24T11:00:00', endTime: '2026-04-24T11:30:00', available: true,  calendlyUri: null },
    { startTime: '2026-04-24T14:00:00', endTime: '2026-04-24T14:30:00', available: true,  calendlyUri: null },
    { startTime: '2026-04-24T15:00:00', endTime: '2026-04-24T15:30:00', available: true,  calendlyUri: null },
  ],

  // ── Appointments ───────────────────────────────────────────────────────────
  appointments: [
    {
      id: 'a-001', patientId: 'p-001', patientName: 'Ahmed Ali',
      doctorId: 'd-001', doctorName: 'Dr. Sara Hassan', specialtyName: 'Cardiologist',
      scheduledAt: '2026-04-25T10:00:00', durationMinutes: 30,
      type: 'InPerson', status: 'Confirmed',
      meetingLink: null, notes: 'Follow-up visit', cancellationReason: null,
    },
    {
      id: 'a-002', patientId: 'p-001', patientName: 'Ahmed Ali',
      doctorId: 'd-003', doctorName: 'Dr. Mona Farouk', specialtyName: 'Pediatrician',
      scheduledAt: '2026-04-28T14:00:00', durationMinutes: 30,
      type: 'Video', status: 'Pending',
      meetingLink: 'https://meet.google.com/fake-link', notes: null, cancellationReason: null,
    },
    {
      id: 'a-003', patientId: 'p-001', patientName: 'Ahmed Ali',
      doctorId: 'd-002', doctorName: 'Dr. Khaled Nour', specialtyName: 'Dermatologist',
      scheduledAt: '2026-03-10T09:30:00', durationMinutes: 30,
      type: 'InPerson', status: 'Completed',
      meetingLink: null, notes: null, cancellationReason: null,
    },
  ],

  // ── Vitals ─────────────────────────────────────────────────────────────────
  vitals: [
    { id: 'v-001', type: 'BloodPressure',    value: '120/80', unit: 'mmHg',  recordedAt: '2026-04-23T08:00:00', note: 'Morning reading' },
    { id: 'v-002', type: 'HeartRate',        value: '72',     unit: 'bpm',   recordedAt: '2026-04-23T08:00:00', note: null },
    { id: 'v-003', type: 'BloodGlucose',     value: '95',     unit: 'mg/dL', recordedAt: '2026-04-22T07:30:00', note: 'Fasting' },
    { id: 'v-004', type: 'Temperature',      value: '36.8',   unit: '°C',    recordedAt: '2026-04-21T09:00:00', note: null },
    { id: 'v-005', type: 'OxygenSaturation', value: '98',     unit: '%',     recordedAt: '2026-04-21T09:00:00', note: null },
    { id: 'v-006', type: 'Weight',           value: '75',     unit: 'kg',    recordedAt: '2026-04-20T07:00:00', note: null },
    { id: 'v-007', type: 'BloodPressure',    value: '118/76', unit: 'mmHg',  recordedAt: '2026-04-19T08:00:00', note: null },
    { id: 'v-008', type: 'BloodGlucose',     value: '102',    unit: 'mg/dL', recordedAt: '2026-04-18T07:00:00', note: 'After breakfast' },
  ],

  // ── Checklists ─────────────────────────────────────────────────────────────
  checklists: [
    {
      id: 'cl-001', title: 'Diabetes Management Plan', patientId: 'p-001',
      doctorId: 'd-001', doctorName: 'Dr. Sara Hassan',
      createdAt: '2026-04-01T10:00:00', adherence: 75,
      tasks: [
        { id: 't-001', title: 'Check blood sugar before breakfast', description: 'Record fasting glucose level', frequency: 'Daily', dueDate: null, status: 'Completed', completedAt: '2026-04-23T07:30:00', note: '95 mg/dL' },
        { id: 't-002', title: 'Take Metformin 500mg', description: 'Take after breakfast', frequency: 'Daily', dueDate: null, status: 'Completed', completedAt: '2026-04-23T08:15:00', note: null },
        { id: 't-003', title: '30-min walk', description: 'Light exercise after dinner', frequency: 'Daily', dueDate: null, status: 'Pending', completedAt: null, note: null },
        { id: 't-004', title: 'Weekly weight check', description: 'Record weight every Saturday', frequency: 'Weekly', dueDate: '2026-04-26', status: 'Pending', completedAt: null, note: null },
      ],
    },
  ],

  // ── Prescriptions ──────────────────────────────────────────────────────────
  prescriptions: [
    {
      id: 'rx-001', patientId: 'p-001', doctorId: 'd-001',
      doctorName: 'Dr. Sara Hassan', diagnosis: 'Type 2 Diabetes Mellitus',
      issuedAt: '2026-04-01T10:00:00', validUntil: '2026-07-01',
      notes: 'Follow diet plan. Reduce sugar intake.',
      medicines: [
        { id: 'm-001', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '3 months', instructions: 'Take after meals' },
        { id: 'm-002', name: 'Aspirin', dosage: '100mg', frequency: 'Once daily', duration: '3 months', instructions: 'Take in the morning' },
      ],
    },
    {
      id: 'rx-002', patientId: 'p-001', doctorId: 'd-002',
      doctorName: 'Dr. Khaled Nour', diagnosis: 'Mild Dermatitis',
      issuedAt: '2026-03-10T09:30:00', validUntil: '2026-04-10',
      notes: 'Avoid sun exposure.',
      medicines: [
        { id: 'm-003', name: 'Hydrocortisone Cream', dosage: '1%', frequency: 'Twice daily', duration: '2 weeks', instructions: 'Apply thin layer to affected area' },
      ],
    },
  ],

  // ── Medical Records ────────────────────────────────────────────────────────
  records: [
    { id: 'r-001', title: 'HbA1c Test Result', type: 'LabResult',   fileUrl: '#', fileSize: 245760,  uploadedAt: '2026-04-01T10:00:00', uploadedBy: 'Ahmed Ali' },
    { id: 'r-002', title: 'Chest X-Ray',        type: 'Imaging',    fileUrl: '#', fileSize: 1048576, uploadedAt: '2026-03-15T11:00:00', uploadedBy: 'Ahmed Ali' },
    { id: 'r-003', title: 'CBC Blood Test',      type: 'LabResult',  fileUrl: '#', fileSize: 153600,  uploadedAt: '2026-02-20T09:00:00', uploadedBy: 'Ahmed Ali' },
  ],

  // ── Family Members ─────────────────────────────────────────────────────────
  family: [
    { id: 'f-001', firstName: 'Fatma',   lastName: 'Ali',     relation: 'Mother', dateOfBirth: '1965-03-20', gender: 'Female', phone: '01098765432' },
    { id: 'f-002', firstName: 'Mohamed', lastName: 'Ali',     relation: 'Father', dateOfBirth: '1962-07-10', gender: 'Male',   phone: '01187654321' },
    { id: 'f-003', firstName: 'Nour',    lastName: 'Ali',     relation: 'Sister', dateOfBirth: '1998-11-05', gender: 'Female', phone: null },
  ],

  // ── Home service requests ──────────────────────────────────────────────────
  serviceRequests: [
    {
      id: 'sr-001', patientId: 'p-001', patientName: 'Ahmed Ali',
      patientAddress: '15 Tahrir St, Cairo', serviceType: 'Nursing',
      scheduledAt: '2026-04-25T09:00:00', status: 'Accepted',
      notes: 'Daily dressing change', providerId: 'prov-001', providerName: 'Fatma Mohamed',
    },
  ],

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: [
    { id: 'n-001', type: 'AppointmentConfirmed', title: 'Appointment Confirmed', body: 'Your appointment with Dr. Sara Hassan on Apr 25 is confirmed.', isRead: false, createdAt: '2026-04-23T09:00:00', actionUrl: '/patient/appointments/a-001' },
    { id: 'n-002', type: 'ChecklistAssigned',    title: 'New Checklist Assigned', body: 'Dr. Sara Hassan assigned you a new diabetes management checklist.', isRead: false, createdAt: '2026-04-22T14:00:00', actionUrl: '/patient/checklist' },
    { id: 'n-003', type: 'PrescriptionIssued',   title: 'New Prescription',       body: 'Dr. Sara Hassan issued a new prescription for you.', isRead: true, createdAt: '2026-04-20T10:00:00', actionUrl: '/patient/prescriptions' },
  ],

  // ── Doctor: my patients ────────────────────────────────────────────────────
  doctorPatients: [
    { id: 'p-001', firstName: 'Ahmed',  lastName: 'Ali',     email: 'patient@test.com', phone: '01554258827', avatarUrl: null, role: 'Patient', dateOfBirth: '1995-06-15', gender: 'Male', bloodType: 'O+', weight: 75, height: 175, chronicDiseases: ['Diabetes'], allergies: ['Penicillin'], createdAt: '2024-01-10' },
    { id: 'p-002', firstName: 'Nadia',  lastName: 'Samir',   email: 'nadia@test.com',   phone: '01234567890', avatarUrl: null, role: 'Patient', dateOfBirth: '1988-09-22', gender: 'Female', bloodType: 'A+', weight: 60, height: 162, chronicDiseases: ['Hypertension'], allergies: [], createdAt: '2024-02-15' },
    { id: 'p-003', firstName: 'Tarek',  lastName: 'Fouad',   email: 'tarek@test.com',   phone: '01099887766', avatarUrl: null, role: 'Patient', dateOfBirth: '1975-01-30', gender: 'Male', bloodType: 'B+', weight: 88, height: 178, chronicDiseases: [], allergies: ['Sulfa'], createdAt: '2024-03-05' },
    { id: 'p-004', firstName: 'Heba',   lastName: 'Kamal',   email: 'heba@test.com',    phone: '01155443322', avatarUrl: null, role: 'Patient', dateOfBirth: '2000-12-01', gender: 'Female', bloodType: 'AB-', weight: 55, height: 158, chronicDiseases: [], allergies: [], createdAt: '2024-04-01' },
  ],

  // ── Admin stats ────────────────────────────────────────────────────────────
  adminStats: {
    totalPatients: 1248, totalDoctors: 86, totalAppointments: 3540,
    pendingDoctors: 12, pendingProviders: 5, appointmentsToday: 47,
  },

  // ── Admin doctor list ──────────────────────────────────────────────────────
  adminDoctors: [
    { id: 'd-007', firstName: 'Mostafa', lastName: 'Saeed', email: 'mostafa@test.com', phone: '01066778899', avatarUrl: null, role: 'Doctor', specialtyId: 'sp-002', specialtyName: 'Cardiologist', clinicName: 'Al Salam Hospital', licenseNumber: 'LIC-2024-007', bio: null, rating: 0, reviewCount: 0, yearsExperience: 5, profileCompleted: true, calendlyEventUrl: null, createdAt: '2026-04-20', approvalStatus: 'Pending', appliedAt: '2026-04-20T10:00:00', reviewedAt: null, reviewedBy: null },
    { id: 'd-008', firstName: 'Rania',   lastName: 'Lotfy',  email: 'rania@test.com',   phone: '01077889900', avatarUrl: null, role: 'Doctor', specialtyId: 'sp-003', specialtyName: 'Neurologist',   clinicName: 'Brain Clinic',      licenseNumber: 'LIC-2024-008', bio: null, rating: 0, reviewCount: 0, yearsExperience: 3, profileCompleted: true, calendlyEventUrl: null, createdAt: '2026-04-21', approvalStatus: 'Pending', appliedAt: '2026-04-21T11:00:00', reviewedAt: null, reviewedBy: null },
    { id: 'd-001', firstName: 'Sara',    lastName: 'Hassan', email: 'doctor@test.com',  phone: '01012345678', avatarUrl: null, role: 'Doctor', specialtyId: 'sp-001', specialtyName: 'Cardiologist',  clinicName: 'Cairo Heart Center', licenseNumber: 'LIC-2024-001', bio: null, rating: 4.8, reviewCount: 156, yearsExperience: 10, profileCompleted: true, calendlyEventUrl: null, createdAt: '2023-06-01', approvalStatus: 'Approved', appliedAt: '2023-06-01T08:00:00', reviewedAt: '2023-06-02T09:00:00', reviewedBy: 'Admin' },
  ],
};

// ── URL matching helpers ──────────────────────────────────────────────────────
function match(url: string, ...patterns: string[]): boolean {
  return patterns.some(p => url.includes(p));
}

function ok(data: any, delay_ms = 400): Observable<HttpResponse<any>> {
  return of(new HttpResponse({
    status: 200,
    body: { success: true, data, message: 'OK', errors: [] },
  })).pipe(delay(delay_ms));
}

function paged(items: any[], delay_ms = 400): Observable<HttpResponse<any>> {
  return of(new HttpResponse({
    status: 200,
    body: {
      success: true,
      data: { items, totalCount: items.length, pageNumber: 1, pageSize: 50, totalPages: 1 },
      message: 'OK', errors: [],
    },
  })).pipe(delay(delay_ms));
}

@Injectable()
export class MockInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url    = req.url;
    const method = req.method;

    // ── Skip auth endpoints (handled by MockAuthService) ──────────────────
    if (match(url, '/auth/')) return next.handle(req);

    // ── PATIENT endpoints ─────────────────────────────────────────────────
    if (match(url, '/patients/me/vitals'))      return method === 'POST' ? ok({ ...req.body, id: 'v-new', recordedAt: new Date().toISOString() }) : ok(FAKE.vitals);
    if (match(url, '/patients/me/checklists'))  return ok(FAKE.checklists);
    if (match(url, '/patients/me/prescriptions')) return ok(FAKE.prescriptions);
    if (match(url, '/patients/me/records'))     return paged(FAKE.records);
    if (match(url, '/patients/me/family'))      return method === 'POST' ? ok({ ...req.body, id: 'f-new' }) : ok(FAKE.family);
    if (match(url, '/patients/me'))             return method === 'PUT'  ? ok({ ...FAKE.patientProfile, ...req.body }) : ok(FAKE.patientProfile);

    // ── HOME SERVICE endpoints ────────────────────────────────────────────
    if (match(url, '/home-service/requests'))   return method === 'POST' ? ok({ ...req.body, id: 'sr-new', status: 'Pending' }) : ok(FAKE.serviceRequests);

    // ── DOCTOR endpoints ──────────────────────────────────────────────────
    if (match(url, '/doctors/') && match(url, '/slots')) return ok(FAKE.slots);
    if (match(url, '/doctors'))                 return paged(FAKE.doctors);
    if (match(url, '/doctor/profile'))          return method === 'PUT' ? ok({ ...FAKE.doctorProfile, ...req.body }) : ok(FAKE.doctorProfile);
    if (match(url, '/doctor/patients/') && match(url, '/vitals'))       return ok(FAKE.vitals);
    if (match(url, '/doctor/patients/') && match(url, '/prescriptions')) return ok(FAKE.prescriptions);
    if (match(url, '/doctor/patients/') && match(url, '/checklists'))   return ok(FAKE.checklists);
    if (match(url, '/doctor/patients/'))        return ok(FAKE.doctorPatients[0]);
    if (match(url, '/doctor/patients'))         return paged(FAKE.doctorPatients);
    if (match(url, '/doctor/prescriptions'))    return ok({ ...req.body, id: 'rx-new', issuedAt: new Date().toISOString() });
    if (match(url, '/doctor/checklists'))       return ok({ ...req.body, id: 'cl-new', createdAt: new Date().toISOString() });
    if (match(url, '/doctor/appointments'))     return ok(FAKE.appointments);
    if (match(url, '/doctor/schedule'))         return ok({ calendlyEventUrl: 'https://calendly.com/mock' });

    // ── APPOINTMENTS ──────────────────────────────────────────────────────
    if (match(url, '/appointments') && method === 'POST') return ok({ ...req.body, id: 'a-new', status: 'Confirmed', meetingLink: null });
    if (match(url, '/appointments/') && match(url, '/cancel'))     return ok({ ...FAKE.appointments[0], status: 'Cancelled' });
    if (match(url, '/appointments/') && match(url, '/reschedule')) return ok({ ...FAKE.appointments[0], status: 'Rescheduled' });
    if (match(url, '/appointments/'))           return ok(FAKE.appointments[0]);
    if (match(url, '/appointments'))            return ok(FAKE.appointments);

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────
    if (match(url, '/notifications') && match(url, '/read-all')) return ok(null, 200);
    if (match(url, '/notifications/') && method === 'PUT')       return ok(null, 200);
    if (match(url, '/notifications'))           return paged(FAKE.notifications);

    // ── AI endpoints ──────────────────────────────────────────────────────
    if (match(url, '/ai/chat'))             return ok({ reply: 'Based on your symptoms, I recommend consulting a cardiologist. Please note this is not a medical diagnosis.', conversationId: 'conv-001', disclaimer: 'This AI is for guidance only.' });
    if (match(url, '/ai/food-recognize'))   return ok({ topPredictions: [{ label: 'Koshary', confidence: 0.92, calories: 480 }, { label: 'Ful', confidence: 0.05, calories: 200 }], totalCalories: 480, nutritionAdvice: 'Koshary is high in carbohydrates. Consider smaller portions.' });
    if (match(url, '/ai/symptom-check'))    return ok({ possibleConditions: [{ name: 'Common Cold', probability: 0.75 }, { name: 'Flu', probability: 0.20 }], recommendedSpecialty: 'General Practitioner', urgencyLevel: 'Low', disclaimer: 'AI guidance only — not a substitute for medical advice.' });

    // ── ADMIN endpoints ───────────────────────────────────────────────────
    if (match(url, '/admin/stats'))                         return ok(FAKE.adminStats);
    if (match(url, '/admin/doctors/') && match(url, '/approve')) return ok({ ...FAKE.adminDoctors[0], approvalStatus: 'Approved' });
    if (match(url, '/admin/doctors/') && match(url, '/reject'))  return ok({ ...FAKE.adminDoctors[0], approvalStatus: 'Rejected' });
    if (match(url, '/admin/doctors'))                       return paged(FAKE.adminDoctors);
    if (match(url, '/admin/patients'))                      return paged(FAKE.doctorPatients);
    if (match(url, '/admin/providers') && match(url, '/approve')) return ok(null);
    if (match(url, '/admin/providers'))                     return paged([]);
    if (match(url, '/admin/users/') && method === 'DELETE') return ok(null);

    // ── PROVIDER endpoints ────────────────────────────────────────────────
    if (match(url, '/home-service/requests/mine')) return ok(FAKE.serviceRequests);
    if (match(url, '/home-service/requests/') && method === 'PUT') return ok({ ...FAKE.serviceRequests[0], ...req.body });
    if (match(url, '/home-service/visits'))       return ok({ id: 'vr-new', ...req.body, visitedAt: new Date().toISOString() });

    // ── Fallback: pass through anything not matched ───────────────────────
    console.warn('[MockInterceptor] Unmatched URL:', method, url);
    return next.handle(req);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOW TO WIRE IN app.module.ts
//  Replace the JWT interceptor with the mock one:
//
//  import { MockInterceptor } from './core/interceptors/mock.interceptor';
//
//  providers: [
//    { provide: HTTP_INTERCEPTORS, useClass: MockInterceptor, multi: true },
//  ]
//
//  When backend is ready, swap back to:
//  import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
//  { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
// ─────────────────────────────────────────────────────────────────────────────
