const SHA256 = new Hashes.SHA256;
const prefix = "github_pat";
const half = "_11AAP7WCI0JB6hAb3gcLmL_";
const otherHalf = "uvFAKqNIoDczm6rhgfFVHNDWauBfXKHDC6Soj9mo205TWBZUXW5wkPgoGVS";

let currentScreen = "recipeListScreen";
let userId = "";

function goto(pageName) {
  const screens = document.getElementsByClassName('page');
  for (let i = 0; i < screens.length; i++) {
    screens[i].classList.add('is-hidden');
  }
  document.getElementById(pageName).classList.remove('is-hidden');
}
async function getRecipes(userId) {
  const response = await fetch(`https://raw.githubusercontent.com/fizal619/recipe-book/main/recipes/${userId}/index.list`);
  const data = await response.text();
  if (response.status === 404) {
    return [];
  }
  return data.split("\n");
}

async function render() {
  const username = localStorage.getItem('username');
  const userSecret = localStorage.getItem('userSecret');
  const recipeList = document.getElementById('recipeList');

  if (!username && !userSecret) {
    currentScreen = "createUserScreen";
  } else {
    userId = SHA256.hex(`${username} ${userSecret}`);
    currentScreen = "recipeListScreen";
  }
  console.log(userId);
  if (userId) {
    const userRecipes = await getRecipes(userId);
    console.log(userRecipes);
    recipeList.innerHTML = userRecipes.map(x => `
      <div class="box">
        <p>${x}</p>
      </div>
    `).join("");
  }
  goto(currentScreen);
}

function registerUser() {
  const username = document.getElementById('username').value;
  const userSecret = document.getElementById('userSecret').value;
  localStorage.setItem('username', username);
  localStorage.setItem('userSecret', userSecret);
  render();
}

function createRecipe() {
  const recipeName = document.getElementById('recipeName');
  const recipeDescription = document.getElementById('recipeDescription');
  const recipeContent = document.getElementById('recipeContent');
  const username = localStorage.getItem('username');
  const userSecret = localStorage.getItem('userSecret');
  const auth = `${prefix}${half}${otherHalf}`;
  const url = `https://api.github.com/repos/fizal619/recipe-book/actions/workflows/create_recipe.yaml/dispatches`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `token ${auth}`,
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      'ref': 'main',
      'inputs': {
        'name': recipeName.value,
        'description': recipeDescription.value,
        'steps': recipeContent.value,
        'username': username,
        'user_secret': userSecret
      }
    })
  }).then(x => x.json()).then(x => {
    console.log(x);
  }).catch(x => {
    console.log(x);
  });
  recipeName.value = '';
  recipeDescription.value = '';
  recipeContent.value = '';
  goto('recipeListScreen');
}

document.getElementById('createUserBtn').addEventListener('click', registerUser);
document.getElementById('createRecipeBtn').addEventListener('click', () => {
  goto('createRecipeScreen');
});
document.getElementById('cancelRecipeBtn').addEventListener('click', () => {
  goto('recipeListScreen');
});
document.getElementById('submitRecipeBtn').addEventListener('click', createRecipe);

render();

