curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GH_SECRET" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/fizal619/recipe-book/actions/workflows/create_recipe.yaml/dispatches \
  -d '{"ref":"main","inputs":{"name":"Fried Eggs","description":"It doesnt get easier than this.","steps":"1. Make the eggs.\n2. Cook the eggs.","username":"fizal619","user_secret":"fizal619"}}'
