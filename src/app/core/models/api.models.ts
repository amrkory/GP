import { Role } from './role.enum';

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string;
  errors:  string[];
}

export interface PagedResult<T> {
  items:      T[];
  totalCount: number;
  pageNumber: number;
  pageSize:   number;
  totalPages: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest  { email: string; password: string; }
export interface AuthResponse  { accessToken: string; refreshToken: string; }

export interface TokenPayload {
  sub:              string;
  email:            string;
  role:             Role;
  given_name:       string;
  family_name:      string;
  profileCompleted: boolean;
  exp:              number;
  iat:              number;
}

// ── Profiles ─────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string; firstName: string; lastName: string;
  email: string; phone: string; avatarUrl: string | null; role: Role; createdAt: string;
}

export interface PatientProfile extends UserProfile {
  dateOfBirth: string; gender: 'Male' | 'Female';
  bloodType: string | null; weight: number | null; height: number | null;
  chronicDiseases: string[]; allergies: string[];
}

export interface DoctorProfile extends UserProfile {
  specialtyId: string; specialtyName: string; clinicName: string;
  licenseNumber: string; bio: string | null; rating: number;
  reviewCount: number; yearsExperience: number;
  profileCompleted: boolean; calendlyEventUrl: string | null;
   consultationFee?: number;
}

export interface ProviderProfile extends UserProfile {
  serviceType: string; bio: string | null; rating: number; reviewCount: number;
}

// ── Appointments ──────────────────────────────────────────────────────────────
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled';
export type AppointmentType   = 'InPerson' | 'Video' | 'HomeVisit';

export interface Appointment {
  id: string; patientId: string; patientName: string;
  doctorId: string; doctorName: string; specialtyName: string;
  scheduledAt: string; durationMinutes: number;
  type: AppointmentType; status: AppointmentStatus;
  meetingLink: string | null; notes: string | null; cancellationReason: string | null;
}

export interface BookAppointmentRequest {
  doctorId: string; scheduledAt: string; type: AppointmentType;
  notes?: string; calendlyEventUri?: string;
}

export interface TimeSlot {
  startTime: string; endTime: string; available: boolean; calendlyUri: string | null;
}

// ── Vitals ────────────────────────────────────────────────────────────────────
export type VitalType = 'BloodPressure' | 'HeartRate' | 'BloodGlucose' | 'Temperature' | 'OxygenSaturation' | 'Weight' | 'Height';

export interface VitalReading {
  id: string; type: VitalType; value: string; unit: string; recordedAt: string; note: string | null;
}

export interface AddVitalRequest { type: VitalType; value: string; unit: string; note?: string; }

// ── Checklist ─────────────────────────────────────────────────────────────────
export type TaskStatus    = 'Pending' | 'Completed' | 'Skipped';
export type TaskFrequency = 'Once' | 'Daily' | 'Weekly';

export interface ChecklistTask {
  id: string; title: string; description: string | null;
  frequency: TaskFrequency; dueDate: string | null;
  status: TaskStatus; completedAt: string | null; note: string | null;
}

export interface Checklist {
  id: string; title: string; patientId: string;
  doctorId: string; doctorName: string; createdAt: string;
  tasks: ChecklistTask[]; adherence: number;
}

// ── Prescriptions ─────────────────────────────────────────────────────────────
export interface Medicine {
  id: string; name: string; dosage: string;
  frequency: string; duration: string; instructions: string | null;
}

export interface Prescription {
  id: string; patientId: string; doctorId: string; doctorName: string;
  diagnosis: string; medicines: Medicine[]; notes: string | null;
  issuedAt: string; validUntil: string | null;
}

// ── Medical Records ───────────────────────────────────────────────────────────
export type RecordType = 'LabResult' | 'Imaging' | 'Report' | 'Vaccination' | 'Other';

export interface MedicalRecord {
  id: string; title: string; type: RecordType;
  fileUrl: string; fileSize: number; uploadedAt: string; uploadedBy: string;
}

// ── Family Members ────────────────────────────────────────────────────────────
export interface FamilyMember {
  id: string; firstName: string; lastName: string;
  relation: string; dateOfBirth: string;
  gender: 'Male' | 'Female'; phone: string | null;
}

// ── Home Service ──────────────────────────────────────────────────────────────
export type ServiceRequestStatus = 'Pending' | 'Accepted' | 'InProgress' | 'Completed' | 'Rejected';

export interface ServiceRequest {
  id: string; patientId: string; patientName: string; patientAddress: string;
  serviceType: string; scheduledAt: string; status: ServiceRequestStatus;
  notes: string | null; providerId: string | null; providerName: string | null;
}

export interface VisitReport {
  id: string; requestId: string; providerId: string;
  bloodPressure: string | null; heartRate: number | null;
  temperature: number | null; oxygenSaturation: number | null;
  notes: string; visitedAt: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType =
  'AppointmentReminder' | 'AppointmentConfirmed' | 'AppointmentCancelled' |
  'NewMessage' | 'ChecklistAssigned' | 'PrescriptionIssued' | 'VitalAlert' | 'ServiceRequestUpdate';

export interface Notification {
  id: string; type: NotificationType; title: string;
  body: string; isRead: boolean; createdAt: string; actionUrl: string | null;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string; senderId: string; senderName: string;
  receiverId: string; body: string; sentAt: string;
  isRead: boolean; attachmentUrl: string | null;
}

export interface ChatConversation {
  participantId: string; participantName: string;
  participantAvatar: string | null; lastMessage: string;
  lastMessageAt: string; unreadCount: number;
}

// ── AI ────────────────────────────────────────────────────────────────────────
export interface AiChatRequest  { message: string; conversationId?: string; }
export interface AiChatResponse { reply: string; conversationId: string; disclaimer: string; }

export interface FoodRecognitionResult {
  topPredictions: { label: string; confidence: number; calories: number; }[];
  totalCalories: number; nutritionAdvice: string;
}

export interface SymptomCheckResult {
  possibleConditions: { name: string; probability: number; }[];
  recommendedSpecialty: string;
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  disclaimer: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export type DoctorApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AdminDoctorRecord extends DoctorProfile {
  approvalStatus: DoctorApprovalStatus; appliedAt: string;
  reviewedAt: string | null; reviewedBy: string | null;
}

export interface DashboardStats {
  totalPatients: number; totalDoctors: number; totalAppointments: number;
  pendingDoctors: number; pendingProviders: number; appointmentsToday: number;
}
