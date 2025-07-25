pipeline {
    agent any
    
    environment {
        // Set Node.js path - Windows uses backslashes and no /bin
        NODEJS_HOME = "${tool 'NodeJS-18'}"
        PATH = "${env.NODEJS_HOME};${env.PATH}"
        
        // Cypress environment variables
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}\\.cypress-cache"
        CYPRESS_BASE_URL = credentials('cypress-base-url')
        CYPRESS_TEST_USER_EMAIL = credentials('cypress-test-email')
        CYPRESS_TEST_USER_PASSWORD = credentials('cypress-test-password')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    // Check if npm is accessible
                    bat 'echo %PATH%'
                    bat 'where npm || echo npm not found in PATH'
                    
                    // Clean install - use call for npm on Windows
                    bat 'call npm ci'
                    
                    // Verify Cypress installation
                    bat 'call npx cypress verify'
                }
            }
        }
        
        stage('Run Tests - Chrome') {
            steps {
                script {
                    try {
                        bat 'call npm run cypress:run:chrome'
                    } catch (Exception e) {
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Run Tests - Edge') {
            when {
                expression { false }  // Disable Edge tests
            }
            steps {
                script {
                    try {
                        bat 'call npm run cypress:run:edge'
                    } catch (Exception e) {
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Generate Reports') {
            steps {
                script {
                    // Clean up any existing files first
                    bat '''
                        if exist cypress\\results\\combined.json del /f cypress\\results\\combined.json
                        if exist cypress\\reports\\html rmdir /s /q cypress\\reports\\html
                    '''
                    
                    // Wait a moment to ensure file is deleted
                    sleep(time: 2, unit: 'SECONDS')
                    
                    // Now merge and generate
                    bat 'call npm run report:merge'
                    bat 'call npm run report:generate'
                }
            }
        }
        
        stage('Archive Results') {
            steps {
                // Archive test results
                archiveArtifacts artifacts: 'cypress/results/*.html', allowEmptyArchive: true
                archiveArtifacts artifacts: 'cypress/screenshots/**/*.png', allowEmptyArchive: true
                archiveArtifacts artifacts: 'cypress/videos/**/*.mp4', allowEmptyArchive: true
                
                // Publish HTML report
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'cypress/reports/html/cypress/results',
                    reportFiles: 'combined.html',
                    reportName: 'Cypress Test Report',
                    reportTitles: 'E2E Test Results'
                ])
                
                // Publish test results for trends - only if XML files exist
                script {
                    def xmlFiles = findFiles(glob: 'cypress/results/*.xml')
                    if (xmlFiles.length > 0) {
                        junit 'cypress/results/*.xml'
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean workspace
            cleanWs()
        }
        
        failure {
            // Send notification on failure
            emailext (
                subject: "Cypress Tests Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                    <p>Cypress tests failed for ${env.JOB_NAME} build ${env.BUILD_NUMBER}</p>
                    <p>Check the test report: ${env.BUILD_URL}Cypress_20Test_20Report</p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}",
                mimeType: 'text/html'
            )
        }
        
        unstable {
            // Send notification on unstable
            emailext (
                subject: "Cypress Tests Unstable: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                    <p>Some Cypress tests failed for ${env.JOB_NAME} build ${env.BUILD_NUMBER}</p>
                    <p>Check the test report: ${env.BUILD_URL}Cypress_20Test_20Report</p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}",
                mimeType: 'text/html'
            )
        }
    }
}
