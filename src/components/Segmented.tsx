import SegmentedControl, { type SegmentedControlProps } from '@react-native-segmented-control/segmented-control';
import type { ComponentType } from 'react';

/** Segmented control nativo (UISegmentedControl / Material). Wrapper só para tipagem com React 19. */
export const Segmented = SegmentedControl as unknown as ComponentType<SegmentedControlProps>;
