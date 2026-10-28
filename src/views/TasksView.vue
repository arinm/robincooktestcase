<template>
    <div class="tasks-view">
        <TaskNav class="nav" />

        <header class="timer">
            <TaskTimer v-if="activeTask" :task="activeTask" />
        </header>

        <main class="detail">
            <div v-if="tasks.loadStatus === 'failed'" class="load-error" role="alert">
                <p>Could not load your tasks.</p>
                <button type="button" class="retry" @click="tasks.loadTasks()">Try again</button>
            </div>
            <p v-else-if="tasks.loadStatus === 'loading'">Loading tasks…</p>
            <p v-else-if="!tasks.tasks.length">No tasks assigned to you right now.</p>
            <p v-else-if="taskId !== null && !activeTask">This task could not be found.</p>
            <p v-else-if="!activeTask">Select a task to start tracking time.</p>

            <KeepAlive>
                <TaskDetail v-if="activeTask" :key="activeTask.id" :task="activeTask" />
            </KeepAlive>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import type { TaskId } from '@/api/taskSchema'
import TaskDetail from '@/components/TaskDetail.vue'
import TaskNav from '@/components/TaskNav.vue'
import TaskTimer from '@/components/TaskTimer.vue'
import { useTasksStore } from '@/stores/tasks'
import { useTimeTrackingStore } from '@/stores/timeTracking'
import { wait } from '@/utils/wait'

const props = defineProps<{
    taskId: TaskId | null
}>()

const tasks = useTasksStore()
const timeTracking = useTimeTrackingStore()

onMounted(async () => {
    // simulate a slow network so the user can see the "loading" state
    await wait(500)
    await tasks.loadTasks()
})

const activeTask = computed(() => (props.taskId === null ? undefined : tasks.getTask(props.taskId)))

// only an open task runs, once completing starts its time stays frozen
const trackedTaskId = computed(() => {
    const task = activeTask.value

    return task && tasks.completionStatus(task.id) === 'open' ? task.id : null
})

onBeforeUnmount(() => timeTracking.pause())

watch(trackedTaskId, taskId => timeTracking.track(taskId), { immediate: true })
</script>

<style scoped lang="scss">
.tasks-view {
    display: grid;
    grid-template-areas:
        'nav timer'
        'nav detail';
    grid-template-columns: 16rem 1fr;
    grid-template-rows: auto 1fr;
    min-height: 100vh;
}

.nav {
    grid-area: nav;
    border-right: 1px solid var(--color-border);
}

.timer {
    grid-area: timer;
    border-bottom: 1px solid var(--color-border);
}

.detail {
    grid-area: detail;
    padding: 2rem;
}

.load-error {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--color-danger);
}

.retry {
    padding: 0.4rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background-soft);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
}
</style>
