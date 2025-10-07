import "../styles/Recipes.css";

export default function RecipesPage() {
  //this is only a placeholder for now, we will get recipes from an api call we make using axios
  const recipes = [
    {
      id: 1,
      title: "Spaghetti Carbonara",
      description:
        "A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.",
      image:
        "https://www.allrecipes.com/thmb/Vg2cRidr2zcYhWGvPD8M18xM_WY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/11973-spaghetti-carbonara-ii-DDMFS-4x3-6edea51e421e4457ac0c3269f3be5157.jpg",
    },
    {
      id: 2,
      title: "Chicken Caesar Salad",
      description:
        "A fresh salad with grilled chicken, romaine lettuce, croutons, and Caesar dressing.",
      image:
        "https://s23209.pcdn.co/wp-content/uploads/2023/01/220905_DD_Chx-Caesar-Salad_051.jpg",
    },
    {
      id: 3,
      title: "Beef Stir Fry",
      description:
        "A quick and easy stir fry with tender beef, vegetables, and a savory sauce.",
      image:
        "https://lifeloveandgoodfood.com/wp-content/uploads/2022/06/Pepper-Steak-Stir-Fry-2-1200x1200-1.jpg",
    },
    {
      id: 4,
      title: "Chocolate Chip Cookies",
      description: "Soft and chewy cookies loaded with chocolate chips.",
      image:
        "https://pinchofyum.com/wp-content/uploads/Chocolate-Chip-Cookies-Recipe.jpg",
    },
    {
      id: 5,
      title: "Margherita Pizza",
      description:
        "A simple pizza topped with fresh tomatoes, mozzarella, basil, and olive oil.",
      image:
        "https://cdn.loveandlemons.com/wp-content/uploads/opengraph/2023/07/margherita-pizza-recipe.jpg",
    },
    {
      id: 6,
      title: "Tomato Basil Soup",
      description:
        "A creamy soup made with fresh tomatoes, basil, and a hint of garlic.",
      image:
        "https://www.cookingclassy.com/wp-content/uploads/2018/03/roasted-tomato-soup-4.jpg",
    },
  ];

  return (
    <div className="rec-container">
      <div className="recipes-container">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="recipe-image"
            />
            <h3>{recipe.title}</h3>
            <p>{recipe.description}</p>
            <button className="view-recipe-button">View Recipe</button>
          </div>
        ))}
      </div>
    </div>
  );
}
