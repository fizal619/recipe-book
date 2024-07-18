const SHA256 = new Hashes.SHA256;
const prefix = "github_pat";
const half = "_11AAP7WCI0JB6hAb3gcLmL_";
const otherHalf = "uvFAKqNIoDczm6rhgfFVHNDWauBfXKHDC6Soj9mo205TWBZUXW5wkPgoGVS";

let currentScreen = "recipeListScreen";
let userId = "";
let deleteRecipeFilename = "";

function goto(pageName) {
  const screens = document.getElementsByClassName('page');
  for (let i = 0; i < screens.length; i++) {
    screens[i].classList.add('is-hidden');
  }
  document.getElementById(pageName).classList.remove('is-hidden');
}

async function getRecipes(userId) {
  const response = await fetch(
    `https://raw.githubusercontent.com/fizal619/recipe-book/main/recipes/${userId}/index.list?token=${Date.now()}`,
    {cache: "no-store"}
  );
  const data = await response.text();
  if (response.status === 404) {
    return [];
  }
  return data.split("\n").filter(x => x !== "");
}

async function getSingleRecipe(filename, userId) {
  const response = await fetch(
    `https://raw.githubusercontent.com/fizal619/recipe-book/main/recipes/${userId}/${filename}?token=${Date.now()}`
  );
  const data = await response.text();
  if (response.status === 404) {
    return "Recipe was probably deleted, go back and try again.";
  }
  return data;
}

async function getUserName(userId) {
  const response = await fetch(
    `https://raw.githubusercontent.com/fizal619/recipe-book/main/users/${userId}/name?token=${Date.now()}`
  );
  const data = await response.text();
  if (response.status === 404) {
    return "";
  }
  return data;
}

async function deleteRecipe() {
  const username = localStorage.getItem('username');
  const userSecret = localStorage.getItem('userSecret');
  const auth = `${prefix}${half}${otherHalf}`;
  const url = `https://api.github.com/repos/fizal619/recipe-book/actions/workflows/delete_recipe.yaml/dispatches`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `token ${auth}`,
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      'ref': 'main',
      'inputs': {
        'filename': deleteRecipeFilename,
        'username': username,
        'user_secret': userSecret
      }
    })
  }).then(x => x.text()).then(x => {
    Toastify({
      text: "Recipe will be deleted shortly. Refresh to see changes in a minute.",
      className: "success",
      position: "center"
    }).showToast();
    currentScreen = "recipeListScreen";
    render();
  }).catch(x => {
    console.log(x);
    Toastify({
      text: "Failed to delete recipe. Please try again later.",
      className: "danger",
      position: "center"
    }).showToast();
  });
}

async function viewRecipe(filename, userId) {
  const recipe = await getSingleRecipe(filename, userId);
  const username = await getUserName(userId);

  const converter = new showdown.Converter();
  const recipeHTML = converter.makeHtml(recipe)
  document.getElementById('recipeBox').innerHTML = recipeHTML;
  document.getElementById('recipeUser').textContent = `${username}`;

  deleteRecipeFilename=filename;

  goto("viewRecipeScreen");
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

  if (userId) {
    const userRecipes = await getRecipes(userId);
    console.log(userRecipes);
    recipeList.innerHTML = userRecipes.map(x => `
      <div onclick="viewRecipe('${x}', '${userId}')" class="box is-flex is-justify-content-space-between recipe-item">
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
document.querySelectorAll('.cancelRecipeBtn').forEach(x => x.addEventListener('click', () => {
  goto('recipeListScreen');
}));
document.getElementById('deleteRecipeBtn').addEventListener('click', deleteRecipe);

document.getElementById('submitRecipeBtn').addEventListener('click', createRecipe);

render();

