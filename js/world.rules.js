/*!
 * world.rules.js
 * Manage rules of a world.
 * Apply new rules to the world every year.
 *
 * World JS
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Rules;

    /**
     * Rules constructor
     * Define default rules of the world
     */
    Rules = WorldJS.Rules = function(world) {
        var worldRules = this;

        // Store reference of a world
        worldRules.world = world;

        worldRules.population = {
            limit: 100
        };

        worldRules.baseIQ = 0;

        // Base chances
        worldRules.chance = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        // Chances that increase or decrease temporarily
        // based on some specific value
        worldRules.chanceIncr = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        worldRules.food = {
            adult: 1,               // Produce 1 food per year
            child: -1,              // Consume 1 food per year
            resourceIncr: 0,        // Percent of food resource increase per 10 years (if enabled)
            min: -10000             // Minimum food value
        };

        // When famine affected,
        // death chance increase 10% every -100 food
        worldRules.famine = {
            deathChanceIncr: 0.1,
            unit: -100
        };

        // Food decrease 90% every 100 years
        worldRules.foodSpoilage = {
            foodDecr: 0.9,
            interval: 1
        };

        // Death chance increase for each man surpass the population limit
        worldRules.largeCooperation = {
            deathChanceIncr: 0.1,
            unit: 1
        };

        var worldEvent = world.event;
        worldEvent.add('yearPassed', 'rules', function() {
            var world = this;
            world.rules.change();
        });
        worldEvent.add('seedAdded', 'rules', function(data) {
            var world = this;
            data.seed.iq += world.rules.baseIQ;
        });
    };

    /**
     * Change rules of the world
     */
    Rules.prototype.change = function() {
        var worldRules = this,
            world = worldRules.world,

            worldStatistic = world.statistic,

            food = worldStatistic.food,
            foodResource = worldStatistic.foodResource,
            population = worldStatistic.population,

            totalAdult = worldStatistic.men + worldStatistic.women,
            totalChildren = worldStatistic.boys + worldStatistic.girls;

        var foodProduce = Math.min(foodResource, totalAdult * worldRules.food.adult),
            foodConsume = totalChildren * worldRules.food.child,
            foodDelta = foodProduce + foodConsume;

        // Obtain food from food resource
        foodResource = Math.max(0, foodResource - foodProduce);
        food += foodDelta;

        if (food < worldRules.food.min) {
            food = worldRules.food.min;
        }

        var deathChance = 0,
            delta = 0;

        // Famine: increase death chance
        if (food <= worldRules.famine.unit) {
            delta = Math.floor(food / worldRules.famine.unit);
            deathChance += delta * worldRules.famine.deathChanceIncr;
        }

        // Food spoilage: decrease food
        if (worldStatistic.year % worldRules.foodSpoilage.interval === 0 && food > 0) {
            food -= Math.floor(food * worldRules.foodSpoilage.foodDecr);
        }

        // Population limit: increase death chance
        if (population > worldRules.population.limit) {
            delta = population - worldRules.population.limit;
            deathChance += delta * worldRules.largeCooperation.deathChanceIncr;
        }

        // Apply new changes
        worldStatistic.food = food;
        worldStatistic.foodResource = foodResource;
        worldRules.chance.death = deathChance + worldRules.chanceIncr.death;
    };
})(window);