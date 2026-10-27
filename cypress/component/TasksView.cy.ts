import { mount } from 'cypress/vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { tasksApi } from '@/api/tasksApi'
import type { Task } from '@/api/taskSchema'
import TasksView from '@/views/TasksView.vue'

const task: Task = {
    id: 1,
    title: 'Anruf',
    message: 'Bitte kontaktiere die Ansprechperson.',
    plannedSeconds: 1000,
    due: 'today',
}

// a fresh store and an in-memory router per test; the API answer is stubbed by each test.
const mountTasksView = () => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/tasks/:taskId?', name: 'tasks', component: TasksView }],
    })

    mount(TasksView, {
        props: { taskId: null },
        global: { plugins: [createPinia(), router] },
    })
}

describe('TasksView states', () => {
    it('shows an error and loads again on retry', () => {
        const fetchTasks = cy.stub(tasksApi, 'fetchTasks')
        fetchTasks.onFirstCall().rejects(new Error('Network down'))
        fetchTasks.onSecondCall().resolves({ tasks: [task], invalidCount: 0 })

        mountTasksView()

        cy.contains('Could not load your tasks.')
        cy.contains('button', 'Try again').click()
        cy.contains('nav a', 'Anruf')
        cy.contains('Could not load your tasks.').should('not.exist')
    })

    it('says so when no task is assigned', () => {
        cy.stub(tasksApi, 'fetchTasks').resolves({ tasks: [], invalidCount: 0 })

        mountTasksView()

        cy.contains('No tasks assigned to you right now.')
    })

    it('lists the valid tasks and counts the ones that could not be loaded', () => {
        cy.stub(tasksApi, 'fetchTasks').resolves({ tasks: [task], invalidCount: 2 })

        mountTasksView()

        cy.contains('nav a', 'Anruf')
        cy.contains('2 tasks could not be loaded.')
    })
})
