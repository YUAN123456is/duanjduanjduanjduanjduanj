import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Image, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useListDramas, getListDramasQueryKey } from "@workspace/api-client-react";
import colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data: dramas, isLoading, isFetching } = useListDramas(
    { publishedOnly: true, search: submittedQuery || undefined },
    { query: { queryKey: getListDramasQueryKey({ publishedOnly: true, search: submittedQuery || undefined }) } },
  );

  const hasSearched = submittedQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <FontAwesome5 name="chevron-left" solid size={20} color={colors.dark.foreground} />
        </Pressable>
        <View style={styles.inputWrap}>
          <FontAwesome5 name="search" solid size={14} color={colors.dark.secondaryForeground} />
          <TextInput
            style={styles.input}
            placeholder="Search dramas..."
            placeholderTextColor={colors.dark.secondaryForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmittedQuery(query)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setSubmittedQuery(""); }} hitSlop={8}>
              <FontAwesome5 name="times-circle" solid size={16} color={colors.dark.secondaryForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && isFetching && hasSearched ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.dark.primary} size="large" />
        </View>
      ) : !hasSearched ? (
        <View style={styles.centered}>
          <FontAwesome5 name="search" solid size={40} color={colors.dark.secondary} />
          <Text style={styles.hintText}>Search by drama title</Text>
        </View>
      ) : (dramas ?? []).length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome5 name="frown" regular size={40} color={colors.dark.secondary} />
          <Text style={styles.hintText}>No results for "{submittedQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={dramas}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: "/player", params: { dramaId: item.id, initialEpisode: 1 } })}
            >
              <Image source={{ uri: item.coverUrl }} style={styles.poster} />
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>Free EP 1-{item.freeEpisodesCount}</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.titleEn}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dark.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, gap: 8 },
  backButton: { padding: 8 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1, color: colors.dark.foreground, fontSize: 15, padding: 0 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  hintText: { color: colors.dark.secondaryForeground, fontSize: 14 },
  grid: { padding: 8 },
  card: { width: "50%", padding: 8 },
  poster: { width: "100%", aspectRatio: 3 / 4, borderRadius: 8, backgroundColor: colors.dark.card },
  freeBadge: { position: "absolute", top: 16, right: 16, backgroundColor: colors.dark.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freeText: { color: colors.dark.accentForeground, fontSize: 10, fontWeight: "bold" },
  title: { color: colors.dark.foreground, fontSize: 14, fontWeight: "600", marginTop: 8 },
});
