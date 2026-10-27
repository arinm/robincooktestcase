import { defineStore } from 'pinia'
import { tasksApi } from '@/api/tasksApi'
import type { Task, TaskId } from '@/api/taskSchema'
import { useTimeTrackingStore } from './timeTracking'

export type LoadStatus = 'loading' | 'loaded' | 'failed'
export type CompletionStatus = 'open' | 'saving' | 'failed' | 'completed'

interface TasksState {
    tasks: Task[]
    loadStatus: LoadStatus
    invalidTaskCount: number
    completionStatusById: Partial<Record<TaskId, CompletionStatus>>
}

export const useTasksStore = defineStore('tasks', {
    state: (): TasksState => ({
        tasks: [],
        loadStatus: 'loading',
        invalidTaskCount: 0,
        completionStatusById: {},
    }),

    getters: {
        getTask: state => (taskId: TaskId) => state.tasks.find(task => task.id === taskId),
        completionStatus: state => (taskId: TaskId) => state.completionStatusById[taskId] ?? 'open',
    },

    actions: {
        async loadTasks() {
            this.loadStatus = 'loading'

            try {
                const { tasks, invalidCount } = await tasksApi.fetchTasks()

                this.tasks = tasks
                this.invalidTaskCount = invalidCount
                this.loadStatus = 'loaded'
            } catch {
                this.loadStatus = 'failed'
            }
        },

        async completeTask(taskId: TaskId) {
            const status = this.completionStatus(taskId)

            if (status === 'saving' || status === 'completed') return

            const timeTracking = useTimeTrackingStore()

            if (timeTracking.runningTaskId === taskId) timeTracking.pause()

            // frozen from here on, so a retry sends the same seconds.
            const timeSpentSeconds = timeTracking.elapsedSeconds(taskId)
            this.completionStatusById[taskId] = 'saving'

            try {
                await tasksApi.completeTask(taskId, timeSpentSeconds)
                this.completionStatusById[taskId] = 'completed'
            } catch {
                this.completionStatusById[taskId] = 'failed'
            }
        },
    },
})
