const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use environment variables if available, otherwise use the values from CLAUDE.md
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://btzfgasugkycbavcwvnx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Please set it and run again: SUPABASE_SERVICE_KEY=your-service-key node apply_rpc_fix.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  try {
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, 'fix_rpc_functions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying RPC function fixes...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('query', { query: sql });
    
    if (error) {
      // If direct RPC doesn't work, try executing statements one by one
      console.log('Direct execution failed, trying statement by statement...');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // For function creation, we need to use a different approach
        // Since Supabase doesn't expose direct SQL execution, we'll provide instructions
        console.log('\nPlease run the following SQL in your Supabase SQL editor:');
        console.log('----------------------------------------');
        console.log(statement + ';');
        console.log('----------------------------------------\n');
      }
      
      console.log('\nSince direct SQL execution is not available through the client library,');
      console.log('please copy the contents of fix_rpc_functions.sql and run it in the Supabase SQL editor.');
      console.log('\nYou can access the SQL editor at:');
      console.log(`${supabaseUrl.replace('.supabase.co', '.supabase.com')}/project/_/sql/new`);
    } else {
      console.log('RPC functions fixed successfully!');
    }
    
  } catch (error) {
    console.error('Error applying fix:', error);
    console.log('\nPlease manually run the SQL from fix_rpc_functions.sql in your Supabase dashboard.');
  }
}

applyFix();