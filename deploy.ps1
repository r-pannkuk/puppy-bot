# deploy.ps1
# Step 1: Build
npm run build

# Step 2: Check if dist/ exists and has files
if (!(Test-Path -Path "./dist")) {
    Write-Error "dist/ folder does not exist. Aborting deploy."
    exit 1
}

# # Step 3: Force-add dist/ and commit temporarily
# git add -f dist
# # Only commit if there are staged changes
# if ((git diff --cached --name-only).Count -gt 0) {
#     git commit -m "deploy build"
# }

# # Step 4: Create a temporary deploy branch
# git subtree split --prefix dist -b __deploy__

# # Step 5: Push to live remote
# git push live __deploy__:main --force

# # Step 6: Delete temporary branch
# git branch -D __deploy__

# # Step 7 (optional): Remove temporary commit from main history if added
# if ((git log -1 --pretty=%B) -eq "deploy build") {
#     git reset HEAD~1
# }

scp -r .\dist dog@165.22.152.215:/var/deploy/puppy-bot-discord/
ssh dog@165.22.152.215 "sudo systemctl restart puppy-bot-discord.service"