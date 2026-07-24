"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

import { User, onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { UserService } from "@/services/user.service";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  provider: string;

  university: string | null;
  semester: string | null;
  branch: string | null;

  onboardingCompleted: boolean;

  createdAt?: unknown;
  updatedAt?: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const data = await UserService.getProfile(uid);

      if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;

    await loadProfile(auth.currentUser.uid);
  }, [loadProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);

        if (!firebaseUser) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(firebaseUser);

        await loadProfile(firebaseUser.uid);

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
    }),
    [user, profile, loading, refreshProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}