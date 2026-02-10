import { useLoader } from "@/hooks/useLoader";
import { auth } from "@/service/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, ReactNode, useEffect, useState, useRef } from "react";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  locked: boolean; // whether the app is locked awaiting biometric unlock
  requireBiometric: boolean; // whether biometric unlock is enabled
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  promptBiometrics: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  locked: false,
  requireBiometric: false,
  enableBiometrics: async () => false,
  disableBiometrics: async () => {},
  promptBiometrics: async () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useLoader();
  const [user, setUser] = useState<User | null>(null);
  const [locked, setLocked] = useState(false);
  const [requireBiometric, setRequireBiometric] = useState(false);
  // Only run the initial biometric prompt once per app session
  const initialPromptRunRef = useRef(false);
  // Remember whether there was a signed-in user when the provider mounted
  const wasSignedInOnMountRef = useRef<boolean>(false);

  useEffect(() => {
    // load biometric preference
    (async () => {
      try {
        const val = await SecureStore.getItemAsync('biometric_enabled');
        setRequireBiometric(val === 'true');
      } catch (e) {
        console.error('Failed to read biometric_enabled', e);
        setRequireBiometric(false);
      }
    })();

    // capture whether user was already signed in at mount (persisted session)
    wasSignedInOnMountRef.current = !!auth.currentUser;

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // when we have a user and biometrics are enabled, require unlock
    // but only auto-prompt once per app session (avoid prompting repeatedly after login/navigation)
    (async () => {
      if (!user || !requireBiometric) {
        setLocked(false);
        return;
      }

      // don't auto-prompt while the app is showing a global loading overlay
      if (isLoading) {
        return;
      }

      // only auto-prompt if the user was already signed in when the app loaded
      if (!wasSignedInOnMountRef.current) {
        return;
      }

      if (initialPromptRunRef.current) {
        // don't auto-prompt again in this session
        return;
      }

      initialPromptRunRef.current = true;
      setLocked(true);
      const result = await promptBiometrics();
      if (result) setLocked(false);
      else {
        // keep locked; optionally you could sign out the user here
        setLocked(true);
      }
    })();
  }, [user, requireBiometric, isLoading]);

  const promptBiometrics = async (): Promise<boolean> => {
    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return false;
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Study Zone',
        fallbackLabel: 'Use device passcode',
      });
      // update locked state so callers (LockScreen) get immediate UI response
      if (res.success) setLocked(false);
      else setLocked(true);
      return res.success;
    } catch (err) {
      console.error('promptBiometrics error', err);
      setLocked(true);
      return false;
    }
  };

  const enableBiometrics = async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) return false;
      // require a biometric check now to confirm setup
      const ok = await promptBiometrics();
      if (!ok) return false;
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setRequireBiometric(true);
      return true;
    } catch (err) {
      console.error('enableBiometrics error', err);
      return false;
    }
  };

  const disableBiometrics = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('biometric_credentials');
    } catch (err) {
      console.error('disableBiometrics error', err);
    }
    setRequireBiometric(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        locked,
        requireBiometric,
        enableBiometrics,
        disableBiometrics,
        promptBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
