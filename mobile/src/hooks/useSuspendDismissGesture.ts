import { useNavigation } from 'expo-router';
import { useEffect } from 'react';

/** Active suspensions per screen, so one closing picker can't re-enable the swipe another still needs off. */
const suspensions = new WeakMap<object, Set<symbol>>();

/**
 * Turns off the host page sheet's swipe-down-to-dismiss while `active`.
 *
 * Several things on one screen need this at once — an open option picker, and
 * the edit sheets that would otherwise lose unsaved changes to a stray
 * pull-down. Each caller holds its own token; the gesture comes back only once
 * every caller has released it.
 */
export function useSuspendDismissGesture(active: boolean) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!active) return;
    // One navigation object per screen, so it keys that screen's suspensions.
    const key: object = navigation;
    let tokens = suspensions.get(key);
    if (!tokens) {
      tokens = new Set();
      suspensions.set(key, tokens);
    }
    const token = Symbol('dismiss-suspension');
    tokens.add(token);
    navigation.setOptions({ gestureEnabled: false });

    return () => {
      tokens.delete(token);
      if (tokens.size === 0) navigation.setOptions({ gestureEnabled: true });
    };
  }, [active, navigation]);
}
