[CmdletBinding()]
param(
    [string]$CommitMessage = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ErrorActionPreference = "Stop"

$ExpectedLocalRemote = "git@github.com:dee2025/daily-life-tools.git"
$ExpectedProductionRemote = "https://github.com/dee2025/daily-life-tools.git"
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

if ($origin -ne $ExpectedLocalRemote.TrimEnd("/")) {
    throw "Refusing to deploy an unexpected repository. Expected $ExpectedLocalRemote but found $origin"
}

Write-Host "Checking GitHub push access..." -ForegroundColor Cyan
Invoke-CheckedCommand -Command git -CommandArguments @("push", "--dry-run", "origin", "HEAD:main")

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

if [ ! -d "$app_directory" ]; then
  echo "Production directory does not exist: $app_directory" >&2
  exit 1
fi

app_owner="$(stat -c '%U' "$app_directory")"
app_group="$(stat -c '%G' "$app_directory")"

run_as_app() {
  if [ "$app_owner" = "root" ]; then
    "$@"
  else
    runuser -u "$app_owner" -- "$@"
  fi
}

bootstrap_production() {
  release_directory="$(mktemp -d "${app_directory}.release.XXXXXX")"
  backup_directory="${app_directory}.backup.$(date -u +%Y%m%dT%H%M%SZ)"

  echo "Creating the initial production Git checkout..."
  git clone --branch main --single-branch "$expected_remote" "$release_directory"

  actual_commit="$(git -C "$release_directory" rev-parse HEAD)"
  if [ "$actual_commit" != "$expected_commit" ]; then
    echo "Cloned commit $actual_commit does not match pushed commit $expected_commit." >&2
    exit 1
  fi

  for env_name in .env .env.local .env.production .env.production.local; do
    if [ -f "$app_directory/$env_name" ]; then
      cp -p "$app_directory/$env_name" "$release_directory/$env_name"
    fi
  done

  chown -R "$app_owner:$app_group" "$release_directory"
  run_as_app npm --prefix "$release_directory" ci
  run_as_app npm --prefix "$release_directory" run build

  systemctl stop "$service"
  mv "$app_directory" "$backup_directory"

  if ! mv "$release_directory" "$app_directory"; then
    mv "$backup_directory" "$app_directory"
    systemctl start "$service"
    echo "Unable to switch the new release into place; the previous production directory was restored." >&2
    exit 1
  fi

  if ! systemctl start "$service" || ! systemctl is-active --quiet "$service"; then
    failed_directory="${app_directory}.failed.$(date -u +%Y%m%dT%H%M%SZ)"
    systemctl stop "$service" || true
    mv "$app_directory" "$failed_directory"
    mv "$backup_directory" "$app_directory"
    systemctl start "$service"
    echo "The new release failed to start; the previous production directory was restored." >&2
    echo "Failed release retained at: $failed_directory" >&2
    exit 1
  fi

  echo "Initial Git deployment completed. Previous production files retained at: $backup_directory"
  echo "Production is live at commit $actual_commit"
}

if [ ! -d "$app_directory/.git" ]; then
  bootstrap_production
  exit 0
fi

cd "$app_directory"

remote_url="$(run_as_app git remote get-url origin)"
if [ "${remote_url%/}" != "${expected_remote%/}" ]; then
  echo "Unexpected production Git remote: $remote_url" >&2
  exit 1
fi

if [ -n "$(run_as_app git status --porcelain)" ]; then
  echo "Production has uncommitted changes. Refusing to overwrite them." >&2
  run_as_app git status --short >&2
  exit 1
fi

run_as_app git fetch origin main
run_as_app git checkout main
run_as_app git pull --ff-only origin main

actual_commit="$(run_as_app git rev-parse HEAD)"
if [ "$actual_commit" != "$expected_commit" ]; then
  echo "Production commit $actual_commit does not match pushed commit $expected_commit." >&2
  exit 1
fi

run_as_app npm ci
run_as_app npm run build
systemctl restart "$service"
systemctl is-active --quiet "$service"

echo "Production is live at commit $actual_commit"
'@

Write-Host "Deploying commit $localCommit to production..." -ForegroundColor Cyan
$remoteScript | & ssh $Server bash -se -- $AppDirectory $Service $localCommit $ExpectedProductionRemote
if ($LASTEXITCODE -ne 0) {
    throw "Production deployment failed with exit code $LASTEXITCODE."
}

Write-Host "Deployment completed successfully." -ForegroundColor Green
