import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import BeanIcon from '../../assets/icon-bean.svg';

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '');

const ORIGIN_COORDS: Record<string, [number, number]> = {
  Ethiopia: [8.6, 39.6],
  Colombia: [4.5, -74.3],
  Panama: [8.9, -79.5],
  Peru: [-9.2, -75.0],
  Guatemala: [15.5, -90.2],
  Kenya: [0.0, 37.9],
  Brazil: [-14.2, -51.9],
  'Costa Rica': [9.7, -83.8],
  Bolivia: [-16.3, -63.6],
  Honduras: [15.2, -86.2],
  Rwanda: [-1.9, 29.9],
  Yemen: [15.5, 48.5],
};

const MAPBOX_STYLE = 'mapbox://styles/rainbowcow02/cmpbsoxbv002n01qhe2v56lsw';

interface Props {
  country?: string | null;
}

export function OriginMap({ country }: Props) {
  const coords = country ? ORIGIN_COORDS[country] : undefined;
  if (!coords) return null;

  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel={`Map of ${country}`}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        pointerEvents="none"
      >
        <MapboxGL.Camera
          centerCoordinate={[coords[1], coords[0]]}
          zoomLevel={4.5}
          animationDuration={0}
        />
        <MapboxGL.MarkerView coordinate={[coords[1], coords[0]]} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerPill}>
            <BeanIcon width={17} height={17} />
          </View>
        </MapboxGL.MarkerView>
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 120,
    borderRadius: 30,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
});
