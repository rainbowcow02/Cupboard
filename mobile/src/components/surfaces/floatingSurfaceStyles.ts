import { Platform, StyleSheet } from 'react-native';
import { colors, fonts, surfaces } from '@shared/theme';

export const SHEET_HORIZONTAL_INSET = 16;

export const floatingSurfaceStyles = StyleSheet.create({
  sheetDetached: {
    marginHorizontal: SHEET_HORIZONTAL_INSET,
  },
  cardShell: {
    borderRadius: surfaces.cardRadius,
    backgroundColor: surfaces.cardFill,
    ...Platform.select({
      ios: {
        shadowColor: surfaces.shadow.shadowColor,
        shadowOffset: surfaces.shadow.shadowOffset,
        shadowOpacity: surfaces.shadow.shadowOpacity,
        shadowRadius: surfaces.shadow.shadowRadius,
      },
      android: { elevation: surfaces.shadow.elevation },
      web: {
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  cardClip: {
    overflow: 'hidden',
    borderRadius: surfaces.cardRadius,
  },
  grabberRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: surfaces.grabberWidth,
    height: surfaces.grabberHeight,
    backgroundColor: surfaces.grabberColor,
    borderRadius: 100,
  },
  grabberIndicator: {
    backgroundColor: surfaces.grabberColor,
    width: surfaces.grabberWidth,
    height: surfaces.grabberHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 16,
    paddingLeft: 24,
  },
  headerExplore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  headerTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleWrapExplore: {
    minHeight: 58,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.black,
    letterSpacing: -0.23,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: surfaces.clearButtonFill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clearButtonText: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '500',
    color: surfaces.clearButtonText,
  },
  divider: {
    height: 0.5,
    backgroundColor: surfaces.divider,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingRight: 20,
    paddingLeft: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: surfaces.divider,
  },
  optionRowFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: surfaces.divider,
  },
  optionFlag: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.black,
  },
});
