// opens the app on a fake clock, so every second of tracked time is controlled by cy.tick().
const openTasks = ({ failFirstSave = false } = {}) => {
    cy.clock()
    cy.visit('/', {
        onBeforeLoad(win) {
            // the imaginary backend saves by logging, so these calls are the payloads sent.
            const save = cy.stub(win.console, 'log').withArgs('Saving to imaginary backend').as('save')

            if (failFirstSave) save.onFirstCall().throws(new Error('Backend unavailable'))
        },
    })

    // the tasks view waits a simulated 500ms before loading.
    cy.contains('Loading tasks…')
    cy.tick(500)
}

const openTask = (title: string) => {
    cy.contains('nav a', title).click()
    cy.get('main h1').should('have.text', title)
}

describe('tasks', () => {
    it('switches between tasks and keeps unsaved notes', () => {
        openTasks()
        cy.contains('Select a task to start tracking time.')

        openTask('Anruf')
        cy.url().should('include', '/tasks/1')
        cy.get('textarea').type('Called the owner')

        openTask('Dokumentation')
        cy.url().should('include', '/tasks/2')
        cy.get('textarea').should('have.value', '')

        openTask('Anruf')
        cy.get('textarea').should('have.value', 'Called the owner')
    })

    it('pauses a task while another one is open and resumes it on return', () => {
        openTasks()

        openTask('Anruf')
        cy.tick(5000)
        cy.get('header').should('contain', '00:05')

        openTask('Dokumentation')
        cy.tick(3000)
        cy.get('header').should('contain', '00:03')
        cy.contains('nav a', 'Anruf').should('contain', '00:05')

        openTask('Anruf')
        cy.tick(2000)
        cy.get('header').should('contain', '00:07')
        cy.contains('nav a', 'Dokumentation').should('contain', '00:03')
    })

    it('counts each task from the moment it is opened', () => {
        openTasks()

        // time on the task list belongs to no task.
        cy.tick(60000)
        openTask('Anruf')
        cy.tick(5300)
        cy.get('header').should('contain', '00:05')

        // the first second of a switched task is a full second, not what is left of the previous tick.
        openTask('Dokumentation')
        cy.tick(1000)
        cy.get('header').should('contain', '00:01')
    })

    it('keeps counting past the planned time and caps the progress bar', () => {
        openTasks()

        openTask('Archivieren')
        cy.tick(61000)

        cy.get('header').should('contain', '01:01')
        cy.get('[role="progressbar"]')
            .should('have.attr', 'aria-valuenow', '60')
            .and('have.attr', 'aria-valuetext', '01:01 spent of 01:00 planned')
    })

    it('sends the task id and the time shown when a task is completed', () => {
        openTasks()

        openTask('Anruf')
        cy.tick(4000)
        cy.contains('button', 'Mark as completed').click()

        // slow network: while saving, the task cannot be completed twice.
        cy.contains('button', 'Saving…').should('be.disabled')
        cy.tick(500)

        cy.get('@save').should('have.been.calledOnceWith', 'Saving to imaginary backend', {
            task_id: 1,
            time_spent_seconds: 4,
        })
        cy.contains('button', 'Completed').should('be.disabled')
        cy.contains('nav a', 'Anruf').should('contain', 'Completed')
        cy.get('textarea').should('have.attr', 'readonly')

        // a completed task no longer counts time.
        cy.tick(3000)
        cy.get('header').should('contain', '00:04')
    })

    it('keeps the task open when saving fails and resends the same time', () => {
        openTasks({ failFirstSave: true })

        openTask('Anruf')
        cy.tick(4000)
        cy.contains('button', 'Mark as completed').click()
        cy.tick(500)

        cy.contains('Could not save your time. Please try again.')
        cy.contains('nav a', 'Anruf').should('not.contain', 'Completed')

        // the unsaved task stays flagged after switching away; its timer stays frozen.
        openTask('Dokumentation')
        cy.contains('nav a', 'Anruf').should('contain', 'Not saved')
        cy.tick(3000)

        openTask('Anruf')
        cy.contains('button', 'Try again').click()
        cy.tick(500)

        cy.contains('button', 'Completed').should('be.disabled')
        cy.get('@save').should('have.been.calledTwice')
        cy.get('@save').should('have.always.been.calledWith', 'Saving to imaginary backend', {
            task_id: 1,
            time_spent_seconds: 4,
        })
    })
})
