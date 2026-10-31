# Daily Life Tools

## Deploy to production

Run this single command from the project directory:

```powershell
npm run deploy
```

It builds the project locally, commits the current changes, rebases and pushes the `main` branch to GitHub, then connects to `root@213.199.57.13`, pulls the same commit, installs production dependencies, builds the application, and restarts `dailylifetools.service`.

GitHub authentication and SSH access must already be configured on this computer. Use an SSH key or enter the server password when OpenSSH asks for it. The server password is intentionally not stored in this repository or command.
