const moment = require('moment-timezone');
import { checkAuth } from "./auth";
import { MAX_PIZZAS, Order } from "./model/order";
import { NextFunction, Request, Response } from "express";
import { Pizza, PizzaDocument } from "./model/pizza";
import mongoose from "mongoose";
import { constants } from "./config";

/**
 * Get all orders
 */
export async function getAllOrders(req: Request, res: Response) {
    await checkAuth(req, res);

    const orders = await Order.find();

    // Add the pizzas to the orders
    for (const order of orders) {

        if (order.pizzas) {
            // Get the pizzas for the order
            const pizzaDetails = await Pizza
                .find({ _id: { $in: order.pizzas } })
                .select('name price');

            // Create a map of pizza details
            const pizzaDetailsMap = pizzaDetails.reduce((map: {
                [id: string]: PizzaDocument
            }, pizza: any) => {
                map[pizza._id.toString()] = pizza;
                return map;
            }, {});

            // Map the pizza details to the order.pizzas array
            order.pizzas = order.pizzas.map(pizzaId => pizzaDetailsMap[pizzaId.toString()]);
        }
    }

    res.send(orders);
}

/**
 * Get order by ID
 * /orders/:id
 *
 * @param req
 * @param res
 * @param next
 */
export async function getOrderById(req: Request, res: Response, next: NextFunction) {
    // Check if the request was GET
    if (req.method !== 'GET') {
        next();
        return;
    }

    // Get the ID from the URL
    const id = req.params.id;

    // Check if the ID is valid and ObjectId
    if (!id || !mongoose.isValidObjectId(id)) {
        res.status(400).send(`
            The ID is not valid.
            Please provide a valid ID.
            We can't find anything with this ID.
            Don't you know how to copy and paste?
            Seek help from someone who knows how to copy and paste.
        `);
        return;
    }

    // Find the order by ID
    const order = await Order.findById(id);
    if (!order) {
        res.status(404).send(`
            The order with the ID ${id} was not found.
            Are you sure you copied the right ID?
            Stop making up IDs and try again.
        `)
        return;
    }

    // Get the pizzas for the order
    const pizzaDetails = await Pizza
        .find({ _id: { $in: order.pizzas } })
        .select('name price');

    // Create a map of pizza details
    const pizzaDetailsMap = pizzaDetails
        .reduce((map: { [id: string]: PizzaDocument }, pizza: any) => {
            map[pizza._id.toString()] = pizza;
            return map;
        }, {});

    // Map the pizza details to the order.pizzas array
    order.pizzas = order.pizzas.map(pizzaId => pizzaDetailsMap[pizzaId.toString()]);

    function transformDateKeysToMoment(order: any) {
        return {
            _id: order._id,
            name: order.name,
            pizzas: order.pizzas,
            orderDate: moment(order.orderDate).tz(constants.TIMEZONE_ORDERS).format(),
            totalPrice: order.totalPrice,
            finishedAt: moment(order.finishedAt).tz(constants.TIMEZONE_ORDERS).format(),
            status: order.status,
        };
    }

    const transformedObject = transformDateKeysToMoment(order);
    // Send the order
    res.send(transformedObject);
}

/**
 * Create a new order
 *
 * @param req
 * @param res
 */
export async function createOrder(req: Request, res: Response) {
    // Get the body of the request
    const body = req.body;
    // console.log('Creating a new order', body);

    body.name = body.name || "anonymous";


    // Check if there are too many pizzas
    if (body.pizzas.length > MAX_PIZZAS || body.pizzas.length < 1) {
        console.error('Too many or too few pizzas', body.pizzas.length);
        res.status(400).send(`Too many or too few pizzas.
                                        We don't know what to do with that.
                                        Can't you just order a normal amount of pizzas?`
        );
    }

    // Check if the pizzas are valid
    const pizzaIds: string[] = body.pizzas.map((pizza: { _id: string }) => pizza._id);
    if (!pizzaIds.every(async (pizzaId: string) => await Pizza.exists({ _id: pizzaId }))) {
        console.error('Some pizzas are missing', body.pizzas);
        res.status(400).send(`Some of the pizzas you ordered seem to have vanished into thin crust.
                            Are you trying to order ghost pizzas?
                            Let's try ordering real ones this time!`);
        return
    }

    // Calculate the total price
    // Don't trust the price from the request body
    const totalPrice: number = await pizzaIds
        .reduce(async (total: Promise<number>, pizzaId: string) => {
            const pizza = await Pizza.findOne({ _id: pizzaId });
            if (!pizza) {
                console.error('Pizza not found', pizzaId)
                return total;
            }
            return await total + pizza.price;
        }, Promise.resolve(0));

    // Create the order
    const order = new Order();
    order.name = body.name;
    order.pizzas = body.pizzas
    order.totalPrice = totalPrice;
    await order.save()

    // Get the order ID
    const orderId = order._id;

    // Send the order ID
    res.send({ orderId });
}

/**
 * Update an order
 *
 * @returns An object containing the rows and the count
 * @param req
 * @param res
 */
export async function updateOrder(req: Request, res: Response) {
    await checkAuth(req, res);

    // Get the order details from the request body
    const body = req.body;

    // Get id from the request
    const id = body.id;
    const status = body.status;
    // console.log('Updating order', id, status)

    if (!id || !mongoose.isValidObjectId(id)) {
        console.error('Invalid ID:', id);
        res.status(400).send('Invalid ID');
        return;
    }


    try {
        // Find the order by ID
        const foundOrder = await Order.findById(id);

        if (!foundOrder) {
            return { rows: [], count: 0 };
        }

        // Update the order status
        foundOrder.status = status;

        // Save the updated order
        await foundOrder.save();

        // console.log('Order updated:', foundOrder)
        res.send(foundOrder);
    } catch (error) {
        console.error('Error setting order as paid:', error);
        res.status(500).send('Error setting order as paid');
    }
}