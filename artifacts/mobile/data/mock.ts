export interface DramaMonetizationRules {
  freeEpisodesCount: number;
  episodesPerAdUnlock: number;
  interstitialAdFreq: number;
}

export interface EpisodeItem {
  episodeNumber: number;
  title?: string;
  videoUrl: string;
  isUnlocked: boolean; // Note: In UI we usually compute this, but keeping it per spec
}

export interface DramaDetail {
  dramaId: string;
  title: string;
  coverUrl: string;
  description: string;
  tags: string[];
  monetizationRules: DramaMonetizationRules;
  episodes: EpisodeItem[];
}

export interface GlobalConfig {
  globalAdEnabled: boolean;
  maxDailyAdUnlocks: number;
}

const SAMPLE_VIDEO_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const generateEpisodes = (count: number): EpisodeItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    episodeNumber: i + 1,
    title: `Episode ${i + 1}`,
    videoUrl: SAMPLE_VIDEO_URL,
    isUnlocked: false,
  }));
};

export const MOCK_DRAMAS: DramaDetail[] = [
  {
    dramaId: "d1",
    title: "The Billionaire's Secret Heir",
    coverUrl: "https://images.unsplash.com/photo-1574607407408-1e681c46041d?w=400&h=600&fit=crop",
    description: "A secret baby, a ruthless billionaire, and a second chance at love.",
    tags: ["Romance", "Billionaire", "CEO"],
    monetizationRules: { freeEpisodesCount: 3, episodesPerAdUnlock: 3, interstitialAdFreq: 5 },
    episodes: generateEpisodes(15),
  },
  {
    dramaId: "d2",
    title: "Alpha's Rejected Mate",
    coverUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&h=600&fit=crop",
    description: "She was rejected by her fated mate, only to discover her true power.",
    tags: ["Werewolf", "Romance", "Fantasy"],
    monetizationRules: { freeEpisodesCount: 5, episodesPerAdUnlock: 5, interstitialAdFreq: 3 },
    episodes: generateEpisodes(20),
  },
  {
    dramaId: "d3",
    title: "Sweet Revenge on the CEO",
    coverUrl: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=400&h=600&fit=crop",
    description: "Betrayed by her fiancé, she teams up with his rival.",
    tags: ["Revenge", "CEO", "Romance"],
    monetizationRules: { freeEpisodesCount: 4, episodesPerAdUnlock: 4, interstitialAdFreq: 4 },
    episodes: generateEpisodes(18),
  },
  {
    dramaId: "d4",
    title: "Contract Marriage with the Devil",
    coverUrl: "https://images.unsplash.com/photo-1580130281320-0ef0754f2bf7?w=400&h=600&fit=crop",
    description: "A fake marriage turns dangerously real.",
    tags: ["CEO", "Romance"],
    monetizationRules: { freeEpisodesCount: 3, episodesPerAdUnlock: 3, interstitialAdFreq: 5 },
    episodes: generateEpisodes(16),
  },
  {
    dramaId: "d5",
    title: "Return of the True Luna",
    coverUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=600&fit=crop",
    description: "Exiled and forgotten, she returns to claim her pack.",
    tags: ["Werewolf", "Revenge"],
    monetizationRules: { freeEpisodesCount: 5, episodesPerAdUnlock: 5, interstitialAdFreq: 3 },
    episodes: generateEpisodes(15),
  },
];

export const MOCK_GLOBAL_CONFIG: GlobalConfig = {
  globalAdEnabled: true,
  maxDailyAdUnlocks: 10,
};
