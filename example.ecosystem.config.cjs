/**
 * PM2 Ecosystem Config
 * 
 * Usage:
 *      staging     -> pm2 start ecosystem.config.cjs --env stating
 *      production  -> pm2 start ecosystem.config.cjs --env production
 * 
 * Deploy ulang (tanpa downtime):
 *      pm2 reload ecosystem.config.cjs --env production
 */

module.exports = {
    apps: [
        // ====== HTTP API Server ======
        {
            name: 'app-api',
            script: 'src/server.js',
            instance: 1,    // single instanace -- ubah ke 'max' untuk cluster mode
            exec_mode: 'fork',    // ganti ke 'cluster' jika instance > 1
            watch: false,
            max_memory_restart: '500M',
            env_staging: {
                NODE_ENV: 'staging',
                PORT: '3000'
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: '3000'
            }
        }
    ]
}