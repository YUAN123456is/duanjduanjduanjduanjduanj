import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProgressState {
  watchHistory: Record<string, { lastEpisode: number; position: number }>; // dramaId -> progress
}

interface DramaContextType extends ProgressState {
  updateProgress: (dramaId: string, episode: number, position: number) => Promise<void>;
}

const DramaContext = createContext<DramaContextType | null>(null);

export function DramaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>({
    watchHistory: {},
  });

  useEffect(() => {
    AsyncStorage.getItem("drama_state").then((data) => {
      if (data) {
        setState(JSON.parse(data));
      }
    });
  }, []);

  const saveState = async (newState: ProgressState) => {
    setState(newState);
    await AsyncStorage.setItem("drama_state", JSON.stringify(newState));
  };

  const updateProgress = async (dramaId: string, episode: number, position: number) => {
    const newState = {
      ...state,
      watchHistory: {
        ...state.watchHistory,
        [dramaId]: { lastEpisode: episode, position },
      },
    };
    await saveState(newState);
  };

  return (
    <DramaContext.Provider value={{ ...state, updateProgress }}>
      {children}
    </DramaContext.Provider>
  );
}

export const useDrama = () => {
  const context = useContext(DramaContext);
  if (!context) throw new Error("useDrama must be used within a DramaProvider");
  return context;
};
