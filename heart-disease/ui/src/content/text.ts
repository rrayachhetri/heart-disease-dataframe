/**
 * text.ts — Central UI text content registry.
 *
 * All user-visible strings live here.  Components import via:
 *   import { TEXT } from '../content/text';
 *   // or the typed accessor:
 *   import { getTextContent } from '../content/text';
 *   const t = getTextContent('login');
 */

export const TEXT = {
  app: {
    name: 'CardioSense',
    tagline: 'Heart Disease Risk Assessment',
  },

  nav: {
    dashboard: 'Dashboard',
    newPrediction: 'New Prediction',
    predictionResult: 'Prediction Result',
    history: 'History',
    doctorProfile: 'Doctor Profile',
    myProfile: 'My Profile',
    modelInsights: 'Model Insights',
  },

  header: {
    toggleMenuAria: 'Toggle menu',
    searchPlaceholder: 'Search history by risk, date, or %\u2026',
    searchEmpty: 'No matching records found',
    searchFooter: 'View all history \u2192',
    highRisk: 'High Risk',
    lowRisk: 'Low Risk',
    riskSuffix: '% risk',
    markAllRead: 'Mark all as read',
    markAsRead: 'Mark as read',
    clearAll: 'Clear all',
    close: 'Close',
    noNotifications: 'No notifications yet',
    changeAvatar: 'Change photo',
    removeAvatar: 'Remove photo',
    signOut: 'Sign out',
    viewProfile: 'View profile',
    adminBadge: 'Admin',
    doctorBadge: 'Doctor',
    patientBadge: 'Patient',
  },

  sidebar: {
    logoText: 'CardioSense',
    closeSidebarAria: 'Close sidebar',
    expandSidebarAria: 'Expand sidebar',
    collapseSidebarAria: 'Collapse sidebar',
  },

  notifications: {
    panelTitle: 'Notifications',
    markAllReadTitle: 'Mark all as read',
    clearAllTitle: 'Clear all',
    closeTitle: 'Close',
    emptyMessage: 'No notifications yet',
  },

  session: {
    warningBannerAria: 'Session expiring soon',
    warningTitle: 'Your session is about to expire',
    warningSubPrefix: 'You will be signed out automatically in\u00a0',
    warningSubSuffix: '\u00a0due to inactivity.',
    stayLoggedIn: 'Stay logged in',
    signOutNow: 'Sign out now',
  },

  sessionTimeout: {
    heading: 'Session expired',
    protectionNote: '10 minutes of inactivity',
    infoText:
      'Any unsaved predictions have been preserved in your local history. Sign back in to access your full prediction record.',
    signInBtn: 'Sign in again',
    footnote:
      'CardioSense enforces session timeouts to comply with clinical data security best practices.',
  },

  kpiCard: {
    viewDetails: 'View details',
  },

  riskGauge: {
    subtext: 'Risk Score',
  },

  dashboard: {
    welcomeBack: 'Welcome back,',
    overviewDoctor:
      "Here\u2019s an overview of your patients\u2019 heart disease risk assessments.",
    overviewPatient:
      "Here\u2019s an overview of your heart disease risk assessments.",
    newPrediction: 'New Prediction',
    totalPredictions: 'Total Predictions',
    totalPredictionsSubtitle: 'All time assessments',
    averageRisk: 'Average Risk',
    averageRiskSubtitle: 'Mean probability score',
    highRiskCases: 'High Risk Cases',
    highRiskCasesSubtitle: 'Prediction = 1',
    lowRiskCases: 'Low Risk Cases',
    lowRiskCasesSubtitle: 'Prediction = 0',
    viewAllHistory: 'View all history',
    viewAssessments: 'View assessments',
    reviewCases: 'Review cases',
    viewCases: 'View cases',
    riskDistribution: 'Risk Distribution',
    recentRiskTrend: 'Recent Risk Trend',
    legendHighRisk: 'High Risk',
    legendLowRisk: 'Low Risk',
    noPredictionsHeading: 'No predictions yet',
    noPredictionsText:
      'Start by creating your first heart disease risk assessment.',
    getStarted: 'Get Started',
    trainingDataTitle: 'Training Data \u2014 Population Cohorts',
    trainingDataSubtitle: (count: number) =>
      `Model trained on ${count} patients across 4 UCI Heart Disease research datasets \u2014 click a cohort to explore`,
    diseaseRateLabel: 'Disease rate',
    avgAge: 'Avg age:',
    avgChol: 'Avg chol:',
    roleLabels: { doctor: 'Doctor', admin: 'Admin', patient: 'Patient' } as Record<
      string,
      string
    >,
  },

  modelInsights: {
    heading: 'Model Insights',
    subheading:
      'Training data, population cohorts, and performance metrics for the underlying ML system.',
    loading: 'Loading model insights\u2026',
  },

  emergency: {
    heading: 'Having a medical emergency?',
    body:
      'Chest pain, shortness of breath, fainting, or other severe symptoms need immediate attention. Don\u2019t wait \u2014 call emergency services now.',
    callBtn: 'Call 911',
    callBtnAria: 'Call emergency services at 911',
  },

  nearbyHospitals: {
    heading: 'Nearby Hospitals',
    subheading: 'Find emergency and urgent care near you',
    findBtn: 'Find hospitals near me',
    finding: 'Finding your location\u2026',
    searching: 'Searching nearby hospitals\u2026',
    permissionDenied:
      'Location access was denied. You can still search for hospitals manually.',
    locationError: 'Couldn\u2019t determine your location. Please try again.',
    searchError: 'Couldn\u2019t load nearby hospitals right now.',
    noResults: 'No hospitals found nearby. Try the manual search instead.',
    manualSearchLink: 'Search \u201chospitals near me\u201d on Google Maps',
    directionsLabel: (name: string) => `Get directions to ${name}`,
    directionsBtn: 'Directions',
    distanceAway: (km: number) => `${km.toFixed(1)} km away`,
  },

  healthTrends: {
    heading: 'Health Trends',
    subheading: 'Based on your prediction history',
    empty: 'Add at least two predictions to see how your vitals are trending.',
    cholesterolLabel: 'Cholesterol',
    bloodPressureLabel: 'Blood Pressure',
    heartRateLabel: 'Max Heart Rate',
    improvingTag: 'Improving',
    worseningTag: 'Needs attention',
    stableTag: 'Stable',
    latestVsFirst: (latest: number, first: number) =>
      `${latest} now vs ${first} at first assessment`,
  },

  login: {
    heading: 'Welcome back',
    subheading: 'Sign in to CardioSense',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
    submitLoading: 'Signing in\u2026',
    submitLabel: 'Sign in',
    forgotText: 'Forgot your password?',
    forgotLink: 'Reset it',
    footerText: "Don\u2019t have an account?",
    footerLink: 'Create one',
  },

  forgotPassword: {
    heading: 'Forgot your password?',
    subheading: 'Confirm your details and we\u2019ll generate a reset link',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'Jane',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Doe',
    submitLoading: 'Sending\u2026',
    submitLabel: 'Send reset link',
    devTokenNote: 'Dev mode (no email service configured) \u2014 use this link to reset your password:',
    footerText: 'Remembered your password?',
    footerLink: 'Sign in',
  },

  resetPassword: {
    heading: 'Reset your password',
    subheading: 'Choose a new password for your account',
    tokenLabel: 'Reset token',
    tokenPlaceholder: 'Paste the reset token from your email',
    passwordLabel: 'New password',
    passwordPlaceholder: 'Min. 8 characters',
    submitLoading: 'Resetting\u2026',
    submitLabel: 'Reset password',
    successMessage: 'Password reset successful. You can now sign in.',
    footerText: 'Remembered your password?',
    footerLink: 'Sign in',
  },

  register: {
    heading: 'Create your account',
    subheading: 'Join CardioSense today',
    patientRole: 'Patient',
    doctorRole: 'Doctor',
    firstNameLabel: 'First name',
    lastNameLabel: 'Last name',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    firstNamePlaceholder: 'Jane',
    lastNamePlaceholder: 'Doe',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Min. 8 characters',
    submitLoading: 'Creating account\u2026',
    submitLabel: 'Create account',
    footerText: 'Already have an account?',
    footerLink: 'Sign in',
  },

  predict: {
    pageTitle: 'Patient Risk Assessment',
    pageSubtitle: 'Enter patient clinical data to predict heart disease risk.',
    sectionPersonal: 'Personal Information',
    sectionSymptoms: 'Symptoms \u0026 Pain',
    sectionVitals: 'Vitals \u0026 Lab Results',
    sectionCardio: 'Cardiovascular Data',
    validationError: 'Please fix the errors in the form.',
    resetBtn: 'Reset Form',
    submitLoading: 'Analyzing...',
    submitLabel: 'Predict Risk',
    notificationHighTitle: 'High Risk Detected',
    notificationLowTitle: 'Low Risk Result',
    notificationHighMsg: (pct: number) =>
      `Patient risk score: ${pct}%. Recommend follow-up consultation.`,
    notificationLowMsg: (pct: number) =>
      `Patient risk score: ${pct}%. No immediate concern.`,
    submitSuccess: 'Prediction complete!',
    submitError: 'Failed to get prediction. Is the API running?',
  },

  result: {
    highRiskTitle: 'Higher Risk Detected',
    lowRiskTitle: 'Lower Risk Detected',
    highRiskDesc:
      'Elevated cardiovascular risk \u2014 a follow-up with a cardiologist is recommended.',
    lowRiskDesc:
      'Lower cardiovascular risk detected \u2014 continue monitoring and maintaining healthy habits.',
    riskScore: 'Risk Score',
    patientDataSummary: 'Patient Data Summary',
    whyThisScore: 'Why This Score?',
    whySubtitle:
      'Top features influencing this prediction. Click a row to see a plain-English explanation.',
    compareSectionTitle: 'How Do You Compare?',
    scoreLabelLow: 'Low',
    scoreLabelModerate: 'Moderate',
    scoreLabelHigh: 'High',
    riskBadgeLow: 'Low Risk',
    riskBadgeModerate: 'Moderate Risk',
    riskBadgeHigh: 'High Risk',
    emptyHeading: 'No prediction result',
    emptyText: 'Submit a prediction first to see results here.',
    emptyBtn: 'Go to Prediction',
    copyBtn: 'Copy result',
    copiedBtn: 'Copied!',
    backBtn: 'Back',
  },

  history: {
    pageTitle: 'Prediction History',
    emptyHeading: 'No predictions yet',
    emptyText: 'Complete a risk assessment to see your history here.',
    clearAllBtn: 'Clear all',
    confirmClear: 'Clear all prediction history?',
    modalTitle: 'Assessment Details',
    clinicalParams: 'Clinical Parameters',
    whyThisScore: 'Why This Score?',
    whyHint: 'Click a row for a plain-English explanation.',
    compareSection: 'How Do You Compare?',
    riskHigh:
      'Elevated cardiovascular risk detected. Medical consultation recommended.',
    riskLow: 'No significant cardiovascular risk detected at this time.',
    scoreLabelLow: 'Low',
    scoreLabelModerate: 'Moderate',
    scoreLabelHigh: 'High',
    copyBtn: 'Copy',
    copiedBtn: '\u2713 Copied',
    closeAria: 'Close',
    copySummaryTitle: 'Copy summary',
  },

  doctorProfile: {
    pageTitle: 'Doctor Profile',
    pageSubtitle:
      'Complete your profile so patients can find and connect with you.',
    verifiedBadge: 'NPI Verified',
    npiLabel: 'NPI Number',
    npiPlaceholder: '10-digit NPI',
    npiHint:
      'Phase 1: entering NPI auto-verifies. Phase 2 will use real NPI registry.',
    specialtyLabel: 'Specialty',
    specialtyPlaceholder: 'e.g. Cardiology',
    phoneLabel: 'Phone',
    phonePlaceholder: '+1 555 000 0000',
    feeLabel: 'Consultation Fee (USD)',
    insuranceLabel: 'Accepted Insurance Plans (comma-separated)',
    insurancePlaceholder: 'BlueCross, Aetna, UnitedHealth',
    bioLabel: 'Bio',
    bioPlaceholder: 'Brief professional background\u2026',
    acceptingPatients: 'Accepting new patients',
    savingLabel: 'Saving\u2026',
    savedLabel: '\u2713 Saved!',
    saveLabel: 'Save profile',
    doctorOnly: 'This page is only available to doctors.',
    saveError: (status: number) => `Save failed (${status}). Please try again.`,
  },

  systemUnavailable: {
    reasons: {
      api_down: {
        title: 'API server is unreachable',
        detail:
          'The CardioSense prediction service is not responding. This is usually a temporary outage \u2014 our team is automatically alerted.',
      },
      model_not_loaded: {
        title: 'Prediction model unavailable',
        detail:
          'The ML model failed to load at startup. A server restart is likely in progress \u2014 predictions will be available again shortly.',
      },
      network: {
        title: 'No network connection',
        detail:
          'Your device appears to be offline. Please check your internet connection and try again.',
      },
    } as Record<string, { title: string; detail: string }>,
  },
} as const;

export type TextSection = keyof typeof TEXT;

/**
 * Type-safe accessor for a text section.
 *
 * @example
 *   const t = getTextContent('login');
 *   <button>{t.submitLabel}</button>
 */
export function getTextContent<K extends TextSection>(
  section: K,
): (typeof TEXT)[K] {
  return TEXT[section];
}
