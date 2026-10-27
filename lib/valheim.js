const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const ALLOWED_ACTIONS = ['start', 'stop', 'restart'];
/* -------------- Functions -------------- */
async function getStatus() {
    let status;
    try {
        const { stdout } = await execFileAsync('systemctl', ['is-active', 'valheim']);
        status = stdout.trim();
    } catch (error) {
        status = error.stdout?.trim() || 'unknown';
    }
    return { status, running: status === 'active', checkedAt: new Date().toISOString() };
}

async function controlServer(action) {
    if(!ALLOWED_ACTIONS.includes(action)){
        throw new Error(`Unknown action: ${action}`);
    }
    
    /* DEV CODE. REMOVE LATER */
    if (process.platform !== 'linux') {
        return new Promise(resolve => setTimeout(resolve, 2000));
    }
    /* END OF DEV CODE */

    await execFileAsync('sudo', ['-n', 'systemctl', action, 'valheim']);
}

module.exports = { getStatus, controlServer };