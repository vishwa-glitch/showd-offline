import { useEffect, useRef } from 'react';
import { useEvents } from '../store/taskStore';
import { useGetConnectionByTaskId } from '../store/witnessStore';
import { useGetTaskById } from '../store/taskStore';
import { sendMissedTaskSMS, sendStruggledTaskSMS } from '../services/witness';
import type { TaskEvent } from '../types/task';

/**
 * Watches for new missed/struggled events and stubs SMS to active witnesses.
 * Uses a ref to track how many events have been processed.
 */
export function useWitnessNotifier() {
  const events = useEvents();
  const getTaskById = useGetTaskById();
  const getConnectionByTaskId = useGetConnectionByTaskId();
  const processedCountRef = useRef(events.length);

  useEffect(() => {
    const currentCount = events.length;
    if (currentCount <= processedCountRef.current) {
      processedCountRef.current = currentCount;
      return;
    }

    const newEvents = events.slice(processedCountRef.current) as readonly TaskEvent[];
    processedCountRef.current = currentCount;

    for (const event of newEvents) {
      if (event.status !== 'missed' && event.status !== 'struggled') continue;

      const task = getTaskById(event.taskId);
      if (!task || task.accountabilityType !== 'real') continue;

      const connection = getConnectionByTaskId(event.taskId);
      if (!connection || connection.status !== 'active') continue;

      const params = {
        connectionId: connection.id,
        witnessPhone: connection.witnessPhone,
        witnessName: connection.witnessName,
        taskDoerName: connection.taskDoerName,
        taskName: task.name,
      };

      if (event.status === 'missed') {
        sendMissedTaskSMS(params);
      } else {
        sendStruggledTaskSMS({ ...params, reason: event.strugglingReason || '' });
      }
    }
  }, [events, getTaskById, getConnectionByTaskId]);
}
