# Daily Life Tools

## Deploy to production

Run this single command from the project directory:

```powershell
npm run deploy
```

It builds the project locally, commits the current changes, rebases and pushes the `main` branch to GitHub, then connects to `root@213.199.57.13`, pulls the same commit, installs production dependencies, builds the application, and restarts `dailylifetools.service`.

This repository uses the personal GitHub SSH key for the `dee2025` account, without changing authentication for other repositories or accounts. SSH access to the production server must also be configured; otherwise, OpenSSH will securely ask for the server password. The password is intentionally not stored in this repository or command.
