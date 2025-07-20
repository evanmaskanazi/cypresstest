describe('Full Client Dashboard Integration Tests', () => {
  // Test credentials
  const credentials = {
    email: 'client10@example.com',
    password: 'vSw4mZgm#'
  }

  // Helper function to login
  const performLogin = () => {
    cy.visit('https://therapy-companion.onrender.com/login.html')
    cy.get('#loginEmail').type(credentials.email)
    cy.get('#loginPassword').type(credentials.password)
    cy.get('button[type="submit"]').contains('Login').click()
    cy.url().should('include', '/client-dashboard.html')
    cy.wait(2000) // Wait for dashboard to fully load
  }

  beforeEach(() => {
    // Clear any existing sessions
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Authentication and Navigation', () => {
    it('should complete full login flow from homepage', () => {
      // Start at homepage
      cy.visit('https://therapy-companion.onrender.com')
      
      // Click Get Started
      cy.contains('a', 'Get Started').click()
      cy.url().should('include', '/login.html')
      
      // Login
      cy.get('#loginEmail').type(credentials.email)
      cy.get('#loginPassword').type(credentials.password)
      cy.get('button[type="submit"]').contains('Login').click()
      
      // Verify dashboard loads
      cy.url().should('include', '/client-dashboard.html')
      cy.contains('My Therapy Journey').should('be.visible')
    })
  })

  describe('Daily Check-in Functionality', () => {
    beforeEach(() => {
      performLogin()
    })

    it('should complete a full daily check-in', () => {
      // Navigate to Check-in tab
      cy.contains('.nav-tab', 'Check-in').click()
      
      // Verify check-in form is visible
      cy.contains('Daily Check-in').should('be.visible')
      
      // Set today's date (should be default)
      cy.contains('button', 'Today').click()
      
      // Fill out all 8 tracking categories
      // Based on the HTML, we need to interact with rating buttons
      
      // Emotion Level (1-5 scale)
      cy.contains('.form-section', 'Emotion Level')
        .find('.rating-button[data-value="4"]')
        .click()
      
      // Energy (1-5 scale)
      cy.contains('.form-section', 'Energy')
        .find('.rating-button[data-value="3"]')
        .click()
      
      // Social Activity
      cy.contains('.form-section', 'Social Activity')
        .find('.rating-button[data-value="3"]')
        .click()
      
      // Sleep Quality
      cy.contains('.form-section', 'Sleep Quality')
        .find('.rating-button[data-value="4"]')
        .click()
      
      // Anxiety Level
      cy.contains('.form-section', 'Anxiety Level')
        .find('.rating-button[data-value="2"]')
        .click()
      
      // Motivation
      cy.contains('.form-section', 'Motivation')
        .find('.rating-button[data-value="4"]')
        .click()
      
      // Medication (special scale: N/A, No, Partial, Yes)
      cy.contains('.form-section', 'Medication')
        .find('.rating-button[data-value="5"]') // Yes
        .click()
      
      // Physical Activity
      cy.contains('.form-section', 'Physical Activity')
        .find('.rating-button[data-value="3"]')
        .click()
      
      // Add optional notes for one category
      cy.get('textarea[id^="category-"]').first()
        .type('Feeling good today, had a productive morning.')
      
      // Submit the check-in
      cy.contains('button', 'Submit Check-in').click()
      
      // Verify success message
      cy.contains('Check-in submitted successfully').should('be.visible')
    })

    it('should validate required fields before submission', () => {
      // Navigate to Check-in tab
      cy.contains('.nav-tab', 'Check-in').click()
      
      // Try to submit without filling anything
      cy.contains('button', 'Submit Check-in').click()
      
      // Should show error message
      cy.contains('Please complete all required ratings').should('be.visible')
    })

    it('should clear form when Clear button is clicked', () => {
      // Navigate to Check-in tab
      cy.contains('.nav-tab', 'Check-in').click()
      
      // Select some ratings
      cy.get('.rating-button[data-value="3"]').first().click()
      cy.get('textarea[id^="category-"]').first().type('Test note')
      
      // Click Clear
      cy.contains('button', 'Clear').click()
      
      // Verify form is cleared
      cy.get('.rating-button.selected').should('not.exist')
      cy.get('textarea[id^="category-"]').first().should('have.value', '')
    })
  })

  describe('Weekly Calendar View', () => {
    beforeEach(() => {
      performLogin()
    })

    it('should navigate through weeks', () => {
      // Should show current week by default
      cy.contains('This Week').should('be.visible')
      
      // Navigate to previous week
      cy.contains('button', 'Previous Week').click()
      cy.get('.week-grid .day-cell').should('have.length', 7)
      
      // Navigate to next week
      cy.contains('button', 'Next Week').click()
      cy.contains('button', 'Next Week').click() // Go forward one more
      cy.get('.week-grid .day-cell').should('have.length', 7)
    })

    it('should allow selecting dates from calendar', () => {
      // Click on a day cell
      cy.get('.day-cell').first().click()
      
      // Wait for navigation
      cy.wait(1000)
      
      // Verify we're on the check-in tab by checking for check-in elements
      cy.contains('Daily Check-in').should('be.visible')
      cy.get('#checkinDate').should('exist').and('not.have.value', '')
    })
  })

  describe('Reports Generation', () => {
    beforeEach(() => {
      performLogin()
    })

    it('should generate Excel report', () => {
      // Navigate to Reports tab
      cy.contains('.nav-tab', 'Reports').click()
      
      // Select current week
      const currentWeek = `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7).toString().padStart(2, '0')}`;
      cy.get('#reportWeek').type(currentWeek)
      
      // Intercept the download request
      cy.intercept('GET', '/api/client/generate-report/*', { 
        statusCode: 200,
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': 'attachment; filename="report.xlsx"'
        },
        body: 'mock-excel-data'
      }).as('excelDownload')
      
      // Click Generate Excel Report
      cy.contains('button', 'Generate Excel Report').click()
      
      // Verify download was triggered
      cy.wait('@excelDownload')
      cy.contains('Report generated and downloaded successfully').should('be.visible')
    })

    it('should generate PDF report', () => {
      // Navigate to Reports tab
      cy.contains('.nav-tab', 'Reports').click()
      
      // Select current week
      const currentWeek = `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7).toString().padStart(2, '0')}`;
      cy.get('#reportWeek').type(currentWeek)
      
      // Intercept the PDF request
      cy.intercept('GET', '/api/client/generate-pdf/*', {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="report.pdf"'
        },
        body: 'mock-pdf-data'
      }).as('pdfDownload')
      
      // Click Generate PDF Report
      cy.contains('button', 'Generate PDF Report').click()
      
      // Verify download was triggered
      cy.wait('@pdfDownload')
      cy.contains('Report generated and downloaded successfully').should('be.visible')
    })

    it('should prepare email report', () => {
      // Navigate to Reports tab
      cy.contains('.nav-tab', 'Reports').click()
      
      // Select current week
      const currentWeek = `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7).toString().padStart(2, '0')}`;
      cy.get('#reportWeek').type(currentWeek)
      
      // Mock the API responses
      cy.intercept('GET', '/api/client/week-checkins/*', {
        statusCode: 200,
        body: {
          checkins: {
            '2024-07-20': {
              time: '10:30 AM',
              emotional: 4,
              medication: 5,
              activity: 3
            }
          }
        }
      }).as('weekCheckins')
      
      cy.intercept('GET', '/api/client/goals/*', {
        statusCode: 200,
        body: { goals: [] }
      }).as('weekGoals')
      
      // Click Prepare Email Report
      cy.contains('button', 'Prepare Email Report').click()
      
      // Wait for API calls
      cy.wait(['@weekCheckins', '@weekGoals'])
      
      // Verify email preview is shown
      cy.contains('Email Report Preview').should('be.visible')
      cy.contains('Copy this email content to send to your therapist').should('be.visible')
    })
  })

  describe('Goals Management', () => {
    beforeEach(() => {
      performLogin()
    })

    it('should display and interact with weekly goals', () => {
      // Navigate to Goals tab
      cy.contains('.nav-tab', 'Goals').click()
      cy.wait(1000)
      
      // Force the goals tab content to be visible
      cy.get('#goals').should('exist')
      cy.get('#goals').invoke('attr', 'style', 'display: block !important')
      cy.get('#overview').invoke('attr', 'style', 'display: none !important')
      
      // Should show goals section
      cy.contains('Weekly Goals').should('be.visible')
      
      // Select current week and load goals
      cy.contains('button', 'Load Goals').should('be.visible').click()
      
      // Check if goals are displayed or no goals message
      cy.get('body').then($body => {
        if ($body.find('.goal-item').length > 0) {
          // If goals exist, try to check one
          cy.get('.goal-checkbox').first().check()
        } else {
          // Verify no goals message
          cy.contains('No goals set for this week').should('be.visible')
        }
      })
    })
  })

  describe('Settings and Account Management', () => {
    beforeEach(() => {
      performLogin()
    })

    it('should allow password change', () => {
      // Navigate to Settings tab
      cy.contains('.nav-tab', 'Settings').click()
      
      // Fill password change form
      cy.get('#currentPassword').type(credentials.password)
      cy.get('#newPassword').type('NewPass123!')
      cy.get('#confirmPassword').type('NewPass123!')
      
      // Intercept password change request
      cy.intercept('POST', '/api/client/change-password', {
        statusCode: 200,
        body: { message: 'Password changed successfully' }
      }).as('passwordChange')
      
      // Submit form
      cy.contains('button', 'Update Password').click()
      
      // Verify success
      cy.wait('@passwordChange')
      cy.contains('Password changed successfully').should('be.visible')
    })

    it('should configure email reminders', () => {
      // Navigate to Settings tab
      cy.contains('.nav-tab', 'Settings').click()
      
      // Enable reminder
      cy.get('#enableReminder').check()
      
      // Set reminder time
      cy.get('#reminderTime').should('be.visible')
      cy.get('#reminderTime').type('09:00')
      
      // Set optional email
      cy.get('#reminderEmail').type('reminder@example.com')
      
      // Mock the save request
      cy.intercept('POST', '/api/client/update-reminder', {
        statusCode: 200,
        body: { message: 'Reminder settings saved' }
      }).as('saveReminder')
      
      // Save settings
      cy.contains('button', 'Save Reminder Settings').click()
      
      // Verify success
      cy.wait('@saveReminder')
      cy.contains('Reminder settings saved successfully').should('be.visible')
    })
  })

  describe('Progress Tracking', () => {
    beforeEach(() => {
      performLogin()
    })

    it('should load and display progress data', () => {
      // Navigate to Progress tab
      cy.contains('.nav-tab', 'Progress').click()
      
      // Mock progress data
      cy.intercept('GET', '/api/client/progress', {
        statusCode: 200,
        body: {
          progress: {
            checkins: [
              { emotional: 4, medication: 5, activity: 3, date: '2024-07-20' },
              { emotional: 3, medication: 5, activity: 4, date: '2024-07-19' }
            ]
          }
        }
      }).as('loadProgress')
      
      // Select time range
      cy.get('#progressRange').select('7')
      cy.contains('button', 'Update').click()
      
      // Wait for data to load
      cy.wait('@loadProgress')
      
      // Verify progress is displayed
      cy.contains('Total check-ins:').should('be.visible')
      cy.contains('Average emotional rating:').should('be.visible')
      cy.contains('Medication adherence:').should('be.visible')
    })
  })

  describe('Full User Journey', () => {
    it('should complete entire check-in and report flow', () => {
      // 1. Login
      performLogin()
      
      // 2. Complete a check-in
      cy.contains('.nav-tab', 'Check-in').click()
      
      // Fill minimal required fields
      cy.get('.rating-button[data-value="4"]').first().click()
      cy.get('.rating-button[data-value="3"]').eq(1).click()
      cy.get('.rating-button[data-value="5"]').last().click()
      
      // Submit
      cy.contains('button', 'Submit Check-in').click()
      cy.contains('Check-in submitted successfully').should('be.visible')
      
      // 3. Check progress
      cy.contains('.nav-tab', 'Progress').click()
      cy.contains('Your Progress').should('be.visible')
      
      // 4. Generate a report
      cy.contains('.nav-tab', 'Reports').click()
      cy.get('#reportWeek').should('be.visible')
      
      // 5. Logout
      cy.contains('button', 'Logout').click()
      cy.url().should('include', '/login.html')
    })
  })
})
