import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapboxGL, { type MapState } from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const SHEET_BOTTOM_PAD = 16;
const GLOBE_LIFT = 100; // extra clearance so the globe sits above the collapsed sheet
// Equatorial, straight-on framing — both hemispheres visible above the bottom sheet.
const GLOBE_HOME = {
  centerCoordinate: [0, 0] as [number, number],
  zoomLevel: 1.0,
};
const GLOBE_VIEW_MAX_ZOOM = 1.5; // at or below = fully zoomed-out globe home
const PIN_VIEW_MAX_ZOOM = 3;     // above this, stale pin padding may still apply

export default function ExploreScreen() {
  const { coffees } = useCoffees();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const mapRef    = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const sheetRef  = useRef<BottomSheet>(null);
  // True after a pin fly-to until the camera is restored to globe home.
  const pinViewActiveRef = useRef(false);
  // True while one of our own setCamera animations is in flight, so the
  // camera-change listeners don't react to (and fight) the animation frames.
  const programmaticAnimRef = useRef(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);

  const tabBarInset = tabBarChromeInset(insets);
  const sheetTopInset = insets.top + 16;

  const peekH = useMemo(() => HEADER_H + Math.ceil(1.5 * ROW_H), []);
  const absMaxH = useMemo(
    () => Math.round((screenH - tabBarInset) * 0.45),
    [screenH, tabBarInset],
  );
  const fullSnapH = useMemo(
    () => screenH - tabBarInset - sheetTopInset,
    [screenH, tabBarInset, sheetTopInset],
  );

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

  const snapPoints = useMemo(() => {
    const contentH = HEADER_H + filteredCoffees.length * ROW_H + SHEET_BOTTOM_PAD;

    if (!selectedOrigin) {
      return [peekH, absMaxH, fullSnapH];
    }

    // Pin selected: hug full list height, capped only by available screen space
    const hugH = Math.min(contentH, fullSnapH);

    if (filteredCoffees.length === 1) {
      return [hugH];
    }
    if (hugH <= peekH) {
      return [hugH];
    }
    return [peekH, hugH];
  }, [selectedOrigin, filteredCoffees.length, peekH, absMaxH, fullSnapH]);

  const activeSheetH = snapPoints[Math.min(sheetIndex, snapPoints.length - 1)];
  const zoomBtnBottom = tabBarInset + activeSheetH + 14;

  useEffect(() => {
    if (!selectedOrigin) {
      setSheetIndex(0);
      sheetRef.current?.snapToIndex(0);
      return;
    }

    const contentH = HEADER_H + filteredCoffees.length * ROW_H + SHEET_BOTTOM_PAD;
    const hugH = Math.min(contentH, fullSnapH);
    const targetIndex = filteredCoffees.length === 1 || hugH <= peekH ? 0 : 1;
    setSheetIndex(targetIndex);
    sheetRef.current?.snapToIndex(targetIndex);
  }, [selectedOrigin, filteredCoffees.length, peekH, fullSnapH]);

  const handleSheetChange = useCallback((index: number) => {
    setSheetIndex(index);
  }, []);

  const cameraDefaultSettings = useMemo(() => ({
    centerCoordinate: GLOBE_HOME.centerCoordinate,
    zoomLevel: GLOBE_HOME.zoomLevel,
  }), []);

  // Stable resting padding: depends only on safe-area insets + the constant peek
  // height, NOT on snapPoints. This keeps the globe's focal point fixed across
  // pin select/deselect so the sphere never drifts when the sheet resizes.
  const cameraPadding = useMemo(() => ({
    paddingTop: sheetTopInset,
    paddingBottom: tabBarInset + peekH + GLOBE_LIFT,
    paddingLeft: 0,
    paddingRight: 0,
  }), [sheetTopInset, tabBarInset, peekH]);

  const animateCamera = useCallback((config: Parameters<NonNullable<typeof cameraRef.current>['setCamera']>[0]) => {
    programmaticAnimRef.current = true;
    cameraRef.current?.setCamera(config);
  }, []);

  // Settle to a clean, straight-on globe WITHOUT snapping longitude/latitude:
  // we keep the user's current center and only correct zoom, tilt, and padding.
  const settleToGlobe = useCallback((animationDuration = 300) => {
    pinViewActiveRef.current = false;
    animateCamera({
      zoomLevel: GLOBE_HOME.zoomLevel,
      heading: 0,
      pitch: 0,
      padding: cameraPadding,
      animationDuration,
      animationMode: animationDuration >= 500 ? 'flyTo' : 'easeTo',
    });
  }, [cameraPadding, animateCamera]);

  const restoreGlobePadding = useCallback((animationDuration = 300) => {
    animateCamera({
      padding: cameraPadding,
      animationDuration,
    });
  }, [cameraPadding, animateCamera]);

  const maybeRestoreFromPinView = useCallback((zoom: number) => {
    if (!pinViewActiveRef.current) return;

    if (zoom <= GLOBE_VIEW_MAX_ZOOM) {
      settleToGlobe(300);
      return;
    }

    if (zoom <= PIN_VIEW_MAX_ZOOM) {
      restoreGlobePadding(300);
    }
  }, [settleToGlobe, restoreGlobePadding]);

  const handleZoom = useCallback(async (delta: number) => {
    const zoom = await mapRef.current?.getZoom();
    if (zoom == null) return;

    const nextZoom = Math.min(Math.max(zoom + delta, 0.5), 14);

    if (pinViewActiveRef.current) {
      // Coming out of a focused pin: once we cross back to globe scale, settle to a
      // clean sphere; otherwise keep the pin's framing while zooming.
      if (nextZoom <= GLOBE_VIEW_MAX_ZOOM) {
        settleToGlobe(300);
        return;
      }
      animateCamera({ zoomLevel: nextZoom, animationDuration: 300 });
      return;
    }

    animateCamera({
      zoomLevel: nextZoom,
      animationDuration: 300,
      padding: cameraPadding,
    });
  }, [cameraPadding, settleToGlobe, animateCamera]);

  const handleMarkerPress = useCallback((origin: string) => {
    const isDeselecting = selectedOrigin === origin;

    if (isDeselecting) {
      setSheetIndex(0);
      setSelectedOrigin(null);
      sheetRef.current?.snapToIndex(0);
      settleToGlobe(700);
      return;
    }

    setSelectedOrigin(origin);

    const coords = ORIGIN_COORDS[origin];
    if (coords) {
      const originCount = originGroups[origin]?.length ?? 0;
      const contentH = HEADER_H + originCount * ROW_H + SHEET_BOTTOM_PAD;
      const hugH = Math.min(contentH, fullSnapH);
      pinViewActiveRef.current = true;
      // Same paddingTop as the globe profile — only the bottom grows to clear the
      // taller pin sheet — so entering/leaving a pin shifts the focal point as
      // little as possible.
      animateCamera({
        centerCoordinate: [coords[1], coords[0]],
        zoomLevel: 8,
        animationDuration: 900,
        animationMode: 'flyTo',
        padding: { paddingBottom: tabBarInset + hugH, paddingTop: sheetTopInset, paddingLeft: 0, paddingRight: 0 },
      });
    }
  }, [selectedOrigin, tabBarInset, sheetTopInset, originGroups, fullSnapH, settleToGlobe, animateCamera]);

  const handleMapIdle = useCallback((state: MapState) => {
    // Our own animation has come to rest; stop suppressing corrections.
    programmaticAnimRef.current = false;
    maybeRestoreFromPinView(state.properties.zoom);
  }, [maybeRestoreFromPinView]);

  const handleCameraChanged = useCallback((state: MapState) => {
    if (state.gestures.isGestureActive) {
      // The user grabbed the map — cancel any in-flight programmatic suppression
      // so their gesture is honored and later settles correctly.
      programmaticAnimRef.current = false;
      return;
    }
    // Ignore frames produced by our own fly-to / settle animations.
    if (programmaticAnimRef.current) return;
    maybeRestoreFromPinView(state.properties.zoom);
  }, [maybeRestoreFromPinView]);

  const handleMapPress = useCallback(() => {
    if (selectedOrigin) {
      setSheetIndex(0);
      setSelectedOrigin(null);
      sheetRef.current?.snapToIndex(0);
      settleToGlobe(700);
    }
  }, [selectedOrigin, settleToGlobe]);

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
        onMapIdle={handleMapIdle}
        onCameraChanged={handleCameraChanged}
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
              anchor={{ x: 0.5, y: 1 }}
              allowOverlap
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
        index={sheetIndex}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChange}
        key={selectedOrigin ?? 'all'}
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
    flexGrow: 0,
    paddingBottom: SHEET_BOTTOM_PAD,
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
