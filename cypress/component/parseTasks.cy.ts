import { parseTasks } from '@/api/tasksApi'

const backendTask = (id: number) => ({
    id,
    title: `Task ${id}`,
    message: '',
    cost_estimate_seconds: 60,
    due: 'today',
})

describe('parseTasks', () => {
    it('keeps the valid tasks and counts invalid and repeated ones', () => {
        const { tasks, invalidCount } = parseTasks([
            backendTask(1),
            { ...backendTask(2), cost_estimate_seconds: 'soon' },
            { ...backendTask(1), title: 'Same id' },
            backendTask(3),
        ])

        expect(tasks.map(task => task.title)).to.deep.equal(['Task 1', 'Task 3'])
        expect(invalidCount).to.equal(2)
    })

    it('fails the whole list when the backend does not send a list', () => {
        expect(() => parseTasks({ tasks: [] })).to.throw()
    })
})
