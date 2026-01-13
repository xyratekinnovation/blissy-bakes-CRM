import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ExcelJS from "https://esm.sh/exceljs";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { date } = await req.json(); // YYYY-MM-DD
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Data
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
            id, created_at, total_amount, payment_method, status,
            app_users(full_name),
            customers(full_name, phone_number)
        `)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

        if (ordersError) throw ordersError;

        // 2. Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Daily Sales');

        worksheet.columns = [
            { header: 'Order ID', key: 'id', width: 30 },
            { header: 'Time', key: 'time', width: 15 },
            { header: 'Customer', key: 'customer', width: 20 },
            { header: 'Staff', key: 'staff', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Payment', key: 'payment', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        orders.forEach(order => {
            worksheet.addRow({
                id: order.id,
                time: new Date(order.created_at).toLocaleTimeString(),
                customer: order.customers?.full_name || 'Guest',
                staff: order.app_users?.full_name || 'N/A',
                amount: order.total_amount,
                payment: order.payment_method,
                status: order.status
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        // 3. Upload to Storage
        // Ensure 'reports' bucket exists and is public or signed-url enabled
        const fileName = `daily_report_${targetDate.toISOString().split('T')[0]}.xlsx`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('reports')
            .upload(fileName, buffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 4. Get URL
        const { data: urlData } = await supabase
            .storage
            .from('reports')
            .createSignedUrl(fileName, 60 * 60); // 1 hour validity

        return new Response(
            JSON.stringify({
                success: true,
                downloadUrl: urlData?.signedUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("Export Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
