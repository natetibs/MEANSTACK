@Library('readytalk') _

def workflow = new com.readytalk.Workflow()

def slackChannel = 'aie'

workflow { flow ->
  flow.slack = slackChannel

  worker(buildHost: 'docker', checkout: true) {
    stage('Build Container') {
      shell './build.sh'
    }
    if(env.BRANCH_NAME == 'master') {
      stage ('Publish Container') {
        shell 'docker push artifactory.ecovate.com/readytalk/squattybot:${env.BUILD_NUMBER}'
        slackSend channel: slackChannel, message: "Successfully published squattybot containers: ${BUILD_URL}/console", color: '#13e100'
      }
    } else {
            echo "Skipping publish on non-master branch"
      }
  }
}
