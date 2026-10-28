import React from 'react';
import { PomodoroTimer, PomodoroTimerProps } from './PomodoroTimer';

export type FocusPacingBarProps = PomodoroTimerProps;

export const FocusPacingBar: React.FC<FocusPacingBarProps> = (props) => {
  return <PomodoroTimer {...props} />;
};

export default FocusPacingBar;
