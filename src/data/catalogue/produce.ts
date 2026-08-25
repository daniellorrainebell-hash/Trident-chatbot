import type { CatalogueFood } from './types';
import { f, PLANT } from './helpers';

/**
 * Fruit and vegetables (Feed spec §15.4, §15.5).
 *
 * All raw or as sold, because that is how they are bought and weighed. Items
 * that double as a carbohydrate source — potatoes, bananas — are declared in
 * the carbohydrate file and carry both categories from there, so no food is
 * duplicated across two records.
 */
export const FRUIT_FOODS: CatalogueFood[] = [
  f('strawberries', 'Strawberries', [], ['fruit'], 'fruit_vegetables', 'as_sold', 32, 0.7, 7.7, 0.3, 2.0, 150, PLANT),
  f('blueberries', 'Blueberries', [], ['fruit'], 'fruit_vegetables', 'as_sold', 57, 0.7, 14.5, 0.3, 2.4, 100, PLANT),
  f('raspberries', 'Raspberries', [], ['fruit'], 'fruit_vegetables', 'as_sold', 52, 1.2, 11.9, 0.7, 6.5, 100, PLANT),
  f('blackberries', 'Blackberries', [], ['fruit'], 'fruit_vegetables', 'as_sold', 43, 1.4, 9.6, 0.5, 5.3, 100, PLANT),
  f('grapes', 'Grapes', [], ['fruit'], 'fruit_vegetables', 'as_sold', 69, 0.7, 18.1, 0.2, 0.9, 100, PLANT),
  f('kiwi', 'Kiwi', [], ['fruit'], 'fruit_vegetables', 'as_sold', 61, 1.1, 14.7, 0.5, 3.0, 90, PLANT, { averageItemWeightG: 75 }),
  f('peach', 'Peach', [], ['fruit'], 'fruit_vegetables', 'as_sold', 39, 0.9, 9.5, 0.3, 1.5, 150, PLANT),
  f('nectarine', 'Nectarine', [], ['fruit'], 'fruit_vegetables', 'as_sold', 44, 1.1, 10.6, 0.3, 1.7, 140, PLANT),
  f('pear', 'Pear', [], ['fruit'], 'fruit_vegetables', 'as_sold', 57, 0.4, 15.2, 0.1, 3.1, 170, PLANT),
  f('watermelon', 'Watermelon', [], ['fruit'], 'fruit_vegetables', 'as_sold', 30, 0.6, 7.6, 0.2, 0.4, 200, PLANT),
  f('melon', 'Melon', ['cantaloupe'], ['fruit'], 'fruit_vegetables', 'as_sold', 34, 0.8, 8.2, 0.2, 0.9, 200, PLANT),
  f('cherries', 'Cherries', [], ['fruit'], 'fruit_vegetables', 'as_sold', 63, 1.1, 16.0, 0.2, 2.1, 120, PLANT),
  f('plums', 'Plums', ['plum'], ['fruit'], 'fruit_vegetables', 'as_sold', 46, 0.7, 11.4, 0.3, 1.4, 120, PLANT),
  f('grapefruit', 'Grapefruit', [], ['fruit'], 'fruit_vegetables', 'as_sold', 42, 0.8, 10.7, 0.1, 1.6, 150, PLANT),
  f('lemon', 'Lemon', [], ['fruit', 'pantry'], 'fruit_vegetables', 'as_sold', 29, 1.1, 9.3, 0.3, 2.8, 30, PLANT),
  f('lime', 'Lime', [], ['fruit', 'pantry'], 'fruit_vegetables', 'as_sold', 30, 0.7, 10.5, 0.2, 2.8, 30, PLANT),
  f('passion-fruit', 'Passion fruit', [], ['fruit'], 'fruit_vegetables', 'as_sold', 97, 2.2, 23.4, 0.7, 10.4, 60, PLANT),
  f('pomegranate', 'Pomegranate', [], ['fruit'], 'fruit_vegetables', 'as_sold', 83, 1.7, 18.7, 1.2, 4.0, 100, PLANT),
];

export const VEGETABLE_FOODS: CatalogueFood[] = [
  f('broccoli', 'Broccoli', [], ['vegetable'], 'fruit_vegetables', 'raw', 34, 2.8, 4.0, 0.4, 2.6, 150, PLANT),
  f('tenderstem-broccoli', 'Tenderstem broccoli', ['broccolini'], ['vegetable'], 'fruit_vegetables', 'raw', 35, 3.0, 4.2, 0.4, 2.8, 150, PLANT),
  f('spinach', 'Spinach', [], ['vegetable'], 'fruit_vegetables', 'raw', 23, 2.9, 1.4, 0.4, 2.2, 100, PLANT),
  f('kale', 'Kale', [], ['vegetable'], 'fruit_vegetables', 'raw', 49, 4.3, 8.8, 0.9, 3.6, 100, PLANT),
  f('peppers', 'Peppers', ['bell pepper', 'capsicum'], ['vegetable'], 'fruit_vegetables', 'raw', 31, 1.0, 4.6, 0.3, 2.1, 120, PLANT),
  f('onion', 'Onion', ['onions'], ['vegetable'], 'fruit_vegetables', 'raw', 40, 1.1, 7.6, 0.1, 1.7, 80, PLANT),
  f('red-onion', 'Red onion', [], ['vegetable'], 'fruit_vegetables', 'raw', 40, 1.1, 7.6, 0.1, 1.7, 80, PLANT),
  f('tomatoes', 'Tomatoes', ['tomato'], ['vegetable'], 'fruit_vegetables', 'raw', 18, 0.9, 2.7, 0.2, 1.2, 100, PLANT),
  f('cherry-tomatoes', 'Cherry tomatoes', [], ['vegetable'], 'fruit_vegetables', 'raw', 18, 0.9, 2.7, 0.2, 1.2, 100, PLANT),
  f('cucumber', 'Cucumber', [], ['vegetable'], 'fruit_vegetables', 'raw', 15, 0.7, 3.6, 0.1, 0.5, 100, PLANT),
  f('carrots', 'Carrots', ['carrot'], ['vegetable'], 'fruit_vegetables', 'raw', 41, 0.9, 7.0, 0.2, 2.8, 100, PLANT),
  f('green-beans', 'Green beans', [], ['vegetable'], 'fruit_vegetables', 'raw', 31, 1.8, 4.5, 0.2, 2.7, 120, PLANT),
  f('asparagus', 'Asparagus', [], ['vegetable'], 'fruit_vegetables', 'raw', 20, 2.2, 2.0, 0.1, 2.1, 120, PLANT),
  f('courgette', 'Courgette', ['zucchini'], ['vegetable'], 'fruit_vegetables', 'raw', 17, 1.2, 2.1, 0.3, 1.0, 150, PLANT),
  f('aubergine', 'Aubergine', ['eggplant'], ['vegetable'], 'fruit_vegetables', 'raw', 25, 1.0, 5.9, 0.2, 3.0, 150, PLANT),
  f('mushrooms', 'Mushrooms', ['mushroom'], ['vegetable'], 'fruit_vegetables', 'raw', 22, 3.1, 1.3, 0.3, 1.0, 100, PLANT),
  f('cauliflower', 'Cauliflower', [], ['vegetable'], 'fruit_vegetables', 'raw', 25, 1.9, 5.0, 0.3, 2.0, 150, PLANT),
  f('cabbage', 'Cabbage', [], ['vegetable'], 'fruit_vegetables', 'raw', 25, 1.3, 5.8, 0.1, 2.5, 120, PLANT),
  f('red-cabbage', 'Red cabbage', [], ['vegetable'], 'fruit_vegetables', 'raw', 31, 1.4, 7.4, 0.2, 2.1, 120, PLANT),
  f('mixed-leaves', 'Mixed leaves', ['salad', 'mixed salad'], ['vegetable'], 'fruit_vegetables', 'as_sold', 17, 1.4, 1.5, 0.2, 1.8, 80, PLANT),
  f('lettuce', 'Lettuce', [], ['vegetable'], 'fruit_vegetables', 'as_sold', 15, 1.4, 2.9, 0.2, 1.3, 80, PLANT),
  f('rocket', 'Rocket', ['arugula'], ['vegetable'], 'fruit_vegetables', 'as_sold', 25, 2.6, 3.7, 0.7, 1.6, 60, PLANT),
  f('sweetcorn', 'Sweetcorn', ['corn'], ['vegetable', 'carbohydrate'], 'pantry', 'drained', 86, 3.2, 19.0, 1.2, 2.7, 100, PLANT),
  f('peas', 'Peas', ['garden peas'], ['vegetable', 'carbohydrate'], 'frozen', 'as_sold', 81, 5.4, 14.5, 0.4, 5.1, 100, PLANT),
  f('mangetout', 'Mangetout', ['snow peas'], ['vegetable'], 'fruit_vegetables', 'raw', 42, 2.8, 7.6, 0.2, 2.6, 100, PLANT),
  f('beetroot', 'Beetroot', [], ['vegetable'], 'fruit_vegetables', 'as_sold', 43, 1.6, 9.6, 0.2, 2.8, 100, PLANT),
  f('celery', 'Celery', [], ['vegetable'], 'fruit_vegetables', 'raw', 14, 0.7, 3.0, 0.2, 1.6, 80, PLANT, { allergens: ['celery'] }),
  f('leeks', 'Leeks', ['leek'], ['vegetable'], 'fruit_vegetables', 'raw', 61, 1.5, 14.2, 0.3, 1.8, 100, PLANT),
  f('pak-choi', 'Pak choi', ['bok choy'], ['vegetable'], 'fruit_vegetables', 'raw', 13, 1.5, 2.2, 0.2, 1.0, 120, PLANT),
  f('brussels-sprouts', 'Brussels sprouts', ['sprouts'], ['vegetable'], 'fruit_vegetables', 'raw', 43, 3.4, 8.9, 0.3, 3.8, 120, PLANT),
  f('butternut-squash', 'Butternut squash', ['squash'], ['vegetable', 'carbohydrate'], 'fruit_vegetables', 'raw', 45, 1.0, 11.7, 0.1, 2.0, 200, PLANT),
  f('pumpkin', 'Pumpkin', [], ['vegetable'], 'fruit_vegetables', 'raw', 26, 1.0, 6.5, 0.1, 0.5, 200, PLANT),
];
