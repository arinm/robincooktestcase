<template>
    <article class="task-detail" :class="{ 'is-completed': status === 'completed' }">
        <h1 class="title">{{ task.title }}</h1>

        <p>{{ task.message }}</p>

        <label class="notes">
            <span>Notes</span>
            <textarea v-model="notes" rows="6" :readonly="!canComplete"></textarea>
        </label>

        <div class="actions">
            <button type="button" class="complete" :disabled="!canComplete" @click="tasks.completeTask(task.id)">
                {{ completeLabel }}
            </button>
            <p v-if="status === 'failed'" class="error" role="alert">Could not save your time. Please try again.</p>
        </div>
    </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '@/api/taskSchema'
import { useTasksStore, type CompletionStatus } from '@/stores/tasks'

const COMPLETE_LABELS: Record<CompletionStatus, string> = {
    open: 'Mark as completed',
    saving: 'Saving…',
    failed: 'Try again',
    completed: 'Completed',
}

const props = defineProps<{
    task: Task
}>()

const tasks = useTasksStore()

// local on purpose: KeepAlive in TasksView keeps one instance per task, including these unsaved notes
const notes = ref('')

const status = computed(() => tasks.completionStatus(props.task.id))
const completeLabel = computed(() => COMPLETE_LABELS[status.value])
const canComplete = computed(() => status.value === 'open' || status.value === 'failed')
</script>

<style scoped lang="scss">
.task-detail {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 48rem;
    padding: 1.5rem;
    border-radius: 8px;
    transition: background-color 0.2s;

    &.is-completed {
        background: var(--color-background-mute);

        .title,
        p,
        textarea {
            opacity: 0.6;
        }
    }
}

.title {
    color: var(--color-heading);
    font-size: 1.5rem;
    font-weight: 600;
}

.notes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

textarea {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background-soft);
    color: var(--color-text);
    font: inherit;
    resize: vertical;

    &:read-only {
        cursor: default;
        resize: none;
    }
}

.actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.complete {
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: 6px;
    background: var(--color-accent);
    color: var(--vt-c-white);
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        background: var(--color-background-mute);
        color: var(--color-text);
        cursor: default;
    }
}

.error {
    color: var(--color-danger);
}
</style>
