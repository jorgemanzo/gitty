const git = require('simple-git/promise')
const { prompt } = require('enquirer')
const Logger = require('purpzielog')

const stat = async (dir) => {
  let statusSummary = null
  try {
    statusSummary = await git(dir).status()
  } catch (e) {
    console.log('error stating: ' + e)
  }
  return statusSummary
}

const add = async (dir, files) => {
  let addSummary = null
  try {
    addSummary = await git(dir).add(files)
  } catch (e) {
    console.log('error adding: ' + e)
  }

  return addSummary
}

const logUntracked = (status) => {
  const log = new Logger({
    unctracked: { label: 'Untracked Files', color: 'blue' }
  })
  log.unctracked(...status.not_added)
}

const logToBeCommited = (status) => {
  const log = new Logger({
    tracked: { label: 'Files to be commited', color: 'green' }
  })
  log.tracked(...status.created)
}

const askAction = async () => {
  const response = await prompt({
    type: 'select',
    name: 'action',
    message: 'GittyUp!',
    choices: [
      'Track',
      'Status',
      'Exit'
    ]
  })
  return response
}

const trackFiles = async (untrackedFiles) => {
  if (untrackedFiles.length < 1) {
    console.log('No untracked files')
    return null
  }
  const response = await prompt({
    type: 'multiselect',
    name: 'addToTrack',
    message: 'Select (press space bar) files to Track:',
    choices: untrackedFiles
  })
  return response
}

const gitStatus = () => {
  stat('.').then(
    status => {
      logUntracked(status)
      logToBeCommited(status)
    }
  )
}

const gitAdd = () => {
  stat('.').then((statusSummary) => {
    trackFiles(statusSummary.not_added).then((response) => {
      if (response === null) {
        process.exit(0)
      }
      add('.', response.addToTrack).then(() => {
        gitStatus()
      })
    })
  })
}

askAction().then(
  response => {
    if (response.action === 'Status') {
      gitStatus()
    } else if (response.action === 'Track') {
      gitAdd()
    } else if (response.action === 'Exit') {
      process.exit(0)
    }
  }
)
