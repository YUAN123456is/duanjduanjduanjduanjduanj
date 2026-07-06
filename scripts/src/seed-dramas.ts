import { db, dramasTable, episodesTable, globalConfigTable } from "@workspace/db";

const SAMPLE_VIDEO_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const DRAMAS = [
  {
    titleEn: "The Billionaire's Secret Heir",
    coverUrl: "https://images.unsplash.com/photo-1574607407408-1e681c46041d?w=400&h=600&fit=crop",
    description: "A secret baby, a ruthless billionaire, and a second chance at love.",
    tags: ["Romance", "Billionaire", "CEO"],
    freeEpisodesCount: 3,
    episodesPerAdUnlock: 3,
    interstitialAdFreq: 5,
    episodeCount: 15,
  },
  {
    titleEn: "Alpha's Rejected Mate",
    coverUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&h=600&fit=crop",
    description: "She was rejected by her fated mate, only to discover her true power.",
    tags: ["Werewolf", "Romance", "Fantasy"],
    freeEpisodesCount: 5,
    episodesPerAdUnlock: 5,
    interstitialAdFreq: 3,
    episodeCount: 20,
  },
  {
    titleEn: "Sweet Revenge on the CEO",
    coverUrl: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=400&h=600&fit=crop",
    description: "Betrayed by her fiance, she teams up with his rival.",
    tags: ["Revenge", "CEO", "Romance"],
    freeEpisodesCount: 4,
    episodesPerAdUnlock: 4,
    interstitialAdFreq: 4,
    episodeCount: 18,
  },
  {
    titleEn: "Contract Marriage with the Devil",
    coverUrl: "https://images.unsplash.com/photo-1580130281320-0ef0754f2bf7?w=400&h=600&fit=crop",
    description: "A fake marriage turns dangerously real.",
    tags: ["CEO", "Romance"],
    freeEpisodesCount: 3,
    episodesPerAdUnlock: 3,
    interstitialAdFreq: 5,
    episodeCount: 16,
  },
  {
    titleEn: "Return of the True Luna",
    coverUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=600&fit=crop",
    description: "Exiled and forgotten, she returns to claim her pack.",
    tags: ["Werewolf", "Revenge"],
    freeEpisodesCount: 5,
    episodesPerAdUnlock: 5,
    interstitialAdFreq: 3,
    episodeCount: 15,
  },
];

async function main() {
  console.log("Seeding global config...");
  const [existingConfig] = await db.select().from(globalConfigTable);
  if (!existingConfig) {
    await db.insert(globalConfigTable).values({ id: 1 });
  }

  console.log("Seeding dramas...");
  const existingDramas = await db.select().from(dramasTable);
  if (existingDramas.length > 0) {
    console.log(`Found ${existingDramas.length} existing dramas, skipping seed.`);
    process.exit(0);
  }

  for (const drama of DRAMAS) {
    const [created] = await db
      .insert(dramasTable)
      .values({
        titleEn: drama.titleEn,
        coverUrl: drama.coverUrl,
        description: drama.description,
        tags: drama.tags,
        freeEpisodesCount: drama.freeEpisodesCount,
        episodesPerAdUnlock: drama.episodesPerAdUnlock,
        interstitialAdFreq: drama.interstitialAdFreq,
        isPublished: true,
      })
      .returning();

    const episodeValues = Array.from({ length: drama.episodeCount }, (_, i) => ({
      dramaId: created.id,
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      videoUrl: SAMPLE_VIDEO_URL,
      duration: 60,
    }));

    await db.insert(episodesTable).values(episodeValues);
    console.log(`Seeded "${drama.titleEn}" with ${drama.episodeCount} episodes`);
  }

  console.log("Done seeding.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
