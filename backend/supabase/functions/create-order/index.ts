import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        const { customer, items, paymentMethod, staffId, notes, totalAmount } = payload;

        if (!items || items.length === 0) {
            throw new Error('No items in order');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // This ideally should be a single transaction. 
        // Supabase JS doesn't support generic transactions yet via client, but we can attempt sequential ops 
        // or use a Postgres function via RPC. For this scaffold, we will use sequential ops with checks.
        // ideally: call a Postgres function `create_order_transaction`

        // 1. Handle Customer
        let customerId = customer?.id;
        if (!customerId && customer?.phoneNumber) {
            // Check if exists
            const { data: existing } = await supabase.from('customers').select('id').eq('phone_number', customer.phoneNumber).single();
            if (existing) {
                customerId = existing.id;
                // Update?
            } else {
                // Create
                const { data: newCust, error: custError } = await supabase.from('customers').insert({
                    full_name: customer.fullName || 'Guest',
                    phone_number: customer.phoneNumber,
                    notes: customer.notes
                }).select().single();
                if (custError) throw custError;
                customerId = newCust.id;
            }
        }

        // 2. Create Order
        const { data: order, error: orderError } = await supabase.from('orders').insert({
            customer_id: customerId,
            staff_id: staffId,
            total_amount: totalAmount,
            payment_method: paymentMethod || 'cash',
            notes: notes,
            status: 'completed'
        }).select().single();

        if (orderError) throw orderError;

        // 3. Create Order Items & Update Inventory
        const orderItemsData = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
        if (itemsError) throw itemsError;

        // 4. Update Inventory
        // We loop for now. In production, use a stored procedure to do this atomically.
        for (const item of items) {
            // Decrement stock
            // We use rpc call if possible, or simple update:
            // new_stock = current_stock - qty used.
            // Prone to race conditions without DB locking or RPC.
            // Attempting simple RPC call "decrement_stock" if it existed, else fetch-update.

            // Simple fetch-update for scaffold:
            const { data: inv } = await supabase.from('inventory').select('stock_quantity').eq('product_id', item.id).single();
            if (inv) {
                const newStock = inv.stock_quantity - item.quantity;
                await supabase.from('inventory').update({ stock_quantity: newStock }).eq('product_id', item.id);
            }
        }

        return new Response(
            JSON.stringify({ success: true, orderId: order.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("Order Creation Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
