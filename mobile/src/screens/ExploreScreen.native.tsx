import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bag } from '../components/Bag';
import { BeanMarker } from '../components/BeanMarker';
import { BottomChromeScrim } from '../components/surfaces/BottomChromeScrim';
import { DetachedSheetBackground } from '../components/surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from '../components/surfaces/DetachedSheetContentClip';
import { SheetHeader } from '../components/surfaces/SheetHeader';
import { floatingSurfaceStyles } from '../components/surfaces/floatingSurfaceStyles';
import { useCoffees } from '../hooks/useCoffees';
import { tabBarChromeInset } from '../lib/chromeInsets';
import { colors, fonts } from '@shared/theme';
import { Coffee, ORIGIN_FLAGS, formatDate } from '@shared/lib/coffees';

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

const MAPBOX_STYLE = 'mapbox://styles/rainbowcow02/cmpbsoxbv002n01qhe2v56lsw';

const HEADER_H = 84;  // grabber 16 + title section 58 + paddingBottom 10
const ROW_H    = 104; // paddingVertical 16×2 + 72px bag
const GLOBE_LIFT = 100; // extra clearance so the globe sits above the collapsed sheet

export default function ExploreScreen() {
  const { coffees } = useCoffees();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const mapRef    = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const sheetRef  = useRef<BottomSheet>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  const tabBarInset = tabBarChromeInset(insets);
  const sheetTopInset = insets.top + 16;

  const snapPoints = useMemo(
    () => [
      HEADER_H + Math.ceil(1.5 * ROW_H),
      Math.round((screenH - tabBarInset) * 0.45),
      screenH - tabBarInset - sheetTopInset,
    ],
    [screenH, tabBarInset, sheetTopInset],
  );

  const zoomBtnBottom = tabBarInset + snapPoints[1] + 14;

  const cameraDefaultSettings = useMemo(() => ({
    centerCoordinate: [0, 5] as [number, number],
    zoomLevel: 1.2,
  }), []);

  const cameraPadding = useMemo(() => ({
    paddingTop: sheetTopInset,
    paddingBottom: tabBarInset + snapPoints[0] + GLOBE_LIFT,
    paddingLeft: 0,
    paddingRight: 0,
  }), [sheetTopInset, tabBarInset, snapPoints]);

  const handleZoom = useCallback(async (delta: number) => {
    const zoom = await mapRef.current?.getZoom();
    if (zoom != null) {
      cameraRef.current?.setCamera({
        zoomLevel: Math.min(Math.max(zoom + delta, 0.5), 14),
        animationDuration: 300,
        padding: cameraPadding,
      });
    }
  }, [cameraPadding]);

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
        const sheetH = (screenH - tabBarInset) * 0.4;
        cameraRef.current?.setCamera({
          centerCoordinate: [coords[1], coords[0]],
          zoomLevel: 8,
          animationDuration: 900,
          animationMode: 'flyTo',
          padding: { paddingBottom: tabBarInset + sheetH, paddingTop: 60, paddingLeft: 0, paddingRight: 0 },
        });
      }
      sheetRef.current?.snapToIndex(1);
    } else {
      sheetRef.current?.snapToIndex(0);
      const allCoords = Object.values(ORIGIN_COORDS).map(([lat, lng]) => [lng, lat] as [number, number]);
      if (allCoords.length > 0) {
        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        cameraRef.current?.fitBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
          [60, 60, tabBarInset + snapPoints[0], 60],
          700,
        );
      }
    }
  }, [selectedOrigin, screenH, tabBarInset, snapPoints]);

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
        [60, 60, tabBarInset + snapPoints[0], 60],
        700,
      );
    }
  }, [selectedOrigin, tabBarInset, snapPoints]);

  const coffeeCount = filteredCoffees.length;
  const countryCount = selectedOrigin ? 1 : Object.keys(originGroups).length;
  const titleText = selectedOrigin
    ? `${ORIGIN_FLAGS[selectedOrigin] ?? ''} ${selectedOrigin}`
    : 'All coffees';
  const subtitleText = `${coffeeCount} ${coffeeCount === 1 ? 'coffee' : 'coffees'} · ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}`;

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MAPBOX_STYLE}
        projection="globe"
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
          defaultSettings={cameraDefaultSettings}
          padding={cameraPadding}
          minZoomLevel={0.5}
          maxZoomLevel={14}
        />

        {Object.entries(originGroups).map(([origin, group]) => {
          const coords = ORIGIN_COORDS[origin];
          if (!coords) return null;
          const isSelected = selectedOrigin === origin;
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
                <BeanMarker count={group.length} selected={isSelected} />
              </TouchableOpacity>
            </MapboxGL.MarkerView>
          );
        })}
      </MapboxGL.MapView>

      <BottomChromeScrim />

      <View style={[styles.zoomControls, { bottom: zoomBtnBottom }]} pointerEvents="box-none">
        <Pressable
          onPress={() => handleZoom(0.75)}
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
        >
          <Text style={styles.zoomBtnText}>+</Text>
        </Pressable>
        <Pressable
          onPress={() => handleZoom(-0.75)}
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </Pressable>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        detached
        topInset={sheetTopInset}
        bottomInset={tabBarInset}
        backgroundComponent={DetachedSheetBackground}
        handleIndicatorStyle={floatingSurfaceStyles.grabberIndicator}
        style={floatingSurfaceStyles.sheetDetached}
      >
        <DetachedSheetContentClip>
          <SheetHeader
            variant="explore"
            title={titleText}
            subtitle={subtitleText}
            showClear={!!selectedOrigin}
            onClear={() => selectedOrigin && handleMarkerPress(selectedOrigin)}
            clearAccessibilityLabel="Clear origin filter"
          />

          <BottomSheetScrollView contentContainerStyle={styles.listContent}>
            {filteredCoffees.map((coffee, i) => (
              <View key={coffee.id}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push(`/coffee/${coffee.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bagThumb}>
                    <Bag coffee={coffee} width={72} height={72} beanNameOnly />
                  </View>
                  <View style={styles.listItemText}>
                    <Text style={styles.beanName} numberOfLines={1}>{coffee.bean}</Text>
                    <Text style={styles.roasterName} numberOfLines={1}>{coffee.roaster}</Text>
                    <Text style={styles.originText} numberOfLines={1}>
                      {ORIGIN_FLAGS[coffee.origin ?? ''] ?? ''} {coffee.origin}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(coffee.date)}</Text>
                </TouchableOpacity>
                {i < filteredCoffees.length - 1 && <View style={floatingSurfaceStyles.divider} />}
              </View>
            ))}
          </BottomSheetScrollView>
        </DetachedSheetContentClip>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  zoomControls: {
    position: 'absolute',
    right: 16,
    gap: 8,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  zoomBtnText: {
    fontFamily: fonts.sans,
    fontSize: 26,
    fontWeight: '500',
    color: colors.supremeBeige,
  },

  listContent: {
    paddingBottom: 16,
  },
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
  listItemText: {
    flex: 1,
    paddingRight: 8,
  },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 17,
    color: colors.black,
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
});
