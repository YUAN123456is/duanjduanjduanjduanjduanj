import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_DRAMAS } from "../data/mock";

interface ProgressState {
  unlockedEpisodes: Record<string, number[]>; // dramaId -> array of unlocked episode numbers
  watchHistory: Record<string, { lastEpisode: number; position: number }>; // dramaId -> progress
  adCounter: { date: string; count: number };
}

interface DramaContextType extends ProgressState {
  unlockEpisode: (dramaId: string, episodes: number[]) => Promise<void>;
  updateProgress: (dramaId: string, episode: number, position: number) => Promise<void>;
  incrementAdCounter: () => Promise<boolean>;
  getIsUnlocked: (dramaId: string, episodeNumber: number) => boolean;
}

const DramaContext = createContext<DramaContextType | null>(null);

export function DramaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>({
    unlockedEpisodes: {},
    watchHistory: {},
    adCounter: { date: new Date().toISOString().split("T")[0], count: 0 },
  });

  useEffect(() => {
    AsyncStorage.getItem("drama_state").then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        const today = new Date().toISOString().split("T")[0];
        if (parsed.adCounter?.date !== today) {
          parsed.adCounter = { date: today, count: 0 };
        }
        setState(parsed);
      }
    });
  }, []);

  const saveState = async (newState: ProgressState) => {
    setState(newState);
    await AsyncStorage.setItem("drama_state", JSON.stringify(newState));
  };

  const unlockEpisode = async (dramaId: string, episodes: number[]) => {
    const current = state.unlockedEpisodes[dramaId] || [];
    const newState = {
      ...state,
      unlockedEpisodes: {
        ...state.unlockedEpisodes,
        [dramaId]: Array.from(new Set([...current, ...episodes])),
      },
    };
    await saveState(newState);
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

  const incrementAdCounter = async () => {
    const today = new Date().toISOString().split("T")[0];
    let { date, count } = state.adCounter;
    if (date !== today) {
      count = 0;
      date = today;
    }
    if (count >= 10) return false; // maxDailyAdUnlocks = 10
    
    const newState = {
      ...state,
      adCounter: { date, count: count + 1 },
    };
    await saveState(newState);
    return true;
  };

  const getIsUnlocked = (dramaId: string, episodeNumber: number) => {
    const drama = MOCK_DRAMAS.find((d) => d.dramaId === dramaId);
    if (!drama) return false;
    if (episodeNumber <= drama.monetizationRules.freeEpisodesCount) return true;
    return (state.unlockedEpisodes[dramaId] || []).includes(episodeNumber);
  };

  return (
    <DramaContext.Provider value={{ ...state, unlockEpisode, updateProgress, incrementAdCounter, getIsUnlocked }}>
      {children}
    </DramaContext.Provider>
  );
}

export const useDrama = () => {
  const context = useContext(DramaContext);
  if (!context) throw new Error("useDrama must be used within a DramaProvider");
  return context;
};
