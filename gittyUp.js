const git = require('simple-git/promise')
const { prompt } = require('enquirer')
const Logger = require('purpzielog')

const stat = async (dir) => {
  let statusSummary = null
  try {
    statusSummary = await git(dir).status()
  } catch (e) {
    oops('error stating: ' + e)
  }
  return statusSummary
}

const add = async (dir, files) => {
  let addSummary = null
  try {
    addSummary = await git(dir).add(files)
  } catch (e) {
		oops('error adding: ' + e)
		return -1
  }

  return addSummary
}

const commit = async (dir, message) => {
	let commitSummary = null
	try {
		commitSummary = await git(dir).commit(message)
	} catch (e) {
		oops('error commiting: ' + e)
		return -1
	}
	return commitSummary
}

const simplePush = async (dir, remote, branch) => {
	let pushSummary = null
	try { 
		pushSummary = await git(dir).push(remote, branch)
	} catch (e) {
		oops('error pushing: ' + e)
		return -1
	}
	return pushSummary
}

const unstage = async (dir, files) => {
	let unstagedSummary = null
	try {
		unstagedSummary = await git(dir).reset(['HEAD'].concat(files))
	} catch (e) {
		oops('error adding: ' + e)
		return -1
	}
	return unstagedSummary
}

const remove = async (dir, files) => {
	let removedSummary = null
	try {
		removedSummary = await git(dir).rmKeepLocal(files)
	} catch (e) {
		oops('Error removing: ' + e)
		return -1
	}
	return removedSummary
}

const oops = errorMessage => {
	new Logger().error(errorMessage)
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
	if(status.created.length + status.staged.length < 1) {
		new Logger().warn('No files to be commited')
		return -1
	}
  const log = new Logger({
    tracked: { label: 'Files to be commited', color: 'green' }
  })
  log.tracked(...status.created.concat(status.staged))
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
			'Stage',
			'Unstage',
      'Status',
      'Track',
			'Untrack',
			'Commit',
			'Simple-Push',
			'Simple-Pull',
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
		oops('No files provided!')
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

const gitStage = async () => {
	let status = await gitStatus()
	let choices = await selectFiles(status.modified)
	if(choices === -1)
		return -1
	
	let addedSummary = await add('.', choices.selectFiles)
	if(choices === -1)
		return -1
	
	let newStatus = await gitStatus()
	printStatus(newStatus)
	return 0
}

const gitUnstage = async () => {
	let status = await gitStatus()
	let choices = await selectFiles(status.staged)
	if(choices === -1)
		return -1

	let removedSummary = await unstage('.', choices.selectFiles)
	if(removedSummary === -1)
		return -1
	
	let newStatus = await gitStatus()
	printStatus(newStatus)
	return 0
}

const gitCommit = async () => {
	const dirstat = await gitStatus()
	if(dirstat.created.length + dirstat.staged.length < 1) {
		oops('No files to commit!')
		return -1
	}

	const response = await prompt({
		type: 'input', 
		name: 'commitMessage', 
		message: 'Please provide a commit message:' 
	})
	
	let commitResults = commit('.', response.commitMessage)
	if(commitResults === -1) return -1

	new Logger().info('Commit complete!')
}

const simpleGitPush = async () => {
	new Logger().warn('Pushing to remote origin on master branch!')
	const dirstat = await gitStatus()

	const pushResp = await simplePush('.', 'origin', dirstat.current)
	if(pushResp === -1) return -1

	new Logger().info('Push complete!')	
}

const simpleGitPull = async () => {
	let pullResults = gitPull()
	if(pullResults === -1) return -1
	return pullResults
}

/*TODO: 
	- Test for bugs!
	- Implement simple pull
*/

const main = async () => {
	while(1){
		const response = await askAction()
		if (response.action === 'Status') {
			let status = await gitStatus()
			printStatus(status)
		} else if (response.action === 'Track') {
			await gitTrack()
		} else if (response.action === 'Untrack') {
			await gitUntack()
		} else if (response.action === 'Stage') {
			await gitStage()
		} else if (response.action === 'Unstage') {
			await gitUnstage()
		} else if (response.action === 'Commit') {
			await gitCommit()
		} else if (response.action === 'Simple-Push') {
			await simpleGitPush()
		} else if (response.action === 'Simple-Pull') {
			await simpleGitPull()
		} else if (response.action === 'Exit') {
			process.exit(0)
		}
	}
}

main()
