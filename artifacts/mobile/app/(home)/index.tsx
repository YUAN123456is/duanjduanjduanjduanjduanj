import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { MOCK_DRAMAS } from "@/data/mock";
import { useDrama } from "@/context/DramaContext";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

const CATEGORIES = ["All", "Romance", "Werewolf", "Revenge", "CEO"];

export default function Home() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const { watchHistory } = useDrama();

  const filtered = activeCategory === "All" 
    ? MOCK_DRAMAS 
    : MOCK_DRAMAS.filter(d => d.tags.includes(activeCategory));

  const historyDramas = Object.keys(watchHistory).map(id => {
    return { drama: MOCK_DRAMAS.find(d => d.dramaId === id), history: watchHistory[id] };
  }).filter(h => h.drama);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.logo}>DramaVerse</Text>
        <Pressable onPress={() => router.push("/profile")} hitSlop={12}>
          <FontAwesome5 name="user-circle" size={24} color={colors.dark.foreground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {historyDramas.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
              {historyDramas.map(({ drama, history }) => (
                <Pressable 
                  key={drama!.dramaId} 
                  style={styles.historyCard}
                  onPress={() => router.push({ pathname: "/player", params: { dramaId: drama!.dramaId, initialEpisode: history.lastEpisode } })}
                >
                  <Image source={{ uri: typeof drama!.coverUrl === "string" ? drama!.coverUrl : "" }} style={styles.historyPoster} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{drama!.title}</Text>
                    <Text style={styles.historyEp}>EP {history.lastEpisode}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.categories}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map(cat => (
              <Pressable 
                key={cat} 
                style={[styles.catBadge, activeCategory === cat && styles.catBadgeActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.grid}>
          {filtered.map(drama => (
            <Pressable 
              key={drama.dramaId} 
              style={styles.card}
              onPress={() => router.push({ pathname: "/player", params: { dramaId: drama.dramaId, initialEpisode: 1 } })}
            >
              <Image source={{ uri: typeof drama.coverUrl === "string" ? drama.coverUrl : "" }} style={styles.poster} />
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>Free EP 1-{drama.monetizationRules.freeEpisodesCount}</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{drama.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dark.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  logo: { fontSize: 24, fontWeight: "bold", color: colors.dark.primary },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.dark.foreground, marginLeft: 16, marginBottom: 12 },
  historySection: { paddingVertical: 12 },
  historyScroll: { paddingHorizontal: 16, gap: 12 },
  historyCard: { width: 140, borderRadius: 8, overflow: "hidden", backgroundColor: colors.dark.card },
  historyPoster: { width: "100%", aspectRatio: 16/9, backgroundColor: colors.dark.muted },
  historyInfo: { padding: 8 },
  historyTitle: { color: colors.dark.foreground, fontSize: 12, fontWeight: "600" },
  historyEp: { color: colors.dark.secondaryForeground, fontSize: 10, marginTop: 4 },
  categories: { paddingVertical: 8 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.dark.secondary },
  catBadgeActive: { backgroundColor: colors.dark.primary },
  catText: { color: colors.dark.secondaryForeground, fontWeight: "600" },
  catTextActive: { color: colors.dark.primaryForeground },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 8 },
  card: { width: "50%", padding: 8 },
  poster: { width: "100%", aspectRatio: 3/4, borderRadius: 8, backgroundColor: colors.dark.card },
  freeBadge: { position: "absolute", top: 16, right: 16, backgroundColor: colors.dark.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freeText: { color: colors.dark.accentForeground, fontSize: 10, fontWeight: "bold" },
  title: { color: colors.dark.foreground, fontSize: 14, fontWeight: "600", marginTop: 8 },
});
