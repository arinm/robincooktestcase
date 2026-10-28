import { defineStore } from 'pinia'
import type { TaskId } from '@/api/taskSchema'

interface RunningSegment {
    taskId: TaskId
    startedAt: number
}

interface TimeTrackingState {
    accumulatedMs: Partial<Record<TaskId, number>>
    running: RunningSegment | null
    now: number
}

// elapsed time comes from timestamps, so a throttled background tab cannot lose time
export const useTimeTrackingStore = defineStore('timeTracking', {
    state: (): TimeTrackingState => ({
        // time per task, without the segment that is running now
        accumulatedMs: {},
        running: null,
        // refreshed by the timer display
        now: Date.now(),
    }),

    getters: {
        runningTaskId: state => state.running?.taskId ?? null,

        elapsedMs: state => (taskId: TaskId) => {
            const accumulated = state.accumulatedMs[taskId] ?? 0

            if (state.running?.taskId !== taskId) return accumulated

            return accumulated + Math.max(0, state.now - state.running.startedAt)
        },

        // whole seconds: what the timer shows and what is sent to the backend
        elapsedSeconds(): (taskId: TaskId) => number {
            return taskId => Math.floor(this.elapsedMs(taskId) / 1000)
        },
    },

    actions: {
        track(taskId: TaskId | null) {
            if (this.runningTaskId === taskId) return

            this.pause()

            if (taskId === null) return

            this.now = Date.now()
            this.running = { taskId, startedAt: this.now }
        },

        pause() {
            if (!this.running) return

            this.now = Date.now()
            this.accumulatedMs[this.running.taskId] = this.elapsedMs(this.running.taskId)
            this.running = null
        },

        refreshNow() {
            this.now = Date.now()
        },
    },
})
