[CmdletBinding()]
param(
    [string]$CommitMessage = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ErrorActionPreference = "Stop"

$ExpectedRemote = "https://github.com/dee2025/daily-life-tools.git"
$Server = "root@213.199.57.13"
$AppDirectory = "/home/dailylifetools/htdocs/www.dailylifetools.in"
$Service = "dailylifetools.service"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$CommandArguments
    )

    & $Command @CommandArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command $($CommandArguments -join ' ')"
    }
}

$currentBranch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read the current Git branch."
}

if ($currentBranch -ne "main") {
    throw "Deployment must be run from the main branch. Current branch: $currentBranch"
}

$origin = (& git remote get-url origin).TrimEnd("/")
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read the origin remote."
}

if ($origin -ne $ExpectedRemote.TrimEnd("/")) {
    throw "Refusing to deploy an unexpected repository. Expected $ExpectedRemote but found $origin"
}

Write-Host "Building the local application..." -ForegroundColor Cyan
Invoke-CheckedCommand -Command npm -CommandArguments @("run", "build")

Write-Host "Staging the current project changes..." -ForegroundColor Cyan
Invoke-CheckedCommand -Command git -CommandArguments @("add", "--all")

$sensitiveFiles = @(& git diff --cached --name-only --diff-filter=ACMR | Where-Object {
    $_ -match '(^|/)(\.env($|\.)|\.codex-ssh\.py$)' -or $_ -match '\.(pem|key|p12|pfx)$'
})

if ($sensitiveFiles.Count -gt 0) {
    throw "Refusing to commit possible credentials: $($sensitiveFiles -join ', ')"
}

& git diff --cached --quiet
$hasStagedChanges = $LASTEXITCODE -eq 1
if ($LASTEXITCODE -notin @(0, 1)) {
    throw "Unable to inspect staged changes."
}

if ($hasStagedChanges) {
    Write-Host "Committing changes..." -ForegroundColor Cyan
    Invoke-CheckedCommand -Command git -CommandArguments @("commit", "-m", $CommitMessage)
}
else {
    Write-Host "No new local changes to commit." -ForegroundColor DarkGray
}

Write-Host "Rebasing on GitHub main..." -ForegroundColor Cyan
Invoke-CheckedCommand -Command git -CommandArguments @("pull", "--rebase", "origin", "main")

Write-Host "Pushing main to GitHub..." -ForegroundColor Cyan
Invoke-CheckedCommand -Command git -CommandArguments @("push", "origin", "main")

$localCommit = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read the local commit."
}

$remoteScript = @'
set -Eeuo pipefail

app_directory="$1"
service="$2"
expected_commit="$3"
expected_remote="$4"

if [ ! -d "$app_directory/.git" ]; then
  echo "Production directory is not a Git checkout: $app_directory" >&2
  echo "Clone $expected_remote into that directory once, then rerun the deploy command." >&2
  exit 1
fi

cd "$app_directory"

remote_url="$(git remote get-url origin)"
if [ "${remote_url%/}" != "${expected_remote%/}" ]; then
  echo "Unexpected production Git remote: $remote_url" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Production has uncommitted changes. Refusing to overwrite them." >&2
  git status --short >&2
  exit 1
fi

git fetch origin main
git checkout main
git pull --ff-only origin main

actual_commit="$(git rev-parse HEAD)"
if [ "$actual_commit" != "$expected_commit" ]; then
  echo "Production commit $actual_commit does not match pushed commit $expected_commit." >&2
  exit 1
fi

npm ci
npm run build
systemctl restart "$service"
systemctl is-active --quiet "$service"

echo "Production is live at commit $actual_commit"
'@

Write-Host "Deploying commit $localCommit to production..." -ForegroundColor Cyan
$remoteScript | & ssh $Server bash -se -- $AppDirectory $Service $localCommit $ExpectedRemote
if ($LASTEXITCODE -ne 0) {
    throw "Production deployment failed with exit code $LASTEXITCODE."
}

Write-Host "Deployment completed successfully." -ForegroundColor Green
