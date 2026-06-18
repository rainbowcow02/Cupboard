import { TAB_BAR_HEIGHT } from '../components/TabBar';

/** Gap between detached sheet bottom and tab bar top (clears tab bar shadow). */
export const SHEET_TAB_GAP = 16;

/** Distance from screen bottom to the bottom edge of a detached sheet. */
export function tabBarChromeInset(insets: { bottom: number }): number {
  return Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT;
}
