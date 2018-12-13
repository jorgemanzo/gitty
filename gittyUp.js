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
		return -1
  }

  return addSummary
}

const unstage = async (dir, files) => {
	let unstagedSummary = null
	try {
		unstagedSummary = await git(dir).reset(['HEAD'].concat(files))
	} catch (e) {
		console.log('error adding: ' + e)
		return -1
	}
	return unstagedSummary
}

const logUntracked = (status) => {
	if(status.not_added.length < 1) {
		new Logger().warn('No untracked files')
		return -1
	}
  const log = new Logger({
    unctracked: { label: 'Untracked Files', color: 'blue' }
  })
  log.unctracked(...status.not_added)
}

const logModified = (status) => {
	if(status.modified.length < 1) {
		new Logger().warn('No newly modified files')
		return -1
	}
  const log = new Logger({
    unctracked: { label: 'Modified Files', color: 'blue' }
  })
  log.unctracked(...status.modified)
}

const logToBeCommited = (status) => {
	if(status.created.length < 1) {
		new Logger().warn('No files to be commited')
		return -1
	}
  const log = new Logger({
    tracked: { label: 'Files to be commited', color: 'green' }
  })
  log.tracked(...status.created)
}

const askAction = async () => {
  const log = new Logger({
    statement: { label: '=========', color: 'cyan' }
  })
  log.statement()
  const response = await prompt({
    type: 'select',
    name: 'action',
    message: 'GittyUp!',
    choices: [
			'Add',
      'Status',
      'Track',
      'Untrack',
      'Exit'
    ]
  })
  return response
}

const printStatus = (status) => {
	logUntracked(status)
	logToBeCommited(status)
	logModified(status)
}

const selectFiles = async (filesLIst) => {
  if (filesLIst.length < 1) {
		new Logger().error('No files')
    return -1
  }
  const response = await prompt({
    type: 'multiselect',
    name: 'selectFiles',
    message: 'Select (press space bar) files:',
    choices: filesLIst
  })
  return response
}

const gitStatus = async () => {
	const status = await stat('.')
	return status
}

const gitTrack = async () => {
	let status = await gitStatus()
	let choices = await selectFiles(status.not_added)
	if(choices === -1)
		return -1

	let addedSummary = await add('.', choices.selectFiles)
	if(addedSummary === -1)
		return -1
	
	let newStatus = await gitStatus()
	printStatus(newStatus)
	return 0
}

const gitUntack = async () => {
	let status = await gitStatus()
	let choices = await selectFiles(status.created)
	if(choices === -1)
		return -1
	
	let unstagedSummary = await unstage('.', choices.selectFiles)
	if(unstagedSummary === -1)
		return -1
	
	let newStatus = await gitStatus()
	printStatus(newStatus)
	return 0
}

/*TODO: 
	- Implement Add for staging changed but tracked files.
	- Implement remove for unstaging changed but tracked files.
	- Implement commit
	- Implement push
*/

const main = async () => {
	while(1){
		const response = await askAction()
		if (response.action === 'Status') {
			let status = await gitStatus()
			printStatus(status)
		} else if (response.action === 'Track') {
			let exitStatus = await gitTrack()
		} else if (response.action === 'Untrack') {
			let exitStatus = await gitUntack()
		} else if (response.action === 'Add') {

		} else if (response.action === 'Exit') {
			process.exit(0)
		}
	}
}

main()
