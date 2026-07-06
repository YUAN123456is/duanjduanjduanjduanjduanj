import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Pressable, FlatList, 
  Dimensions, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FontAwesome5 } from '@expo/vector-icons';
import { useDrama } from '@/context/DramaContext';
import { MOCK_DRAMAS } from '@/data/mock';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

import AdWallModal from '@/components/AdWallModal';
import EpisodeDrawer from '@/components/EpisodeDrawer';
import ReportSheet from '@/components/ReportSheet';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

const SingleVideo = ({ 
  url, isActive, isUnlocked, onNeedAd 
}: { 
  url: string, isActive: boolean, isUnlocked: boolean, onNeedAd: () => void 
}) => {
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    if (isActive && isUnlocked) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive && isUnlocked) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isUnlocked, player]);

  // Handle ad wall timer if locked
  useEffect(() => {
    if (isActive && !isUnlocked) {
      const timer = setTimeout(() => {
        player.pause();
        onNeedAd();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isUnlocked]);

  return (
    <View style={styles.videoContainer}>
      <VideoView 
        player={player} 
        style={styles.video} 
        nativeControls={false}
        contentFit="cover"
      />
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <ActivityIndicator color={colors.dark.primary} size="large" />
          <Text style={styles.lockedText}>Preview playing...</Text>
        </View>
      )}
    </View>
  );
};

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dramaId = params.dramaId as string;
  const initialEpisode = parseInt((params.initialEpisode as string) || "1", 10);

  const drama = MOCK_DRAMAS.find(d => d.dramaId === dramaId);
  const { getIsUnlocked, unlockEpisode, updateProgress } = useDrama();

  const [currentIndex, setCurrentIndex] = useState(initialEpisode - 1);
  const [showAdWall, setShowAdWall] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [likes, setLikes] = useState<Record<number, boolean>>({});

  if (!drama) return <View style={styles.container}><Text style={styles.errorText}>Drama not found</Text></View>;

  const currentEp = drama.episodes[currentIndex];
  const isUnlocked = getIsUnlocked(drama.dramaId, currentEp.episodeNumber);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikes(prev => ({ ...prev, [currentEp.episodeNumber]: !prev[currentEp.episodeNumber] }));
  };

  const handleAdSuccess = () => {
    const start = currentEp.episodeNumber;
    const end = Math.min(start + drama.monetizationRules.episodesPerAdUnlock - 1, drama.episodes.length);
    const epsToUnlock = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    unlockEpisode(drama.dramaId, epsToUnlock);
    setShowAdWall(false);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      updateProgress(drama.dramaId, drama.episodes[newIndex].episodeNumber, 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const flatListRef = useRef<FlatList>(null);

  const navigateToEpisode = (epNumber: number, isUnl: boolean) => {
    setShowDrawer(false);
    const index = epNumber - 1;
    flatListRef.current?.scrollToIndex({ index, animated: false });
    if (!isUnl) {
      setShowAdWall(true);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={drama.episodes}
        keyExtractor={item => item.episodeNumber.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({ length: WINDOW_HEIGHT, offset: WINDOW_HEIGHT * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        maxToRenderPerBatch={3}
        renderItem={({ item, index }) => (
          <View style={{ height: WINDOW_HEIGHT, width: WINDOW_WIDTH }}>
            <SingleVideo 
              url={item.videoUrl} 
              isActive={index === currentIndex} 
              isUnlocked={getIsUnlocked(drama.dramaId, item.episodeNumber)}
              onNeedAd={() => setShowAdWall(true)}
            />
          </View>
        )}
      />

      {/* Top Bar Overlay */}
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconButton}>
          <FontAwesome5 name="chevron-left" size={20} color={colors.dark.foreground} />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable style={styles.iconButton}>
            <FontAwesome5 name="search" size={20} color={colors.dark.foreground} />
          </Pressable>
          <Pressable style={styles.rewardButton} onPress={() => setShowAdWall(true)}>
            <FontAwesome5 name="gift" size={16} color={colors.dark.accent} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Right Action Rail Overlay */}
      <View style={styles.actionRail}>
        <Pressable style={styles.actionItem} onPress={handleLike}>
          <FontAwesome5 name="heart" solid={likes[currentEp.episodeNumber]} size={28} color={likes[currentEp.episodeNumber] ? colors.dark.primary : colors.dark.foreground} />
          <Text style={styles.actionText}>Like</Text>
        </Pressable>
        <Pressable style={styles.actionItem}>
          <FontAwesome5 name="bookmark" size={28} color={colors.dark.foreground} />
          <Text style={styles.actionText}>Save</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => setShowDrawer(true)}>
          <FontAwesome5 name="list-ul" size={28} color={colors.dark.foreground} />
          <Text style={styles.actionText}>Episodes</Text>
        </Pressable>
        <Pressable style={styles.actionItem}>
          <FontAwesome5 name="share" size={28} color={colors.dark.foreground} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={() => setShowReport(true)}>
          <FontAwesome5 name="flag" size={24} color={colors.dark.secondaryForeground} />
        </Pressable>
      </View>

      {/* Bottom Info Overlay */}
      <SafeAreaView style={styles.bottomInfo} pointerEvents="none">
        <View style={styles.badgeRow}>
          {isUnlocked ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Unlocked</Text>
            </View>
          ) : (
            <View style={[styles.freeBadge, { backgroundColor: colors.dark.muted }]}>
              <Text style={styles.freeText}>Preview</Text>
            </View>
          )}
        </View>
        <Text style={styles.titleText}>{drama.title}</Text>
        <Text style={styles.epText}>Episode {currentEp.episodeNumber} / {drama.episodes.length}</Text>
        
        {/* Fake Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '30%' }]} />
        </View>
      </SafeAreaView>

      <AdWallModal 
        visible={showAdWall} 
        onClose={() => {
          setShowAdWall(false);
          if (!isUnlocked) router.back();
        }}
        onSuccess={handleAdSuccess}
        dramaId={drama.dramaId}
        episode={currentEp.episodeNumber}
        episodesPerAdUnlock={drama.monetizationRules.episodesPerAdUnlock}
      />

      <EpisodeDrawer 
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        dramaId={drama.dramaId}
        currentEpisode={currentEp.episodeNumber}
        onSelectEpisode={navigateToEpisode}
      />

      <ReportSheet 
        visible={showReport}
        onClose={() => setShowReport(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    color: colors.dark.foreground,
    marginTop: 12,
    fontWeight: '600',
  },
  errorText: {
    color: colors.dark.destructive,
    textAlign: 'center',
    marginTop: 100,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  topRight: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.dark.accent,
  },
  actionRail: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: colors.dark.foreground,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 48,
    zIndex: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  freeBadge: {
    backgroundColor: colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeText: {
    color: colors.dark.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleText: {
    color: colors.dark.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  epText: {
    color: colors.dark.secondaryForeground,
    fontSize: 14,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.dark.secondaryForeground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
  },
});
