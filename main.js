const SHA256 = new Hashes.SHA256;
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
  return data.split(" ").filter(x => x !== "index.list" && x !== "");
}

async function render() {
  const createUserScrreen = document.getElementById('createUserScreen');
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
    recipeList.innerHTML = userRecipes.map(x => `<div class="box"><p>${x}</p></div>`).join("");
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

document.getElementById('createUserBtn').addEventListener('click', registerUser);

render();

