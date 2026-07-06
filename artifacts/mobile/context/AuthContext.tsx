import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  hasCompletedOnboarding: boolean;
  attChoice: "allow" | "ask_not_to_track" | null;
  provider: "apple" | "google" | "guest" | null;
}

interface AuthContextType extends AuthState {
  completeOnboarding: (attChoice: "allow" | "ask_not_to_track") => Promise<void>;
  signIn: (provider: "apple" | "google" | "guest") => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    hasCompletedOnboarding: false,
    attChoice: null,
    provider: null,
  });
  const [isLoading, setIsLoading] = useState(true);

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
    await saveState({ ...state, provider });
  };

  const signOut = async () => {
    await AsyncStorage.clear();
    setState({
      hasCompletedOnboarding: false,
      attChoice: null,
      provider: null,
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
