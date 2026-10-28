import { z } from 'zod'
import { useImaginaryBackend } from '@/composables/useImaginaryBackend'
import { wait } from '@/utils/wait'
import { taskSchema, type Task, type TaskId } from './taskSchema'

// simulated latency so "Saving…" is visible, the store sets it before calling this
const SAVE_LATENCY_MS = 500

const { loadDummyData, saveToImaginaryBackend } = useImaginaryBackend()

export interface LoadedTasks {
    tasks: Task[]
    // tasks the backend sent but validation rejected, repeated ids included
    invalidCount: number
}

// skips invalid tasks instead of failing the list, a repeated id would share time and notes
export const parseTasks = (data: unknown): LoadedTasks => {
    const items = z.array(z.unknown()).parse(data)

    const tasks: Task[] = []
    const seenIds = new Set<TaskId>()

    for (const item of items) {
        const result = taskSchema.safeParse(item)

        if (!result.success || seenIds.has(result.data.id)) continue

        seenIds.add(result.data.id)
        tasks.push(result.data)
    }

    return { tasks, invalidCount: items.length - tasks.length }
}

export const tasksApi = {
    async fetchTasks(): Promise<LoadedTasks> {
        return parseTasks(loadDummyData())
    },

    async completeTask(taskId: TaskId, timeSpentSeconds: number): Promise<void> {
        await wait(SAVE_LATENCY_MS)

        saveToImaginaryBackend({ task_id: taskId, time_spent_seconds: timeSpentSeconds })
    },
}
