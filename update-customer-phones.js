// Script to update customer phone numbers
// This is just a template - you'll need to manually add the phone numbers

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need the service role key for updates

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables. You need SUPABASE_SERVICE_ROLE_KEY for updates.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Example phone numbers to update - replace with real data
const customerPhoneUpdates = [
    { email: 'yosefmdscb@gmail.com', name: 'Yosef Alemu', phone: '+251944113999' }, // Example phone
    { name: 'Dagmar T.', phone: '+251944114000' }, // Example phone
    { name: 'Martine de Groot', phone: '+251944114001' }, // Example phone
    { name: 'Estifanos Getachew', phone: '+251944114002' }, // Example phone
    // Add more as needed...
];

async function updateCustomerPhones() {
    console.log('=== UPDATING CUSTOMER PHONE NUMBERS ===');
    console.log('WARNING: This will update customer profiles in the database!');
    console.log('Make sure you have the correct phone numbers before running this.');

    // Uncomment the code below when you have real phone numbers to update
    /*
    for (const customer of customerPhoneUpdates) {
      try {
        let query = supabase.from('profiles').update({ phone: customer.phone });
        
        if (customer.email) {
          query = query.eq('email', customer.email);
        } else if (customer.name) {
          query = query.eq('name', customer.name);
        } else {
          console.log('Skipping customer - no email or name provided');
          continue;
        }
        
        const { data, error } = await query.select();
        
        if (error) {
          console.error(`Error updating ${customer.name || customer.email}:`, error);
        } else {
          console.log(`Updated ${customer.name || customer.email}: ${customer.phone}`);
        }
      } catch (error) {
        console.error(`Error updating ${customer.name || customer.email}:`, error);
      }
    }
    */

    console.log('Update script template ready. Edit the phone numbers and uncomment the update code to run.');
}

updateCustomerPhones();
