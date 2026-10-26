const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile)

const ALLOWED_ACTIONS = ['start', 'stop', 'restart']
/* -------------- Functions -------------- */
function getStatus(){
    return new Promise((resolve) => {
        execFile('systemctl', ['is-active', 'valheim'], (error, stdout) => {
            const status = stdout.trim() || 'unknown';
            resolve({
                status: status,
                running: status === 'active',
                checkedAt: new Date().toISOString()
            });
        });
    });
};

async function controlServer(action) {
    if(!ALLOWED_ACTIONS.includes(action)){
        throw new Error(`Unknown action: ${action}`)
    }
    await execFileAsync('sudo', ['-n', 'systemctl', action, 'valheim'])
}

module.exports = { getStatus, controlServer };