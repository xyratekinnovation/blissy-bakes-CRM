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
        const { period } = await req.json() // 'today', 'week', 'month'

        // Calculate Date Range
        const now = new Date();
        let startDate = new Date();

        if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        } else {
            // Default Today (start of day)
            startDate.setHours(0, 0, 0, 0);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch Orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_amount, created_at, status')
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled'); // Exclude cancelled

        if (error) throw error;

        // Aggregation
        const totalOrders = orders.length;
        const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;

        // Best Sellers (Simplified: just top 5 items from order_items in this period)
        // Complex queries are harder in JS-side aggregation, but for MVP it's fine.
        // For scalability, use a SQL View or RPC.

        return new Response(
            JSON.stringify({
                metrics: {
                    totalSales,
                    totalOrders,
                    averageOrderValue
                },
                periodUsed: period
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
