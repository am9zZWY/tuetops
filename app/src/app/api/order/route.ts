import mongoose from "mongoose";
import { Pizza, PizzaDocument } from "@/model/pizza";
import { MAX_PIZZAS, Order } from "@/model/order";
import dbConnect from "@/db/dbConnect";

const moment = require('moment-timezone');


export async function GET() {
    await dbConnect();

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

    return Response.json(orders);
}

export async function POST(req: Request) {
    await dbConnect();

    // Get the body of the request
    const { pizzas, name } = await req.json();

    // Check if there are too many pizzas
    if (pizzas.length > MAX_PIZZAS || pizzas.length < 1) {
        console.error('Too many or too few pizzas', pizzas.length);
        return new Response(`Too many or too few pizzas.
                                        We don't know what to do with that.
                                        Can't you just order a normal amount of pizzas?`
        );
    }

    // Check if the pizzas are valid
    const pizzaIds: string[] = pizzas.map((pizza: { _id: string }) => pizza._id);
    if (!pizzaIds.every(async (pizzaId: string) => await Pizza.exists({ _id: pizzaId }))) {
        console.error('Some pizzas are missing', pizzas);
        return new Response(`Some of the pizzas you ordered seem to have vanished into thin crust.
                            Are you trying to order ghost pizzas?
                            Let's try ordering real ones this time!`, { status: 400 });
    }

    // Calculate the total price.
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
    order.name = name || "anonymous";
    order.pizzas = pizzas
    order.totalPrice = totalPrice;
    await order.save()

    // Get the order ID
    const orderId = order._id;

    // Send the order ID
    return Response.json({ orderId });
}

export async function PUT(req: Request) {
    await dbConnect();

    // Get the order details from the request body
    const { id, status } = await req.json()

    if (!id || !mongoose.isValidObjectId(id)) {
        console.error('Invalid ID:', id);
        return new Response('Invalid ID', { status: 400 });
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
        return Response.json(foundOrder);
    } catch (error) {
        console.error('Error setting order as paid:', error);
        return new Response('Error setting order as paid', { status: 500 });
    }
}