import { z } from 'zod'

// validates a task as the backend sends it and maps it to the shape the app uses.
export const taskSchema = z
    .object({
        id: z.int().positive(),
        title: z.string().trim().min(1),
        message: z.string(),
        cost_estimate_seconds: z.int().positive(),
        due: z.enum(['yesterday', 'today', 'tomorrow']),
    })
    .transform(dto => ({
        id: dto.id,
        title: dto.title,
        message: dto.message,
        plannedSeconds: dto.cost_estimate_seconds,
        due: dto.due,
    }))

export type Task = z.infer<typeof taskSchema>
export type TaskId = Task['id']
