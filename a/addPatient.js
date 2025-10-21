const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const { name, stage, service } = body;

    if (!name || !stage || !service) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Get next ticket number
    const { data: lastPatient, error: lastError } = await supabase
      .from('patients')
      .select('ticket_number')
      .order('ticket_number', { ascending: false })
      .limit(1);

    if (lastError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: lastError.message }),
      };
    }

    const nextTicketNumber = lastPatient.length > 0 ? lastPatient[0].ticket_number + 1 : 1;

    const { data, error } = await supabase
      .from('patients')
      .insert([{ name, stage, service, status: 'pending', ticket_number: nextTicketNumber }])
      .select()
      .single();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
