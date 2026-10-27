<template>
    <nav class="task-nav" aria-label="Tasks">
        <p v-if="tasks.invalidTaskCount" class="notice" role="status">{{ invalidNotice }}</p>

        <ul class="list">
            <li v-for="item in navItems" :key="item.id">
                <RouterLink
                    :to="{ name: 'tasks', params: { taskId: item.id } }"
                    class="link"
                    :class="{ completed: item.isCompleted }"
                >
                    <span class="title">{{ item.title }}</span>
                    <span class="meta">
                        <span v-if="item.isCompleted">Completed</span>
                        <span v-else :class="{ overdue: item.isOverdue }">{{ item.dueLabel }}</span>
                        <span class="time">{{ item.timeSpent }}</span>
                    </span>
                </RouterLink>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Task } from '@/api/taskSchema'
import { useTasksStore } from '@/stores/tasks'
import { useTimeTrackingStore } from '@/stores/timeTracking'
import { formatDuration } from '@/utils/formatDuration'

const DUE_LABELS: Record<Task['due'], string> = {
    yesterday: 'Due yesterday',
    today: 'Due today',
    tomorrow: 'Due tomorrow',
}

const tasks = useTasksStore()
const timeTracking = useTimeTrackingStore()

const navItems = computed(() =>
    tasks.tasks.map(task => ({
        id: task.id,
        title: task.title,
        dueLabel: DUE_LABELS[task.due],
        isOverdue: task.due === 'yesterday',
        isCompleted: tasks.completionStatus(task.id) === 'completed',
        timeSpent: formatDuration(timeTracking.elapsedSeconds(task.id)),
    })),
)

// partial failure: the valid tasks are listed, the rejected ones are only counted.
const invalidNotice = computed(() => {
    const count = tasks.invalidTaskCount

    return `${count} ${count === 1 ? 'task' : 'tasks'} could not be loaded.`
})
</script>

<style scoped lang="scss">
.task-nav {
    padding: 1rem 0;
}

.notice {
    margin: 0 1rem 0.5rem;
    padding: 0.5rem 0.75rem;
    border-left: 3px solid var(--color-danger);
    background: var(--color-background-soft);
    font-size: 0.85rem;
}

.list {
    list-style: none;
    padding: 0;
}

.link {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-left: 3px solid transparent;
    color: var(--color-text);
    text-decoration: none;

    &:hover {
        background: var(--color-background-soft);
    }

    &.router-link-active {
        border-left-color: var(--color-accent);
        background: var(--color-background-mute);
    }

    &.completed .title {
        text-decoration: line-through;
    }
}

.title {
    color: var(--color-heading);
    font-weight: 600;
}

.meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
}

.overdue {
    color: var(--color-danger);
}

.time {
    font-variant-numeric: tabular-nums;
}
</style>
