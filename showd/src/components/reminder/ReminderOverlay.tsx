import React, { useState, useEffect, useRef } from 'react';
import {
  useActiveTaskId,
  useShowStrugglingSheet,
  useShowSuccessAnimation,
} from '../../store/reminderStore';
import { useShowPostTimerCompletion, useActiveTimerTaskId } from '../../store/timerStore';
import { useGetTaskById } from '../../store/taskStore';
import {
  useShouldShowRatingPrompt,
  useMarkRatingPromptShown,
  useMarkAppRated,
} from '../../store/ratingStore';
import type { RatingTriggerResult } from '../../store/ratingStore';
import { FullScreenReminder } from './FullScreenReminder';
import { StrugglingSheet } from './StrugglingSheet';
import { SuccessAnimation } from './SuccessAnimation';
import { PostTimerCompletion } from '../timer/PostTimerCompletion';
import { RatingPromptSheet } from '../ui/RatingPromptSheet';

export function ReminderOverlay() {
  const activeTaskId = useActiveTaskId();
  const activeTimerTaskId = useActiveTimerTaskId();
  const showStrugglingSheet = useShowStrugglingSheet();
  const showSuccessAnimation = useShowSuccessAnimation();
  const showPostTimerCompletion = useShowPostTimerCompletion();
  const getTaskById = useGetTaskById();
  const shouldShowRatingPrompt = useShouldShowRatingPrompt();
  const markRatingPromptShown = useMarkRatingPromptShown();
  const markAppRated = useMarkAppRated();

  const [ratingTrigger, setRatingTrigger] = useState<RatingTriggerResult | null>(null);
  const prevShowSuccess = useRef(showSuccessAnimation);

  // When success animation finishes, check if we should show rating prompt
  useEffect(() => {
    if (prevShowSuccess.current && !showSuccessAnimation) {
      const result = shouldShowRatingPrompt();
      if (result.shouldShow) {
        setRatingTrigger(result);
        markRatingPromptShown();
      }
    }
    prevShowSuccess.current = showSuccessAnimation;
  }, [showSuccessAnimation, shouldShowRatingPrompt, markRatingPromptShown]);

  const activeTask = activeTaskId ? getTaskById(activeTaskId) : null;
  // StrugglingSheet can be triggered from either a reminder or the focus timer
  const hasStrugglingContext = activeTask || activeTimerTaskId;

  const handleRate = () => {
    markAppRated();
    setRatingTrigger(null);
  };

  const handleDismissRating = () => {
    setRatingTrigger(null);
  };

  return (
    <>
      {activeTask && <FullScreenReminder task={activeTask} />}
      {hasStrugglingContext && showStrugglingSheet && <StrugglingSheet />}
      {showSuccessAnimation && <SuccessAnimation />}
      {showPostTimerCompletion && <PostTimerCompletion />}
      {ratingTrigger && (
        <RatingPromptSheet
          trigger={ratingTrigger}
          onRate={handleRate}
          onDismiss={handleDismissRating}
        />
      )}
    </>
  );
}
