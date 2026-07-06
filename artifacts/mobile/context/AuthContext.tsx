import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRegisterUser } from "@workspace/api-client-react";

interface AuthState {
  hasCompletedOnboarding: boolean;
  attChoice: "allow" | "ask_not_to_track" | null;
  provider: "apple" | "google" | "guest" | null;
  userId: string | null;
}

interface AuthContextType extends AuthState {
  completeOnboarding: (attChoice: "allow" | "ask_not_to_track") => Promise<void>;
  signIn: (provider: "apple" | "google" | "guest") => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const generateDeviceId = () => `dev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    hasCompletedOnboarding: false,
    attChoice: null,
    provider: null,
    userId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const registerUser = useRegisterUser();

  useEffect(() => {
    AsyncStorage.getItem("auth_state").then((data) => {
      if (data) {
        setState(JSON.parse(data));
      }
      setIsLoading(false);
    });
  }, []);

  const saveState = async (newState: AuthState) => {
    setState(newState);
    await AsyncStorage.setItem("auth_state", JSON.stringify(newState));
  };

  const completeOnboarding = async (attChoice: "allow" | "ask_not_to_track") => {
    await saveState({ ...state, hasCompletedOnboarding: true, attChoice });
  };

  const signIn = async (provider: "apple" | "google" | "guest") => {
    let deviceId = await AsyncStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem("device_id", deviceId);
    }

    const user = await registerUser.mutateAsync({ data: { deviceId, authProvider: provider } });
    await saveState({ ...state, provider, userId: user.id });
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(["auth_state", "drama_state", "device_id"]);
    setState({
      hasCompletedOnboarding: false,
      attChoice: null,
      provider: null,
      userId: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, completeOnboarding, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
