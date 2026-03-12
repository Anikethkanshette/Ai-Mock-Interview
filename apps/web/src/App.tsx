import { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { InterviewDashboard } from './components/InterviewDashboard';
import { LandingPage } from './components/LandingPage';
import { ProfilePage } from './components/ProfilePage';
import { getCurrentSessionUser } from './services/auth';
import type { UserProfile } from './types/auth';
import type { ResumeScanResult } from './types/interview';

type GuestView = 'landing' | 'auth';
type AuthMode = 'login' | 'register';
type AuthenticatedView = 'dashboard' | 'profile';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentSessionUser());
  const [guestView, setGuestView] = useState<GuestView>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authenticatedView, setAuthenticatedView] = useState<AuthenticatedView>('dashboard');
  const [latestResumeScan, setLatestResumeScan] = useState<ResumeScanResult | null>(null);

  function handleAuthenticated(user: UserProfile) {
    setCurrentUser(user);
    setAuthenticatedView('dashboard');
  }

  function handleLogout() {
    setCurrentUser(null);
    setAuthenticatedView('dashboard');
  }

  if (currentUser) {
    if (authenticatedView === 'profile') {
      return (
        <ProfilePage
          user={currentUser}
          latestResumeScan={latestResumeScan}
          onBackToDashboard={() => setAuthenticatedView('dashboard')}
          onUserUpdated={setCurrentUser}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <InterviewDashboard
        user={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setAuthenticatedView('profile')}
        onResumeScanned={setLatestResumeScan}
      />
    );
  }

  if (guestView === 'landing') {
    return (
      <LandingPage
        onLogin={() => {
          setAuthMode('login');
          setGuestView('auth');
        }}
        onRegister={() => {
          setAuthMode('register');
          setGuestView('auth');
        }}
      />
    );
  }

  return (
    <AuthPage
      initialMode={authMode}
      onBack={() => setGuestView('landing')}
      onAuthenticated={handleAuthenticated}
    />
  );
}
