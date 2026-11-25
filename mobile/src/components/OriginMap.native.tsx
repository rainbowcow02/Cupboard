import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import BeanIcon from '../../assets/icon-bean.svg';
import { useOriginLocation } from '../lib/geocode';

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '');

const MAPBOX_STYLE = 'mapbox://styles/rainbowcow02/cmpbsoxbv002n01qhe2v56lsw';

// Closer in when the pin marks a growing region rather than a whole country.
const REGION_ZOOM = 6;
const COUNTRY_ZOOM = 4.5;

interface Props {
  country?: string | null;
  region?: string | null;
}

export function OriginMap({ country, region }: Props) {
  const location = useOriginLocation(country, region);
  if (!location) return null;
  const { coords, level } = location;
  const label = region || country;

  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel={`Map of ${label}`}>
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
          zoomLevel={level === 'region' ? REGION_ZOOM : COUNTRY_ZOOM}
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
