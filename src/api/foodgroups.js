const API_KEY = 'j8Ub8aAHP25xJbnAm9vewbdDza3dtyWW3VEsoeo6';
const cache = {};

/**
 * Fetches the food group/category for a given food name from USDA FoodData Central API.
 * @param {string} foodName
 * @returns {Promise<string|null>} The food group/category, or null if not found.
 */
export async function getFoodGroupFromUSDA(foodName) {
  if (!foodName) return null;
  const key = foodName.trim().toLowerCase();
  if (cache[key]) return cache[key];
  try {
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(foodName)}&pageSize=1`);
    const data = await res.json();
    if (data.foods && data.foods.length > 0) {
      const group = data.foods[0].foodCategory || null;
      cache[key] = group;
      return group;
    }
    cache[key] = null;
    return null;
  } catch (e) {
    return null;
  }
} 
