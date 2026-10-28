import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: { name: 'tasks' },
        },
        {
            path: '/tasks/:taskId?',
            name: 'tasks',
            component: () => import('@/views/TasksView.vue'),
            // a missing or non-numeric id means no task is selected
            props: route => ({ taskId: Number(route.params.taskId) || null }),
        },
    ],
})

export default router
