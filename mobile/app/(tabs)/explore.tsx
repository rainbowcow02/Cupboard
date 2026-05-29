import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BeanMarker } from '../../src/components/BeanMarker';
import { useCoffees } from '../../src/hooks/useCoffees';
import { colors, fonts } from '@shared/theme';
import { Coffee } from '@shared/lib/coffees';

MapboxGL.setAccessToken(
  Constants.expoConfig?.extra?.mapboxToken ?? ''
);

const ORIGIN_COORDS: Record<string, [number, number]> = {
  Ethiopia:    [8.6,   39.6],
  Colombia:    [4.5,  -74.3],
  Panama:      [8.9,  -79.5],
  Peru:        [-9.2, -75.0],
  Guatemala:   [15.5, -90.2],
  Kenya:       [0.0,   37.9],
  Brazil:      [-14.2, -51.9],
  'Costa Rica': [9.7,  -83.8],
  Bolivia:     [-16.3, -63.6],
  Honduras:    [15.2,  -86.2],
  Rwanda:      [-1.9,   29.9],
  Yemen:       [15.5,   48.5],
};

const ORIGIN_FLAGS: Record<string, string> = {
  Ethiopia:    '🇪🇹',
  Colombia:    '🇨🇴',
  Panama:      '🇵🇦',
  Peru:        '🇵🇪',
  Guatemala:   '🇬🇹',
  Kenya:       '🇰🇪',
  Brazil:      '🇧🇷',
  'Costa Rica': '🇨🇷',
  Bolivia:     '🇧🇴',
  Honduras:    '🇭🇳',
  Rwanda:      '🇷🇼',
  Yemen:       '🇾🇪',
};

const SNAP_POINTS = ['28%', '40%'];
const MAPBOX_STYLE = 'mapbox://styles/rainbowcow02/cmpbsoxbv002n01qhe2v56lsw';

const BAG_IMAGES: Record<string, ReturnType<typeof require>> = {
  white:  require('../../../shared/assets/bag-white.png'),
  blue:   require('../../../shared/assets/bag-blue.png'),
  green:  require('../../../shared/assets/bag-green.png'),
  orange: require('../../../shared/assets/bag-orange.png'),
};

export default function ExploreScreen() {
  const { coffees } = useCoffees();
  const router = useRouter();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  const originGroups = useMemo(() =>
    coffees.reduce<Record<string, Coffee[]>>((acc, coffee) => {
      if (!coffee.origin) return acc;
      acc[coffee.origin] = acc[coffee.origin] || [];
      acc[coffee.origin].push(coffee);
      return acc;
    }, {}),
  [coffees]);

  const filteredCoffees = selectedOrigin
    ? coffees.filter(c => c.origin === selectedOrigin)
    : coffees;

  const handleMarkerPress = useCallback((origin: string) => {
    const isDeselecting = selectedOrigin === origin;
    const next = isDeselecting ? null : origin;
    setSelectedOrigin(next);

    if (!isDeselecting) {
      const coords = ORIGIN_COORDS[origin];
      if (coords) {
        cameraRef.current?.flyTo([coords[1], coords[0]], 900);
        cameraRef.current?.zoomTo(4, 900);
      }
      sheetRef.current?.snapToIndex(1);
    } else {
      sheetRef.current?.snapToIndex(0);
      // Zoom back out to fit all origins
      const allCoords = Object.values(ORIGIN_COORDS).map(([lat, lng]) => [lng, lat] as [number, number]);
      if (allCoords.length > 0) {
        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        cameraRef.current?.fitBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
          [60, 60, 60, 60],
          700,
        );
      }
    }
  }, [selectedOrigin]);

  const handleMapPress = useCallback(() => {
    if (selectedOrigin) {
      setSelectedOrigin(null);
      sheetRef.current?.snapToIndex(0);
      const allCoords = Object.values(ORIGIN_COORDS).map(([lat, lng]) => [lng, lat] as [number, number]);
      const lngs = allCoords.map(c => c[0]);
      const lats = allCoords.map(c => c[1]);
      cameraRef.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
        [60, 60, 60, 60],
        700,
      );
    }
  }, [selectedOrigin]);

  const coffeeCount = filteredCoffees.length;
  const countryCount = selectedOrigin ? 1 : Object.keys(originGroups).length;
  const titleText = selectedOrigin
    ? `${ORIGIN_FLAGS[selectedOrigin] ?? ''} ${selectedOrigin}`
    : 'All coffees';
  const subtitleText = `${coffeeCount} ${coffeeCount === 1 ? 'coffee' : 'coffees'} · ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}`;

  // Initial camera bounds — fit all origins in view
  const allCoordValues = Object.values(ORIGIN_COORDS);
  const initMinLng = Math.min(...allCoordValues.map(([, lng]) => lng));
  const initMaxLng = Math.max(...allCoordValues.map(([, lng]) => lng));
  const initMinLat = Math.min(...allCoordValues.map(([lat]) => lat));
  const initMaxLat = Math.max(...allCoordValues.map(([lat]) => lat));

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE}
        projection="mercator"
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        onPress={handleMapPress}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            bounds: {
              ne: [initMaxLng, initMaxLat],
              sw: [initMinLng, initMinLat],
              paddingTop: 60,
              paddingBottom: 340,
              paddingLeft: 60,
              paddingRight: 60,
            },
          }}
          minZoomLevel={1.5}
          maxZoomLevel={5}
        />

        {Object.entries(originGroups).map(([origin, group]) => {
          const coords = ORIGIN_COORDS[origin];
          if (!coords) return null;
          const isSelected = selectedOrigin === origin;
          const isDimmed = selectedOrigin !== null && !isSelected;
          return (
            <MapboxGL.MarkerView
              key={origin}
              coordinate={[coords[1], coords[0]]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); handleMarkerPress(origin); }}
                activeOpacity={0.85}
              >
                <BeanMarker count={group.length} selected={isSelected} dimmed={isDimmed} />
              </TouchableOpacity>
            </MapboxGL.MarkerView>
          );
        })}
      </MapboxGL.MapView>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.grabber}
        style={styles.sheet}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.titleText}>{titleText}</Text>
            <Text style={styles.subtitleText}>{subtitleText}</Text>
          </View>
          {selectedOrigin && (
            <TouchableOpacity
              onPress={() => handleMarkerPress(selectedOrigin)}
              style={styles.clearBtn}
              hitSlop={8}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <BottomSheetScrollView contentContainerStyle={styles.listContent}>
          {filteredCoffees.map((coffee, i) => {
            const bagKey = (coffee.bagImg ?? 'white') as keyof typeof BAG_IMAGES;
            const src = BAG_IMAGES[bagKey] ?? BAG_IMAGES.white;
            return (
              <View key={coffee.id}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push(`/coffee/${coffee.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bagThumb}>
                    <Image source={src} style={styles.bagImg} resizeMode="contain" />
                  </View>
                  <View style={styles.listItemText}>
                    <Text style={styles.beanName} numberOfLines={1}>{coffee.bean}</Text>
                    <Text style={styles.roasterName} numberOfLines={1}>{coffee.roaster}</Text>
                    <Text style={styles.originText} numberOfLines={1}>
                      {ORIGIN_FLAGS[coffee.origin ?? ''] ?? ''} {coffee.origin}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{coffee.date}</Text>
                </TouchableOpacity>
                {i < filteredCoffees.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  sheet: { marginHorizontal: 16 },
  sheetBg: {
    borderRadius: 34,
    backgroundColor: 'rgba(245,245,245,0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  grabber: { backgroundColor: '#ccc', width: 36, height: 5 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  headerText: { flex: 1, justifyContent: 'center', minHeight: 58 },
  titleText: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: '#000',
    letterSpacing: -0.23,
    lineHeight: 30,
  },
  subtitleText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(120,120,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '500',
    color: '#727272',
  },

  listContent: { paddingBottom: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 4,
    paddingRight: 24,
  },
  bagThumb: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bagImg: {
    width: 36,
    height: 74,
  },
  listItemText: {
    flex: 1,
    paddingRight: 8,
  },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  roasterName: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
  },
  originText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
  },
  dateText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
    flexShrink: 0,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e7e7e7',
  },
});
