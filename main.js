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

async function viewRecipe(filename, recipeUserId) {
  const recipe = await getSingleRecipe(filename, recipeUserId);
  const username = await getUserName(recipeUserId);

  const converter = new showdown.Converter();
  const recipeHTML = converter.makeHtml(recipe);

  document.getElementById('recipeBox').innerHTML = recipeHTML;
  document.getElementById('recipeUser').textContent = `${username}`;

  deleteRecipeFilename=filename;

  if (recipeUserId === userId) {
    document.getElementById('deleteRecipeBtn').classList.remove('is-hidden');
  } else {
    document.getElementById('deleteRecipeBtn').classList.add('is-hidden');
  }

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

    recipeList.innerHTML = userRecipes.map(x => `
      <div onclick="viewRecipe('${x}', '${userId}')" class="box is-flex is-justify-content-space-between recipe-item">
        <p>${x}</p>
      </div>
    `).join("");
  }

  renderFriendListScreen();

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
  }).then(x => x.text()).then(x => {
    console.log(x);
    Toastify({
      text: "Recipe will be created shortly. Refresh to see changes in a minute.",
      className: "success",
      position: "center"
    }).showToast();
  }).catch(x => {
    console.log(x);
    Toastify({
      text: "Failed to create recipe. Please try again later.",
      className: "success",
      position: "center"
    }).showToast();
  });
  recipeName.value = '';
  recipeDescription.value = '';
  recipeContent.value = '';
  goto('recipeListScreen');
}

function addFriend() {
  const friendCode = prompt("Enter friend code:");
  const friends = localStorage.getItem('friends') || "[]";
  const friendsList = JSON.parse(friends);
  const friendSet = new Set(friendsList);
  if (!friendSet.has(friendCode)) {
    friendsList.push(friendCode);
    localStorage.setItem('friends', JSON.stringify(friendsList));
    renderFriendListScreen();
  }
}

async function getFriendNames(friendsList) {
  const friendNames = {};
  for (const friend of friendsList) {
    const username = await getUserName(friend);
    friendNames[friend] = username;
  }
  return friendNames;
}

async function getFriendRecipes(friendList) {
  const friendRecipes = {};
  for (const friend of friendList) {
    const userRecipes = await getRecipes(friend);
    friendRecipes[friend] = userRecipes;
  }
  return friendRecipes;
}

async function renderFriendListScreen() {
  const friends = localStorage.getItem('friends') || "[]";
  const friendsList = JSON.parse(friends);
  const friendNames = await getFriendNames(friendsList);
  document.getElementById('friendList').innerHTML = friendsList.map(x => `
    <div class="box is-flex is-justify-content-space-between friend-item">
      <p>${friendNames[x]}</p>
    </div>
  `).join("");

  const friendRecipes = await getFriendRecipes(friendsList);
  document.getElementById('friendRecipeList').innerHTML = friendsList.map(x => {
    const recipes = friendRecipes[x];
    return recipes.map(y => `
      <div onclick="viewRecipe('${y}', '${x}')" class="box is-flex is-justify-content-space-between recipe-item">
        <p>${y} by ${friendNames[x]}</p>
      </div>
    `).join("");
  }).join("");

}

document.getElementById('createUserBtn').addEventListener('click', registerUser);
document.getElementById('createRecipeBtn').addEventListener('click', () => {
  goto('createRecipeScreen');
});
document.getElementById('friendsBtn').addEventListener('click', () => {
  goto('friendReceipeListScreen');
});
document.querySelectorAll('.cancelRecipeBtn').forEach(x => x.addEventListener('click', () => {
  goto('recipeListScreen');
}));

document.getElementById('deleteRecipeBtn').addEventListener('click', deleteRecipe);

document.getElementById('submitRecipeBtn').addEventListener('click', createRecipe);

document.getElementById("friendCode").addEventListener("click", () => {
  navigator.clipboard.writeText(userId);
  Toastify({
    text: "Friend code copied to clipboard.",
    className: "success",
    position: "center"
  }).showToast();
})

document.getElementById('addFriendButton').addEventListener('click',addFriend);

render();

