// api/order/ticket

import { requireAuth } from "@/lib/auth/serverAuth";
import { NextResponse } from "next/server";
import { ItemTicketModel, TICKET_STATUS } from "@/model/ticket";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";
import { ItemModel } from "@/model/item";
import { ORDER_STATUSES, OrderModel } from "@/model/order";

const dbReady = dbConnect();

const withDB = async <T>(fn: () => Promise<T>) => {
    await dbReady;
    return fn();
};


export async function GET() {
    return withDB(async () => {
        await requireAuth();

        const itemTickets = await ItemTicketModel.find({})
            .populate('itemTypeRef').sort({ timeslot: 1 })

        return NextResponse.json(itemTickets);
    }).catch((err) => {
        console.error('GET /order error ➜', err);
        return NextResponse.json(
            { message: 'There was an error on our side' },
            { status: 500 },
        );
    });
}

export async function PUT(req: Request) {
    return withDB(async () => {
        await requireAuth();

        const { id, status, orderId } = await req.json();

        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: 'Invalid ticket ID' },
                { status: 400 },
            );
        }

        const existing = await ItemTicketModel.findById(id);
        if (!existing) {
            return NextResponse.json(
                { message: 'Ticket not found' },
                { status: 404 },
            );
        }

        // Check if it changed from DEMANDED to ACTIVE
        if (existing.status === TICKET_STATUS.DEMANDED && status === TICKET_STATUS.ACTIVE) {
            // Get the item to determine size
            const item = await ItemModel.findById(existing.itemTypeRef).lean();
            if (!item) {
                throw new Error('Item not found');
            }

            const ticketsNeeded = Math.floor(1 / item.size);

            // Get all DEMANDED tickets of the same item type, sorted by timeslot
            const demandedTickets = await ItemTicketModel.find({
                itemTypeRef: existing.itemTypeRef,
                status: TICKET_STATUS.DEMANDED
            }).sort({ timeslot: 1 }); // Sort by timeslot ascending

            // Activate the first ticketsNeeded tickets
            const ticketsToActivate = demandedTickets.slice(0, ticketsNeeded);

            for (const ticket of ticketsToActivate) {
                ticket.status = TICKET_STATUS.ACTIVE;
                await ticket.save();
            }

            // If we need more tickets than available, create new ones
            const ticketsActivated = ticketsToActivate.length;
            const ticketsToCreate = ticketsNeeded - ticketsActivated;

            for (let i = 0; i < ticketsToCreate; i++) {
                await ItemTicketModel.create({
                    itemTypeRef: existing.itemTypeRef,
                    status: TICKET_STATUS.ACTIVE,
                    timeslot: existing.timeslot, // Use the same timeslot or adjust as needed
                });
            }

            // Return the updated ticket
            const updatedTicket = await ItemTicketModel.findById(id);
            return NextResponse.json(updatedTicket);
        } else if (status === TICKET_STATUS.READY) {
            // Count tickets that are NOT ready
            const notReadyCount = await ItemTicketModel.countDocuments({
                orderId: existing.orderId,
                status: { $ne: TICKET_STATUS.READY }
            });

            // 1 because the status is not updated, so we check if n-1 tickets are ready
            if (notReadyCount <= 1 && existing.orderId) {
                // All tickets are ready, update the order
                const order = await OrderModel.findByIdAndUpdate(
                    existing.orderId,
                    { status: ORDER_STATUSES.READY_FOR_PICKUP },
                    { new: true }
                );

                if (!order) {
                    return NextResponse.json(
                        { message: 'Order not found' },
                        { status: 404 }
                    );
                }
            }
        }

        if (status) {
            existing.status = status;
        }

        if (orderId) {
            existing.orderId = orderId;
        }
        await existing.save();

        return NextResponse.json(existing);
    });
}

export async function DELETE(req: Request) {
    return withDB(async () => {
        await requireAuth();

        const { id } = await req.json();
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: 'Invalid ticket ID' },
                { status: 400 },
            );
        }

        const existing = await ItemTicketModel.findById(id);
        if (!existing) {
            return NextResponse.json(
                { message: 'Ticket not found' },
                { status: 404 },
            );
        }

        // Check if item ticket is already assigned to an order
        if (existing.orderId !== undefined && existing.orderId !== null) {
            return NextResponse.json(
                { message: `Cannot delete ticket because it's assigned to order ${existing.orderId}` },
                { status: 400 },
            );
        }

        await existing.deleteOne()

        return NextResponse.json(
            { message: 'Ticket deleted successfully' },
            { status: 200 }
        );
    })
}
