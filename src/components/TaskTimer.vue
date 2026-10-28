<template>
    <div class="task-timer">
        <div class="times">
            <div>
                <p class="label">Time spent</p>
                <p class="value spent" :class="{ over: isOverPlanned }">{{ spentLabel }}</p>
            </div>
            <div>
                <p class="label">Planned</p>
                <p class="value">{{ plannedLabel }}</p>
            </div>
        </div>

        <div
            class="bar"
            role="progressbar"
            aria-label="Time spent of planned"
            aria-valuemin="0"
            :aria-valuemax="task.plannedSeconds"
            :aria-valuenow="progressValue"
            :aria-valuetext="progressDescription"
        >
            <div class="fill" :class="{ over: isOverPlanned }" :style="{ width: `${progressPercent}%` }"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import type { Task } from '@/api/taskSchema'
import { useTimeTrackingStore } from '@/stores/timeTracking'
import { formatDuration } from '@/utils/formatDuration'

const props = defineProps<{
    task: Task
}>()

const timeTracking = useTimeTrackingStore()

const spentSeconds = computed(() => timeTracking.elapsedSeconds(props.task.id))
const spentLabel = computed(() => formatDuration(spentSeconds.value))
const plannedLabel = computed(() => formatDuration(props.task.plannedSeconds))
const isOverPlanned = computed(() => spentSeconds.value > props.task.plannedSeconds)

const progressValue = computed(() => Math.min(spentSeconds.value, props.task.plannedSeconds))
const progressPercent = computed(() => Math.min(100, (spentSeconds.value / props.task.plannedSeconds) * 100))
const progressDescription = computed(() => `${spentLabel.value} spent of ${plannedLabel.value} planned`)

let tickId: ReturnType<typeof setTimeout> | undefined

// refreshes the display right when the running task reaches the next second
const scheduleTick = () => {
    clearTimeout(tickId)

    const running = timeTracking.running

    if (!running) return

    const msToNextSecond = 1000 - (timeTracking.elapsedMs(running.taskId) % 1000)

    tickId = setTimeout(() => {
        timeTracking.refreshNow()
        scheduleTick()
    }, msToNextSecond)
}

// restarts on every switch, so a new segment is not tied to the previous tick
watch(() => timeTracking.running, scheduleTick, { immediate: true })

onBeforeUnmount(() => {
    clearTimeout(tickId)
})
</script>

<style scoped lang="scss">
.task-timer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem 2rem;
}

.times {
    display: flex;
    gap: 2.5rem;
}

.label {
    font-size: 0.85rem;
}

.value {
    color: var(--color-heading);
    font-size: 1.75rem;
    font-variant-numeric: tabular-nums;
}

.spent.over {
    color: var(--color-danger);
}

.bar {
    height: 0.5rem;
    border-radius: 999px;
    background: var(--color-background-mute);
    overflow: hidden;
}

.fill {
    height: 100%;
    background: var(--color-accent);

    &.over {
        background: var(--color-danger);
    }
}
</style>
