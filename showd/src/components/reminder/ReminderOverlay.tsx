import React from 'react';
import {
  useActiveTaskId,
  useShowStrugglingSheet,
  useShowSuccessAnimation,
} from '../../store/reminderStore';
import { useShowPostTimerCompletion, useActiveTimerTaskId } from '../../store/timerStore';
import { useGetTaskById } from '../../store/taskStore';
import { FullScreenReminder } from './FullScreenReminder';
import { StrugglingSheet } from './StrugglingSheet';
import { SuccessAnimation } from './SuccessAnimation';
import { PostTimerCompletion } from '../timer/PostTimerCompletion';

export function ReminderOverlay() {
  const activeTaskId = useActiveTaskId();
  const activeTimerTaskId = useActiveTimerTaskId();
  const showStrugglingSheet = useShowStrugglingSheet();
  const showSuccessAnimation = useShowSuccessAnimation();
  const showPostTimerCompletion = useShowPostTimerCompletion();
  const getTaskById = useGetTaskById();

  const activeTask = activeTaskId ? getTaskById(activeTaskId) : null;
  // StrugglingSheet can be triggered from either a reminder or the focus timer
  const hasStrugglingContext = activeTask || activeTimerTaskId;

  return (
    <>
      {activeTask && <FullScreenReminder task={activeTask} />}
      {hasStrugglingContext && showStrugglingSheet && <StrugglingSheet />}
      {showSuccessAnimation && <SuccessAnimation />}
      {showPostTimerCompletion && <PostTimerCompletion />}
    </>
  );
}

