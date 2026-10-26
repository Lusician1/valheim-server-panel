const { execFile } = require('child_process');

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

module.exports = { getStatus }